# Jerelevance

A personal static site: a numbered list of reports from my reading group, dressed up as a sci-fi operator terminal.

## About the "root" / "hack" stuff

The terminal on this site is **set dressing**. The look comes from the *Marathon* "graphic realism" style. Commands like `root`, `scan`, `ping`, `top`, `ps`, `kill` and `decrypt` are toys written in the page's own JavaScript. They print made-up text and play sounds. None of them:

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
- **On GitHub:** `.github/workflows/build.yml` does the same thing on every push to `main` and once a day, and deploys to GitHub Pages.
- **Quick build without the network:** set `JRL_OFFLINE=1` before running `build.py`.

## Backups

Every commit copies the whole repo to Proton Drive as `jerelevance-latest.bundle` (a git hook the setup script installs). `BACKUP.bat` also saves a dated copy and keeps the newest 14. To restore: `git clone jerelevance-latest.bundle jerelevance`.
