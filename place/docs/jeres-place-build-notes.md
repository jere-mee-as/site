# Jere's Place: second brain (build notes)

A Capacities + Tana hybrid in the FFXIII style (built from the FFXIII v2 template). One page that reads and writes a folder of plain Markdown. Direction:
- Keyboard first ("clicking is cringe").
- **Desktop app first** (Nov 9). Android is on hold.
- **Jere's Place is where writing happens** (cutover agreed); Capacities is no longer the source of truth.

The notes vault itself is private and never in this repo. This folder holds the app only.

## Where it lives
- `builds/`: single-file browser builds, never overwritten: `v1.html`, `v2.html`, `v2.1.html` (current).
- `desktop/`: the Electron shell (`app/main.js`, `preload.js`, `vaultfs.js`, `index.html`, icons) and `SETUP.md`.
  - Setup: download the Electron win32-x64 zip, unzip it outside any sync folder, copy `app` into `resources/`, rename `electron.exe` to `Jere's Place.exe`.
- Sources: `src/*` + `assemble.py`. The app skips `_` folders in the vault.
  - Build: `python3 assemble.py` → `dist/Jere's Place.html`.
  - Bundle order: vault, app1, audio, fx, app2 (minus boot), nav, native, boot.
- **Updating the desktop app:** `main.js` loads `<vault>/_jeres-place-src/desktop/app/index.html` when it exists, falling back to the bundled copy. To ship a new page, write the built file there and press Ctrl R. Only `main.js`/`preload.js` changes need a manual re-copy into `resources/app`.

## How it works
- **Storage, browser:** File System Access API, handle in IndexedDB. On `file://`, Chrome asks for the folder again on every visit, which is why the desktop app exists.
- **Storage, desktop:** `window.jpNative` (preload, contextIsolation) → IPC → `vaultfs.js`, plain Node, testable.
  - Paths are vault-relative and anything resolving outside the vault is refused.
  - Writes go to a temp file, then rename.
  - BOMs are stripped.
  - Images/PDFs load as `file://` URLs.
  - In the page, `src/native.js` swaps the `B` backend methods when `window.jpNative` exists; `B.kind` stays `'fs'`.
- **Desktop shell (`main.js`):**
  - Single instance; remembered window bounds.
  - Global capture hotkey **Ctrl+Alt+Space** brings the window forward and sends `jp:capture`, which calls `capture()`. If the hotkey is taken, a notice says so.
  - Tray: Open, Capture, Start with Windows (`--hidden`), close-to-tray toggle, Choose vault, Open settings file, Quit.
  - Close → hide to tray, or quit if close-to-tray is off. Quit runs `window.__jpFlush()` (max 3 s) first.
  - Links: http(s) → default browser; `file:` → default app. PDFs show in an embedded viewer (`plugins: true`).
  - Esc is forwarded as `jp:esc`, so the page takes focus back from a focused PDF.
  - Keys: F11, Ctrl ± 0 zoom, Ctrl R, Ctrl Shift I.
  - Config: `%APPDATA%/jeres-place/config.json` (`vault`, `hotkey`, `closeToTray`, `bounds`).
- **Saving:** debounced 650 ms; only edited files are written; conflict copy "(edited in Jere's Place).md"; delete → `_trash/`.

## Features
- **Capacities side:** typed objects, editable fields, daily notes + `+ Entry`, linked references, live Query objects, pins.
- **Tana side:** outliner (Enter/Tab/Backspace merge/move/fold/zoom/tasks/undo); inline `[[`, `#Type` supertags, `/` commands; Alt Enter crystallizes.
- **FFXIII shell:** Today, Party, Datalog, Crystarium. Ctrl K opens the palette. In `N` (new object), typing a title instead of a type offers "New Atomic note / Page / Project / Person / Book / Quote: '…'".

## Keyboard model (v2)
- **EDIT:** a line has the caret.
- **NAVIGATE:** a cursor with the pointer hand walks title → fields → nodes → backlinks.
- **Esc ladder:** edit → navigate → zoom out → back (`[` `]` and Alt ←/→ also step).
- Today opens ready to type only on launch and with `A` (or the desktop hotkey).

| Global key | Action |
|---|---|
| T / P / D / C | Today / Party / Datalog / Crystarium |
| K or / | Search |
| N | New object |
| A | Capture |
| F | Follow: keycap hints on links and targets, content first |
| 1–6 | Open Party slot |
| Space or ? | Commands overlay |
| W / M / S | World / Sound / Settings |

| Note key | Action |
|---|---|
| ↑↓ PgUp/PgDn Home/End | Move the cursor |
| Enter / E / I | Edit or activate |
| O / Shift O | New line below / above |
| X | Task cycle |
| Tab / Shift Tab | Indent / outdent |
| Shift ↑↓ | Move the line |
| ← → | Fold or go to parent / unfold or go to first child |
| Z / Shift Z | Zoom in / out |
| Del | Delete the line |
| Ctrl Z | Undo (stays in navigate mode) |
| B | Backlinks |
| R | Rename |
| Y | Copy `[[link]]` |
| * | Pin |
| , . | Previous / next day, or object of the same type |

Other views: Datalog uses arrows, PgUp/PgDn, ←→/Tab to change type, / to filter. Crystarium: Tab hops along link paths. Keys pressed mid-transition are queued, not dropped.

## QA
- Browser keyboard suite: 36 checks, all passing on Nov 8 (3 date-dependent checks fail after midnight because the test hardcodes the date).
- Desktop: `vaultfs` unit tests 15/15 (list 312 notes in 63 ms, traversal refused, temp-file write, BOM); page-through-bridge integration on `file://` 22/22 (first-run pick, reopen with no pick, typing to disk, hotkey capture, images and embedded PDF via F, quick-create, flush, trash, hotkey-conflict notice).
- Not testable in the sandbox: Electron itself (`main.js` glue, tray, global shortcut, real PDF-viewer focus).

## Open
- **Android:** on hold. Needs folder sync and a touch design pass. Could live as a room in the JRL launcher.
- **Sparse links:** the Capacities export carries few links.

## Ideas not built
File rename with link rewriting; unlinked mentions; custom types; keyboard multi-select; a hotkey settings UI (it's in config.json for now).
