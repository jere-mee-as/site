# JERE.ING

Everything I build, in one repo. The root is the live site at https://jere.ing: a numbered list of reports from my reading group, dressed up as a sci-fi operator terminal. The folders around it hold the other projects.

| Folder | What | Live? |
|---|---|---|
| `/` (template.html, build.py, reports/) | The site: Uplink, the runner's shell between runs | yes, jere.ing |
| `lab/` | Design explorations: Marathon type/colour, Uplink, Final Fantasy XIII, Mirror's Edge | not yet |
| `launcher/` | JRL Launcher, Android home screen: Kotlin shell, web UI, previews v0–v4 | not yet |
| `switchboard/` | Switchboard, a chat-app-layout Android launcher concept | not yet |
| `kept/` | Kept, a local AI file manager for Windows | not yet |
| `place/` | Jere's Place, a keyboard-first second brain (app only, never the notes) | not yet |
| `archive/` | Earlier versions of the site: terminal of the future (v3.6), graphic realism, paper & ink, plus the v3.x previews | built into reports/_archive/ |
| `docs/` | Site plans and decision records | no |
| `legacy/` | The old GitHub Pages workflow, parked so it can't run | no |

Read `PUBLISHING.md` before making anything else public.

## About the "root" / "hack" stuff

The terminal on this site is **set dressing**. The look comes from the *Marathon* "graphic realism" style (the front page is Uplink, the second pass at it; the first pass is archived). Commands like `root`, `scan`, `ping`, `top`, `ps`, `kill` and `decrypt` are toys written in the page's own JavaScript. They print made-up text and play sounds. None of them:

- touch your computer, your files or your network,
- scan, probe or contact anything except the site's own files,
- download or run anything.

The only outside things the page loads are fonts (Google Fonts), images from my Are.na channels, and YouTube for the song of the day. The tarot card uses a random id kept in your own browser; there is no IP lookup.

## Adding a report

Drop a file into `reports/`, commit it, and build.

- **Title:** the HTML page's `<title>`, or the PDF's title, or the filename.
- **Comment:** the page's `<meta name="description">`, or a `.txt` file with the same name (`skynet.pdf` + `skynet.txt`).
- **Date:** when the file was first committed.
- **Overrides:** put anything you want to force in `reports/_meta.json`.

Don't edit `index.html` directly; edit `template.html` for design changes. Old designs live in `archive/<name>/template.html` and are built to `reports/_archive/<name>/`.

## Building and hosting

This repo works with or without GitHub.

- **On my PC:** double-click `BUILD SITE.bat`. It runs `build.py` and puts the finished site in `_site/`. Upload that folder to any static host (it's on Cloudflare Pages).
- **Live site:** Cloudflare Pages (project `jere-ing`) builds every push to `main` with `pip install pypdf && python build.py && python tools/package_site.py` and serves `_site/` at https://jere.ing.
- **GitHub Actions:** off. `.github/workflows/build.yml` is the old GitHub Pages workflow, kept for reference.
- **Quick build without the network:** set `JRL_OFFLINE=1` before running `build.py`.

## Backups

Every commit copies the whole repo to Proton Drive as `jere-ing-latest.bundle` (a git hook the setup script installs). `BACKUP.bat` also saves a dated copy and keeps the newest 14. To restore: `git clone jere-ing-latest.bundle jere.ing`.
