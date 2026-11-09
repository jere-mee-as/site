package ing.jere.launcher

import android.Manifest
import android.app.ActivityOptions
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.LauncherApps
import android.graphics.Color
import android.graphics.Rect
import android.net.Uri
import android.os.Bundle
import android.os.UserHandle
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * The home screen: one full-screen WebView that loads the launcher page from
 * https://appassets.androidplatform.net/live/index.html and talks to it through [Bridge]
 * (window.JRLAndroid). Native events go the other way through window.JRLnative.event(name, data).
 */
class MainActivity : ComponentActivity() {

    lateinit var web: WebView
        private set

    private var pageReady = false
    private var insetJs = ""
    private var fetching = false
    private var statusBarHidden = false

    private val launcherApps: LauncherApps by lazy { requireNotNull(getSystemService(LauncherApps::class.java)) }

    private val calendarPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { emit("calendar") }

    private val appsCallback = object : LauncherApps.Callback() {
        override fun onPackageRemoved(packageName: String?, user: UserHandle?) = emit("apps")
        override fun onPackageAdded(packageName: String?, user: UserHandle?) = emit("apps")
        override fun onPackageChanged(packageName: String?, user: UserHandle?) = emit("apps")
        override fun onPackagesAvailable(packageNames: Array<out String>?, user: UserHandle?, replacing: Boolean) = emit("apps")
        override fun onPackagesUnavailable(packageNames: Array<out String>?, user: UserHandle?, replacing: Boolean) = emit("apps")
    }

