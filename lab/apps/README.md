# Lab app snapshots

The apps live in their own repos; jere.ing keeps a snapshot of each demo here so the site builds on its own.

| Here | From | Refresh |
|---|---|---|
| `launcher/v4.0.html` and the older `launcher/v*.html` | [jere-mee-as/jrl-launcher](https://github.com/jere-mee-as/jrl-launcher) `previews/` | copy the new preview in |
| `switchboard.html` | [jere-mee-as/switchboard](https://github.com/jere-mee-as/switchboard) `index.html` | copy it in |
| `veta/Veta.html`, `veta/demo-vault/` | [jere-mee-as/veta](https://github.com/jere-mee-as/veta): `python3 assemble.py` → `dist/Veta.html`, and `demo-vault/` | copy both in |

`tools/lab_build.py` turns these into jere.ing/lab/demo/… and the Archive shelf.
