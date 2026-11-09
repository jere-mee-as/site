package ing.jere.launcher

import android.Manifest
import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.ContentUris
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Rect
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.CalendarContract
import android.provider.Settings
import android.util.Base64
import android.telephony.TelephonyManager
import android.view.HapticFeedbackConstants
import android.webkit.JavascriptInterface
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

/**
 * window.JRLAndroid. Every @JavascriptInterface method runs on WebView's JavaBridge thread, so anything
 * that touches views or starts activities hops to the UI thread with [ui]. Reads return JSON strings.
 *
 * The names and parameter lists below are the contract with every page version that has shipped:
 * add new methods under new names, never change or overload an existing one.
 */
class Bridge(private val act: MainActivity) {

    private val pm: PackageManager get() = act.packageManager

    private fun ui(block: () -> Unit) = act.runOnUiThread { block() }

    // ---------------------------------------------------------------- programs

    /** [{key: "pkg/activity", pkg, act, label, sys}] for every launchable activity except this one. */
    @JavascriptInterface
    fun apps(): String {
        val query = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val out = JSONArray()
        for (ri in pm.queryIntentActivities(query, 0)) {
            val ai = ri.activityInfo ?: continue
            if (ai.packageName == act.packageName) continue
            out.put(
                JSONObject()
                    .put("key", "${ai.packageName}/${ai.name}")
                    .put("pkg", ai.packageName)
                    .put("act", ai.name)
                    .put("label", ri.loadLabel(pm).toString())
                    .put("sys", (ai.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0)
            )
        }
        return out.toString()
    }

    /**
     * Opens "pkg/activity". x, y, w, h are the tapped tile in physical pixels; when w and h are positive the
     * app grows out of that rectangle, otherwise it cuts in with no animation.
     */
    @JavascriptInterface
    fun launch(key: String, x: Int, y: Int, w: Int, h: Int) {
        val rect = if (w > 0 && h > 0) Rect(x, y, x + w, y + h) else null
        ui { act.launch(key, rect) }
    }

    /** App info screen. Takes "pkg/activity" or just "pkg". */
    @JavascriptInterface
    fun info(key: String) {
        ui { act.start(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri(key))) }
    }

    /** Hands the package to the system uninstaller (which asks first). Takes "pkg/activity" or "pkg". */
    @JavascriptInterface
    fun uninstall(key: String) {
        ui { act.start(Intent(Intent.ACTION_DELETE, packageUri(key))) }
    }

    private fun packageUri(key: String): Uri = Uri.fromParts("package", key.substringBefore('/'), null)

    // ---------------------------------------------------------------- readouts

    /** {level: 0–100 or -1, charging, saver}. */
    @JavascriptInterface
    fun battery(): String {
        val bm = act.getSystemService(BatteryManager::class.java)
        val level = bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
        val saver = act.getSystemService(PowerManager::class.java)?.isPowerSaveMode ?: false
        return JSONObject()
            .put("level", if (level in 0..100) level else -1)
            .put("charging", bm?.isCharging ?: false)
            .put("saver", saver)
            .toString()
    }

    /** {on: listener enabled, count: total unread (-1 when off), pkgs: {pkg: count}}. */
    @JavascriptInterface
    fun notifs(): String {
        val on = NotificationManagerCompat.getEnabledListenerPackages(act).contains(act.packageName)
        val out = JSONObject().put("on", on)
        if (!on) return out.put("count", -1).put("pkgs", JSONObject()).toString()

        val counts = NotifListener.counts
        val pkgs = JSONObject()
        counts.forEach { (pkg, n) -> pkgs.put(pkg, n) }
        return out.put("count", counts.values.sum()).put("pkgs", pkgs).toString()
    }

    /** {maker, model, release, sdk, uptime (s), version (versionName)}. */
    @JavascriptInterface
    fun device(): String {
        val versionName = runCatching { pm.getPackageInfo(act.packageName, 0).versionName }.getOrNull() ?: "?"
        return JSONObject()
            .put("maker", Build.MANUFACTURER)
            .put("model", Build.MODEL)
            .put("release", Build.VERSION.RELEASE)
            .put("sdk", Build.VERSION.SDK_INT)
            .put("uptime", SystemClock.elapsedRealtime() / 1000)
            .put("version", versionName)
            .toString()
    }