    private val notifsChanged: () -> Unit = { emit("notifs") }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
        )
        if ((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        Live.dropIfStale(this)

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain(HOST)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/live/", LiveHandler(this))
            .addPathHandler("/icon/", IconHandler(this))
            .build()

        val field = getColor(R.color.field)
        web = WebView(this).apply {
            setBackgroundColor(field)
            overScrollMode = View.OVER_SCROLL_NEVER
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            isHapticFeedbackEnabled = true
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                textZoom = 100
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                mediaPlaybackRequiresUserGesture = true
            }
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    assetLoader.shouldInterceptRequest(request.url)

                // Our own pages stay in the WebView; every other link goes to the browser / app that handles it.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.url.host == HOST) return false
                    openExternal(request.url)
                    return true
                }

                override fun onPageFinished(view: WebView, url: String?) {
                    pageReady = true
                    if (insetJs.isNotEmpty()) view.evaluateJavascript(insetJs, null)
                }
            }
            addJavascriptInterface(Bridge(this@MainActivity), JS_NAME)
        }

        val root = FrameLayout(this).apply {
            setBackgroundColor(field)
            addView(web, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        }
        setContentView(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets -> applyInsets(insets) }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                emit("back")
            }
        })
        launcherApps.registerCallback(appsCallback)
        NotifListener.onChange = notifsChanged
        web.loadUrl(START)
    }

    /**
     * The page draws edge to edge. System bar / cutout sizes go to the page as CSS variables
     * (--sat, --sar, --sab, --sal, in dp); the keyboard is handled natively by lifting the WebView.
     */
    private fun applyInsets(insets: WindowInsetsCompat): WindowInsetsCompat {
        val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
        val imeBottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom

        val lp = web.layoutParams as FrameLayout.LayoutParams
        if (lp.bottomMargin != imeBottom) {
            lp.bottomMargin = imeBottom
            web.layoutParams = lp
        }

        val d = resources.displayMetrics.density
        val bottom = if (imeBottom > 0) 0f else bars.bottom / d
        insetJs = "(function(s){" +
            "s.setProperty('--sat','${bars.top / d}px');" +
            "s.setProperty('--sar','${bars.right / d}px');" +
            "s.setProperty('--sab','${bottom}px');" +
            "s.setProperty('--sal','${bars.left / d}px')" +
            "})(document.documentElement.style)"
        if (pageReady) web.evaluateJavascript(insetJs, null)
        return WindowInsetsCompat.CONSUMED
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Pressing Home while already home.
        if (intent.action == Intent.ACTION_MAIN && intent.hasCategory(Intent.CATEGORY_HOME)) emit("home")
    }

    override fun onResume() {
        super.onResume()
        web.resumeTimers()
        web.onResume()
        if (statusBarHidden) applyStatusBar()
        emit("show")
        if (Live.due(this)) checkForUi(manual = false)
    }

    override fun onPause() {
        emit("hide")
        web.onPause()
        web.pauseTimers()
        super.onPause()
    }

    override fun onDestroy() {
        if (NotifListener.onChange === notifsChanged) NotifListener.onChange = null
        launcherApps.unregisterCallback(appsCallback)
        web.removeJavascriptInterface(JS_NAME)
        web.destroy()
        super.onDestroy()
    }

    /** Calls window.JRLnative.event(name, data) on the page. [data] is a JS expression (default `null`). */
    fun emit(name: String, data: String = "null") {
        if (!::web.isInitialized) return
        web.post {
            if (pageReady) web.evaluateJavascript("window.JRLnative&&JRLnative.event('$name',$data)", null)
        }
    }

    /**
     * Starts the activity named by [key] ("package/activity"). With a [rect] (from older pages) the app
     * grows out of the tapped tile; without one it cuts in with no window animation.
     */
    fun launch(key: String, rect: Rect?) {
        val parts = key.split("/", limit = 2)
        if (parts.size < 2) return
        val (pkg, cls) = parts
        val intent = Intent(Intent.ACTION_MAIN)
            .addCategory(Intent.CATEGORY_LAUNCHER)
            .setComponent(ComponentName(pkg, cls))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        val options = if (rect != null && rect.width() > 0 && rect.height() > 0) {
            ActivityOptions.makeClipRevealAnimation(web, rect.left, rect.top, rect.width(), rect.height())
        } else {
            ActivityOptions.makeCustomAnimation(this, 0, 0)
        }
        try {
            startActivity(intent, options.toBundle())
        } catch (e: Exception) {
            val fallback = packageManager.getLaunchIntentForPackage(pkg)
            val started = fallback != null &&
                runCatching { startActivity(fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }.isSuccess
            if (!started) emit("error", jsString("launch failed: " + pkg.replace("'", "")))
        }
    }

    fun openExternal(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (e: ActivityNotFoundException) {
            emit("error", jsString("nothing can open that link"))
        }
    }

    /** Starts [intent] in a new task. Returns false (and tells the page) if nothing handles it. */
    fun start(intent: Intent): Boolean = try {
        startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
    } catch (e: Exception) {
        emit("error", jsString("that screen is not available on this phone"))
        false
    }

    fun requestCalendar() {
        calendarPermission.launch(Manifest.permission.READ_CALENDAR)
    }

    /**
     * Asks [Live] for a newer page. Automatic checks only tell the page when something new was
     * staged; a manual check (bridge update()) always reports "updated", "same" or "failed".
     */
    fun checkForUi(manual: Boolean) {
        if (fetching) return
        fetching = true
        lifecycleScope.launch {
            val result = try {
                withContext(Dispatchers.IO) { Live.fetch(applicationContext) }
            } finally {
                fetching = false
            }
            if (manual || result == Live.UPDATED) emit("updated", jsString(result))
        }
    }

    /** true = dark icons on the (transparent) system bars, for light pages. */
    fun setDarkBarIcons(dark: Boolean) {
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = dark
            isAppearanceLightNavigationBars = dark
        }
    }

    /** Hides or shows Android's status bar. While hidden, a swipe from the top shows it briefly. */
    fun setStatusBarVisible(visible: Boolean) {
        statusBarHidden = !visible
        applyStatusBar()
    }

    private fun applyStatusBar() {
        WindowCompat.getInsetsController(window, window.decorView).apply {
            if (statusBarHidden) {
                systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                hide(WindowInsetsCompat.Type.statusBars())
            } else {
                show(WindowInsetsCompat.Type.statusBars())
            }
        }
    }

    fun showKeyboard() {
        web.requestFocus()
        getSystemService(InputMethodManager::class.java)?.showSoftInput(web, InputMethodManager.SHOW_IMPLICIT)
    }

    companion object {
        const val HOST = "appassets.androidplatform.net"
        const val START = "https://$HOST/live/index.html"

        /** The name the page sees: window.JRLAndroid. Do not change; every page version depends on it. */
        const val JS_NAME = "JRLAndroid"

        /** A Kotlin string as a JS string literal, for [emit] data. */
        fun jsString(s: String): String = JSONObject.quote(s)
    }
}
