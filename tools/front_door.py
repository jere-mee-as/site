"""Renders the front door (jere.ing/) from template.html and site.json.

Called by build.py. Standard library only, because Cloudflare's build has nothing else.

The Nov 25, 2026 layout ("Maison"): one open list, no tabs or accordions. site.json holds every word:
intro (name, pronounced, facts, headline with *italics*), links, featured (the new-essay row), work, writing,
writing_more, made, elsewhere and resume (the slide-in panel at #resume). The old sky front door is
archived at archive/2026-11-sky/.
"""
import html, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
esc = lambda s: html.escape(str(s), quote=True)

# Links into the old front page (Uplink at /) that people may still have. The browser keeps the
# part after # to itself, so the redirect happens in the page (see the first <script> in template.html).
UPLINK_ROOMS = ["comms", "salvage", "cipher", "paint", "scan", "noise"]
OLD_LAB = {
    "launcher": "/lab/demo/launcher.html",
    "veta": "/lab/demo/veta.html",
    "scope": "/reports/scope.html",
    "uplink": "/uplink/",
    "crystarium": "/crystarium/",
    "vesta": "/vesta9/",
    "terminal": "/reports/_archive/2026-11-terminal-of-the-future/",
    "a-ink": "/reports/_archive/2026-10-paper-and-ink/",
    "a-real": "/reports/_archive/2026-11-graphic-realism/",
    "a-term": "/reports/_archive/2026-11-terminal-of-the-future/",
    "a-launch": "/lab/archive/launcher/v3.0.html",
    "a-crys": "/lab/archive/crystarium/v2.html",
    "a-vesta": "/lab/archive/vesta9/v1.html",
    "a-scope": "/lab/archive/scope/marathon.html",
}


def redirects(reports_oldest_first):
    """#report-NN (numbered oldest first, as the old pages did), #lab/<id>, and Uplink's rooms.
    #lab and #vault stay here: they open the Projects row."""
    r = {f"report-{n}": "/reports/" + f for n, f in enumerate(reports_oldest_first, 1)}
    r.update({"lab/" + Path(f).stem: "/reports/" + f for f in reports_oldest_first})
    r.update({"lab/" + k: v for k, v in OLD_LAB.items()})
    r.update({room: "/uplink/#" + room for room in UPLINK_ROOMS})
    r["shell"] = "/uplink/"
    return r


def links(ls):
    out = []
    for l in ls:
        href = "mailto:" + l["email"] if l.get("email") else l["href"]
        out.append(f'      <a href="{esc(href)}">{esc(l["label"])}</a>')
    return "\n".join(out)


def headline(text):
    """*word* becomes italic."""
    parts = esc(text).split("*")
    return "".join(f"<i>{p}</i>" if i % 2 else p for i, p in enumerate(parts))


def featured(f):
    if not f:
        return ""
    c = esc(f["cover"])
    return (f'      <a class="new" href="{esc(f["url"])}">\n'
            f'        <picture class="cover">\n'
            f'          <source type="image/webp" srcset="{c}-152.webp 152w, {c}-304.webp 304w" sizes="120px">\n'
            f'          <img class="bw" src="{c}-304.jpg" alt="" width="120" height="96">\n'
            f'        </picture>\n'
            f'        <span>\n'
            f'          <span class="label mute">New essay · {esc(f["date_label"])}</span>\n'
            f'          <span class="t">{esc(f["title"])}</span>\n'
            f'          <span class="mute sub">{esc(f["subtitle"])} · on Substack ↗</span>\n'
            f'        </span>\n'
            f'      </a>')


def work(rows):
    out = []
    for r in rows:
        # "Full time" / "Part time" also show inline under the role where the type column is hidden
        kk = f'<span class="kk"> · {esc(r["type"])}</span>' if "time" in r.get("type", "").lower() else ""
        out.append(f'        <div class="row"><span><b>{esc(r["org"])}</b><span class="s mute">{esc(r["role"])}{kk}</span></span>'
                   f'<span class="k label mute">{esc(r.get("type", ""))}</span><span class="d mute">{esc(r["dates"])}</span></div>')
    return "\n".join(out)


