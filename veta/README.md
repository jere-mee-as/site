# Veta

Veta is a keyboard-first second brain in the Final Fantasy XIII style: typed objects, an outliner and daily notes, stored as plain Markdown in a folder you choose. It reads and writes that folder directly. (*Veta* is Spanish for a vein of ore.) A vault is just a folder: mine is called Jere's Place, and it is never in this repo. Only the app is.

| Path | What |
|---|---|
| `src/` | Page sources: `shell.html`, `base.css`, `app.css`, `vault.js`, `app1.js`, `app2.js`, `audio.js`, `fx.js`, `nav.js`, `native.js` |
| `assemble.py` | Inlines `src/` into one HTML file, `dist/Veta.html` |
| `demo-vault/` | A made-up vault (44 objects: daily notes, projects, books, quotes, people, queries) used by the demo in the Lab |
| `desktop/app/` | Electron shell: `main.js`, `preload.js`, `vaultfs.js`, `package.json`, icons, and the built `index.html` |
| `desktop/SETUP.md` | One-time setup for the Windows desktop app |
| `builds/v1.html`, `v2.html`, `v2.1.html` | Single-file builds of each version (from before the rename) |

## How to open and build

- **Demo:** jere.ing/#lab/veta. The sample vault loads in the browser; edits stay in that browser. Dates in the sample vault are relative (`{D0}` is today), so it always opens on a fresh day.
- **Build from source:** `python3 assemble.py` inside `veta/` writes `dist/Veta.html`. Copy it to `desktop/app/index.html` when it's a release.
- **Desktop app:** follow `desktop/SETUP.md`. The app keeps its storage keys and IndexedDB name from before the rename, so an existing setup keeps working.

## Status

v2.1 in daily use. The visible name changed to Veta in `src/` on Nov 9, 2026; the desktop app shows the new name after its next rebuild.

## Docs

[`docs/`](docs/): build notes. Desktop setup is in [`desktop/SETUP.md`](desktop/SETUP.md).
