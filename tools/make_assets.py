"""Regenerates the front door's static files. Run by hand, then commit what it writes.

Cloudflare's build only copies these files (it has nothing but pypdf), so this script is
never part of the deploy. It needs Pillow, fontTools (+ brotli for WOFF2), reportlab and,
for the favicon PNGs, Playwright with Chromium.

  python tools/make_assets.py fonts      assets/fonts/geist-latin.woff2 (Latin subset, wght 300-600)
  python tools/make_assets.py portrait   assets/img/jeremias-portrait-{160,320}.{webp,jpg}
  python tools/make_assets.py icons      assets/img/favicon-32.png, apple-touch-icon.png
  python tools/make_assets.py resume     resume.pdf (from site.json, same order as the sheet)
  python tools/make_assets.py            all of the above

Sources:
  Geist          tools/assets-src/Geist[wght].ttf + Geist-{Light,Regular,Medium}.ttf (OFL, vercel/geist-font 1.800)
  Portrait       assets/img/jeremias-portrait-320.jpg is the approved crop ("B", cooled), taken
                 byte-for-byte from the v18 design; the other sizes are made from it.
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "assets-src"
FONTS = ROOT / "assets" / "fonts"
IMG = ROOT / "assets" / "img"

# Google Fonts' "latin" range, plus the arrows the page draws (← → ↗ ↓).
LATIN = ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,"
         "U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2197,U+2212,U+2215,U+FEFF,U+FFFD")


def fonts():
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    FONTS.mkdir(parents=True, exist_ok=True)
    f = TTFont(SRC / "Geist[wght].ttf", lazy=False)
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    unicodes = []
    for part in LATIN.split(","):
        a, _, b = part[2:].partition("-")
        unicodes += range(int(a, 16), int(b or a, 16) + 1)
    s = subset.Subsetter(opts)
    s.populate(unicodes=unicodes)
    s.subset(f)
    f = instancer.instantiateVariableFont(f, {"wght": (300, 600)})
    out = FONTS / "geist-latin.woff2"
    f.flavor = "woff2"
    f.save(out)
    print(f"{out.relative_to(ROOT)}: {out.stat().st_size / 1024:.1f} KB")


def portrait():
    from PIL import Image
    src = IMG / "jeremias-portrait-320.jpg"
    im = Image.open(src).convert("RGB")
    im.save(IMG / "jeremias-portrait-320.webp", "WEBP", quality=86, method=6)
    small = im.resize((160, 160), Image.LANCZOS)
    small.save(IMG / "jeremias-portrait-160.webp", "WEBP", quality=86, method=6)
    small.save(IMG / "jeremias-portrait-160.jpg", "JPEG", quality=88, optimize=True, progressive=True)
    for p in sorted(IMG.glob("jeremias-portrait-*")):
        print(f"{p.relative_to(ROOT)}: {p.stat().st_size / 1024:.1f} KB")


def icons():
    from playwright.sync_api import sync_playwright
    svg = (ROOT / "favicon.svg").read_text(encoding="utf-8")
    with sync_playwright() as p:
        b = p.chromium.launch()
        for size, name in ((32, "favicon-32.png"), (180, "apple-touch-icon.png")):
            pg = b.new_page(viewport={"width": size, "height": size})
            body = svg.replace("<svg ", f'<svg width="{size}" height="{size}" ', 1)
            if name.startswith("apple"):   # iOS rounds the corners itself: fill the square
                body = body.replace('rx="16"', 'rx="0"')
            pg.set_content(f"<html><body style='margin:0;background:transparent'>{body}</body></html>")
            pg.screenshot(path=str(IMG / name), omit_background=True)
            print(f"assets/img/{name}")
        b.close()


def resume():
    sys.path.insert(0, str(ROOT / "tools"))
    import resume_pdf
    resume_pdf.build(json.loads((ROOT / "site.json").read_text(encoding="utf-8")), ROOT / "resume.pdf", SRC)


if __name__ == "__main__":
    jobs = {"fonts": fonts, "portrait": portrait, "icons": icons, "resume": resume}
    for name in (sys.argv[1:] or jobs):
        jobs[name]()
