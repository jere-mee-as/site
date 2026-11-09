package ing.jere.launcher

import android.accessibilityservice.AccessibilityService
import android.os.Build
import android.view.accessibility.AccessibilityEvent

/**
 * "JRL lock": an accessibility service whose only job is GLOBAL_ACTION_LOCK_SCREEN, so a double-tap on the
 * clock can turn the screen off. It asks for no events and reads nothing on screen. Off until the user
 * switches it on in Settings → Accessibility → Installed apps.
 */
class LockService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // No events are requested; nothing to do.
    }

    override fun onInterrupt() {
        // Nothing to interrupt.
    }

    override fun onDestroy() {
        if (instance === this) instance = null
        super.onDestroy()
    }

    companion object {
        @Volatile
        private var instance: LockService? = null

        /** Locks the screen if the service is on (Android 9+). Returns false when it couldn't. */
        fun lock(): Boolean {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
            val svc = instance ?: return false
            return try {
                svc.performGlobalAction(AccessibilityService.GLOBAL_ACTION_LOCK_SCREEN)
            } catch (e: Exception) {
                false
            }
        }
    }
}
