"""Wallpapers from the front door's sky: every sky x weather as a still, and the rain and
storm skies as seamless video loops. Output goes to wallpapers/ (kept in the repo only;
package_site.py doesn't publish it).

  python tools/wallpapers.py            everything (needs Playwright, Pillow, numpy, ffmpeg)
  python tools/wallpapers.py stills     stills only
  python tools/wallpapers.py live       video loops only

The sky itself is screenshotted from the real index.html (reduced motion, page content
hidden), so the wallpapers match the site. Rain and lightning are drawn here with the same
numbers as the page's script: density, drop length and speed, wind, colour and alpha, and
the bolt's keyframes. Each drop's speed is snapped so it falls a whole number of screens
per loop, which is what makes the video loop without a seam.
"""
import functools
import http.server
import random
import subprocess
import sys
import threading
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "wallpapers"
SKIES = ["dawn", "day", "dusk", "night"]
WEATHER = ["clear", "rain", "storm"]

# name: (css width, css height, device scale)
STILL = {"phone": (430, 932, 3), "desktop": (1920, 1080, 2)}       # 1290x2796, 3840x2160
LIVE = {"phone": (360, 780, 3), "desktop": (1920, 1080, 1)}        # 1080x2340, 1920x1080
LOOP_S, FPS = 12, 30
FLASH_AT = 4.0  # seconds into the storm loop

HIDE = """
main,footer,.wx,.sheetwrap,#rain,.bolt{display:none!important}
*{transition:none!important}
"""
BOLT_ONLY = """
html,body{background:transparent!important}
main,footer,.wx,.sheetwrap,#rain,.stars,.layer,.overcast{display:none!important}
.sky{background:none!important}
.bolt{display:block!important;opacity:1!important;animation:none!important}
*{transition:none!important}
"""


def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    h.log_message = lambda *a: None
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s


def shoot(browser, base, size, sky, weather, css, transparent=False):
    w, h, d = size
    page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=d,
                            reduced_motion="reduce")
    page.goto(f"{base}/index.html#{sky}-{weather}")
    page.add_style_tag(content=css)
    page.wait_for_timeout(300)
    png = page.screenshot(omit_background=transparent)
    page.close()
    from io import BytesIO
    return Image.open(BytesIO(png)).convert("RGBA" if transparent else "RGB")


class Rain:
    """The page's rain, made periodic over LOOP_S seconds."""

    def __init__(self, w, h, mode, night, seed=7):
        rnd = random.Random(seed)
        self.w, self.h, self.mode = w, h, mode
        self.wind = .22 if mode == "storm" else .12
        base = .26 if mode == "storm" else .2
        self.color = np.array((205, 215, 235) if night else (70, 86, 104), np.float32)
        span = h + 40
        n = round(w * h / (5200 if mode == "storm" else 9500))
        self.drops = []
        for _ in range(n):
            v = 520 + rnd.random() * 340
            k = max(1, round(v * LOOP_S / span))       # whole screens per loop
            self.drops.append((rnd.random() * (w + 40), rnd.random() * span,
                               9 + rnd.random() * 12, k * span / LOOP_S, base * (.35 + rnd.random() * .65)))

    def mask(self, t, scale, ss=2):
        """Alpha mask (0..1) of the drops at time t, rendered at ss x supersampling."""
        s = scale * ss
        img = Image.new("L", (int(self.w * s), int(self.h * s)), 0)
        dr = ImageDraw.Draw(img)
        span, wrap = self.h + 40, self.w + 40
        for x0, y0, l, v, a in self.drops:
            y = (y0 + v * t) % span - 20
            x = (x0 - self.wind * (y + 20)) % wrap - 20
            dr.line([(x * s, y * s), ((x + l * self.wind) * s, (y - l) * s)],
                    fill=int(a * 255), width=max(1, round(s)))
        img = img.resize((int(self.w * scale), int(self.h * scale)), Image.LANCZOS)
        return np.asarray(img, np.float32)[..., None] / 255


def bolt_opacity(t):
    """The page's @keyframes bolt (1.1s, ease-out approximated as linear between stops)."""
    u = (t - FLASH_AT) / 1.1
    if u < 0 or u > 1:
        return 0.0
    stops = [(0, 0), (.04, .55), (.09, .08), (.14, .4), (.40, .05), (1, 0)]
    for (a, va), (b, vb) in zip(stops, stops[1:]):
        if a <= u <= b:
            return va + (vb - va) * (u - a) / (b - a)
    return 0.0


