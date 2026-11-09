# JRL Launcher v2 → v3: plan (Nov 7, 2026)

Guiding question, from Jeremias: **"In a future where this aesthetic is the norm, what would the UI look like?"** Follow that all the way, ignore present-day launcher habits where they only exist out of habit, but stay useful as a daily driver. The website is a sample of the language, not a template. Everything gets tweaked iteratively.

Overrides `jrl-launcher-brief.md` (old). Builds on `jrl-launcher-v2-handoff.md` and `jrl-v3-1-decisions.md`.

## Status (Nov 7, 2026, 23:30 ET)

- **v3.0 is the current preview** at the time of writing: `../previews/v3.0.html`. v2.0 to v2.2 stay in `../previews/`; the v2.2 sources are kept in `../web/archive/src-v2.2/`.
- Jeremias asked for three changes and then: "knowing everything you know now, scrap this and implement the elegant solution." v3.0 is that rebuild. The v3.0 section below overrides everything older where they conflict.
- Tested in the cloud at 412×915, 412×820, 390×844 and 984×1092 (fallback fonts), radical and utility, eight palettes, grid and list slots, night. No console errors. Daily-jobs tap check still passes.
- Not done yet: Jeremias's field test on the Fold7. His notes become v3.1.
- Bridge wiring, local fonts and the APK were still to do (see `../android/README.md`).

## v3.0: one field, one strip (Nov 7)

Jeremias's asks: keep the options in the terminal and drop the button that opened them; palettes should be able to change whole backgrounds, as a setting (radical or utilitarian); an option to show the apps as a list instead of blocks; then rebuild it as the elegant solution.

The idea: **the field is the screen and the strip is the only chrome.** Every view is one full-bleed field; the lime strip at the bottom is the one constant (tap it for the terminal, slide it to launch, read the unit at its right end). There are no buttons for settings anywhere, because in this world options are commands.

| # | Change | What it does |
|---|---|---|
| 1 | **Colour is a setting: `set color radical` (default) or `utility`** | Radical: every view IS its palette hue, so the whole screen changes when the view or the palette does (Standard: Console blue, Manifest pink, Schedule bone, Signal orange, Comms violet, Bio black). Utility: grounds stay deep or light (the register decides, `set register auto|white|dark`) and the hues become accents only. Contrast is computed per field; small text moves onto black slabs when a field is mid-contrast. |
| 2 | **Night overrides both** | 00:00–06:00 ET, every field goes deep and no cut flashes. The page re-themes on its own when the hour turns. |
| 3 | **Every option lives in the terminal** | `set` prints every option as a table (value highlighted among its choices). `set KEY VALUE` changes one, `set KEY` explains it. Twelve options: color, palette, register, slots, icons, labels, sound, haptics, life, launch, boot, bars. The old commands (`palette ember`, `mode dark`, `sound on`…) still work as shortcuts. Tab on a keyboard opens the terminal on `set`. |
| 4 | **No options button and no index screen** | The index key, the index overlay and the life chip are gone. A readout of a setting is only a shortcut to its command: tapping Bio's life support panel types `set life ` into the terminal. |
| 5 | **The loadout as blocks or a list: `set slots grid|list`** | Grid: 4×4 blocks with codes. List: two columns of 8 rows, each with slot number, small glyph, code and full name. Kits show their size (`K/04 Music`). The switch steps in over 3 frames. |
| 6 | **Views grow out of what opened them** | An instrument grows into its view in 3 frames; swiping up grows the Manifest out of the strip. Back shrinks either one home. Bursts stay for launch, palette, colour mode, root, boot and unfold. Horizontal swipes between readouts are hard cuts. |
| 7 | **Folders are kits** | `K/` everywhere (tiles, program file, `slots`, `open k/music`). |
| 8 | **Sound map** (still off by default) | scrub letter = tick, launch = crackle per card + thump, grow = click, arrival = chirp, wake = crackle, plant = feed, lock = thump. Haptics on by default with the same map. |

The code was rewritten, not patched: `pal.js` (colour engine with the two modes), `shell.html`, `launcher.css` and `app.js` are new; `term.js` gained the `set` table. `app.js` keeps every v2.2 behaviour (scrub-to-launch, program file, kits, ticker, colony wallpaper, clock hold and double-tap lock, wake resolve, launch waveform, unfold flip) behind a settings registry (`JRL.settings()`, `JRL.set(k, v)`).

