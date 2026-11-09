package ing.jere.launcher

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Notification access. Keeps a per-package count of clearable, non-ongoing, non-summary notifications for
 * Bridge.notifs(); being an enabled listener is also what lets Bridge read media sessions.
 */
class NotifListener : NotificationListenerService() {

    override fun onListenerConnected() = recount()

    override fun onListenerDisconnected() {
        counts = emptyMap()
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val before = counts
        recount()
        // Tell the page right away on arrivals instead of waiting for its next poll.
        if (counts != before) onChange?.invoke()
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) = recount()

    private fun recount() {
        val next = HashMap<String, Int>()
        try {
            activeNotifications?.forEach { sbn ->
                val isSummary = (sbn.notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0
                if (sbn.isClearable && !sbn.isOngoing && !isSummary) {
                    next[sbn.packageName] = (next[sbn.packageName] ?: 0) + 1
                }
            }
        } catch (e: Exception) {
            // The listener can be unbound mid-call; publish what we counted.
        }
        counts = next
    }

    companion object {
        /** Unread notifications per package. Replaced wholesale, so readers on other threads see a consistent map. */
        @Volatile
        var counts: Map<String, Int> = emptyMap()
            private set

        /** Set by MainActivity while it is alive; called on the listener's thread. */
        @Volatile
        var onChange: (() -> Unit)? = null
    }
}
