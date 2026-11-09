# Publishing checklist

The repo is public (Nov 9, 2026). jere.ing serves the site (Uplink), its archive, and the Lab: interactive demos of the launcher, Switchboard, Veta and Kept, the other site directions, and the archived versions. Source chips in the Lab link here, and both Android apps publish their APKs as releases.

## Status of the old "must fix before public" list

| # | What | Status |
|---|---|---|
| 1 | Album cover and band photo embedded in `reports/rio.html` | **Fixed** (Nov 9): replaced with original flat-colour stand-ins. The old JPEGs are still in earlier commits of the history. |
| 2 | The hidden cat sprite in the archived v3.6 site and v3 previews | **Kept on purpose** (Jeremias, Nov 9). Swap it for an original pixel cat if it's ever a problem. |
| 3 | The Phil Chat reports name people from a public Discord channel by handle | **Open, Jeremias's call**: they were already public on the site; a public repo also shows their edit history. Anonymize if anyone asks. |

## Rules that already hold (keep them)

- **No game material.** The style books (reference screenshots, videos and zips for Marathon, Final Fantasy XIII, Mirror's Edge and others) are private reference kept in Proton Drive under `Claude Things/Reference/`. They never enter this repo. The lab pages are original work inspired by those styles.
- **No personal data.** The Jere's Place notes vault, Downloads, documents and backups stay out. `veta/` holds only the app; its demo vault (`veta/demo-vault/`) is made up.
- **Fonts** are SIL Open Font License fonts from Google Fonts. The launcher APK bundles some; their licences ship with it.
- **No secrets in git.** The launcher signing key lives in the repo secret `JRL_KEYSTORE_B64` plus a backup in Proton Drive (`Claude Things/Setup/keys/`). Switchboard has its own: `SB_KEYSTORE_B64` and friends (until they're set, its APK is debug-signed). `*.jks`, `*.keystore` and `*.apk` are ignored.

## Switches, when you're ready

- **Lab:** live. `tools/lab_build.py` decides what's published under jere.ing/lab/ (demos, worlds, archive pages, docs). The Mirror's Edge runner site stays repo-only.. Add to its lists to publish more.
- **Source links:** open. `REPO.open` in `template.html` (and the built `index.html`) is `true`; set it to `false` to seal them again.
- **Launcher over-the-air page:** live. `tools/package_site.py` copies `launcher/android/app/src/main/assets/www/index.html` to `jere.ing/launcher/app/index.html` on every build, and installed launchers pick it up within 30 minutes. Only push a page there that matches the shell's bridge (see `launcher/android/README.md`).
- **APK downloads:** each manual workflow run replaces a rolling release: `releases/download/jrl-launcher/jrl-launcher.apk` and `releases/download/switchboard/switchboard.apk`. The Lab's launcher and Switchboard cards link to them.
- **Repo visibility:** GitHub, Settings, General, Danger Zone, Change visibility.

## Account safety

- One GitHub account (`jere-mee-as`). Don't connect or push from any other.
- Pushes are human-paced: a batch at a time, no scripted bursts of API calls, no automated pull requests or merges.
- GitHub Actions run only on a manual button press (the launcher APK and Switchboard APK builds). Nothing runs on a schedule or on push; the old GitHub Pages workflow is parked in `legacy/` where it can't run.
- The live site builds on Cloudflare Pages, so GitHub is only storage.
