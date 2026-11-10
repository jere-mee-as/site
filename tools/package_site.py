"""Puts the finished site in _site/.

Run build.py first. Cloudflare Pages runs both on every push to main and serves _site/ at jere.ing.

  /                   the front door (index.html), its files in assets/, favicon.svg, resume.pdf
  /uplink/            Uplink, the old front page
  /crystarium/        the Crystarium (lab/ffxiii/preview.html)
  /vesta9/            Vesta 9 (lab/mirrors-edge/vesta9.html)
  /reports/<file>     reports, unchanged
  /lab/...            demos, world docs and archive pages (tools/lab_build.py)
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"

# The worlds, each at its own address. The old addresses under /lab/worlds/ send people on.
WORLDS = {
    "uplink/index.html": "uplink/index.html",
    "crystarium/index.html": "lab/ffxiii/preview.html",
    "vesta9/index.html": "lab/mirrors-edge/vesta9.html",
}
MOVED = {
    "/lab/worlds/ffxiii/index.html": "/crystarium/",
    "/lab/worlds/ffxiii/": "/crystarium/",
    "/lab/worlds/mirrors-edge/vesta9.html": "/vesta9/",
    "/lab/worlds/mirrors-edge/vesta9": "/vesta9/",   # Cloudflare also serves .html pages without the extension
}

# Crystarium's tab icon and link preview, from the two-worlds branch.
CRYSTARIUM_HEAD = """<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 1 9 11l3 17 4 3z' fill='%23d5f2f6'/%3E%3Cpath d='M16 1l7 10-3 17-4 3z' fill='%235a96bb'/%3E%3Cpath d='M16 1 9 11l7 2 7-2z' fill='%23fff' opacity='.6'/%3E%3C/svg%3E">
<meta property="og:title" content="JERE.ING · Crystarium">
<meta property="og:description" content="An archive of reports, kept as crystals on a growing ring.">
<meta property="og:type" content="website">
"""


def stub(to):
    """A tiny page that forwards to the new address (for hosts or tools that skip _redirects)."""
    return (f'<!doctype html><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="{to}">'
            f'<meta http-equiv="refresh" content="0; url={to}"><p>This moved to <a href="{to}">{to}</a>.</p>\n')


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()

    # The front door and its files
    for name in ("index.html", "favicon.svg", "resume.pdf"):
        shutil.copy2(ROOT / name, SITE / name)
    shutil.copytree(ROOT / "assets", SITE / "assets")

    # Uplink's daily data (it fetches /images.json and /songs.json)
    for name in ("images.json", "tarot.json", "songs.json"):
        src = ROOT / name
        if src.exists():
            shutil.copy2(src, SITE / name)
        else:
            (SITE / name).write_text("[]", encoding="utf-8")
    shutil.copytree(ROOT / "reports", SITE / "reports")

    for dst, src in WORLDS.items():
        out = SITE / dst
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / src, out)
    cry = SITE / "crystarium" / "index.html"
    page = cry.read_text(encoding="utf-8")
    if 'rel="icon"' not in page:
        cry.write_text(page.replace("</head>", CRYSTARIUM_HEAD + "</head>", 1), encoding="utf-8")

    (SITE / ".nojekyll").touch()

    # The Lab's files: demos, world docs, archive pages (see tools/lab_build.py).
    import sys
    sys.path.insert(0, str(ROOT / "tools"))
    import lab_build
    lab_build.build(SITE)

    # Old world addresses: a 301 on Cloudflare, and a forwarding page in case the rule is skipped.
    for old, new in MOVED.items():
        if old.endswith(".html"):
            p = SITE / old.lstrip("/")
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(stub(new), encoding="utf-8")
    (SITE / "_redirects").write_text("".join(f"{a} {b} 301\n" for a, b in MOVED.items()), encoding="utf-8")

    files = [p for p in SITE.rglob("*") if p.is_file()]
    size = sum(p.stat().st_size for p in files) / 1024 / 1024
    print(f"_site ready: {len(files)} files, {size:.1f} MB")


if __name__ == "__main__":
    main()