def writing(items, more):
    out = [f'        <a class="w" href="{esc(w["href"])}"><span class="t">{esc(w["title"])}</span><span class="d mute">{esc(w["time"])}</span></a>' for w in items]
    if more:
        out.append(f'        <a class="more mute u" href="{esc(more["href"])}">{esc(more["label"])}</a>')
    return "\n".join(out)


def resume(r):
    o = [f'<div class="rs-top label"><span class="mute">Résumé · {esc(r["updated"])}</span><span class="rs-act">'
         f'<a class="u" href="{esc(r["pdf"])}" target="_blank" rel="noopener">View PDF ↗</a>'
         f'<button type="button" class="rs-x" data-close aria-label="Close résumé">Close</button></span></div>',
         f'<header class="rs-head"><h2 id="rs-name">{esc(r["name"])}</h2><p class="mute">{esc(r["headline"])} · {esc(r["location"])} · '
         f'<a class="u" href="mailto:{esc(r["email"])}">{esc(r["email"])}</a></p></header>',
         f'<p class="rs-sum">{esc(r["summary"])}</p>']
    for s in r["sections"]:
        o.append(f'<section class="rs-sec"><div class="h label">{esc(s["title"])}</div>')
        for j in s.get("jobs", []):
            o.append(f'<div class="rs-job"><p class="rs-org"><b>{esc(j["org"])}</b><span class="mute">{esc(j["where"])}</span></p>')
            for ro in j["roles"]:
                o.append(f'<p class="rs-role"><span>{esc(ro["title"])}</span><span class="mute">{esc(ro["dates"])}</span></p>')
                if ro.get("bullets"):
                    o.append("<ul>" + "".join(f"<li>{esc(b)}</li>" for b in ro["bullets"]) + "</ul>")
                if ro.get("note"):
                    o.append(f'<p class="rs-note mute">{esc(ro["note"])}</p>')
            o.append("</div>")
        if s.get("skills"):
            o.append('<dl class="rs-skills">' + "".join(f'<div><dt class="label mute">{esc(a)}</dt><dd>{esc(b)}</dd></div>' for a, b in s["skills"]) + "</dl>")
        if s.get("bullets"):
            o.append('<ul class="rs-plain">' + "".join(f"<li>{esc(b)}</li>" for b in s["bullets"]) + "</ul>")
        o.append("</section>")
    return ('<div class="rs-wrap" id="resume" role="dialog" aria-modal="true" aria-labelledby="rs-name" hidden>\n'
            '  <div class="rs-veil" data-close></div>\n'
            '  <article class="rs-panel" tabindex="-1">\n      ' + "\n      ".join(o) + "\n  </article>\n</div>")


def render(reports_oldest_first):
    data = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
    page = (ROOT / "template.html").read_text(encoding="utf-8")
    s, intro, made = data["site"], data["intro"], data["made"]
    fill = {
        "title": esc(s["title"]),
        "url": esc(s["url"].rstrip("/")),
        "description": esc(s["description"]),
        "name": esc(intro["name"]),
        "pronounced": esc(intro["pronounced"]),
        "facts": "<br>".join(esc(x) for x in intro["facts"]),
        "headline": headline(intro["headline"]),
        "portrait_alt": esc(s["portrait_alt"]),
        "links": links(data["links"]),
        "featured": featured(data.get("featured")),
        "work": work(data["work"]),
        "writing": writing(data["writing"], data.get("writing_more")),
        "made_title": esc(made["title"]), "made_label": esc(made["label"]), "made_href": esc(made["href"]),
        "elsewhere": "\n".join(f'            <a class="u" href="{esc(x["href"])}">{esc(x["label"])}</a>' for x in data["elsewhere"]),
        "resume": resume(data["resume"]),
    }
    for key, val in fill.items():
        page = page.replace("{{" + key + "}}", val)
    if "{{" in page:
        raise SystemExit("template.html: unfilled " + page[page.index("{{"):page.index("{{") + 30])
    page = page.replace("/*REDIRECTS*/{}", json.dumps(redirects(reports_oldest_first), separators=(",", ":")), 1)
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    print(f"Built index.html (front door): {len(data['work'])} work rows, {len(data['writing'])} essays")
