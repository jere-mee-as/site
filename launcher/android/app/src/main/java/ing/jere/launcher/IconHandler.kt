package ing.jere.launcher

import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.util.LruCache
import android.webkit.WebResourceResponse
import androidx.core.graphics.drawable.toBitmap
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

/**
 * Serves https://appassets.androidplatform.net/icon/<pkg>/<activity> (or /icon/<pkg>) as a 144×144 PNG
 * of the app's icon. Rendered PNGs are cached in memory (12 MB).
 */
class IconHandler(private val ctx: Context) : WebViewAssetLoader.PathHandler {

    private val cache = object : LruCache<String, ByteArray>(CACHE_BYTES) {
        override fun sizeOf(key: String, value: ByteArray): Int = value.size
    }

    override fun handle(path: String): WebResourceResponse? {
        val key = Uri.decode(path).trimStart('/')
        val png = cache.get(key) ?: render(key)?.also { cache.put(key, it) } ?: return null
        return WebResourceResponse("image/png", null, ByteArrayInputStream(png))
    }

    private fun render(key: String): ByteArray? = try {
        val parts = key.split("/", limit = 2)
        val pm = ctx.packageManager
        val icon = if (parts.size == 2) {
            pm.getActivityIcon(ComponentName(parts[0], parts[1]))
        } else {
            pm.getApplicationIcon(parts[0])
        }
        val bitmap = icon.toBitmap(SIZE_PX, SIZE_PX, Bitmap.Config.ARGB_8888)
        ByteArrayOutputStream().use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.toByteArray()
        }
    } catch (e: Exception) {
        null
    }

    private companion object {
        const val SIZE_PX = 144
        const val CACHE_BYTES = 12 * 1024 * 1024
    }
}
