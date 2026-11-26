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
BADGE = {"read": "READ", "generator": "GENERATOR", "look": "LOOK", "android": "ANDROID"}

# Fonts the drawn thumbnails use. Loaded with Google Fonts' text= option, so only
# the letters the drawings need are downloaded.
SKIN_FONTS = ("family=Anton&family=Oswald:wght@500;600&family=Libre+Caslon+Text:ital@0;1"
              "&family=Archivo+Black&family=Archivo:wght@400;700&family=PT+Serif:wght@700"
              "&family=Fraunces:ital,opsz,wght@0,9..144,800;1,9..144,900&family=IM+Fell+English"
              "&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400"
              "&family=Cabin+Sketch:wght@700&family=Kalam:wght@400;700")

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


def t_app(it):
    apps = "".join(f"<span>{a}</span>" for a in ["Brave", "Claude", "Discord", "Gmail", "Maps", "YouTube", "Camera", "Phone"])
    return ('<div style="position:absolute;inset:0;background:#e6e1d7;display:flex;justify-content:center;align-items:center">'
            '<span style="width:46cqw;height:94cqw;border-radius:6cqw;border:1cqw solid #1c1c1c;background:#fbf9f4;color:#1c1c1c;font-family:Georgia,serif;padding:5cqw 4.5cqw;box-sizing:border-box;display:flex;flex-direction:column;gap:2cqw;font-size:4cqw">'
            f'<span style="font-size:9cqw;margin-bottom:2cqw">12:04</span>{apps}</span></div>')


THUMBS = {"fight": t_fight, "label": t_label, "tabloid": t_tabloid, "riso": t_riso, "dict": t_dict, "arxiv": t_arxiv,
          "chalk": t_chalk, "gen": t_gen, "worlds": t_worlds, "lookbook": t_lookbook, "app": t_app}


def thumb(it):
    if it.get("img"):
        return f'<img src="{e(it["img"])}" alt="" loading="lazy" decoding="async">'
    return THUMBS[it["thumb"]](it)


def main():
    d = json.loads(DATA.read_text(encoding="utf-8"))
    items = sorted(d["items"], key=lambda i: (not i["live"], [-ord(c) for c in i["made"]]))
    links = SITE["links"]
    top = "".join(f'<a href="{e("mailto:" + l["email"] if l.get("email") else l["href"])}">{e(l["label"].upper())}</a>' for l in links)
    cards, rows, drawn = [], [], []
    for n, it in enumerate(items, 1):
        no = f"{n:02d}"
        badge = BADGE[it["kind"]] if it["live"] else "SOON"
        tag = "a" if it["live"] and it["url"] else "div"
        href = f' href="{e(it["url"])}"' if tag == "a" else ' aria-disabled="true"'
        th = thumb(it)
        drawn.append(th)
        data = f'data-s="{e(it["section"].lower())}" data-q="{e((it["name"] + " " + it["line"] + " " + it["section"] + " " + badge).lower())}"'
        cards.append(f'<{tag} class="look{" hero" if n == 1 else ""}{"" if it["live"] else " soon"}"{href} {data}>'
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
nav{height:44px;display:flex;justify-content:space-between;align-items:center;padding:0 var(--pad)}
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
    grid=document.getElementById('grid'),index=document.getElementById('index'),vb=document.getElementById('view'),
    none=document.getElementById('none'),count=document.getElementById('count'),input=document.getElementById('q');
try{if(localStorage.getItem('dir-view')==='index')view='index'}catch(e){}
function ok(el){return (!f||el.dataset.s===f)&&(!q||el.dataset.q.indexOf(q)>=0)}
function draw(){var n=0,first=true;
 looks.forEach(function(el){var s=ok(el);el.hidden=!s;if(s)n++;el.classList.toggle('hero',s&&first&&!f&&!q);if(s)first=false});
 rows.forEach(function(el){el.hidden=!ok(el)});
 grid.hidden=view!=='grid';index.hidden=view!=='index';none.hidden=n>0;
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
