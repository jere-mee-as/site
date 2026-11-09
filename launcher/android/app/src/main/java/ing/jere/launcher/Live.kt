package ing.jere.launcher

import android.content.Context
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Over-the-air page updates. A downloaded index.html is kept in files/live/ and served instead of the
 * bundled assets/www/index.html. Everything else (fonts) always comes from the APK.
 */
object Live {

    const val SRC = "https://jere.ing/launcher/app/index.html"

    const val UPDATED = "updated"
    const val SAME = "same"
    const val FAILED = "failed"

    private const val MIN_GAP_MS = 30 * 60 * 1000L
    private const val PREFS = "live"
    private const val KEY_CHECKED = "checked"

    /** Anything smaller, or without the native event hook, is an error page, not the launcher. */
    private const val MIN_BYTES = 20_000
    private const val MARKER = "JRLnative"

    fun file(ctx: Context): File = File(ctx.filesDir, "live/index.html")

    /** A freshly installed APK wins over an older downloaded page. */
    fun dropIfStale(ctx: Context) {
        val f = file(ctx)
        if (!f.exists()) return
        val installed = try {
            ctx.packageManager.getPackageInfo(ctx.packageName, 0).lastUpdateTime
        } catch (e: Exception) {
            0L
        }
        if (installed > f.lastModified()) f.delete()
    }

    /** At most one automatic check every 30 minutes. */
    fun due(ctx: Context): Boolean =
        System.currentTimeMillis() - ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getLong(KEY_CHECKED, 0L) > MIN_GAP_MS

    /**
     * Downloads [SRC] and stages it if it differs from the page in use. Blocking: call off the main thread.
     * Returns [UPDATED], [SAME] or [FAILED]. The new page is picked up on the next page load.
     */
    fun fetch(ctx: Context): String {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putLong(KEY_CHECKED, System.currentTimeMillis()).apply()
        return try {
            val conn = URL("$SRC?t=${System.currentTimeMillis()}").openConnection() as HttpURLConnection
            val body = try {
                conn.connectTimeout = 8_000
                conn.readTimeout = 15_000
                conn.useCaches = false
                conn.setRequestProperty("User-Agent", "jrl-launcher")
                if (conn.responseCode != HttpURLConnection.HTTP_OK) return FAILED
                conn.inputStream.use { it.readBytes() }
            } finally {
                conn.disconnect()
            }

            if (body.size < MIN_BYTES || !String(body, Charsets.UTF_8).contains(MARKER)) return FAILED

            val target = file(ctx)
            val current = if (target.exists()) target.readBytes() else ctx.assets.open("www/index.html").use { it.readBytes() }
            if (current.contentEquals(body)) return SAME

            // Write next to the target and rename, so the page is never served half-written.
            val dir = target.parentFile!!
            dir.mkdirs()
            val tmp = File(dir, "index.tmp")
            tmp.writeBytes(body)
            if (!tmp.renameTo(target)) {
                target.delete()
                tmp.renameTo(target)
            }
            UPDATED
        } catch (e: Exception) {
            FAILED
        }
    }
}

/**
 * Serves https://appassets.androidplatform.net/live/…: index.html from the OTA copy when there is one,
 * everything else (and index.html otherwise) from assets/www/.
 */
class LiveHandler(private val ctx: Context) : WebViewAssetLoader.PathHandler {

    override fun handle(path: String): WebResourceResponse? {
        val name = path.trimStart('/').ifEmpty { "index.html" }
        if (".." in name) return null

        val mime = when (name.substringAfterLast('.', "")) {
            "html" -> "text/html"
            "js" -> "text/javascript"
            "css" -> "text/css"
            "png" -> "image/png"
            "ttf" -> "font/ttf"
            else -> "application/octet-stream"
        }
        return try {
            val live = Live.file(ctx)
            val stream: InputStream =
                if (name == "index.html" && live.exists()) live.inputStream() else ctx.assets.open("www/$name")
            WebResourceResponse(mime, if (mime.startsWith("text")) "utf-8" else null, stream)
        } catch (e: Exception) {
            null
        }
    }
}
