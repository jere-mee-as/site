"""Renders the front door (jere.ing/) from template.html and site.json.

Called by build.py. Standard library only, because Cloudflare's build has nothing else.

site.json holds every word on the page. An item is one entry:
  {"title": ..., "sub": ..., "detail": ..., "href": ..., "dot": "<css>"}
  - with "href" it is a link (↗), without it plain text;
  - "resume": true makes it the button that opens the résumé sheet (#resume).
A row has optional loose "items" first, then "groups" (title, note, items).
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
    "switchboard": "/lab/demo/switchboard.html",
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


CHEVRON = ('<span class="ch"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5" '
           'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>')


def item(it):
    dot = f'<span class="dot" style="{esc(it["dot"])}"></span>' if it.get("dot") else ""
    inner = (f'<span><span class="n">{dot}{esc(it["title"])}</span>'
             + (f'<span class="s">{esc(it["sub"])}</span>' if it.get("sub") else "")
             + (f'<span class="s2">{esc(it["detail"])}</span>' if it.get("detail") else "")
             + "</span>")
    if it.get("resume"):
        return f'<a class="it rbtn" href="#resume" data-open-resume>{inner}<span class="ar">→</span></a>'
    if it.get("href"):
        return f'<a class="it" href="{esc(it["href"])}">{inner}<span class="ar">↗</span></a>'
    return f'<div class="it plain">{inner}<span></span></div>'


def row(r, i):
    pad = " " * 10
    lines = [pad + item(it) for it in r.get("items", [])]
    for g in r.get("groups", []):
        note = f' <span class="note">{esc(g["note"])}</span>' if g.get("note") else ""
        lines.append(f'{pad}<p class="grp">{esc(g["title"])}{note}</p>')
        lines += [pad + item(it) for it in g["items"]]
    rid = r["id"]
    # Rows ship open (aria-expanded="true") so the page reads fully without JavaScript; the script closes them.
    return (f'      <section class="m fast" style="--d:{delay(i)}">\n'
            f'        <button class="q" id="b-{rid}" aria-expanded="true" aria-controls="p-{rid}">{CHEVRON}{esc(r["label"])}</button>\n'
            f'        <div class="dd" id="p-{rid}" role="region" aria-labelledby="b-{rid}"><div><div class="ddc">\n'
            + "\n".join(lines) +
            '\n        </div></div></div>\n      </section>')


def delay(i):
    """The rows mist in .15 s apart, starting at 2.15 s (as in the approved design)."""
    return f"{2.15 + 0.15 * i:.2f}".rstrip("0") + "s"


def links(ls):
    out = []
    for l in ls:
        if l.get("email"):
            # Without JavaScript it is a mailto link; with it, tapping shows the address and copies it.
            out.append(f'<a href="mailto:{esc(l["email"])}" id="copy" data-addr="{esc(l["email"])}">{esc(l["label"])}</a>')
        else:
            out.append(f'<a href="{esc(l["href"])}">{esc(l["label"])}</a>')
    return "".join(out)


def resume(r):
    k = []   # each .rs block fades in on its own
    top = (f'<div class="sheet-top rs"><a href="#" class="back" data-close-resume>← Back</a>'
           f'<span class="st-r"><span>Résumé · {esc(r["updated"])}</span>'
           f'<a class="dl" href="{esc(r["pdf"])}" download="jeremias-resume.pdf">Download PDF</a></span></div>')
    k.append(top)
    k.append(f'<header class="rs">\n      <h2 id="r-name">{esc(r["name"])}</h2>\n'
             f'      <p class="rmeta">{esc(r["headline"])} · {esc(r["location"])} · <span class="sel">{esc(r["email"])}</span></p>\n    </header>')
    k.append(f'<p class="summary rs">{esc(r["summary"])}</p>\n')
    for s in r["sections"]:
        k.append(f'<p class="sec rs">{esc(s["title"])}</p>')
        for j in s.get("jobs", []):
            body = f'<p class="org">{esc(j["org"])}<span>{esc(j["where"])}</span></p>'
            for role in j["roles"]:
                body += f'<p class="role">{esc(role["title"])}<span>{esc(role["dates"])}</span></p>'
                if role.get("bullets"):
                    body += "<ul>" + "".join(f"<li>{esc(b)}</li>" for b in role["bullets"]) + "</ul>"
                if role.get("note"):
                    body += f'<p class="note2">{esc(role["note"])}</p>'
            k.append(f'<div class="job rs">{body}</div>')
        if s.get("skills"):
            k.append('<dl class="skills rs">\n' + "\n".join(
                f"      <div><dt>{esc(a)}</dt><dd>{esc(b)}</dd></div>" for a, b in s["skills"]) + "\n    </dl>")
        if s.get("bullets"):
            k.append('<div class="job rs"><ul>' + "".join(f"<li>{esc(b)}</li>" for b in s["bullets"]) + "</ul></div>")
        k[-1] += "\n"
    k.append(f'<p class="sheet-end rs">{esc(r["end"])} <a href="#" class="back" data-close-resume>Back to the page</a></p>')
    return ('<div class="sheetwrap" id="resume" role="dialog" aria-modal="true" aria-labelledby="r-name">\n'
            '  <div class="veil" data-close-resume></div>\n'
            '  <article class="sheet">\n' + "\n".join("    " + x for x in k) + "\n  </article>\n</div>")


def render(reports_oldest_first):
    data = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
    page = (ROOT / "template.html").read_text(encoding="utf-8")
    s, intro = data["site"], data["intro"]
    rows = data["rows"]
    fill = {
        "title": esc(s["title"]),
        "url": esc(s["url"].rstrip("/")),
        "description": esc(s["description"]),
        "og_title": esc(intro["hello"]),
        "og_description": esc(" ".join(intro["role"])),
        "portrait_alt": esc(s["portrait_alt"]),
        "hello": esc(intro["hello"]),
        "pronounced": esc(intro["pronounced"]),
        "born": esc(intro["born"]),
        "role": "<br>".join(esc(x) for x in intro["role"]),
        "links": links(data["links"]),
        "rows": "\n".join(row(r, i) for i, r in enumerate(rows)),
        "resume": resume(data["resume"]),
        "footer_delay": f"{2.15 + 0.15 * (len(rows) - 1) + 0.25:.2f}".rstrip("0") + "s",
        "greeting": esc(data["footer"]["greeting"]),
        "footer_links": "".join(f'<a href="{esc(l["href"])}">{esc(l["label"])}</a>' for l in data["footer"]["links"]),
    }
    for key, val in fill.items():
        page = page.replace("{{" + key + "}}", val)
    left = [p for p in ("{{",) if p in page]
    if left:
        raise SystemExit("template.html: unfilled " + page[page.index("{{"):page.index("{{") + 30])
    page = page.replace("/*REDIRECTS*/{}", json.dumps(redirects(reports_oldest_first), separators=(",", ":")), 1)
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    n = sum(len(r.get("items", [])) + sum(len(g["items"]) for g in r.get("groups", [])) for r in rows)
    print(f"Built index.html (front door): {len(rows)} rows, {n} entries")
