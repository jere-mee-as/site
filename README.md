# JERE.ING

The live site. The root, https://jere.ing, is the front door: a quiet page in a time-of-day sky that says who I am and leads to everything else (work, writing, projects, social, the résumé). The worlds live one level down.

| Folder | What | Live? |
|---|---|---|
| `/` (template.html, site.json, build.py) | The front door. **Every word on it is in `site.json`.** | yes, jere.ing |
| `assets/`, `favicon.svg`, `resume.pdf` | The front door's files: Geist (self-hosted, Latin subset), the portrait, icons, the résumé PDF | yes |
| `uplink/` (template.html) | Uplink, the runner's shell (the old front page). Its Lab holds only worlds and retired versions now | jere.ing/uplink/ |
| `reports/` | Reports, each its own page | jere.ing/reports/&lt;file&gt; |
| `lab/` | The other worlds and their style books: Crystarium (`lab/ffxiii/`), Vesta 9 (`lab/mirrors-edge/`), Uplink's book, Marathon type/colour | jere.ing/crystarium/, /vesta9/, /lab/worlds/ |
| `lab/apps/` | Demo snapshots of the apps that have their own repos (see below) | demos in the Lab |
| `archive/` | Earlier versions of the site: terminal of the future (v3.6), graphic realism, paper & ink, the v3.x previews, and earlier Scopes | built into reports/_archive/, and downloadable from the Lab |
| `docs/` | Site plans and decision records | no |
| `legacy/` | The old GitHub Pages workflow, parked so it can't run | no |

The apps live in their own repos, each with its downloads on its Releases page:

| App | Repo | Download |
|---|---|---|
| JRL Launcher (Android home screen) | [jere-mee-as/jrl-launcher](https://github.com/jere-mee-as/jrl-launcher) | `jrl-launcher.apk` |
| Switchboard (Android home screen, chat-app layout) | [jere-mee-as/switchboard](https://github.com/jere-mee-as/switchboard) | `switchboard.apk` |
| Veta (second brain, Windows) | [jere-mee-as/veta](https://github.com/jere-mee-as/veta) | `Veta-win-x64.zip` |

Read `PUBLISHING.md` before making anything else public. `LICENSE`: all rights reserved; look, don't reuse.

## The front door

`template.html` is the approved design (v18) turned into a template; `site.json` fills it. To add a post, a report or an app, add one entry to the right list in `site.json` (an entry is `title`, `sub`, optional `detail`, and `href` if it links somewhere). Projects are grouped Software, Reports, Worlds, Shelved. The résumé (the sheet at `jere.ing/#resume` and `resume.pdf`) is the `resume` part of the same file.

- Sky and weather are the visitor's choice (the cloud button, bottom right, after scrolling). First visit: Clear, and Day unless the visitor's own clock says 8pm to 6am. Choices stay in their browser. No location, no weather service, no analytics; the page loads nothing from anywhere else.
- Returning within a day: a one-second fade instead of the intro. Reduced motion: everything at once, no rain or drift. Without JavaScript every row is open.
- Old links: `/reports/<file>.html` is unchanged; `#report-NN`, `#lab/<id>` and Uplink's room links (`#comms`, `#noise`...) forward to their new homes; `#lab` and `#vault` open Projects.
- After changing `site.json`'s résumé, the portrait or the font, run `python tools/make_assets.py` (needs Pillow, fontTools + brotli, reportlab, Playwright) and commit what it writes. Cloudflare only copies these files.
- `python tools/check_front_door.py` runs the browser checks (both screen sizes, every sky, reduced motion, no JavaScript, the résumé, old links).

## The Lab (inside Uplink)

Slot 01 in Uplink (`jere.ing/uplink/#lab`). It now holds two shelves: **Worlds** (other directions for this site) and **Archive** (retired versions of the site and the worlds, each opening as its own page in a new tab). The reports and apps moved to the front door. `tools/lab_build.py` still builds the demos, world docs and archive pages into `_site/lab/` on every deploy.

## About the "root" / "hack" stuff

The terminal on this site is **set dressing**. The look comes from the *Marathon* "graphic realism" style (the front page is Uplink, the second pass at it; the first pass is archived). Commands like `root`, `scan`, `ping`, `top`, `ps`, `kill` and `decrypt` are toys written in the page's own JavaScript. They print made-up text and play sounds. None of them:

- touch your computer, your files or your network,
- scan, probe or contact anything except the site's own files,
- download or run anything.

The only outside things Uplink loads are fonts (Google Fonts), images from my Are.na channels, and YouTube for the song of the day. The front door loads nothing from anywhere else. The tarot card uses a random id kept in your own browser; there is no IP lookup.

## Adding a report

Drop a file into `reports/`, commit it, and build.

- **Title:** the HTML page's `<title>`, or the PDF's title, or the filename.
- **Comment:** the page's `<meta name="description">`, or a `.txt` file with the same name (`skynet.pdf` + `skynet.txt`).
- **Date:** when the file was first committed.
- **Overrides:** put anything you want to force in `reports/_meta.json`.

To list it on the front door, add an entry under Projects → Reports in `site.json`. Don't edit `index.html` or `uplink/index.html` directly; they're built from `template.html` + `site.json` and `uplink/template.html`. Old designs live in `archive/<name>/template.html` and are built to `reports/_archive/<name>/`.

## Building and hosting

This repo works with or without GitHub.

- **On my PC:** double-click `BUILD SITE.bat`. It runs `build.py` and puts the finished site in `_site/`. Upload that folder to any static host (it's on Cloudflare Pages).
- **Live site:** Cloudflare Pages (project `jere-ing`) builds every push to `main` with `pip install pypdf && python build.py && python tools/package_site.py` and serves `_site/` at https://jere.ing.
- **GitHub Actions:** off. `.github/workflows/build.yml` is the old GitHub Pages workflow, kept for reference.
- **Quick build without the network:** set `JRL_OFFLINE=1` before running `build.py`.

## Backups

Every commit copies the whole repo to Proton Drive as `jere-ing-latest.bundle` (a git hook the setup script installs). `BACKUP.bat` also saves a dated copy and keeps the newest 14. To restore: `git clone jere-ing-latest.bundle jere.ing`.
