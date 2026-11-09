# place

Jere's Place is a keyboard-first second brain in the Final Fantasy XIII style: typed objects, an outliner and daily notes, stored as plain Markdown in a folder you choose. It reads and writes that folder directly. The notes vault is never in this repo; only the app is.

| Path | What |
|---|---|
| `src/` | Page sources: `shell.html`, `base.css`, `app.css`, `vault.js`, `app1.js`, `app2.js`, `audio.js`, `fx.js`, `nav.js`, `native.js` |
| `assemble.py` | Inlines `src/` into one HTML file |
| `desktop/app/` | Electron shell: `main.js`, `preload.js`, `vaultfs.js`, `package.json`, icons, and the built `index.html` (currently the same as `builds/v2.1.html`) |
| `desktop/SETUP.md` | One-time setup for the Windows desktop app |
| `builds/v1.html`, `v2.html`, `v2.1.html` | Single-file builds of each version |

## How to open and build

- **In a browser:** open a file in `builds/` (v2.1 is the latest). The browser asks for the vault folder.
- **Build from source:** run `python3 assemble.py` from inside `place/`. It writes `dist/Jere's Place.html`. Copy that to `desktop/app/index.html` (and `builds/`) when it's a release.
- **Desktop app:** follow `desktop/SETUP.md` (download Electron, drop `desktop/app/` into its `resources` folder). Adds a global hotkey that starts an entry in today's note, and keeps running in the tray.

## Status

v2.1 is the current build, in the browser and in the desktop app.

## Docs

[`docs/`](docs/): `jeres-place-build-notes.md`. Desktop setup is in [`desktop/SETUP.md`](desktop/SETUP.md).