def composite(bg, rain, t, bolt=None):
    f = bg.copy()
    if bolt is not None:
        o = bolt_opacity(t)
        if o:
            a = bolt[..., 3:] / 255 * o
            f = f * (1 - a) + bolt[..., :3] * a
    m = rain.mask(t, scale=bg.shape[1] / rain.w)
    f = f * (1 - m) + rain.color * m
    return np.clip(f + 0.5, 0, 255).astype(np.uint8)


def main(only=None):
    from playwright.sync_api import sync_playwright
    srv = serve()
    base = f"http://127.0.0.1:{srv.server_port}"
    with sync_playwright() as p:
        b = p.chromium.launch()
        for kind, size in (STILL.items() if only != "live" else []):
            d = OUT / "still" / kind
            d.mkdir(parents=True, exist_ok=True)
            for sky in SKIES:
                for w in WEATHER:
                    img = shoot(b, base, size, sky, w, HIDE)
                    if w != "clear":
                        bg = np.asarray(img, np.float32)
                        bolt = None
                        rain = Rain(size[0], size[1], w, sky == "night")
                        img = Image.fromarray(composite(bg, rain, 1.7, bolt))
                    img.save(d / f"{sky}-{w}.png", optimize=True)
                    th = OUT / "thumbs" / kind
                    th.mkdir(parents=True, exist_ok=True)
                    img.resize((img.width // 6, img.height // 6), Image.LANCZOS).save(th / f"{sky}-{w}.jpg", quality=86)
                    print("still", kind, sky, w, flush=True)
        if only == "stills":
            return
        for kind, size in LIVE.items():
            d = OUT / "live" / kind
            d.mkdir(parents=True, exist_ok=True)
            W, H = size[0] * size[2], size[1] * size[2]
            for sky in SKIES:
                for w in ("rain", "storm"):
                    bg = np.asarray(shoot(b, base, size, sky, w, HIDE), np.float32)
                    bolt = np.asarray(shoot(b, base, size, sky, w, BOLT_ONLY, transparent=True), np.float32) \
                        if w == "storm" else None
                    rain = Rain(size[0], size[1], w, sky == "night")
                    ff = subprocess.Popen(
                        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                         "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-tune", "grain",
                         "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(d / f"{sky}-{w}.mp4")],
                        stdin=subprocess.PIPE)
                    for i in range(LOOP_S * FPS):
                        ff.stdin.write(composite(bg, rain, i / FPS, bolt).tobytes())
                    ff.stdin.close()
                    ff.wait()
                    print("live", kind, sky, w, flush=True)
        b.close()
    srv.shutdown()


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)


def web():
    """Self-contained live pages (Wallpaper Engine 'Web' / Lively): the real sky, clouds drifting,
    rain and lightning running forever. One per sky x weather, plus sky.html that reads
    #night-storm style hashes or ?sky=&weather=."""
    import re
    t = (ROOT / "template.html").read_text(encoding="utf-8")
    style = "\n".join(re.findall(r"<style>.*?</style>", t, re.S))
    style = re.sub(r"@font-face\{.*?\}", "", style, flags=re.S)
    sky = re.search(r'<div class="sky".*?\n</div>', t, re.S).group(0)
    start = t.index("  var rain = (function () {")
    end = t.index("  })();", start) + len("  })();")
    rain_js = t[start:end]
    d = OUT / "live" / "web"
    d.mkdir(parents=True, exist_ok=True)
    for name, default in [("sky", "night-rain")] + [(f"{s}-{w}", f"{s}-{w}") for s in SKIES for w in WEATHER]:
        page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>jere.ing sky · {default}</title>
{style}
<style>html,body{{height:100%;margin:0;overflow:hidden}}</style>
</head><body>
{sky}
<script>
(function () {{
  var root = document.documentElement;
  var q = new URLSearchParams(location.search);
  var parts = (location.hash.slice(1) || '{default}').split('-');
  var sky = q.get('sky') || parts[0], w = q.get('weather') || parts[1] || 'clear';
  root.setAttribute('data-sky', sky);
  if (w !== 'clear') root.setAttribute('data-weather', w);
{rain_js}
  rain.set(w === 'clear' ? '' : w);
  addEventListener('pointermove', function (e) {{
    root.style.setProperty('--px', (-(e.clientX / innerWidth * 2 - 1)).toFixed(3));
    root.style.setProperty('--py', (-(e.clientY / innerHeight * 2 - 1)).toFixed(3));
  }});
}})();
</script>
</body></html>
"""
        (d / f"{name}.html").write_text(page, encoding="utf-8")
    print("web pages", len(SKIES) * len(WEATHER) + 1)
