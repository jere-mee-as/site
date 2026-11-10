"""Checks the built front door in a real browser (Playwright + Chromium). Dev only; not part of the deploy.

  python build.py && python tools/package_site.py
  python tools/check_front_door.py [--shots DIR] [--v18 PATH_TO_V18_HTML]

Serves _site/ on localhost and, at 390x844 and 1440x900, checks: day, night, dusk + rain,
night + storm, reduced motion and no JavaScript; every row opens and closes (closed rows are
inert); the résumé opens and closes by button, Back, Esc, the browser's Back and a direct
#resume link; the weather panel; the cloud button stays hidden until the page scrolls; first-visit
sky by the visitor's clock; old links. Fails on any console error, any horizontal scroll, or any
request that leaves the site. With --v18 it also renders the approved design in the same states
(reduced motion, so nothing drifts) and reports how many pixels differ.
"""
import argparse, functools, http.server, json, sys, threading, time
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"
VIEWPORTS = {"phone": {"width": 390, "height": 844}, "desktop": {"width": 1440, "height": 900}}
FAIL = []


def check(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        FAIL.append(msg)


def serve(root, port):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    h = functools.partial(Quiet, directory=str(root))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{port}"


class Watch:
    """Console errors and every request a page makes."""
    def __init__(self, page, origin):
        self.errors, self.offsite = [], []
        page.on("console", lambda m: m.type == "error" and self.errors.append(m.text))
        page.on("pageerror", lambda e: self.errors.append(str(e)))
        page.on("request", lambda r: (not r.url.startswith(origin) and not r.url.startswith(("data:", "blob:")))
                and self.offsite.append(r.url))


def store(sky=None, weather=None, seen=True):
    js = "try{"
    if seen:
        js += "localStorage.setItem('jere.seen', String(Date.now()));"
    if sky:
        js += f"localStorage.setItem('jere.sky','{sky}');"
    if weather:
        js += f"localStorage.setItem('jere.weather','{weather}');"
    return js + "}catch(e){}"


def no_hscroll(page):
    return page.evaluate("document.documentElement.scrollWidth <= innerWidth")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shots", default=str(ROOT / "_shots"))
    ap.add_argument("--v18", default="")
    a = ap.parse_args()
    shots = Path(a.shots)
    shots.mkdir(parents=True, exist_ok=True)
    base = serve(SITE, 8791)

    with sync_playwright() as p:
        b = p.chromium.launch()

        def ctx(vp, **kw):
            o = dict(viewport=VIEWPORTS[vp], timezone_id="America/New_York",
                     device_scale_factor=2 if vp == "phone" else 1, is_mobile=vp == "phone", has_touch=vp == "phone")
            o.update(kw)
            return b.new_context(**o)

        for vp in VIEWPORTS:
            print(f"\n== {vp} {VIEWPORTS[vp]['width']}x{VIEWPORTS[vp]['height']}")

            # States: the sky and weather each visitor can choose.
            for name, sky, w in (("day", "day", None), ("night", "night", None), ("dusk-rain", "dusk", "rain"), ("night-storm", "night", "storm")):
                c = ctx(vp)
                c.add_init_script(store(sky, w))
                pg = c.new_page()
                wt = Watch(pg, base)
                pg.goto(base + "/")
                pg.wait_for_timeout(1500)
                check(pg.evaluate("document.documentElement.dataset.sky") == sky, f"{name}: sky is {sky}")
                check(pg.evaluate("document.documentElement.dataset.weather || 'clear'") == (w or "clear"), f"{name}: weather is {w or 'clear'}")
                if w:
                    check(pg.evaluate("getComputedStyle(document.getElementById('rain')).display") != "none", f"{name}: rain is drawn")
                pg.screenshot(path=str(shots / f"{vp}-{name}.png"))
                check(no_hscroll(pg), f"{name}: no horizontal scroll")
                check(not wt.errors, f"{name}: no console errors {wt.errors[:2]}")
                check(not wt.offsite, f"{name}: no requests off the site {wt.offsite[:3]}")
                c.close()

            # First visit: the full intro, and the visitor's own clock picks Day or Night.
            for hour, want in ((10, "day"), (21, "night"), (5, "night"), (6, "day"), (19, "day"), (20, "night")):
                c = ctx(vp)
                pg = c.new_page()
                pg.clock.install(time=datetime(2026, 11, 10, hour, 30))
                pg.goto(base + "/")
                got = pg.evaluate("document.documentElement.dataset.sky")
                weather = pg.evaluate("document.documentElement.dataset.weather || 'clear'")
                check(got == want and weather == "clear", f"first visit at {hour}:30 → {want}, clear (got {got}, {weather})")
                if hour == 10:
                    check(pg.evaluate("document.documentElement.classList.contains('quick')") is False, "first visit plays the full intro")
                    pg.wait_for_timeout(600)
                    op = pg.evaluate("+getComputedStyle(document.querySelector('.rows section')).opacity")
                    check(op < 0.5, f"intro: rows still in the mist at 0.6 s (opacity {op:.2f})")
                    pg.wait_for_timeout(3600)
                    op = pg.evaluate("+getComputedStyle(document.querySelector('footer')).opacity")
                    check(op > 0.99, f"intro: footer in by 4.2 s (opacity {op:.2f})")
                    pg.screenshot(path=str(shots / f"{vp}-first-visit.png"))
                    pg.reload()
                    check(pg.evaluate("document.documentElement.classList.contains('quick')"), "return visit within a day: one-second fade")
                c.close()

            # Interactions, on a day sky.
            c = ctx(vp)
            c.add_init_script(store("day"))
            pg = c.new_page()
            wt = Watch(pg, base)
            pg.goto(base + "/")
            pg.wait_for_timeout(1300)
            check(pg.evaluate("scrollY") == 0 and not pg.evaluate("document.querySelector('.wx').classList.contains('show')")
                  and pg.evaluate("getComputedStyle(document.querySelector('.wx')).visibility") == "hidden", "cloud button hidden at the top")
            for rid in ("work", "writing", "projects", "social"):
                btn, panel = pg.locator(f"#b-{rid}"), f"#p-{rid}"
                check(pg.evaluate(f"document.querySelector('{panel}').inert") and btn.get_attribute("aria-expanded") == "false", f"{rid}: starts closed and inert")
                btn.click(force=True)
                pg.wait_for_timeout(900)
                h = pg.evaluate(f"document.querySelector('{panel}').getBoundingClientRect().height")
                check(btn.get_attribute("aria-expanded") == "true" and not pg.evaluate(f"document.querySelector('{panel}').inert") and h > 40,
                      f"{rid}: opens ({h:.0f}px)")
            pg.wait_for_timeout(600)
            check(no_hscroll(pg), "all rows open: no horizontal scroll")
            pg.screenshot(path=str(shots / f"{vp}-rows-open.png"), full_page=True)
            pg.evaluate("scrollTo(0, 400)")
            pg.wait_for_timeout(1100)
            check(pg.evaluate("document.querySelector('.wx').classList.contains('show')"), "cloud button appears after scrolling")
            # weather panel
            pg.click("#wx-btn", force=True)
            pg.wait_for_timeout(700)
            check(pg.get_attribute("#wx-btn", "aria-expanded") == "true" and not pg.evaluate("document.getElementById('wx-pop').inert"), "weather panel opens")
            pg.screenshot(path=str(shots / f"{vp}-weather-panel.png"))
            pg.click("#wx-pop [data-sky=dusk]", force=True)
            pg.click("#wx-pop [data-w=rain]", force=True)
            pg.wait_for_timeout(300)
            check(pg.evaluate("[document.documentElement.dataset.sky, document.documentElement.dataset.weather, localStorage.getItem('jere.sky'), localStorage.getItem('jere.weather')].join()") == "dusk,rain,dusk,rain",
                  "panel sets Dusk + Rain and remembers it")
            check(pg.get_attribute("#wx-pop [data-sky=dusk]", "aria-pressed") == "true", "panel marks the chosen sky")
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(300)
            check(pg.get_attribute("#wx-btn", "aria-expanded") == "false", "Esc closes the panel")
            pg.click("#wx-btn", force=True); pg.click("#wx-pop [data-sky=day]", force=True); pg.click("#wx-pop [data-w=clear]", force=True)
            pg.mouse.click(5, 5)
            pg.wait_for_timeout(300)
            check(pg.get_attribute("#wx-btn", "aria-expanded") == "false", "clicking outside closes the panel")
            for b_ in ("#b-work", "#b-writing", "#b-projects", "#b-social"):
                pg.click(b_, force=True)
                pg.wait_for_timeout(900)   # let the row fold before the next click, or it lands on whatever slid under it
            check(all(pg.evaluate(f"document.querySelector('#p-{r}').inert") for r in ("work", "writing", "projects", "social")), "closed rows are inert again")
            # résumé: button, Back, Esc, browser Back
            pg.evaluate("scrollTo(0,0)")
            pg.click("#b-work", force=True); pg.wait_for_timeout(800)

            def opened():
                return pg.evaluate("(w => !w.hidden && w.classList.contains('open'))(document.getElementById('resume'))")

            pg.click("[data-open-resume]", force=True); pg.wait_for_timeout(1300)
            check(opened() and pg.evaluate("location.hash") == "#resume", "résumé opens from Work → Résumé (#resume)")
            check(pg.evaluate("document.activeElement.classList.contains('back')"), "résumé: focus moves to Back")
            check(pg.get_attribute(".sheet .dl", "href") == "/resume.pdf", "résumé: Download PDF link at the top")
            pg.screenshot(path=str(shots / f"{vp}-resume.png"))
            pg.click(".sheet-top .back", force=True); pg.wait_for_timeout(800)
            check(not opened() and pg.evaluate("location.hash") == "", "résumé closes with ← Back")
            pg.click("[data-open-resume]", force=True); pg.wait_for_timeout(900)
            pg.keyboard.press("Escape"); pg.wait_for_timeout(800)
            check(not opened() and pg.evaluate("location.hash") == "", "résumé closes with Esc")
            pg.click("[data-open-resume]", force=True); pg.wait_for_timeout(900)
            pg.go_back(); pg.wait_for_timeout(800)
            check(not opened(), "résumé closes with the browser's Back")
            # Email: shows and copies the address
            c.grant_permissions(["clipboard-read", "clipboard-write"], origin=base)
            pg.click("#copy", force=True); pg.wait_for_timeout(700)
            check("jere.mee.as@pm.me" in pg.inner_text("#mailnote") and pg.evaluate("location.href").startswith(base), "Email shows the address (no mailto jump)")
            check(not wt.errors, f"interactions: no console errors {wt.errors[:2]}")
            check(not wt.offsite, f"interactions: no requests off the site {wt.offsite[:3]}")
            c.close()

            # Direct link to the résumé
            c = ctx(vp)
            c.add_init_script(store("day"))
            pg = c.new_page()
            pg.goto(base + "/#resume"); pg.wait_for_timeout(1400)
            check(pg.evaluate("(w => !w.hidden && w.classList.contains('open'))(document.getElementById('resume'))"), "#resume link opens the sheet")
            check(no_hscroll(pg), "résumé: no horizontal scroll")
            pg.screenshot(path=str(shots / f"{vp}-resume-direct.png"))
            c.close()

            # Reduced motion: everything at once, no rain, no lightning, no drift
            c = ctx(vp, reduced_motion="reduce")
            c.add_init_script(store("night", "storm", seen=False))
            pg = c.new_page()
            wt = Watch(pg, base)
            pg.goto(base + "/")
            pg.wait_for_timeout(150)
            ops = pg.evaluate("[...document.querySelectorAll('.m')].map(e => +getComputedStyle(e).opacity)")
            check(min(ops) == 1, f"reduced motion: all {len(ops)} parts visible at once")
            check(pg.evaluate("getComputedStyle(document.getElementById('rain')).display") == "none"
                  and pg.evaluate("getComputedStyle(document.querySelector('.bolt')).display") == "none", "reduced motion: no rain, no lightning")
            check(pg.evaluate("[...document.querySelectorAll('.cl,.float')].every(e => getComputedStyle(e).animationName === 'none')"), "reduced motion: no drift, no float")
            pg.screenshot(path=str(shots / f"{vp}-reduced-motion.png"))
            check(not wt.errors, f"reduced motion: no console errors {wt.errors[:2]}")
            c.close()

            # No JavaScript: every row open and readable
            c = ctx(vp, java_script_enabled=False)
            pg = c.new_page()
            wt = Watch(pg, base)
            pg.goto(base + "/")
            hs = pg.evaluate("[...document.querySelectorAll('.dd')].map(d => d.getBoundingClientRect().height)")
            check(all(h > 40 for h in hs), f"no JS: all {len(hs)} rows open ({', '.join(f'{h:.0f}' for h in hs)} px)")
            check(pg.evaluate("[...document.querySelectorAll('.it,.m')].every(e => getComputedStyle(e).opacity === '1')"), "no JS: everything visible")
            check(pg.evaluate("[...document.querySelectorAll('.dd')].every(d => !d.inert)"), "no JS: no row is inert")
            check(no_hscroll(pg), "no JS: no horizontal scroll")
            pg.screenshot(path=str(shots / f"{vp}-no-js.png"), full_page=True)
            check(pg.get_attribute("#copy", "href") == "mailto:jere.mee.as@pm.me", "no JS: Email is a mailto link")
            pg.goto(base + "/#resume")
            check(pg.evaluate("getComputedStyle(document.getElementById('resume')).display") == "block"
                  and pg.evaluate("+getComputedStyle(document.querySelector('.sheet')).opacity") == 1, "no JS: #resume shows the sheet")
            check(not wt.offsite, f"no JS: no requests off the site {wt.offsite[:3]}")
            c.close()

        # Old links into the old front page
        print("\n== old links")
        c = b.new_context(viewport=VIEWPORTS["desktop"])
        pg = c.new_page()
        for h, want in (("#report-4", "/reports/timaeus-connectome.html"), ("#report-04", "/reports/timaeus-connectome.html"),
                        ("#lab/veta", "/lab/demo/veta.html"), ("#lab/rio", "/reports/rio.html"), ("#lab/crystarium", "/crystarium/"),
                        ("#comms", "/uplink/#comms"), ("#noise", "/uplink/#noise")):
            pg.goto("about:blank"); pg.goto(base + "/" + h)
            pg.wait_for_timeout(400)
            got = pg.evaluate("location.pathname + location.hash")
            check(got == want, f"/{h} → {want} (got {got})")
        for h in ("#lab", "#vault"):
            pg.goto("about:blank"); pg.goto(base + "/" + h); pg.wait_for_timeout(400)
            check(pg.get_attribute("#b-projects", "aria-expanded") == "true" and pg.evaluate("location.hash") == "", f"/{h} opens Projects")
        for path in ("/resume.pdf", "/assets/fonts/geist-latin.woff2", "/favicon.svg", "/assets/img/jeremias-portrait-320.webp"):
            r = pg.request.get(base + path)
            check(r.ok, f"{path} is served ({r.status}, {len(r.body())} bytes)")
        c.close()

        # The worlds at their new addresses
        print("\n== worlds")
        for path, sel in (("/uplink/", "#r-lab"), ("/crystarium/", "body"), ("/vesta9/", "body")):
            c = b.new_context(viewport=VIEWPORTS["desktop"])
            pg = c.new_page()
            wt = Watch(pg, base)
            pg.goto(base + path, wait_until="domcontentloaded")
            pg.wait_for_timeout(2500)
            own = [e for e in wt.errors if "ERR_" not in e and "Failed to load resource" not in e]
            check(pg.locator(sel).count() == 1 and not own, f"{path} loads, no script errors {own[:2]}")
            if path == "/uplink/":
                shelves = pg.evaluate("[...document.querySelectorAll('#shelves .sh b')].map(e => e.textContent)")
                check(shelves == ["01 WORLDS", "02 ARCHIVE"], f"Uplink Lab holds worlds and archive only {shelves}")
                bad = pg.evaluate("[...document.querySelectorAll('#shelves .lp .nm')].map(e=>e.textContent).filter(t => /launcher|switchboard|veta|scope|connectome|metaphors|investigations|timaeus|rio/i.test(t))")
                check(not bad, f"Uplink Lab lists no reports or apps {bad}")
            c.close()

        # Side by side with the approved design
        if a.v18:
            print("\n== against v18 (reduced motion, nothing drifting)")
            from PIL import Image, ImageChops
            for vp in VIEWPORTS:
                for state, steps in (("closed", []), ("work", ["#b-work"]), ("projects", ["#b-projects"]), ("resume", ["#b-work", "[data-open-resume]"])):
                    imgs = []
                    for url in (base + "/__v18/index.html", base + "/"):
                        c = ctx(vp, reduced_motion="reduce")
                        c.add_init_script(store("day"))
                        pg = c.new_page()
                        pg.goto(url); pg.wait_for_timeout(400)
                        for s in steps:
                            pg.click(s, force=True); pg.wait_for_timeout(500)
                        pg.wait_for_timeout(500)
                        imgs.append(Image.open(__import__("io").BytesIO(pg.screenshot())).convert("RGB"))
                        c.close()
                    d = ImageChops.difference(*imgs).convert("L").point(lambda v: 255 if v > 24 else 0)
                    n = sum(1 for v in d.getdata() if v)
                    pct = 100 * n / (d.width * d.height)
                    side = Image.new("RGB", (imgs[0].width * 2 + 20, imgs[0].height), "white")
                    side.paste(imgs[0], (0, 0)); side.paste(imgs[1], (imgs[0].width + 20, 0))
                    side.save(shots / f"compare-{vp}-{state}.png")
                    print(f"  {vp:7} {state:9} {pct:6.3f}% of pixels differ (v18 left, build right: compare-{vp}-{state}.png)")
        b.close()

    print(f"\n{'ALL CHECKS PASSED' if not FAIL else str(len(FAIL)) + ' FAILED'}  ·  screenshots in {shots}")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
