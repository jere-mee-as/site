"""Puts the finished site in _site/ (the same files GitHub Pages used to get).

Run build.py first. Then drag _site/ into Cloudflare Pages, Netlify, or any static host.
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"

if SITE.exists():
    shutil.rmtree(SITE)
SITE.mkdir()
shutil.copy2(ROOT / "index.html", SITE / "index.html")
for name in ("images.json", "tarot.json", "songs.json"):
    src = ROOT / name
    if src.exists():
        shutil.copy2(src, SITE / name)
    else:
        (SITE / name).write_text("[]", encoding="utf-8")
shutil.copytree(ROOT / "reports", SITE / "reports")

# The JRL launcher's over-the-air page: the phone pulls jere.ing/launcher/app/index.html (see launcher/android).
# Same file as the one bundled in the APK, so a push to main updates every installed launcher's UI.
ota = ROOT / "launcher" / "android" / "app" / "src" / "main" / "assets" / "www" / "index.html"
if ota.exists():
    (SITE / "launcher" / "app").mkdir(parents=True, exist_ok=True)
    shutil.copy2(ota, SITE / "launcher" / "app" / "index.html")
(SITE / ".nojekyll").touch()

# The Lab: demos, other worlds for the site, and archive downloads (see tools/lab_build.py).
import sys
sys.path.insert(0, str(ROOT / "tools"))
import lab_build
lab_build.build(SITE)

files = [p for p in SITE.rglob("*") if p.is_file()]
size = sum(p.stat().st_size for p in files) / 1024 / 1024
print(f"_site ready: {len(files)} files, {size:.1f} MB")
