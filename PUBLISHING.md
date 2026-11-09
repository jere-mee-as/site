# Publishing checklist

The repo is private. jere.ing serves the site (Uplink), its archive, and the Lab: interactive demos of the launcher, Switchboard, Veta and Kept, the other site directions, and archive zips. The app source and downloadable builds stay private until each item below is cleared.

## Must fix before the repo goes public

| # | What | Where | Why | Fix |
|---|---|---|---|---|
| 1 | Album cover and a band photo embedded as images | `reports/rio.html` (two `data:image/jpeg` blobs, `IMG.cover` and `IMG.face`) | Both are someone else's copyrighted images. They are already live on jere.ing. | Replace them with original artwork (a drawn or generated stand-in), or show text and link out. |
| 2 | The hidden cat easter egg sprite (7 frames, 128×896 PNG) | The archived v3.6 site, `archive/2026-11-terminal-of-the-future/template.html` (served at jere.ing/reports/_archive/2026-11-terminal-of-the-future/), and the v3 previews in `archive/2026-11-marathon-v3-previews/` | It looks like third-party meme art, not something drawn for the site. The Uplink front page doesn't use it. | Swap it for an original pixel cat drawn for the site, or drop the egg from the archive. Kept on purpose (Nov 9); it ships in the archive zips too. Swap it before the repo goes public. |
| 3 | The Phil Chat reports name real people from a group chat | `reports/phil-chat-*.html` | They were already public on the old site, but a public repo also exposes their full history. | Get the group's OK, or anonymize the names before flipping the repo public. |

## Rules that already hold (keep them)

- **No game material.** The style books (reference screenshots, videos and zips for Marathon, Final Fantasy XIII, Mirror's Edge and others) are private reference kept in Proton Drive under `Claude Things/Reference/`. They never enter this repo. The lab pages are original work inspired by those styles.
- **No personal data.** The Jere's Place notes vault, Downloads, documents and backups stay out. `veta/` holds only the app; its demo vault (`veta/demo-vault/`) is made up.
- **Fonts** are SIL Open Font License fonts from Google Fonts. The launcher APK bundles some; their licences ship with it.
- **No secrets in git.** The launcher signing key lives in the repo secret `JRL_KEYSTORE_B64` plus a backup in Proton Drive (`Claude Things/Setup/keys/`). `*.jks`, `*.keystore` and `*.apk` are ignored.

## Switches, when you're ready

- **Lab:** live. `tools/lab_build.py` decides what's published under jere.ing/lab/ (demos, worlds, archive zips). Add to its lists to publish more.
- **Source links:** sealed. Set `REPO.open = true` in `template.html` once the repo is public; every Lab item then links to its folder.
- **Launcher over-the-air page:** the phone pulls `https://jere.ing/launcher/app/index.html`. Publishing it means copying the current launcher page to that path in `_site/` (same file as `launcher/android/app/src/main/assets/www/index.html`). Until then the launcher just uses its bundled page.
- **Repo public:** GitHub, Settings, General, Danger Zone, Change visibility. Only after items 1–3.

## Account safety

- One GitHub account (`jere-mee-as`). Don't connect or push from any other.
- Pushes are human-paced: a batch at a time, no scripted bursts of API calls, no automated pull requests or merges.
- GitHub Actions run only on a manual button press (the launcher APK build). Nothing runs on a schedule or on push; the old GitHub Pages workflow is parked in `legacy/` where it can't run.
- The live site builds on Cloudflare Pages, so GitHub is only storage.
