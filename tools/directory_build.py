"""Builds jere.ing/sites/ ("Things I've made") from sites/directory.json.

    python3 tools/directory_build.py      (build.py runs it too)

The page is a fashion-site "collection": every project is a numbered look with a
tall thumbnail, its name and a one-line tagline. Live projects first, newest first.
Cards link straight to the project. Filter tabs, search and an index view are a
few lines of script on top of plain HTML, so the page works without it.

Thumbnails are drawn in HTML/CSS (THUMBS below) until real screenshots exist.
To use a screenshot instead, put it in sites/thumbs/<id>.webp and add
"img": "thumbs/<id>.webp" to the item; it replaces the drawing.
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "sites" / "directory.json"
OUT = ROOT / "sites" / "index.html"
SITE = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))

e = html.escape
MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split()
BADGE = {"read": "READ", "generator": "GENERATOR", "look": "LOOK", "android": "ANDROID", "series": "SERIES", "world": "WORLD"}
# Sections that always sit at the bottom of the page, below everything current.
BOTTOM = {"Old"}

# Fonts the drawn thumbnails use. Loaded with Google Fonts' text= option, so only
# the letters the drawings need are downloaded.
SKIN_FONTS = ("family=Anton&family=Oswald:wght@500;600&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400"
              "&family=Archivo+Black&family=Archivo:wght@400;600;700&family=PT+Serif:wght@700"
              "&family=Fraunces:ital,opsz,wght@0,9..144,800;1,9..144,900&family=IM+Fell+English"
              "&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400"
              "&family=Cabin+Sketch:wght@700&family=Kalam:wght@400;700&family=Source+Serif+4:wght@400"
              "&family=IBM+Plex+Mono")

BAR = '<span style="height:.7cqw;background:{c};width:{w}%"></span>'


def bars(c, *ws):
    return "".join(BAR.format(c=c, w=w) for w in ws)


def t_fight(it):
    side = "".join(f'<span style="font:500 2.2cqw Oswald,sans-serif;color:{c};text-transform:uppercase">{t}</span>'
                   for t, c in [("Stoicism ◀", "#ffd76a"), ("Epicureanism", "#e9dcc0"), ("Cynicism", "#e9dcc0"), ("Platonism", "#e9dcc0")])
    box = lambda top, lab, col, b: (f'<div style="background:#f6ecd6;border-top:.8cqw solid {top};height:17cqw;padding:1.4cqw;display:flex;flex-direction:column;gap:1cqw">'
                                   f'<span style="font:600 1.7cqw Oswald,sans-serif;letter-spacing:.12em;color:{col}">{lab}</span>{b}</div>')
    return ('<div style="position:absolute;inset:0;background:#efe3c8;display:grid;grid-template-columns:30% 1fr">'
            '<div style="background:#1b140e;padding:4cqw 3cqw;display:flex;flex-direction:column;gap:1.5cqw">'
            '<span style="font-family:Anton,Impact,sans-serif;color:#ffd76a;font-size:4.2cqw;line-height:.95;text-transform:uppercase">So you’re arguing about…</span>'
            '<span style="height:.5cqw;background:#5a4a3a;margin:.6cqw 0"></span>'
            '<span style="font:500 2.1cqw Oswald,sans-serif;letter-spacing:.1em;color:#c3261b">Ω ANCIENTS</span>' + side +
            '</div><div style="padding:4cqw;display:flex;flex-direction:column;gap:2cqw">'
            '<span style="font-family:Anton,Impact,sans-serif;font-size:9.5cqw;line-height:.9;color:#1b140e;text-shadow:.5cqw .5cqw 0 #c3261b">STOICISM</span>'
            '<span style="border-top:.8cqw double #1b140e"></span>'
            '<span style="font-family:\'Libre Caslon Text\',Georgia,serif;font-style:italic;font-size:2.7cqw;color:#1b140e">“Virtue is the only good.”</span>'
            '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.6cqw">'
            + box("#1b140e", "○ SERIOUS", "#1b140e", bars("#d4c09b", 100, 80, 60))
            + box("#e08a1c", "◐ BAIT", "#b36a0c", bars("#d4c09b", 100, 70))
            + box("#c3261b", "● RAGE BAIT", "#c3261b", bars("#b9a07a", 100, 85, 50))
            + '</div></div></div>')


def t_label(it):
    return ('<div style="position:absolute;inset:0;background:#f6f5ef;color:#0d0d0d;font-family:Archivo,Arial,sans-serif">'
            '<div style="height:1.8cqw;background:repeating-linear-gradient(-45deg,#0d0d0d 0 1.4cqw,#ff4a1c 1.4cqw 2.8cqw)"></div>'
            '<div style="display:grid;grid-template-columns:28% 1fr;height:calc(100% - 1.8cqw)">'
            '<div style="border-right:.5cqw solid #0d0d0d;padding:3cqw 2.6cqw;display:flex;flex-direction:column;gap:1.2cqw">'
            '<span style="font-family:\'Archivo Black\',sans-serif;font-size:3.6cqw;line-height:.95;text-transform:uppercase;border-bottom:1.6cqw solid #0d0d0d;padding-bottom:1.2cqw">So you’re sure about…</span>'
            '<span style="font:700 1.9cqw Archivo,sans-serif;letter-spacing:.1em;color:#ff4a1c">HEALTH</span>'
            '<span style="font-size:2.2cqw;background:#0d0d0d;color:#fff;padding:.5cqw 1cqw">Diet</span>'
            '<span style="font-size:2.2cqw">Drugs</span><span style="font-size:2.2cqw">Sleep</span>'
            '<span style="font:700 1.9cqw Archivo,sans-serif;letter-spacing:.1em;color:#ff4a1c">MONEY</span><span style="font-size:2.2cqw">Wages</span></div>'
            '<div style="padding:3cqw 3.4cqw;display:flex;flex-direction:column;gap:2cqw">'
            '<span style="font-family:\'Archivo Black\',sans-serif;font-size:7cqw;line-height:.95;text-transform:uppercase;border-bottom:1.8cqw solid #0d0d0d;padding-bottom:1cqw">Diet</span>'
            '<div style="background:#fff;border:.5cqw solid #0d0d0d;box-shadow:1.2cqw 1.2cqw 0 #0d0d0d;padding:1.6cqw 2cqw;display:flex;flex-direction:column;gap:1cqw;width:78%">'
            '<span style="font-family:\'Archivo Black\',sans-serif;font-size:3.4cqw;border-bottom:1.2cqw solid #0d0d0d;padding-bottom:.6cqw">Salt</span>'
            '<span style="font:700 2.3cqw Archivo,sans-serif">“Salt is bad for everyone.”</span>'
            '<span style="font-size:2cqw;color:#333"><span style="color:#ff4a1c">■</span> ………………………………</span>'
            '<span style="font:700 1.8cqw Archivo,sans-serif;letter-spacing:.1em;color:#66645d">+ ⚠ WARNING &amp; SOURCE</span>'
            '</div></div></div></div>')


def t_tabloid(it):
    col = lambda kick, head, stamp, c: (f'<div style="border-top:.7cqw solid #111;padding-top:1cqw;display:flex;flex-direction:column;gap:1cqw">'
                                        f'<span style="font:500 1.6cqw Oswald,sans-serif;color:#e10600">{kick}</span>'
                                        f'<span style="font:700 2.8cqw/1.15 \'PT Serif\',serif">{head}</span>'
                                        f'<span style="align-self:flex-start;font:400 2cqw Anton,sans-serif;color:{c};border:.45cqw solid {c};padding:.4cqw 1cqw;transform:rotate(-4deg)">{stamp}</span></div>')
    return ('<div style="position:absolute;inset:0;background:#fbf9f1;color:#111">'
            '<div style="background:#e10600;border-bottom:1.2cqw solid #ffe500;padding:2.6cqw 3.4cqw 1.6cqw;display:flex;align-items:flex-end;gap:3cqw">'
            '<span style="font-family:Anton,Impact,sans-serif;color:#fff;font-size:9cqw;line-height:.9">DiD yOu KnOw…</span>'
            '<span style="font:600 1.8cqw Oswald,sans-serif;color:#fff;letter-spacing:.08em;text-transform:uppercase;max-width:30%">Real studies. Outrageous findings. Most didn’t survive.</span></div>'
            '<div style="background:#111;color:#ccc;font:500 1.9cqw Oswald,sans-serif;text-transform:uppercase;letter-spacing:.05em;padding:1cqw 3.4cqw;display:flex;gap:3cqw">'
            '<span style="background:#ffe500;color:#111;padding:0 1cqw">All</span><span>Psychology</span><span>Nutrition</span><span>Medicine</span></div>'
            '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3cqw;padding:2.4cqw 3.4cqw">'
            + col("PRIMING", "Reading about old age makes you walk slower", "DEAD", "#e10600")
            + col("EGO DEPLETION", "Willpower runs out like a battery", "CONTESTED", "#c77800")
            + col("NUTRITION", "Plate colour changes how much you eat", "HELD UP", "#0a7a3a")
            + '</div></div>')


def t_riso(it):
    hl = 'background:linear-gradient(transparent 60%,rgba(255,79,174,.35) 60%)'
    return ('<div style="position:absolute;inset:0;background:radial-gradient(rgba(255,79,174,.18) 1px,transparent 1.4px) 0 0/1.6cqw 1.6cqw,#f5f0e6;color:#2340b8;display:grid;grid-template-columns:27% 1fr;font-family:Fraunces,Georgia,serif">'
            '<div style="border-right:.4cqw dashed #ff4fae;padding:3.4cqw 2.4cqw;display:flex;flex-direction:column;gap:1.2cqw">'
            '<span style="font:italic 900 4.6cqw/.95 Fraunces,serif;text-shadow:-.5cqw .4cqw 0 rgba(255,79,174,.85)">Metaphors for…</span>'
            '<span style="font:1.7cqw monospace;color:#ff4fae;margin-top:1cqw">abstract things</span>'
            '<span style="font-size:2.4cqw;font-weight:800;background:#2340b8;color:#f5f0e6;padding:.4cqw 1cqw">Time</span>'
            '<span style="font-size:2.4cqw;font-weight:800">Ideas</span><span style="font-size:2.4cqw;font-weight:800">Argument</span><span style="font-size:2.4cqw;font-weight:800">Love</span></div>'
            '<div style="padding:3cqw 3.4cqw;display:flex;flex-direction:column;gap:2cqw">'
            '<span style="font:italic 900 12cqw/.9 Fraunces,serif;text-shadow:-.8cqw .6cqw 0 rgba(255,79,174,.85)">Time</span>'
            '<div style="background:#fbf7ef;border:.4cqw solid #2340b8;padding:2cqw 2.4cqw;display:flex;flex-direction:column;gap:1cqw;width:82%">'
            '<span style="font:800 3.4cqw/1.1 Fraunces,serif">Time is <span style="font-style:italic;background:#ff4fae;color:#fff;padding:0 .8cqw">money</span></span>'
            f'<span style="font-size:2.3cqw;border-top:.3cqw dashed #f1c4dd;padding-top:.6cqw">You’re <span style="{hl}">wasting</span> my time.</span>'
            f'<span style="font-size:2.3cqw;border-top:.3cqw dashed #f1c4dd;padding-top:.6cqw">That <span style="{hl}">saved</span> me an hour.</span>'
            '</div></div></div>')


def meter(on, col):
    return ('<span style="display:grid;grid-template-columns:repeat(9,1fr);gap:.2cqw;width:12cqw;height:1.2cqw">'
            + "".join(f'<i style="background:{col if i == on else "rgba(120,90,40,.15)"}"></i>' for i in range(9)) + '</span>')


def t_dict(it):
    return ('<div style="position:absolute;inset:0;background:#f2ead8;color:#251c12;font-family:\'EB Garamond\',Garamond,serif">'
            '<div style="position:absolute;inset:1.8cqw;border:.7cqw double #d8c9aa;padding:3cqw 4cqw;display:flex;flex-direction:column;gap:1.2cqw">'
            '<span style="text-align:center;font:7.4cqw/1 \'IM Fell English\',serif">Norm Dictionary</span>'
            '<span style="text-align:center;font-style:italic;font-size:2.3cqw;color:#8b7a60">of what people say, and what they actually allow</span>'
            '<span style="border-top:.8cqw double #251c12"></span>'
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4cqw">'
            '<div style="display:flex;flex-direction:column;gap:.8cqw">'
            '<span style="font:700 3.4cqw \'EB Garamond\',serif"><span style="color:#8b1a1a;font-weight:400">≠</span> Lying</span>'
            '<span style="font-size:2.2cqw"><b style="color:#8b1a1a">1.</b> <i>to spare feelings.</i> Said: never lie.</span>'
            f'<span style="display:flex;gap:1cqw;align-items:center;font-size:2cqw">{meter(0, "#2f6b3a")}<i style="color:#2f6b3a">expected</i></span>'
            f'<span style="display:flex;gap:1cqw;align-items:center;font-size:2cqw">{meter(6, "#994722")}<i style="color:#994722">frowned on</i></span></div>'
            '<div style="display:flex;flex-direction:column;gap:.8cqw;border-left:.2cqw solid #d8c9aa;padding-left:3cqw">'
            '<span style="font:700 3.4cqw \'EB Garamond\',serif"><span style="color:#8b1a1a;font-weight:400">✕</span> Hitting</span>'
            '<span style="font-size:2.2cqw"><b style="color:#8b1a1a">1.</b> <i>a child.</i> Said: never.</span>'
            '<span style="font-size:2.2cqw"><b style="color:#8b1a1a">2.</b> <i>in a ring.</i> Said: it’s sport.</span>'
            '</div></div></div></div>')


def t_arxiv(it):
    toc = "".join(f'<span><span style="color:#6b6b6b">{n}</span>  {t}</span>' for n, t in [(1, "Biology"), (3, "Physics"), (4, "Economics")])
    return ('<div style="position:absolute;inset:0;background:#fdfdfb;color:#141414;font-family:\'STIX Two Text\',Times,serif;display:grid;grid-template-columns:26% 1fr">'
            '<div style="background:#f4f3ef;border-right:.2cqw solid #dcdcdc;padding:3cqw 2.4cqw;display:flex;flex-direction:column;gap:.9cqw;font-size:2cqw">'
            '<span style="font-weight:600;font-size:2.6cqw;line-height:1.15">The ten best papers for…</span>'
            '<span style="color:#b31b1b;font-size:1.6cqw">arXiv:2611.25001</span>'
            '<span style="font:600 1.5cqw Inter,sans-serif;letter-spacing:.08em;color:#6b6b6b;margin-top:1cqw">SCIENCES</span>'
            + toc.replace("<span><span style=\"color:#6b6b6b\">3", '<span style="color:#b31b1b;font-weight:700"><span>2</span>  Psychology</span><span><span style="color:#6b6b6b">3', 1) +
            '</div><div style="position:relative;padding:4cqw 6cqw 0 8cqw;display:flex;flex-direction:column;gap:1.4cqw">'
            '<span style="position:absolute;left:2.6cqw;bottom:3cqw;transform:rotate(-90deg);transform-origin:left bottom;font-size:2cqw;color:#a6a6a6;white-space:nowrap">arXiv:2611.25001v1  [cs.DL]</span>'
            '<span style="text-align:center;font-weight:600;font-size:4.2cqw;line-height:1.15">The ten best papers for Psychology</span>'
            '<span style="text-align:center;font-variant:small-caps;font-size:2.1cqw;color:#6b6b6b">Jere · Sciences · 9 fields, 90 papers</span>'
            '<span style="font-size:2cqw;text-align:justify"><b>Abstract.</b> Not psychology’s history but where it stands now: the papers today’s research runs on or is still arguing with.</span>'
            '<span style="font-weight:600;font-size:2.6cqw;margin-top:.6cqw">2.1  Memory</span>'
            '<span style="font-size:2cqw"><span style="color:#b31b1b">[1]</span>  <i>Working memory: looking back and looking forward</i></span>'
            '<span style="font-size:2cqw"><span style="color:#b31b1b">[2]</span>  <i>The magical number 4 in short-term memory</i></span>'
            '</div></div>')


def t_chalk(it):
    return ('<div style="position:absolute;inset:0;background:linear-gradient(135deg,#7d5634,#5a3a20 40%,#7d5634 60%,#4f321b);padding:2cqw">'
            '<div style="height:100%;box-sizing:border-box;background:radial-gradient(ellipse at 20% 30%,rgba(255,255,255,.08),transparent 45%),#253a30;color:#f1efe4;padding:3cqw 4cqw;display:flex;flex-direction:column;gap:1.6cqw;font-family:Kalam,cursive">'
            '<span style="font:700 2.6cqw \'Cabin Sketch\',cursive;color:#a7bbaf">So you want to understand…</span>'
            '<span style="font:700 8.6cqw/1 \'Cabin Sketch\',cursive;color:#fbfaf3">Psychology</span>'
            '<span style="border:.4cqw solid rgba(246,226,127,.55);border-radius:2.4cqw .8cqw 2.8cqw 1cqw;padding:1.2cqw 2cqw;color:#f6e27f;font-size:2.1cqw"><b style="color:#f5a9bb">The lay of the land</b> · A field split between …</span>'
            '<span style="font:700 3.6cqw Kalam,cursive;color:#f6e27f">Is intelligence mostly inherited?</span>'
            '<span style="font-size:2.4cqw"><span style="color:#f5a9bb">→</span> More than most people want, less than some claim.</span>'
            '<span style="display:flex;gap:1.4cqw;font-size:1.9cqw"><span style="background:#f6e27f;color:#1f2f27;padding:0 1.2cqw;border-radius:1.4cqw">where it’s landing</span>'
            '<span style="border:.3cqw solid #a9d4f5;color:#a9d4f5;padding:0 1.2cqw;border-radius:1.4cqw">partly right</span>'
            '<span style="color:#f5a9bb;text-decoration:line-through">losing</span></span></div></div>')


def t_gen(it):
    fg, acc = it.get("fg", "#f1efe9"), it.get("accent", "#f1efe9")
    chips = "".join(f'<span style="border:1px solid {acc};color:{acc};border-radius:999px;padding:1cqw 3cqw;font-size:3.1cqw">{e(c)}</span>' for c in it.get("chips", []))
    return (f'<div style="position:absolute;inset:0;background:{it.get("bg", "#111")};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4cqw;padding:6cqw;text-align:center;font-family:Inter,system-ui,sans-serif;color:{fg}">'
            f'<span style="font-size:6.4cqw;font-weight:600;letter-spacing:-.02em;line-height:1.1">{e(it.get("q", ""))}</span>'
            f'<span style="display:flex;flex-wrap:wrap;justify-content:center;gap:1.6cqw">{chips}</span>'
            '<span style="font-size:2.7cqw;opacity:.7">↻ tap for another</span></div>')


def t_worlds(it):
    cells = [("#efefef", "#111", "300 3.4cqw Inter,sans-serif", "cyberminimalism"), ("#0d0d0d", "#e9e9e9", "3.4cqw 'Courier New',monospace", "POST-PUNK"),
             ("#6f5236", "#f2e6d4", "italic 3.8cqw Georgia,serif", "Sprezzatura"), ("#d8cbb8", "#1d1a16", "3.6cqw Didot,Georgia,serif", "Chic Modernist"),
             ("#2c6aa3", "#fbf4e6", "3.4cqw Georgia,serif", "Mediterranean"), ("#120a1f", "#ff2e88", "700 3.6cqw 'Courier New',monospace", "CYBERPUNK")]
    return ('<div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr))">'
            + "".join(f'<span style="background:{b};color:{c};font:{f};padding:3cqw;display:flex;align-items:flex-end">{t}</span>' for b, c, f, t in cells) + '</div>')


def t_lookbook(it):
    return ('<div style="position:absolute;inset:0;background:#fff;color:#000;font-family:\'Helvetica Neue\',Arial,sans-serif;padding:5cqw 6cqw;display:flex;flex-direction:column;gap:3cqw">'
            '<span style="display:flex;justify-content:space-between;font-size:2.4cqw;letter-spacing:.12em;font-weight:700"><span>LOOKBOOK INDEX</span><span>JUST IN · INDEX</span></span>'
            '<span style="display:flex;gap:3cqw;align-items:flex-start"><span style="display:flex;flex-direction:column"><span style="font-size:14cqw;font-weight:800;line-height:.9">24</span><span style="font-size:2.2cqw;letter-spacing:.1em">NOV</span></span>'
            '<span style="flex:1 1 auto;height:44cqw;background:#d6d3ce"></span><span style="flex:1 1 auto;height:44cqw;background:#b9b5ae"></span><span style="flex:1 1 auto;height:44cqw;background:#e4e1dc"></span></span>'
            '<span style="display:flex;gap:3cqw;margin-top:2cqw"><span style="font-size:14cqw;font-weight:800;line-height:.9;visibility:hidden">24</span>'
            '<span style="flex:1 1 auto;height:44cqw;background:#cfcac2"></span><span style="flex:1 1 auto;height:44cqw;background:#e9e6e1"></span></span></div>')


def t_uplink(it):
    # Uplink: the Marathon "graphic realism" console (the old front page).
    return ('<div style="position:absolute;inset:0;background:#050506;color:#f2f2ee;font-family:\'Kode Mono\',\'Courier New\',monospace;padding:6cqw;display:flex;flex-direction:column;gap:3cqw">'
            '<span style="display:flex;justify-content:space-between;font-size:2.6cqw;letter-spacing:.1em;color:#6f706c"><span>UPLINK // RUNNER SHELL</span><span>接続</span></span>'
            '<span style="height:.6cqw;background:#c2ff16;width:38%"></span>'
            '<span style="font-family:\'Hubot Sans\',Inter,sans-serif;font-weight:300;font-size:15cqw;line-height:.88;letter-spacing:-.02em;margin-top:6cqw">JERE<br>.ING</span>'
            '<span style="font-size:3cqw;color:#c2ff16">&gt; root_ <span style="color:#6f706c">// set dressing</span></span>'
            '<span style="margin-top:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.6cqw">'
            '<span style="height:16cqw;background:#c2ff16"></span><span style="height:16cqw;background:#e0216f"></span><span style="height:16cqw;border:.5cqw solid #f2f2ee"></span>'
            '<span style="font-size:2.4cqw">01 LAB</span><span style="font-size:2.4cqw">02 COMMS</span><span style="font-size:2.4cqw">03 NOISE</span></span></div>')


def t_vesta(it):
    # Vesta 9: Mirror's Edge city-web site, white, red and navy.
    return ('<div style="position:absolute;inset:0;background:#fff;color:#1a2140;font-family:\'Barlow Condensed\',\'Arial Narrow\',sans-serif;display:flex;flex-direction:column">'
            '<span style="height:46cqw;background:linear-gradient(160deg,#eef2f6 0 55%,#e6ebf1 55% 100%);position:relative">'
            '<span style="position:absolute;right:8cqw;top:0;bottom:0;width:20cqw;background:#e3120b"></span>'
            '<span style="position:absolute;left:6cqw;top:8cqw;width:26cqw;height:30cqw;border:.5cqw solid #1a2140"></span></span>'
            '<span style="padding:6cqw;display:flex;flex-direction:column;gap:2.4cqw">'
            '<span style="font-size:2.6cqw;letter-spacing:.24em;color:#8a94a6">RESIDENCES · CITY WEB</span>'
            '<span style="font-size:13cqw;font-weight:600;line-height:.9;letter-spacing:.02em">vesta 9</span>'
            '<span style="font-size:3.4cqw;color:#e3120b;letter-spacing:.1em">ヴェスタ 9 ― WELCOME HOME</span></span></div>')


def t_app(it):
    apps = "".join(f"<span>{a}</span>" for a in ["Brave", "Claude", "Discord", "Gmail", "Maps", "YouTube", "Camera", "Phone"])
    return ('<div style="position:absolute;inset:0;background:#e6e1d7;display:flex;justify-content:center;align-items:center">'
            '<span style="width:46cqw;height:94cqw;border-radius:6cqw;border:1cqw solid #1c1c1c;background:#fbf9f4;color:#1c1c1c;font-family:Georgia,serif;padding:5cqw 4.5cqw;box-sizing:border-box;display:flex;flex-direction:column;gap:2cqw;font-size:4cqw">'
            f'<span style="font-size:9cqw;margin-bottom:2cqw">12:04</span>{apps}</span></div>')


# ---- v5 thumbnails (Nov 25, 2026): the arguing sites' shared layout (header sentence, index, rows) ----
def v5(c, say, index, rows, tabs=""):
    """c: colors/fonts dict. say: header sentence html. index: list of (icon, name, items or None, current item index).
    rows: list of row html; the first is drawn selected."""
    head = (f'<div style="height:11cqw;flex:none;display:flex;align-items:center;gap:2.4cqw;padding:0 3cqw;background:{c["bar"]};color:{c["barfg"]};'
            f'border-bottom:{c.get("barline", "0.2cqw solid " + c["line"])}">'
            f'<span style="flex:none;width:3.2cqw;height:2.4cqw;background:linear-gradient(currentColor 0 0) 0 0/100% .35cqw no-repeat,linear-gradient(currentColor 0 0) 0 50%/100% .35cqw no-repeat,linear-gradient(currentColor 0 0) 0 100%/100% .35cqw no-repeat"></span>'
            f'<span style="font:{c.get("sayw", 400)} {c.get("says", 4.4)}cqw/1.05 {c["disp"]};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;{c.get("saycss", "")}">{say}</span>'
            f'{tabs}</div>')
    ix = [f'<span style="font:600 2.2cqw {c["text"]};padding:1.4cqw 2.4cqw;background:{c["sel"]};box-shadow:inset .5cqw 0 0 {c["acc"]}">Overview</span>']
    for icon, name, items, cur in index:
        ix.append(f'<span style="display:flex;gap:1.2cqw;padding:1.3cqw 2.4cqw;border-top:.15cqw solid {c["line"]};font:600 2.1cqw {c.get("label", c["text"])};{c.get("gcss", "")}">'
                  f'<span style="color:{c["dim"]};font-size:1.4cqw">{"▼" if items else "▶"}</span><span style="color:{c["acc"]}">{icon}</span>{name}</span>')
        for i, it in enumerate(items or []):
            on = i == cur
            ix.append(f'<span style="padding:.7cqw 2.4cqw .7cqw 6.2cqw;font:2.1cqw {c["text"]};'
                      + (f'background:{c["sel"]};box-shadow:inset .5cqw 0 0 {c["acc"]}' if on else "") + f'">{it}</span>')
    body = "".join(
        f'<div style="padding:2.2cqw 3cqw;border-top:.15cqw solid {c["line"]};' + (f'background:{c["sel"]};box-shadow:inset .5cqw 0 0 {c["acc"]}' if i == 0 else "") + f'">{r}</div>'
        for i, r in enumerate(rows))
    return (f'<div style="position:absolute;inset:0;background:{c["bg"]};color:{c["fg"]};font-family:{c["text"]};display:flex;flex-direction:column">{head}'
            f'<div style="flex:1;display:grid;grid-template-columns:31% 1fr;min-height:0">'
            f'<div style="border-right:.15cqw solid {c["line"]};display:flex;flex-direction:column;padding-top:1.2cqw;overflow:hidden">{"".join(ix)}</div>'
            f'<div style="overflow:hidden">{body}</div></div></div>')


def tag(t, col, fg="#fff"):
    return f'<span style="display:inline-block;font:600 1.6cqw/1 Oswald,sans-serif;text-transform:uppercase;letter-spacing:.04em;padding:.6cqw .9cqw .5cqw;background:{col};color:{fg};margin-top:.8cqw">{t}</span>'


def t_fight(it):
    c = dict(bg="#efe3c8", fg="#1b140e", dim="#6b5744", line="#d4c09b", acc="#c3261b", sel="#e4d2ac", bar="#1b140e", barfg="#f0e4c8",
             disp="Anton,Impact,sans-serif", text="'Libre Caslon Text',Georgia,serif", label="Oswald,sans-serif",
             saycss="text-transform:uppercase", gcss="text-transform:uppercase;letter-spacing:.05em;font-weight:500")
    rep = lambda t, col, b=False: f'<span style="border-top:.4cqw solid {col};padding-top:.6cqw;font-size:1.65cqw;line-height:1.35;{"font-weight:700" if b else ""}">{t}</span>'
    row = lambda claim, a, b, r: (f'<span style="display:block;font:italic 2.4cqw/1.25 \'Libre Caslon Text\',serif;margin-bottom:1cqw">{claim}</span>'
                                  f'<span style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.6cqw">{rep(a, "#1b140e")}{rep(b, "#9a5200")}{rep(r, "#c3261b", True)}</span>')
    return v5(c, 'So you’re arguing about <b style="color:#ffd76a;font-weight:400">Socrates</b>?',
              [("Ω", "Ancients", ["Socrates", "Plato", "Aristotle", "Stoicism", "Epicurus"], 0), ("∃", "Metaphysics", None, 0), ("Ψ", "Mind", None, 0),
               ("§", "Ethics", None, 0), ("†", "Religion", None, 0), ("⚑", "Politics", None, 0)],
              [row("“The unexamined life is not worth living”", "Plenty of people live decent lives without scrutiny.", "Examining things is what got him executed.", "Socrates lost his own trial."),
               row("“He knew that he knew nothing”", "The modesty is selective.", "If he knew nothing, he didn’t know that either.", "“I know nothing,” then corrected people for fifty years."),
               row("“He died for his principles”", "The sources are admirers writing afterwards.", "He was offered exile and turned it down.", "He picked hemlock to make a point."),
               row("“No one does wrong knowingly”", "Weakness of will is one of the most familiar things about people.", "Everyone who has eaten a second dessert knew.", "He’d never met Athenians."),
               row("“The Socratic method gets at the truth”", "The early dialogues mostly end in a shrug.", "A method that worked would finish at some point.", "It’s asking “but what is justice?” until they leave.")])


def t_label(it):
    c = dict(bg="#f6f5ef", fg="#0d0d0d", dim="#5f5d57", line="#d6d3c9", acc="#c4320a", sel="#ffffff", bar="#0d0d0d", barfg="#ffffff",
             barline=".8cqw solid #c4320a", disp="'Archivo Black',sans-serif", text="Archivo,Arial,sans-serif", saycss="text-transform:uppercase", says=4)
    row = lambda h, f: (f'<span style="display:block;font-size:1.7cqw;color:#5f5d57">You’ve heard <b style="color:#1f1f1c">“{h}”</b></span>'
                        f'<span style="display:block;font-size:2.15cqw;line-height:1.4;margin-top:.4cqw">{f}</span>')
    return v5(c, 'So you’re sure about <span style="color:#ff6a3d">abortion</span>?',
              [("⚕", "Health", ["Abortion and end of life", "Bodies and consent", "Mental health", "Vaccines and COVID"], 0), ("⚖", "Crime and justice", None, 0),
               ("¤", "Economics", None, 0), ("✎", "Education", None, 0), ("☘", "Environment", None, 0)],
              [row("Late-term abortions are common", "CDC data for 2022: 40% happened by six weeks, 7% after the first trimester."),
               row("Most Americans support abortion rights", "Gallup 2023: 69% back legality in the first three months, 22% in the last."),
               row("Brain dead patients sometimes wake up", "A 2023 guideline from four US medical societies says they do not recover."),
               row("Abortion patients are mostly young and childless", "About six in ten had already given birth at least once."),
               row("Death is a medical fact everyone agrees on", "US law has defined it since 1981, but a 2023 revision effort stalled."),
               row("Organs are only taken once the donor is dead", "A 2025 federal review flagged 351 cases for a closer look."),
               row("Overturning Roe cut the number of abortions", "Monthly totals rose in 2023 and 2024, helped by telehealth.")])


def t_tabloid(it):
    c = dict(bg="#fbf9f1", fg="#111", dim="#5e5e5e", line="#d9d6cc", acc="#d10600", sel="#fff6b8", bar="#d10600", barfg="#fff",
             barline=".8cqw solid #ffe500", disp="Anton,Impact,sans-serif", text="'PT Serif',Georgia,serif", label="Oswald,sans-serif",
             gcss="text-transform:uppercase;letter-spacing:.05em;font-weight:500", says=4.6)
    row = lambda h, v, col: f'<span style="display:block;font:700 2.35cqw/1.25 \'PT Serif\',serif">{h}</span>{tag(v, col)}'
    return v5(c, 'DiD yOu KnOw <span style="color:#ffe500">holding a pen in your teeth</span>…',
              [("◇", "By field", ["Psychology", "Medicine", "Food & lifestyle", "The paranormal", "Animals"], 0), ("●", "By how it ended", None, 0),
               ("✦", "By kind of crazy", None, 0)],
              [row("Holding a pen in your teeth makes cartoons funnier", "Contested", "#a25f00"),
               row("Standing like Wonder Woman raises your testosterone", "Dead", "#d10600"),
               row("Listening to Mozart makes you smarter", "Dead", "#d10600"),
               row("Taking a test teaches you more than rereading", "Held up, somehow", "#0a7a3a"),
               row("A marshmallow wait predicts later achievement", "Real data, wrong conclusion", "#555"),
               row("Washing your hands makes your moral judgments less harsh", "Dead", "#d10600"),
               row("Holding a warm cup makes people seem warmer", "Dead", "#d10600"),
               row("Hurricanes with female names kill more people", "Contested", "#a25f00")])


def t_riso(it):
    c = dict(bg="#f5f0e6", fg="#2340b8", dim="#4f5ca8", line="#e6c3d6", acc="#c81d70", sel="#fbe3ef", bar="#f5f0e6", barfg="#2340b8",
             disp="Fraunces,Georgia,serif", text="Fraunces,Georgia,serif", sayw=800, saycss="font-style:italic;letter-spacing:-.02em", says=4.8)
    hl = lambda w: f'<em style="font-style:italic;background:#ff4fae;color:#fff;padding:0 .6cqw">{w}</em>'
    row = lambda a, w, ex: (f'<span style="display:grid;grid-template-columns:44% 1fr;gap:2cqw"><span style="font:800 2.5cqw/1.2 Fraunces,serif">{a} {hl(w)}</span>'
                            f'<span style="display:flex;flex-direction:column;gap:.5cqw;font-size:1.9cqw">' + "".join(f'<span>“{e}”</span>' for e in ex) + '</span></span>')
    return v5(c, 'Metaphors for <span style="color:#c81d70">the mind</span>',
              [("◇", "By picture", None, 0), ("◉", "Mind & knowing", ["The mind", "Ideas", "Understanding", "Reason"], 0), ("❝", "Argument", None, 0),
               ("✺", "Emotion", None, 0), ("∞", "Love", None, 0), ("⧗", "Time", None, 0)],
              [row("The mind is a", "container", ["I can’t get that song out of my head.", "Keep that in mind.", "It just popped into my head."]),
               row("The mind is a", "machine", ["My brain isn’t working today.", "I’m a little rusty.", "She’s running out of steam."]),
               row("Memory is a", "storehouse", ["Let me dig that up.", "It’s filed away somewhere."]),
               row("The mind is a", "body", ["I can’t stomach that argument.", "Let me chew on it."]),
               row("The self is a", "container", ["I’m bottling it all up.", "She opened up to me."]),
               row("Ideas are", "food", ["That’s food for thought.", "Half-baked ideas.", "Hard to swallow."])])


def t_dict(it):
    c = dict(bg="#f2ead8", fg="#251c12", dim="#6b5b43", line="#d8c9aa", acc="#8b1a1a", sel="#e7d9ba", bar="#f2ead8", barfg="#251c12",
             disp="'IM Fell English',serif", text="'EB Garamond',Garamond,serif", says=4.6)
    col = ["#2f6b3a", "#2f6e55", "#55722b", "#7a6510", "#8f5d10", "#985020", "#8f3f1d", "#86251a", "#560c0c"]
    def scale(v, o=None):
        p = lambda k: f"{(k + .5) / 9 * 100:.1f}%"
        s = (f'<span style="position:relative;display:block;height:2cqw;width:20cqw;flex:none;background:linear-gradient({c["line"]},{c["line"]}) 0 50%/100% .15cqw no-repeat">'
             + (f'<i style="position:absolute;left:{p(o)};top:50%;width:1.4cqw;height:1.4cqw;margin:-.7cqw;border-radius:50%;border:.25cqw solid {col[o]};box-sizing:border-box;background:{c["bg"]}"></i>' if o is not None else "")
             + f'<i style="position:absolute;left:{p(v)};top:50%;width:1.7cqw;height:1.7cqw;margin:-.85cqw;border-radius:50%;background:{col[v]}"></i></span>')
        return s
    vd = ["expected", "admired", "fine", "laughed at", "eyebrows", "divided", "frowned on", "not okay", "illegal"]
    row = lambda t, v, o=None: (f'<span style="display:flex;align-items:center;gap:2cqw"><span style="flex:1;font-size:2.15cqw;line-height:1.3">{t}</span>{scale(v, o)}'
                                f'<i style="width:10cqw;flex:none;font-size:1.9cqw;color:{col[v]}">{vd[v]}</i></span>')
    tabs = ('<span style="margin-left:auto;display:flex;gap:2cqw;font:2cqw \'EB Garamond\',serif;color:#6b5b43;flex:none">'
            '<span style="color:#251c12;border-bottom:.3cqw solid #8b1a1a">Dictionary</span><span>Outline</span><span>Granular</span></span>')
    return v5(c, 'Norm Dictionary: <span style="color:#8b1a1a">bodies</span>',
              [("○", "Bodies", ["Changing your body", "Changing your mind", "Showing skin", "Showing wealth"], 0), ("☉", "Faith", None, 0), ("✕", "Harm", None, 0),
               ("♥", "Love and family", None, 0), ("¤", "Money", None, 0), ("≠", "Words", None, 0)],
              [row("Braces, on a twelve-year-old.", 0), row("A full sleeve tattoo, at 30.", 2, 6), row("Pierced ears, on a baby girl.", 2, 4),
               row("A face tattoo, at 30.", 4, 7), row("A tattoo, on a baby.", 7), row("Testosterone, for a 25-year-old athlete.", 8, 2),
               row("A weight-loss drug, for a wedding.", 4), row("Testosterone, at 55, from his doctor.", 2), row("Coffee, every morning.", 0), row("A line of cocaine, at a party.", 8, 2)], tabs)


def t_arxiv(it):
    c = dict(bg="#fdfdfb", fg="#141414", dim="#5f5f5f", line="#e0dfda", acc="#b31b1b", sel="#fbf3e9", bar="#fdfdfb", barfg="#141414",
             disp="'STIX Two Text',Times,serif", text="'STIX Two Text',Times,serif", sayw=600, says=4.2)
    row = lambda y, t, a: (f'<span style="display:grid;grid-template-columns:6cqw 1fr;gap:1.6cqw;align-items:baseline"><span style="font:1.7cqw \'IBM Plex Mono\',monospace;color:#5f5f5f">{y}</span>'
                           f'<span><i style="font-size:2.2cqw">{t}</i><span style="display:block;font-size:1.7cqw;color:#5f5f5f;font-variant:small-caps">{a}</span></span></span>')
    return v5(c, 'The ten best papers for <span style="color:#b31b1b">History</span>',
              [("❦", "Humanities", ["History", "Philosophy", "Religious studies", "Literature"], 0), ("⚖", "Social sciences", None, 0), ("☉", "Natural sciences", None, 0),
               ("∑", "Formal sciences", None, 0), ("⚒", "Applied sciences", None, 0)],
              [row(1971, "The World of Late Antiquity", "Brown"), row(1973, "The Ancient Economy", "Finley"), row(1977, "The Emperor in the Roman World", "Millar"),
               row(1980, "Taxes and Trade in the Roman Empire", "Hopkins"), row(1998, "Becoming Roman", "Woolf"), row(2000, "The Corrupting Sea", "Horden & Purcell"),
               row(2007, "The Cambridge Economic History of the Greco-Roman World", "Scheidel, Morris & Saller"), row(2008, "Democracy and Knowledge", "Ober"),
               row(2017, "The Fate of Rome", "Harper"), row(2019, "Escape from Rome", "Scheidel")])


def t_chalk(it):
    c = dict(bg="#22362c", fg="#efede2", dim="#a9bcb0", line="#3b5246", acc="#f6e27f", sel="#2f4a3c", bar="#1d2f26", barfg="#efede2",
             disp="'Cabin Sketch',cursive", text="'Source Serif 4',Georgia,serif", label="Kalam,cursive", sayw=700, says=4.4)
    row = lambda q, a: (f'<span style="display:block;font:700 2.5cqw/1.2 Kalam,cursive;color:#f6e27f">{q}</span>'
                        f'<span style="display:block;font-size:1.95cqw;line-height:1.4;margin-top:.4cqw;color:#dcdfd3">{a}</span>')
    return v5(c, 'So you want to understand <span style="color:#f6e27f">History</span>?',
              [("❦", "Humanities", ["History", "Philosophy", "Religious studies", "Arts & music"], 0), ("⚖", "Social sciences", None, 0), ("☉", "Natural sciences", None, 0),
               ("∑", "Formal sciences", None, 0), ("⚒", "Applied sciences", None, 0)],
              [row("Did Rome fall, or just change?", "Real collapse in the West, from politics, invasion and climate; the East carried on."),
               row("Great men or deep structures?", "Leaders matter most where constraints are weak; structures set the menu."),
               row("Why did the West get rich first?", "No single factor wins: wages, coal, empire and ideas all mattered."),
               row("Did religion fight science?", "Historians dropped the war story; real clashes were local."),
               row("Why did Latin America fall behind?", "Institutions lead; dependency theory kept a point but lost the whole."),
               row("Was there a Scientific Revolution?", "The label survives; the one-event, one-genius version is dead."),
               row("Is the world heading for too many people?", "Too few is now the bigger worry in most of the world.")])



THUMBS = {"fight": t_fight, "label": t_label, "tabloid": t_tabloid, "riso": t_riso, "dict": t_dict, "arxiv": t_arxiv,
          "chalk": t_chalk, "gen": t_gen, "worlds": t_worlds, "lookbook": t_lookbook, "app": t_app,
          "uplink": t_uplink, "vesta": t_vesta}


def thumb(it):
    if it.get("img"):
        return f'<img src="{e(it["img"])}" alt="" loading="lazy" decoding="async">'
    return THUMBS[it["thumb"]](it)


def main():
    d = json.loads(DATA.read_text(encoding="utf-8"))
    # "pin": true puts an item first, as a big card (in pin order); the rest: live first, newest first, Old last.
    items = sorted(d["items"], key=lambda i: (not i.get("pin"), i["section"] in BOTTOM, not i["live"], [-ord(c) for c in i["made"]]))
    links = SITE["links"]
    top = "".join(f'<a href="{e("mailto:" + l["email"] if l.get("email") else l["href"])}">{e(l["label"].upper())}</a>' for l in links)
    cards, rows, drawn, seen = [], [], [], set()
    for n, it in enumerate(items, 1):
        no = f"{n:02d}"
        badge = BADGE[it["kind"]] if it["live"] else "SOON"
        if it["live"] and it.get("count"):
            badge += f' · {it["count"]}'
        if it["section"] in BOTTOM and it["section"] not in seen:
            seen.add(it["section"])
            sep = f'<p class="sep" data-sep>{e(it["section"].upper())} — STILL ONLINE, NO LONGER WORKED ON</p>'
            # Its own grid, so the dense packing above can't pull old cards up past the divider.
            cards.append('</div>' + sep.replace('data-sep', 'data-sep="g"') + '<div class="grid">'); rows.append(sep)
        tag = "a" if it["live"] and it["url"] else "div"
        href = f' href="{e(it["url"])}"' if tag == "a" else ' aria-disabled="true"'
        th = thumb(it)
        drawn.append(th)
        data = (' data-pin="1"' if it.get("pin") else "") + f' data-s="{e(it["section"].lower())}" data-q="{e((it["name"] + " " + it["line"] + " " + it["section"] + " " + badge).lower())}"'
        cards.append(f'<{tag} class="look{" hero" if it.get("pin") else ""}{"" if it["live"] else " soon"}{" old" if it["section"] in BOTTOM else ""}"{href} {data}>'
                     f'<span class="th" aria-hidden="true">{th}</span>'
                     f'<span class="cap"><span class="meta"><span>LOOK {no}</span><span>{badge}</span></span>'
                     f'<span class="nm">{e(it["name"].upper())}</span><span class="ln">{e(it["line"])}</span></span></{tag}>')
        rows.append(f'<{tag} class="row"{href} {data}><span class="no">{no}</span>'
                    f'<span class="rn"><span class="rnm">{e(it["name"])}</span><span class="ln">{e(it["line"])}</span></span>'
                    f'<span class="sec">{e(it["section"].upper())}</span><span class="bd">{badge}</span></{tag}>')
    tabs = '<button type="button" aria-pressed="true" data-f="">ALL</button>' + "".join(
        f'<button type="button" aria-pressed="false" data-f="{s.lower()}">{s.upper()}</button>'
        for s in d["sections"] if any(i["section"] == s for i in items))
    chars = "".join(sorted(set(html.unescape(re.sub(r"<[^>]+>", "", "".join(drawn))))))
    from urllib.parse import quote
    skin = f'https://fonts.googleapis.com/css2?{SKIN_FONTS}&text={quote(chars)}&display=swap'

    page = TEMPLATE
    for k, v in {"@@TOP@@": top, "@@ANNOUNCE@@": e(d["announce"]), "@@COLLECTION@@": e(d["collection"]),
                 "@@COUNT@@": f"{len(items)} LOOKS", "@@TABS@@": tabs, "@@CARDS@@": "\n".join(cards),
                 "@@ROWS@@": "\n".join(rows), "@@SKIN@@": e(skin)}.items():
        page = page.replace(k, v)
    OUT.write_text(page, encoding="utf-8")
    print(f"Built sites/index.html with {len(items)} looks")


TEMPLATE = r'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Things I’ve Made · jere.ing</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Things Jeremias has made: sites for arguing and reading, generators, and an Android app.">
<meta property="og:title" content="Things I’ve Made · jere.ing"><meta property="og:description" content="Sites for arguing and reading, generators, and an Android app.">
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap">
<link rel="stylesheet" href="@@SKIN@@">
<style>
:root{--bg:#f2f0eb;--ink:#111;--dim:#6b6862;--rule:#d6d2ca;--pad:32px;color-scheme:light}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--ink);font:400 14px/1.4 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.caps,.ann,nav,.coll,.tabs button,#q,#view,.meta,.nm,.sec,.bd,.no,footer{font-weight:500;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase}
.ann{background:var(--ink);color:var(--bg);text-align:center;height:32px;line-height:32px;padding:0 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}
nav{position:relative;z-index:4;height:44px;display:flex;justify-content:space-between;align-items:center;padding:0 var(--pad)}
nav .top{display:flex;gap:20px}
a:hover,button:hover{text-decoration:underline;text-underline-offset:4px}
header{padding:8px var(--pad) 0}
h1{margin:0;font:400 clamp(64px,13.4vw,188px)/.86 "Instrument Serif",Georgia,serif;letter-spacing:-.025em}
.coll{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px 16px;border-top:1px solid var(--ink);padding-top:8px;margin-top:4px}
.bar{position:sticky;top:0;z-index:3;background:var(--bg);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:4px 24px;padding:20px var(--pad) 8px}
.tabs{display:flex;flex-wrap:wrap;gap:4px 24px}
.tabs button{min-height:32px;color:var(--dim)}
.tabs button[aria-pressed=true]{color:var(--ink);text-decoration:underline;text-underline-offset:5px}
.tools{display:flex;align-items:center;gap:24px}
#q{color:var(--ink);background:transparent;border:0;border-bottom:1px solid var(--ink);width:110px;padding:6px 0;outline:none;border-radius:0}
#q::placeholder{color:var(--dim)}
#view{min-height:32px}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-flow:dense;gap:0 2px;padding-top:8px}
.look{display:flex;flex-direction:column;min-width:0;padding-bottom:28px}
.look.hero{grid-column:span 2;grid-row:span 2}
.th{display:block;position:relative;aspect-ratio:4/5;overflow:hidden;container-type:inline-size;background:#e6e1d7}
.th>*{transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.th img{width:100%;height:100%;object-fit:cover;display:block}
a.look:hover .th>*{transform:scale(1.035)}
a.look:hover{text-decoration:none}a.look:hover .nm{text-decoration:underline;text-underline-offset:3px}
.cap{display:flex;flex-direction:column;gap:3px;padding:10px 12px 0}
.meta{display:flex;justify-content:space-between;gap:8px;color:var(--dim);font-size:10px}
.nm{font-weight:600;font-size:11px;letter-spacing:.14em}
.ln{font:italic 400 21px/1.12 "Instrument Serif",Georgia,serif;margin-top:2px}
.hero .ln{font-size:40px}
.soon .th::after{content:"SOON";position:absolute;top:12px;left:12px;background:var(--bg);font:600 10px Inter,sans-serif;letter-spacing:.14em;padding:5px 9px}
.sep{margin:40px 0 0;padding:10px 12px 12px;border-top:1px solid var(--ink);font-size:10px;letter-spacing:.14em}
.index .sep{margin:32px 0 0;border-top:0}
.old .th>*{filter:grayscale(1)}a.old:hover .th>*{filter:none}
.th>*{transition:transform .6s cubic-bezier(.2,.7,.2,1),filter .6s}
.index{border-top:1px solid var(--ink);margin:8px var(--pad) 0}
.row{display:grid;grid-template-columns:48px minmax(0,1fr) 140px 120px;gap:16px;align-items:center;padding:12px 4px;border-bottom:1px solid var(--rule)}
a.row:hover{background:#e9e6df;text-decoration:none}
.no{color:var(--dim)}.rn{display:flex;flex-direction:column;gap:2px;min-width:0}
.rnm{font:400 34px/1.05 "Instrument Serif",Georgia,serif;letter-spacing:-.01em}
.row .ln{font-size:17px;color:#4a4741}
.sec{color:#4a4741}.bd{text-align:right}
.none{padding:48px 16px;text-align:center;font:italic 24px "Instrument Serif",Georgia,serif}
footer{display:flex;justify-content:space-between;gap:16px;margin-top:48px;padding:16px var(--pad);border-top:1px solid var(--ink);font-size:10px}
[hidden]{display:none!important}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
@media (max-width:1000px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:760px){:root{--pad:16px}nav .top{display:none}h1{font-size:64px}.bar{padding-top:12px}
 .grid{grid-template-columns:repeat(2,minmax(0,1fr))}.look{padding-bottom:20px}.look.hero{grid-row:auto}.ln{font-size:17px}.hero .ln{font-size:26px}
 .row{grid-template-columns:28px minmax(0,1fr) 72px}.sec{display:none}.rnm{font-size:24px}}
@media (prefers-reduced-motion:reduce){.th>*{transition:none}}
</style></head><body>
<div class="ann">@@ANNOUNCE@@</div>
<nav><a href="/">← JEREMIAS</a><span class="top">@@TOP@@</span></nav>
<header><h1>Things I’ve Made</h1><div class="coll"><span>@@COLLECTION@@</span><span id="count">@@COUNT@@</span></div></header>
<div class="bar"><div class="tabs" role="group" aria-label="Sections">@@TABS@@</div>
<div class="tools"><input id="q" type="search" placeholder="SEARCH" aria-label="Search" autocomplete="off" spellcheck="false"><button type="button" id="view">VIEW: INDEX</button></div></div>
<main>
<div class="grid" id="grid">
@@CARDS@@
</div>
<div class="index" id="index" hidden>
@@ROWS@@
</div>
<p class="none" id="none" hidden>Nothing in the collection matches.</p>
</main>
<footer><span>JEREMIAS — THINGS I’VE MADE</span><span>MADE WITH CLAUDE</span></footer>
<script>
(function(){
var f='',q='',view='grid',tabs=[].slice.call(document.querySelectorAll('.tabs button')),
    looks=[].slice.call(document.querySelectorAll('.look')),rows=[].slice.call(document.querySelectorAll('.row')),
    grids=[].slice.call(document.querySelectorAll('.grid')),index=document.getElementById('index'),vb=document.getElementById('view'),
    seps=[].slice.call(document.querySelectorAll('[data-sep]')),none=document.getElementById('none'),count=document.getElementById('count'),input=document.getElementById('q');
try{if(localStorage.getItem('dir-view')==='index')view='index'}catch(e){}
function ok(el){return (!f||el.dataset.s===f)&&(!q||el.dataset.q.indexOf(q)>=0)}
function draw(){var n=0;
 looks.forEach(function(el){var s=ok(el);el.hidden=!s;if(s)n++;el.classList.toggle('hero',s&&!f&&!q&&el.dataset.pin==='1')});
 rows.forEach(function(el){el.hidden=!ok(el)});
 seps.forEach(function(el){el.hidden=!!(f||q)||(el.dataset.sep==='g'&&view!=='grid')});
 grids.forEach(function(g){g.hidden=view!=='grid'});index.hidden=view!=='index';none.hidden=n>0;
 vb.textContent=view==='grid'?'VIEW: INDEX':'VIEW: GRID';count.textContent=n+(n===1?' LOOK':' LOOKS')}
tabs.forEach(function(b){b.addEventListener('click',function(){f=b.dataset.f;tabs.forEach(function(t){t.setAttribute('aria-pressed',String(t===b))});draw()})});
input.addEventListener('input',function(){q=input.value.trim().toLowerCase();draw()});
vb.addEventListener('click',function(){view=view==='grid'?'index':'grid';try{localStorage.setItem('dir-view',view)}catch(e){}draw()});
document.addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement!==input){e.preventDefault();input.focus()}if(e.key==='Escape'&&document.activeElement===input){input.value='';q='';draw()}});
draw();
})();
</script>
</body></html>
'''

if __name__ == "__main__":
    main()
