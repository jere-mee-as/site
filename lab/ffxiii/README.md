# lab/ffxiii

A Final Fantasy XIII-inspired direction for the site. The previews show the full design with sample content; the templates are drop-in replacements for the root `template.html` (they keep the `<!-- LIST -->` marker `build.py` fills with reports). The audit checks the design against the reference. These are original pages inspired by the FFXIII UI style; no game assets are included.

| File | What |
|---|---|
| `preview.html` | v1 preview with a sample report list |
| `template.html` | v1 template, drop-in for the root `template.html` |
| `preview-v2.html` | v2 preview with a sample report list |
| `template-v2.html` | v2 template, drop-in for the root `template.html` |
| `audit.html` | Audit of the design against the reference |

## How to open

Open any file in a browser. Fonts load from Google Fonts.

To try a template against the real report list, copy it over the root `template.html` locally and run `build.py` (see the root README). Don't commit that swap.

## Status

Exploration. Not live.

## Docs

[`docs/`](docs/): plan, build notes, footage notes and audit notes.

The style books and reference footage are private reference material kept outside the repo.
