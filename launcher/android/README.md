# JRL launcher (Android shell)

The Android home-screen app behind the JRL launcher. It is a thin Kotlin shell: one full-screen WebView
that loads the launcher page and gives it a native bridge, `window.JRLAndroid`, for apps, notifications,
calendar, media, haptics and system screens. All of the look and behaviour lives in the page
(`app/src/main/assets/www/index.html`, currently the v4.0 preview), which can also update itself over the air.

This source was rebuilt in November 2026 from the decompiled 0.1.2 APK (the original repo was lost). It keeps
the 0.1.2 bridge contract method-for-method, so older pages keep working.

| | |
|---|---|
| applicationId / package | `ing.jere.launcher` |
| Label | JRL |
| Version | 0.3.0 (versionCode 3) |
| SDK | min 26, target/compile 35 |
| Toolchain | AGP 8.7.3, Kotlin 2.0.21, Gradle 8.10.2 (wrapper), JDK 17 |
| OTA page source | `https://jere.ing/launcher/app/index.html` |

## Layout

```
app/src/main/java/ing/jere/launcher/
  MainActivity.kt   the activity: WebView setup, insets, native events, launching, OTA trigger
  Bridge.kt         window.JRLAndroid (every @JavascriptInterface method)
  Live.kt           Live (OTA page fetch) and LiveHandler (serves /live/…)
  IconHandler.kt    serves /icon/<pkg>/<activity> as PNG
  NotifListener.kt  notification-access service: unread counts per package
app/src/main/assets/www/
  index.html        the bundled page (v4.0 preview)
  fonts/            Archivo, Doto, JetBrains Mono (+ LICENSES.md, OFL.txt)
ci/launcher-apk.yml GitHub Actions workflow (copy to .github/workflows/)
```

The page is served from `https://appassets.androidplatform.net/` through `WebViewAssetLoader`:

- `/live/…` → `files/live/index.html` (the OTA copy) if present, else `assets/www/…`
- `/assets/…` → raw APK assets
- `/icon/<pkg>/<activity>` or `/icon/<pkg>` → the app icon as a 144×144 PNG

Links to any other host open in the browser / handling app, not in the WebView.

## Build

### GitHub Actions (no local setup)

1. Copy `ci/launcher-apk.yml` to `.github/workflows/launcher-apk.yml` in the repo. It expects this project
   at `launcher/android/`.
2. Add repo secrets: `JRL_KEYSTORE_B64` (the release keystore, base64: `base64 -w0 jrl.jks`),
   `JRL_KEYSTORE_PASSWORD`, `JRL_KEY_ALIAS`, `JRL_KEY_PASSWORD`. Without them the build still runs and the
   APK is debug-signed (fine for a test, but every CI run then has a different debug key, so updates won't
   install over each other).
3. Actions → **Launcher APK** → **Run workflow**. It runs only when you press the button.
4. Download the `jrl-launcher-apk` artifact from the run (a zip with `app-release.apk`).

### Android Studio

Open this folder, let it sync, then **Build → Build App Bundle(s) / APK(s) → Build APK(s)**, or run
`./gradlew assembleRelease`. With no `JRL_KEYSTORE_*` environment variables the release APK is signed with
your local debug key, so it installs directly. To sign properly, set:

```
JRL_KEYSTORE_PATH=/path/to/jrl.jks
JRL_KEYSTORE_PASSWORD=…
JRL_KEY_ALIAS=…
JRL_KEY_PASSWORD=…
```

Never commit a keystore (`.gitignore` blocks `*.jks` / `*.keystore`).

## Sideload

1. Get the APK onto the phone (download the artifact on the phone, or copy it over).
2. Open it from Files; allow "Install unknown apps" for that app when asked. Or from a PC:
   `adb install -r app-release.apk`.
3. The package name changed in 0.3.0, so this installs **alongside** the old 0.1.2 launcher, not over it.
   Uninstall the old one once the new one works.
4. Settings → Apps → Default apps → Home app → **JRL**.
5. In the launcher, grant notification access (needed for unread counts *and* now-playing media) and
   calendar access when the page asks.

## Bridge: `window.JRLAndroid`

All reads return JSON strings. Names and argument lists are a contract with every shipped page: add new
methods under new names; never change or overload an existing one (WebView matches by name and argument
count, and a wrong count throws "Method not found" in JS).