    /**
     * {wifi: 0–4, cell: 0–4, net: "WIFI" | "CELL" | "", airplane}. Uses only normal permissions, so net is the
     * transport, not the radio generation (5G/LTE would need READ_PHONE_STATE).
     */
    @JavascriptInterface
    fun signal(): String {
        var wifi = 0
        var cell = 0
        var net = ""
        try {
            val cm = act.getSystemService(ConnectivityManager::class.java)
            val caps = cm?.let { it.getNetworkCapabilities(it.activeNetwork) }
            if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                net = "WIFI"
                // Before Android 10 the RSSI is not on NetworkCapabilities: report "connected, full".
                wifi = if (Build.VERSION.SDK_INT >= 29) rssiLevel(caps.signalStrength) else 4
            } else if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                net = "CELL"
            }
        } catch (e: Exception) {
            // Leave the defaults.
        }
        if (Build.VERSION.SDK_INT >= 28) {
            try {
                cell = act.getSystemService(TelephonyManager::class.java)?.signalStrength?.level ?: 0
            } catch (e: Exception) {
                // No SIM, or the OEM wants a permission for it.
            }
        }
        val airplane = Settings.Global.getInt(act.contentResolver, Settings.Global.AIRPLANE_MODE_ON, 0) == 1
        return JSONObject()
            .put("wifi", wifi)
            .put("cell", cell)
            .put("net", net)
            .put("airplane", airplane)
            .toString()
    }

    private fun rssiLevel(rssi: Int): Int = when {
        rssi == NetworkCapabilities.SIGNAL_STRENGTH_UNSPECIFIED -> 0
        rssi >= -55 -> 4
        rssi >= -66 -> 3
        rssi >= -77 -> 2
        rssi >= -88 -> 1
        else -> 0
    }

    // ---------------------------------------------------------------- haptics

    /**
     * One haptic tap. Kinds: "long" / "heavy" (long press), "tick" (clock tick), "click", "double" and
     * "err" (confirm / reject waveforms); anything else is a virtual-key tap. Follows the system haptics setting.
     */
    @JavascriptInterface
    fun haptic(kind: String) {
        ui {
            when (kind) {
                "double" -> if (Build.VERSION.SDK_INT >= 30) {
                    act.web.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                } else {
                    vibrate(longArrayOf(0, 14, 40, 14))
                }
                "err" -> if (Build.VERSION.SDK_INT >= 30) {
                    act.web.performHapticFeedback(HapticFeedbackConstants.REJECT)
                } else {
                    vibrate(longArrayOf(0, 30, 50, 30))
                }
                else -> act.web.performHapticFeedback(
                    when (kind) {
                        "long", "heavy" -> HapticFeedbackConstants.LONG_PRESS
                        "tick" -> HapticFeedbackConstants.CLOCK_TICK
                        else -> HapticFeedbackConstants.VIRTUAL_KEY
                    }
                )
            }
        }
    }

    /**
     * A vibration waveform like navigator.vibrate: a JSON array of [on, off, on, …] in ms.
     * Separate name on purpose: JS interface overloading by argument count is not reliable.
     */
    @JavascriptInterface
    fun hapticPattern(json: String) {
        val steps = try {
            val arr = JSONArray(json)
            LongArray(minOf(arr.length(), MAX_PATTERN_STEPS)) { i -> arr.optLong(i, 0L).coerceIn(0L, MAX_PATTERN_STEP_MS) }
        } catch (e: Exception) {
            return
        }
        if (steps.none { it > 0 }) return
        // createWaveform starts with an "off" duration; navigator.vibrate starts with "on".
        ui { vibrate(longArrayOf(0L) + steps) }
    }

    private fun vibrate(timings: LongArray) {
        val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= 31) {
            act.getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            act.getSystemService(Vibrator::class.java)
        }
        if (vibrator == null || !vibrator.hasVibrator()) return
        try {
            vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
        } catch (e: Exception) {
            // A bad waveform must never take the launcher down.
        }
    }

    // ---------------------------------------------------------------- system screens

    /**
     * Opens a settings screen: wifi, bt/bluetooth, airplane, data, display, sound, battery, storage, apps,
     * notif (notification access), location, date, dev, home/launcher (default home app), wallpaper.
     * Anything else opens the main Settings app. Always returns true.
     */
    @JavascriptInterface
    fun settings(which: String): Boolean {
        val action = when (which.lowercase(Locale.ROOT)) {
            "wifi" -> Settings.ACTION_WIFI_SETTINGS
            "bt", "bluetooth" -> Settings.ACTION_BLUETOOTH_SETTINGS
            "airplane" -> Settings.ACTION_AIRPLANE_MODE_SETTINGS
            "data" -> Settings.ACTION_DATA_ROAMING_SETTINGS
            "display" -> Settings.ACTION_DISPLAY_SETTINGS
            "sound" -> Settings.ACTION_SOUND_SETTINGS
            "battery" -> Intent.ACTION_POWER_USAGE_SUMMARY
            "storage" -> Settings.ACTION_INTERNAL_STORAGE_SETTINGS
            "apps" -> Settings.ACTION_APPLICATION_SETTINGS
            "notif" -> Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS
            "location" -> Settings.ACTION_LOCATION_SOURCE_SETTINGS
            "date" -> Settings.ACTION_DATE_SETTINGS
            "dev" -> Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS
            "home", "launcher" -> Settings.ACTION_HOME_SETTINGS
            "wallpaper" -> Intent.ACTION_SET_WALLPAPER
            else -> Settings.ACTION_SETTINGS
        }
        ui { act.start(Intent(action)) }
        return true
    }

    /** Pulls down the notification shade (hidden StatusBarManager API, needs EXPAND_STATUS_BAR). */
    @SuppressLint("WrongConstant")
    @JavascriptInterface
    fun expand() {
        ui {
            try {
                val sbm = act.getSystemService("statusbar")
                Class.forName("android.app.StatusBarManager").getMethod("expandNotificationsPanel").invoke(sbm)
            } catch (t: Throwable) {
                // Not available on this build; nothing to do.
            }
        }
    }

    /** Web search through the system handler, else a Google search in the browser. */
    @JavascriptInterface
    fun webSearch(q: String) {
        ui {
            if (!act.start(Intent(Intent.ACTION_WEB_SEARCH).putExtra("query", q))) {
                act.openExternal(Uri.parse("https://www.google.com/search?q=" + Uri.encode(q)))
            }
        }
    }

    /** Opens a URL (or any URI) in whatever handles it. */
    @JavascriptInterface
    fun view(url: String) {
        ui { act.openExternal(Uri.parse(url)) }
    }

    /** true = dark system-bar icons (for a light page), false = light icons. */
    @JavascriptInterface
    fun bars(dark: Boolean) {
        ui { act.setDarkBarIcons(dark) }
    }

    /** Shows (true) or hides (false) Android's status bar; while hidden it can be swiped in briefly. */
    @JavascriptInterface
    fun statusBar(visible: Boolean) {
        ui { act.setStatusBarVisible(visible) }
    }

    /** Focuses the page and asks for the soft keyboard. */
    @JavascriptInterface
    fun keyboard() {
        ui { act.showKeyboard() }
    }

    /** True for the first call after the app process started (a cold start), false after that. */
    @JavascriptInterface
    fun coldStart(): Boolean = coldStartUnread.getAndSet(false)

    // ---------------------------------------------------------------- calendar

    /**
     * {perm, ev: [{id, title, begin, end, allDay, color, cal}]}: up to 40 events that have not ended yet, from 12 h ago
     * to [days] (1–31) days ahead. perm is false (and ev empty) until READ_CALENDAR is granted.
     */
    @JavascriptInterface
    fun events(days: Int): String {
        val out = JSONObject()
        val list = JSONArray()
        if (ContextCompat.checkSelfPermission(act, Manifest.permission.READ_CALENDAR) != PackageManager.PERMISSION_GRANTED) {
            return out.put("perm", false).put("ev", list).toString()
        }

        val now = System.currentTimeMillis()
        val uri = CalendarContract.Instances.CONTENT_URI.buildUpon().also {
            ContentUris.appendId(it, now - 12 * HOUR_MS)
            ContentUris.appendId(it, now + days.coerceIn(1, 31) * DAY_MS)
        }.build()
        val columns = arrayOf(
            CalendarContract.Instances.EVENT_ID,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.DISPLAY_COLOR,
            CalendarContract.Instances.CALENDAR_DISPLAY_NAME,
        )
        try {
            act.contentResolver.query(uri, columns, "${CalendarContract.Instances.VISIBLE}=1", null, "${CalendarContract.Instances.BEGIN} ASC")
                ?.use { c ->
                    while (c.moveToNext() && list.length() < MAX_EVENTS) {
                        val end = c.getLong(3)
                        if (end <= now) continue
                        list.put(
                            JSONObject()
                                .put("id", c.getLong(0).toString())
                                .put("title", c.getString(1) ?: "")
                                .put("begin", c.getLong(2))
                                .put("end", end)
                                .put("allDay", c.getInt(4) == 1)
                                .put("color", if (c.isNull(5)) JSONObject.NULL else c.getInt(5))
                                .put("cal", c.getString(6) ?: "")
                        )
                    }
                }
        } catch (e: Exception) {
            // Calendar provider missing or failing: report what we have.
        }
        return out.put("perm", true).put("ev", list).toString()
    }

    /** Shows the system permission dialog; the page gets a "calendar" event when it closes. */
    @JavascriptInterface
    fun askCalendar() {
        ui { act.requestCalendar() }
    }

    /** Opens one event in the calendar app. [begin] is the instance start in ms (may be empty). */
    @JavascriptInterface
    fun openEvent(id: String, begin: String) {
        ui {
            val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id.toLongOrNull() ?: 0L)
            val intent = Intent(Intent.ACTION_VIEW, uri)
            begin.toDoubleOrNull()?.let { intent.putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, it.toLong()) }
            if (!act.start(intent)) openCalendar()
        }
    }

    /** Opens the default calendar app, or the calendar provider's "time" view. */
    @JavascriptInterface
    fun openCalendar() {
        ui {
            val main = Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_CALENDAR)
            if (!act.start(main)) {
                act.start(Intent(Intent.ACTION_VIEW, CalendarContract.CONTENT_URI.buildUpon().appendPath("time").build()))
            }
        }
    }

    // ---------------------------------------------------------------- media

    /** The playing session if there is one, else the most recent one. Needs notification access. */
    private fun controller(): MediaController? {
        val msm = act.getSystemService(MediaSessionManager::class.java) ?: return null
        val sessions = msm.getActiveSessions(ComponentName(act, NotifListener::class.java))
        return sessions.firstOrNull { it.playbackState?.state == PlaybackState.STATE_PLAYING } ?: sessions.firstOrNull()
    }

    /**
     * {on: false} without notification access; {on: true, active: false} with no session;
     * otherwise {on, active, title, artist, app, pkg, playing, pos (s), dur (s), art (JPEG data URL or "")}.
     */
    @JavascriptInterface
    fun media(): String {
        val out = JSONObject()
        val mc: MediaController? = try {
            controller()
        } catch (e: SecurityException) {
            // Notification access is off, so media sessions are off limits.
            return out.put("on", false).toString()
        } catch (e: Exception) {
            null
        }
        if (mc == null) return out.put("on", true).put("active", false).toString()

        val meta = mc.metadata
        val appLabel = try {
            pm.getApplicationLabel(pm.getApplicationInfo(mc.packageName, 0)).toString()
        } catch (e: Exception) {
            mc.packageName
        }
        val artist = meta?.getString(MediaMetadata.METADATA_KEY_ARTIST)
            ?: meta?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
            ?: ""
        return out
            .put("on", true)
            .put("active", meta != null)
            .put("title", meta?.getString(MediaMetadata.METADATA_KEY_TITLE) ?: "")
            .put("artist", artist)
            .put("app", appLabel)
            .put("pkg", mc.packageName)
            .put("playing", mc.playbackState?.state == PlaybackState.STATE_PLAYING)
            .put("pos", position(mc.playbackState) / 1000.0)
            .put("dur", (meta?.getLong(MediaMetadata.METADATA_KEY_DURATION) ?: 0L).coerceAtLeast(0L) / 1000.0)
            .put("art", artwork(meta, mc.packageName))
            .toString()
    }

    /** The playhead in ms, moved on by the time since the session last reported it while playing. */
    private fun position(st: PlaybackState?): Long {
        if (st == null) return 0L
        var pos = st.position
        if (st.state == PlaybackState.STATE_PLAYING && st.lastPositionUpdateTime > 0L) {
            pos += ((SystemClock.elapsedRealtime() - st.lastPositionUpdateTime) * st.playbackSpeed).toLong()
        }
        return pos.coerceAtLeast(0L)
    }

    @Volatile private var artKey = ""
    @Volatile private var artUrl = ""

    /**
     * The track's artwork as a small JPEG data URL. The page polls media() every second, so the encoded
     * image is cached per track and only rebuilt when the track changes.
     */
    private fun artwork(meta: MediaMetadata?, pkg: String): String {
        if (meta == null) return ""
        val key = pkg + "|" + (meta.getString(MediaMetadata.METADATA_KEY_TITLE) ?: "") + "|" +
            (meta.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: "")
        if (key == artKey) return artUrl
        val url = try {
            val bmp: Bitmap? = meta.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
                ?: meta.getBitmap(MediaMetadata.METADATA_KEY_ART)
                ?: meta.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)
            if (bmp == null || bmp.width <= 0 || bmp.height <= 0) {
                ""
            } else {
                val scale = ART_PX.toFloat() / maxOf(bmp.width, bmp.height)
                val small = if (scale < 1f) {
                    Bitmap.createScaledBitmap(bmp, maxOf(1, (bmp.width * scale).toInt()), maxOf(1, (bmp.height * scale).toInt()), true)
                } else {
                    bmp
                }
                val out = ByteArrayOutputStream()
                small.compress(Bitmap.CompressFormat.JPEG, 85, out)
                "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
            }
        } catch (e: Exception) {
            ""
        }
        artUrl = url
        artKey = key
        return url
    }

    /** "play", "pause", "next", "prev"; anything else (e.g. "toggle") flips play/pause. */
    @JavascriptInterface
    fun mediaCmd(cmd: String) {
        ui {
            try {
                val mc = controller() ?: return@ui
                val t = mc.transportControls
                when (cmd) {
                    "play" -> t.play()
                    "pause" -> t.pause()
                    "next" -> t.skipToNext()
                    "prev" -> t.skipToPrevious()
                    else -> if (mc.playbackState?.state == PlaybackState.STATE_PLAYING) t.pause() else t.play()
                }
            } catch (e: Exception) {
                // No access or the session went away.
            }
        }
    }

    // ---------------------------------------------------------------- lock

    /**
     * Turns the screen off (double-tap the clock, or `lock`). Uses the JRL lock accessibility service; if it
     * isn't switched on yet, opens Accessibility settings and tells the page. Returns true when it locked.
     */
    @JavascriptInterface
    fun lock(): Boolean {
        if (LockService.lock()) return true
        ui {
            act.emit("error", MainActivity.jsString("switch on JRL lock in Accessibility, then double-tap again"))
            act.start(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        return false
    }

    // ---------------------------------------------------------------- the page itself

    /** Checks the OTA source now; the page always gets an "updated" event with "updated", "same" or "failed". */
    @JavascriptInterface
    fun update() {
        ui { act.checkForUi(manual = true) }
    }

    /** The shell's versionCode (0 if unknown). */
    @Suppress("DEPRECATION") // longVersionCode needs API 28; ours fits in an Int
    @JavascriptInterface
    fun version(): Int = try {
        pm.getPackageInfo(act.packageName, 0).versionCode
    } catch (e: Exception) {
        0
    }

    private companion object {
        const val HOUR_MS = 3_600_000L
        const val DAY_MS = 86_400_000L
        const val MAX_EVENTS = 40
        const val MAX_PATTERN_STEPS = 64
        const val MAX_PATTERN_STEP_MS = 5_000L
        const val ART_PX = 240

        /** Process-wide: a new process means a cold start. */
        val coldStartUnread = AtomicBoolean(true)
    }
}