## v2.2: decisions from the second grill (Nov 7)

The test again: "is this how it would be if the world had this aesthetic?" v2.1 had the right structure; it failed on motion and the screen edges.

| # | Change | What it does |
|---|---|---|
| 1 | **Instruments grow, they don't burst** | Tapping an instrument (or the one line) grows that cell into its readout in 3 stepped frames (~100ms), framed in ink, carrying the instrument's value. Back shrinks it home. Bursts are kept for launch, palette, root, boot and unfold. |
| 2 | **One strip runs the phone** | The top strip is gone; the field runs to the top edge. Time, Wi-Fi, cell, colony day and power sit at the right end of the lime strip. On the Console the time is hidden there because the giant clock is the time. The wordmark lives in the strip when unfolded. |
| 3 | **The colony is the wallpaper** | The 32×18 culture fills the Console field in square cells (turned upright on a tall screen, cropped to fill), dim enough that slabs carry all small text. Tapping empty field plants a glider under your finger (counts as feeding). Every arriving notification drops a cell. The BIO instrument shows population; the unfolded column no longer repeats the colony. |
| 4 | **Slot labels are codes** | `PHN MSS CHR GML WHT…` by default; `set labels name` or the index switch brings names back. |
| 5 | **No white flashes at night** | In the dark register and during the colony's night, cuts are clean hard cuts with no inverted frame (also the arrival flash on the strip). |
| 6 | **Waking re-acquires** | Coming back to the launcher (unlock, or returning from an app) resolves the Console in 4 block steps, coarse to fine, about 130ms. |
| 7 | **You feel the burst** | The launch burst and palette flips play as a vibration waveform, one pulse per card and a heavier one on the last. |
| 8 | **The index is settings** (replaced in v3.0: options live in the terminal) | No more six cards. All 17 palettes are a swatch grid you tap, then register, icons, labels, sound, haptics, life, launch, Android bars, boot. |
| 9 | **Hold the clock to feel the time** | Long pulses for the hour (12-hour), short pulses for tens of minutes. `time` in the terminal does the same. With sound on, it beeps along. |
| 10 | **Double-tap the clock to lock** | Calls `lock()` on the bridge. `lock` in the terminal does the same. The mock shows a black screen; tapping it wakes the unit with the block resolve. |

### Kotlin to-do added by v2.2
- `haptic(kind, patternJson)`: when kind is `pattern`, play the JSON array `[on, off, on, …]` ms with `VibrationEffect.createWaveform`.
- `lock()`: AccessibilityService `GLOBAL_ACTION_LOCK_SCREEN` (needs the user to enable the service once) or `DevicePolicyManager.lockNow()` (device admin).
- Send `show` on every return to the launcher (unlock included) so the wake resolve plays; send `hide` before leaving.

## v2.1: decisions from the grill (Nov 7)

The test: "is this how it would be if the world had this aesthetic?" v2.0 failed it. It was a 2025 launcher skeleton (tab bar, squircle icon grid, badges, widget stack, bottom sheets) wearing the costume.

| # | Question | Decision |
|---|---|---|
| 1 | Six tabs? | **Killed.** The Console is the only place. Schedule, Signal, Comms and Bio are instruments on it; tapping one bursts its readout open, Back cuts home. The Manifest is one swipe up. The top strip is pure status. |
| 2 | Scrub to launch | **Yes.** Slide along the lime strip: it becomes an A–Z ruler, the field shows the matching programs as giant cropped names, the most-used one sits nearest your thumb. Release opens it; slide up to pick another; lift above the list to cancel. A plain tap still opens the terminal. |
| 3 | Icons | **Duo by default**: the icon in the palette's ink plus one block of the app's own colour. `icons app` brings real icons back; `mosaic`, `pixel` and `code` also exist. |
| 4 | Pinned grid | **Loadout**: 16 numbered slots in fixed positions. Empty slots stay empty; tapping one opens the Manifest in assign mode. Nothing reflows. |
| 5 | Badges | **Gone.** New notifications take over the lime strip for 3 seconds (`INCOMING // WHATSAPP 03`, inverted strip, double haptic). Slots with unread light their top edge. Counts live in Comms. |
| 6 | Status bar | **Ours.** Android's bar is hidden (`set bars off`, the default); the strip shows time, Wi-Fi, cell, colony day and power. Swipe down still opens the shade. |
| 7 | Console density | **Calm**: giant time, one date line, one line (an event under 30 minutes wins, then a playing song, then the next event, then a paused song), the instrument row, the loadout. |