| Method | Returns / does |
|---|---|
| `apps()` | `[{key:"pkg/activity", pkg, act, label, sys}]`, every launchable activity except this app |
| `launch(key, x, y, w, h)` | Opens `"pkg/activity"`; with w,h > 0 (px) it grows from that rect, otherwise it cuts in with no animation |
| `info(key)` | App info screen (`key` is `"pkg/activity"` or `"pkg"`) |
| `uninstall(key)` | System uninstall dialog for the package |
| `battery()` | `{level: 0–100 or -1, charging, saver}` |
| `notifs()` | `{on, count, pkgs:{pkg:n}}`; `on:false, count:-1` without notification access |
| `device()` | `{maker, model, release, sdk, uptime (s), version (versionName)}` |
| `signal()` | *new* `{wifi:0–4, cell:0–4, net:"WIFI"/"CELL"/"", airplane}` |
| `haptic(kind)` | One tap: `long`/`heavy`, `tick`, `double`, `err`; anything else is a key tap |
| `hapticPattern(json)` | *new* Waveform from a JSON array `[on, off, on, …]` ms, like `navigator.vibrate` |
| `settings(which)` | Opens a settings screen (wifi, bt/bluetooth, airplane, data, display, sound, battery, storage, apps, notif, location, date, dev, home/launcher, wallpaper; else main Settings); returns `true` |
| `expand()` | Pulls down the notification shade |
| `webSearch(q)` | System web search, else Google in the browser |
| `view(url)` | Opens a URL in whatever handles it |
| `bars(dark)` | `true` = dark system-bar icons (light page), `false` = light icons |
| `statusBar(visible)` | *new* Shows / hides Android's status bar (swipe shows it briefly while hidden) |
| `keyboard()` | Focuses the page and asks for the soft keyboard |
| `coldStart()` | *new* `true` on the first call after the app process starts, then `false` |
| `events(days)` | `{perm, ev:[{id, title, begin, end, allDay}]}`: up to 40 not-yet-ended events, 12 h back to `days` (1–31) ahead |
| `askCalendar()` | Calendar permission dialog; fires `calendar` when it closes |
| `openEvent(id, begin)` | Opens the event in the calendar app (`begin` in ms as a string, may be `""`) |
| `openCalendar()` | Opens the calendar app |
| `media()` | `{on, active, title, artist, app, pkg, playing}`; `{on:false}` without notification access |
| `mediaCmd(cmd)` | `play`, `pause`, `next`, `prev`; anything else (e.g. `toggle`) flips play/pause |
| `update()` | Checks for a new page now; always answers with an `updated` event |
| `version()` | The shell's versionCode (number) |

## Native → page events

The shell calls `window.JRLnative.event(name, data)` (only after the page has finished loading). `data` is
`null` unless noted.

| Event | When |
|---|---|
| `back` | Android Back (the launcher never closes itself) |
| `home` | Home pressed while the launcher is already in front |
| `show` | The launcher resumed (unlock, return from an app) |
| `hide` | The launcher is being paused (an app opens, screen off) |
| `apps` | A package was added, removed, changed or (un)mounted |
| `notifs` | *new* A notification arrived and the counts changed (re-read `notifs()`) |
| `calendar` | The calendar permission dialog closed |
| `updated` | OTA check finished; `data` is the string `"updated"`, `"same"` or `"failed"`. Automatic checks only send `"updated"`; `update()` always reports |
| `error` | `data` is a string: `"launch failed: <pkg>"`, `"nothing can open that link"`, `"that screen is not available on this phone"` |

Inset sizes go to the page as CSS variables on `<html>`: `--sat`, `--sar`, `--sab`, `--sal` (px, in dp).
`--sab` is 0 while the keyboard is up (the shell lifts the WebView above the keyboard itself).

## OTA page updates

- Source: `https://jere.ing/launcher/app/index.html` (fetched with `?t=<now>`, User-Agent `jrl-launcher`,
  8 s connect / 15 s read timeout).
- Checked on resume at most every 30 minutes, or immediately through `update()`.
- Accepted only if HTTP 200, at least 20,000 bytes, and the text contains `JRLnative`. If it differs from
  the page in use it is written to `files/live/index.html` (via a temp file + rename) and used from the
  next page load. Only `index.html` is updated over the air; fonts always come from the APK.
- Installing a newer APK drops a downloaded page that is older than the install.
- Publish a page by uploading the assembled single-file `index.html` to that URL.

## Known gaps

### The v4.0 page's adapter vs this bridge

`launcher-proton/src/bridge.js` and the copy embedded in the v4.0 preview are identical (the preview has
one extra closing line). The page was written before the Kotlin source was recovered, against guessed
signatures. The native side keeps the 0.1.2 contract, so **these need fixing in the page adapter** (only
the `if (!MOCK)` block of `bridge.js`). Items marked *breaks* throw "Method not found" or show wrong data today.

