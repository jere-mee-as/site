# JRL Launcher — build notes

Repo: github.com/jere-mee-as/site (launcher/android) (public). APK: github.com/jere-mee-as/site (launcher/android)
Built from claude/jrl-launcher-brief.md and jere-mee-as/site/template.html.

## v0.2 (2026-11-05) — daily-driver pass, from Jeremias's review of his stock home screen
What he relies on today: ~16 apps on page 1, folders (dating, finance, music, AI), calendar widget, now-playing widget, recognisable colour icons, almost never searches.
Changes:
- Home: compact Doto clock + date/week strip, Agenda (next 7 days from phone calendars, READ_CALENDAR asked on tap), Now playing (media sessions via notification access; prev/play/next), 4-col grid of pinned apps + folders sitting low near the thumb (max 24 items).
- Folders: hold app → Put in a folder → existing or new; tap folder opens a panel, rename inline, Ungroup.
- Hold sheet is contextual: pin/remove, move earlier/later, folder, hide, info, uninstall.
- Drawer: real icons default (`set icons app|mosaic|pixel`; mosaic = icon redrawn as round pixels in its own colours), 4 columns, find bar (Enter opens top match), inline tile-sized letter markers, A–Z rail, hidden apps. No 001 numbering. Labels no longer scramble.
- Swipe up on home → drawer with search focused (Android habit). Prompt tap → terminal.
- Transitions still random, but content shows under the dissolve immediately.
- Boot: smart (after phone restart or UI update); `set boot always|smart|off`.
- OTA UI: app pulls index.html from main every 30 min (on return to home), applies next time you leave home; terminal `update` forces. New APK resets to its bundled page. Only Kotlin changes need reinstall.

## Architecture
- Kotlin shell (ing.jere.launcher): MainActivity HOME + LAUNCHER, full-screen WebView at https://appassets.androidplatform.net/live/index.html (LiveHandler: downloaded copy, else bundled assets).
- Bridge `window.JRLAndroid`: apps, launch, info, uninstall, battery, notifs, device, haptic, settings, expand, webSearch, view, bars, keyboard, events, askCalendar, openEvent, openCalendar, media, mediaCmd, update, version.
- Native → page: `JRLnative.event` back, home, show, hide, apps, calendar, updated, error.
- IconHandler serves icons at /icon/<pkg>/<activity>. NotifListener counts per-app notifications (no content).
- CI builds and publishes a release on every push; fixed keystore so updates install over each other.

## Open
- Not yet run on a real device.
- Ideas not built: multiple home pages, drag-to-reorder, double-tap to lock, Android widgets (WebView can't host them).
