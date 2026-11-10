# Publishing checklist

This repo holds the site and the Lab, and it is public (Nov 9, 2026). The apps moved to their own public repos on Nov 9, 2026 (jere-mee-as/jrl-launcher, /switchboard, /veta), and their downloads are GitHub Releases there. The Lab keeps a demo snapshot of each in `lab/apps/`.

## Status of the old "must fix before public" list

| # | What | Status |
|---|---|---|
| 1 | Album cover and band photo embedded in `reports/rio.html` | **Fixed** (Nov 9): replaced with original flat-colour stand-ins. The old JPEGs are still in earlier commits of the history. |
| 2 | The hidden cat sprite in the archived v3.6 site and v3 previews | **Kept on purpose** (Jeremias, Nov 9). Swap it for an original pixel cat if it's ever a problem. |
| 3 | The Phil Chat reports name people from a public Discord channel by handle | **Open, Jeremias's call**: public on the site and in this repo's history. Anonymize if anyone asks. |

## Rules that already hold (keep them)

- **No game material.** The style books (reference screenshots, videos and zips for Marathon, Final Fantasy XIII, Mirror's Edge and others) are private reference kept in Proton Drive under `Claude Things/Reference/`. They never enter this repo. The lab pages are original work inspired by those styles.
- **No personal data.** The Jere's Place notes vault, Downloads, documents and backups stay out. The Veta demo vault (`lab/apps/veta/demo-vault/`) is made up.
- **Fonts** are SIL Open Font License fonts from Google Fonts.
- **No secrets in git.** App signing keys are secrets in each app's own repo (`JRL_KEYSTORE_*` in jrl-launcher, `SB_KEYSTORE_*` in switchboard), with a backup in Proton Drive (`Claude Things/Setup/keys/`).

## Switches, when you're ready

- **Lab:** live. `tools/lab_build.py` decides what's published under jere.ing/lab/ (demos, worlds, archive pages, docs). The Mirror's Edge runner site stays repo-only.. Add to its lists to publish more.
- **Source links:** the launcher, Switchboard and Veta chips link to their own repos. Everything else (Scope) links into this repo while `REPO.open` is `true` in `template.html` and the built `index.html`; set it to `false` to seal them.
- **Launcher over-the-air page:** installed launchers pull `android/app/src/main/assets/www/index.html` from the jrl-launcher repo's main branch (raw.githubusercontent.com), so it needs that repo to stay public.
- **Downloads:** GitHub Releases in each app repo, built by its manual Release workflow. The Lab's Install chips use `releases/latest/download/…`.
- **Repo visibility:** GitHub, Settings, General, Danger Zone, Change visibility. App repos must be public for their downloads to work.

## Account safety

- One GitHub account (`jere-mee-as`). Don't connect or push from any other.
- Pushes are human-paced: a batch at a time, no scripted bursts of API calls, no automated pull requests or merges.
- GitHub Actions run only on a manual button press (each app repo's Release workflow; this repo has none). Nothing runs on a schedule or on push; the old GitHub Pages workflow is parked in `legacy/` where it can't run.
- The live site builds on Cloudflare Pages, so GitHub is only storage.