| Page call | Native | Problem | Fix in the adapter |
|---|---|---|---|
| `launch(app.pkg, app.act)` | `launch(key, x, y, w, h)` | *breaks*: 2 args vs 5 | `call('launch', app.pkg + '/' + app.act, 0, 0, 0, 0)` (0s = no animation) |
| `apps()` reads `a.act` | 0.1.2 sent no `act` | launch keys were `"pkg/"` | fixed natively: `apps()` now also sends `act` |
| `settings()` | `settings(which)` | *breaks*: 0 args vs 1 | `call('settings', which \|\| '')` |
| `keyboard(!!on)` | `keyboard()` | *breaks*: 1 arg vs 0 | `call('keyboard')` (there is no hide) |
| `openEvent(String(id))` | `openEvent(id, begin)` | *breaks*: 1 arg vs 2 | `call('openEvent', String(id), String(begin \|\| ''))` |
| `haptic(kind, JSON)` / `haptic(ms)` | `haptic(kind)` | *breaks*: 2-arg call fails, the fallback passes a number as the kind, so every buzz is a plain key tap | `call('haptic', kind)`; for `pattern`, `call('hapticPattern', JSON.stringify(ms))` |
| `events(7)` reads `r.list` / `r.events`, `r.granted` | `{perm, ev}` | *breaks*: list is always empty; `granted` is always true | read `r.ev` and `r.perm` |
| `events` items read `e.color`, `e.cal` | not sent | calendar colour / name missing | native addition (Instances `DISPLAY_COLOR`, `CALENDAR_DISPLAY_NAME`) or drop |
| `notifs()` returns the object as-is | `{on, count, pkgs}` | *breaks*: the page treats `on`/`count`/`pkgs` as package names | return `n.pkgs` (and use `n.on` for the "grant access" state) |
| `bars(on)` means "show Android's bars" | `bars(dark)` = icon colour | wrong meaning: `set bars off` turns icons light instead of hiding the bar | call `statusBar(on)` for show/hide; keep `bars(dark)` for icon colour |
| `battery()` divides level by 100 if > 1 | level is 0–100 | at exactly 1% it reads as 100% | always divide when `level >= 0` |
| `device()` reads `name`, `android` | `maker`, `model`, `release`, `sdk` | shows "android // model", "?" | map `name ← maker + ' ' + model`, `android ← release` |
| `media()` reads `art`, `pos`, `dur` | not sent | no artwork, progress or timecode | native addition (MediaMetadata art bitmap → data URL, `PlaybackState.position`, `METADATA_KEY_DURATION`) |
| `signal()` expects `net` like `"5G"` / `"LTE"` | `"WIFI"` / `"CELL"` | radio generation not shown | needs `READ_PHONE_STATE` + `TelephonyDisplayInfo`; left out |
| `lock()` | missing | *no-op* (caught) | needs an accessibility or device-admin service, see below |
| `coldStart()` | added | fine now | none |
| `JRLnative 'updated'` reads `data.ok`, `data.why` | sends a string | every result shows as "UI update staged", even `same` / `failed` | `ok = data === 'updated'`, `why = data` |
| `JRLnative 'error'` reads `data.msg` | sends a string | the message is dropped from the log | use `data` when it's a string |

Also from the page side:

- The v4.0 page loads its fonts (Archivo, Doto, DotGothic16, EB Garamond, Hubot Sans, JetBrains Mono,
  Kode Mono) from Google Fonts over the network. The bundled TTFs in `www/fonts/` are not referenced by it,
  so offline the page falls back to system fonts. Add `@font-face` rules for `fonts/*.ttf` and bundle the
  missing families (all OFL) to make it fully offline.
- The page uses `env(safe-area-inset-*)`, but the shell consumes the window insets and publishes them as
  `--sat/--sar/--sab/--sal` instead (as 0.1.2 did), so in the WebView `env()` reads 0 and the strip can sit
  under the status bar. Use `var(--sat, env(safe-area-inset-top, 0px))` etc. in the page.

### Kotlin to-dos from `docs/jrl-launcher-v2-plan.md`

| To-do | Status |
|---|---|
| `haptic(kind, patternJson)` → `VibrationEffect.createWaveform` | **Done as `hapticPattern(json)`** (separate name, not an overload). Needs the adapter fix above |
| `haptic(kind)` with tick, click, heavy, double, err | **Done**: tick = clock tick, heavy = long press, double/err = system CONFIRM/REJECT on Android 11+ (short waveform before) |
| `lock()` via AccessibilityService `GLOBAL_ACTION_LOCK_SCREEN` or `DevicePolicyManager.lockNow()` | **Not done**: needs an accessibility or device-admin service the user enables by hand |
| `signal()` → `{wifi, cell, net, airplane}` | **Done, partly**: levels and airplane yes; `net` is the transport, not 5G/LTE |
| Push a `notif` event on arrivals | **Done** as the `notifs` event (no payload; the page re-reads `notifs()`; the v4 page already handles `notifs`) |
| `launch()` with `ActivityOptions.makeCustomAnimation(ctx, 0, 0)` | **Done**: used whenever no tile rect is passed |
| Hide the status bar when `set bars off` | **Done as `statusBar(visible)`**. Needs the adapter fix above |
| Send `show` on every return, `hide` before leaving | **Already so** (onResume / onPause) |
| Battery/charging events and power-saver state | **Partly**: `saver` added to `battery()`; no push event (the page polls every 30 s) |
| Fold state via WindowInfoTracker | **Not done** (optional; the page reacts to width) |

### Other

- Not built here: this project was written without an Android SDK or network, so it has never been compiled.
  Expect to fix small things on the first Android Studio sync.
- `lifecycle-runtime-ktx` is pinned at 2.6.1: the APK's lifecycle version files were build placeholders, and its
  code has `withStateAtLeast` but not `currentStateFlow`, which puts it at 2.5–2.6. Gradle resolves up if
  activity-ktx asks for newer.
- Notification counts and media both need notification access; without it the page sees `on:false`.
- The status bar on the Galaxy cover screen and inner screen has not been tested with `statusBar(false)`.