Also changed in v2.1 (Claude's calls, not contested):
- **Launch is frame 0.** The app starts at the tap; the burst plays over Android's own load time. Kotlin should launch with no window animation so the app cuts in.
- **Terminal output prints instantly**; only the first line of an answer scrambles.
- **Unfolding is a big move** (panel flip, "Stage // 12 COL"); folding is a cut.
- **Holding a program opens its file**: full screen in the app's colour, giant cropped name, PRG number and code, opened count, last opened, unread, slot, and the actions as command lines (uninstall behind a hazard stripe).
- **Kits** (folders) open as a panel over the loadout.
- **The Manifest is a table**: PRG number, glyph, code, name, times opened. Letters are quiet ruler rows. No letter blocks, no A–Z rail (the strip does that). Two columns when unfolded.
- **Program codes are unique** (Proton Mail PRM, Proton Drive PRD, Calculator CLC, Clock CLK).
- **The Signal instrument has its own play/pause key**, so the song is one tap away even when an event holds the one line.
- Coming home is still one inverted frame. Going out is the big move.

### Daily-jobs check (v2.1 vs the stock Samsung home)

Jeremias didn't send a list, so this uses the daily needs from the v0.2 notes. Tested in Playwright on the mock bridge.

| Job | Stock | v2.1 |
|---|---|---|
| Open a pinned app | 1 tap | 1 tap (slot), app starts on the tap |
| Open any other app | swipe up, scroll or type, tap | 1 slide on the lime strip, release |
| App in a folder | 2 taps | 2 taps (kit, program) |
| Next event | glance at widget | glance at the AGD instrument (countdown + title) |
| Play/pause | 1 tap on widget | 1 tap (the one line or the Signal key) |
| Notifications | swipe down | swipe down on the Console |

### Kotlin to-do for v2.1
- Hide the status bar (`WindowInsetsController.hide(statusBars())`, transient bars by swipe) when `set bars off`; the page asks through `bars(false)`.
- New bridge call `signal()` → `{wifi: 0–4, cell: 0–4, net: "5G"|"LTE"|…, airplane}`.
- `launch()` with `ActivityOptions.makeCustomAnimation(ctx, 0, 0)` so apps cut in.
- `haptic(kind)` with kinds tick, click, heavy, double, err.
- Push a `notif` native event on arrivals (package + new count) instead of relying on 4s polling, so the ticker is instant.
- Fold state: the page already reacts to width; WindowInfoTracker is optional.

## Decisions taken this session

| Topic | Decision |
|---|---|
| Screens | The launcher's own six "decks", not the site's modules (no colour generator on a phone). |
| Register | User setting: `mode auto` (default), `mode white`, `mode dark`. Auto = content decides, and everything goes dark 00:00–06:00 ET while the colony sleeps. |
| Palettes | 16 palettes, switched from the terminal (`palette`, `palette ember`, `palette next`, `palette random`) or the index. A palette swap is a big move (flash-card burst). |
| Sound | Off by default. `sound on` turns the synth on. Haptics on by default (`haptics off`). |
| Root | `root`, `su` or `~` plays the invert sweep, then drops into the fullscreen root tty with the site's toys. Exiting sweeps back. |
| Priority screen | Fold7 **cover screen** first (≈412 dp wide). The unfolded screen (984×1092 dp) gets the site's 12-column stage with the instrument column. |

## The fiction

The phone is a field unit, node **JRL-01**. Apps are programs loaded from a manifest; each gets a code (`PRG 017 / SPOTIFY`). The colony is the tenant. The OS speaks in direct system copy, no cute lines.

## Six decks (top strip codes; swipe left/right, tap a code, or `go 3`)

| # | Code | Name | What it is | Identity |
|---|---|---|---|---|
| 01 | HOM | Console | Doto clock, date, next event, now-playing strip, instrument strip (colony, life, comms), 16 pinned programs low near the thumb | lime |
| 02 | APP | Manifest | Every program: 4-col grid, inline letter tiles, A–Z ruler rail you scrub (giant cropped letter shows where you are), hidden programs, icon modes app / mosaic / pixel | blue |
| 03 | AGD | Schedule | Countdown to the next event (T-01:08:22), 7-day density ruler, day-by-day list, opens events in the calendar app | bone |
| 04 | SIG | Signal | Now playing: duotone art inside a HUD tick ring that tracks progress, Doto timecode, big transport keys, round-pixel EQ | orange |
| 05 | COM | Comms | Unread counts per program as block bars (tap opens the app), shade button, the unit's telemetry log | pink |
| 06 | BIO | Bio | The colony at full size (tap to feed), its stats and genome, life support with real battery, device readouts | teal |

## Motion

- 30fps grid. Deck switch = hard cut with one inverted frame + haptic tick.
- **Launching a program is the big move**: flash-card burst (code card `exec com.app` → dither into the app's own colour → mosaic → title card with the name cropped in Archivo), about 220ms, then the app opens. `set launch burst|cut`.
- Palette change, boot and root are also big moves. Overlays (terminal, index, sheets) step in over 3 frames.
- Background bursts every 2–4s: glyphs, genome hex rows, barcode, coordinate tags, LED. The colony steps once per burst.

## Chrome

- **Top strip** (system layer): six deck codes with identity swatches, battery. On the unfolded screen also the wordmark.
- **Lime bottom strip**: index key + the prompt. Every tap types its command there (`open spotify`, `go sig`, `palette ember`).
- **Terminal** slides up from the prompt. Search is the terminal: `find sp` filters the manifest live; Enter opens the top match.
- **Index** (tap the index key or the active deck code): six deck cards plus the SYS rows (register, palette, sound, haptics, life, icons, launch fx). It is the settings screen.
- Hold a program: sheet with pin/unpin, move earlier/later, put in folder, hide, info, uninstall (hazard stripe).

## Gestures

Swipe left/right = next/previous deck. Swipe up on Console = Manifest. Swipe down on Console = Android notification shade. Swipe down at the top of Manifest = back to Console. Android Back closes the top overlay, then returns to Console. Tapping an empty spot on a field drops the grid reticle (`C 03 · R 07`).

## Life support

FULL / LOW / AUTO. AUTO drops to LOW on reduced motion, battery under 20% and not charging, or data saver. LOW halves burst rate, stops the EQ and colony escapes, and swaps the launch burst for a cut. Battery and charging come from the bridge (`navigator.getBattery` in the preview).

## Colony on the phone

Same engine as the site, its own organism (different storage), same day count (Day 001 = 2026-11-07 ET). Fed by returning to the launcher after 10+ minutes (an unlock counts as a visit), by every 5th program launch, and by tapping it. Dormant 00:00–06:00 ET, dozes after 2 minutes idle, escapes across the Console every 3–6 minutes.

## Bridge

The page talks to `window.JRLAndroid` through one adapter (`B` in `bridge.js`). Without it, a mock bridge runs (fake programs, calendar, media, notifications) so the preview works in any browser. The real method signatures are listed in `../android/README.md`; only the adapter should need to change. Native events arrive at `JRLnative.event(name, data)`: back, home, show, hide, apps, calendar, updated, error.

## Preview harness

On a desktop the page frames itself as the Fold7 cover screen (412×915), with buttons for the unfolded screen (984×1092) and fill. On a phone it runs full screen. Layouts use container queries on the device frame, so the frame sizes behave like real screens.

## Sources and files

Modular sources live in `../web/src` and are assembled into one HTML file with `assemble.py`, so they can't be lost with a chat again. Every preview is a new versioned file in `../previews`.

## Next steps (native)

1. Wire the adapter to the real bridge; bundle the fonts as local woff2 (Google Fonts won't load offline).
2. Kotlin: add a haptic kinds parameter if `haptic` doesn't take one; pass battery/charging events and power-saver state.
3. Replace the bundled `index.html` in jrl-launcher, push, let CI build the APK, test on the Fold7 (both screens).
