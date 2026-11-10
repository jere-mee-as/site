"""Builds the Lab for jere.ing into _site/lab/.

Called by tools/package_site.py. Everything here is generated from files in the repo:

  _site/lab/demo/launcher.html      JRL Launcher v4.0 preview (mock phone bridge)
  _site/lab/demo/switchboard.html   Switchboard v0.2 (example data)
  _site/lab/demo/veta.html          Veta, loaded with the made-up vault

The apps live in their own repos (jere-mee-as/jrl-launcher, /switchboard, /veta); their demos come from the
snapshots in lab/apps/ (see lab/apps/README.md).
  _site/lab/worlds/...              The site directions: FFXIII, Mirror's Edge, Uplink, Marathon
  _site/lab/archive/...             Older versions, each its own page
  _site/lab/docs/...                Concept docs

Nothing in here talks to the network.
"""
import json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _copy(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / src, dst)


def veta_demo(out):
    """Veta (snapshot of the assembled page from jere-mee-as/veta), preloaded with the sample vault (kept in the browser)."""
    page = (ROOT / "lab" / "apps" / "veta" / "Veta.html").read_text(encoding="utf-8")
    vault = ROOT / "lab" / "apps" / "veta" / "demo-vault"
    files = [{"path": p.relative_to(vault).as_posix(), "text": p.read_text(encoding="utf-8")}
             for p in sorted(vault.rglob("*.md"))]
    # Dates in the sample vault are relative ({D0} = today, {D3} = three days ago, {D+12} = in 12 days),
    # so the demo always opens on a fresh Today page with a week of history behind it.
    boot = """<script>
(function(){
  var F=%s;
  function ymd(n){var d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function fill(s){return s.replace(/\\{D(\\+?)(\\d+)\\}/g,function(_,plus,n){return ymd(plus?+n:-n)})}
  window.JP_TEST_NAME='Sample vault';
  window.JP_TEST_FILES=F.map(function(f){return{path:fill(f.path),text:fill(f.text),mtime:1}});
})();
</script>
""" % json.dumps(files, ensure_ascii=False)
    page = page.replace("<title>Veta</title>", "<title>Veta · demo</title>", 1)
    page = page.replace("</head>", boot + "</head>", 1)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding="utf-8")
    return len(files)


# The Mirror's Edge runner site (lab/mirrors-edge/runner.html and its style book) stays in the repo only; it is never published.
WORLDS = {
    # published path under lab/worlds/      : source in the repo
    "ffxiii/index.html": "lab/ffxiii/preview.html",
    "ffxiii/audit.html": "lab/ffxiii/audit.html",
    "mirrors-edge/vesta9.html": "lab/mirrors-edge/vesta9.html",
    "mirrors-edge/field-guide.html": "lab/mirrors-edge/city-web-field-guide.html",
    "uplink/stylebook.html": "lab/uplink/stylebook.html",
    "marathon/type.html": "lab/marathon/type-specimen.html",
    "marathon/color.html": "lab/marathon/color-map.html",
}

DEMOS = {
    "launcher.html": "lab/apps/launcher/v4.0.html",
    "switchboard.html": "lab/apps/switchboard.html",
}

# The Archive shelf: every older version as its own page (opened in a new tab, never downloaded).
ARCHIVE = {f"terminal/{v}.html": f"archive/2026-11-marathon-v3-previews/v{k}.html" for v, k in
           [("v3.0", "3"), ("v3.1", "3.1"), ("v3.2", "3.2"), ("v3.3", "3.3"), ("v3.4", "3.4"), ("v3.5", "3.5")]}
ARCHIVE.update({f"launcher/{n}.html": f"lab/apps/launcher/{s}.html" for n, s in
                [("v0", "v0-first-mockup"), ("v2.0", "v2.0"), ("v2.1", "v2.1"), ("v2.2", "v2.2"), ("v3.0", "v3.0")]})
ARCHIVE.update({"crystarium/v2.html": "lab/ffxiii/preview-v2.html", "vesta9/v1.html": "lab/mirrors-edge/vesta9-v1.html",
                "scope/simple.html": "archive/scope/scope-simple.html", "scope/marathon.html": "archive/scope/scope-marathon.html"})

DOCS = {}


def build(site):
    lab = site / "lab"
    if lab.exists():
        shutil.rmtree(lab)
    n = veta_demo(lab / "demo" / "veta.html")
    for dst, src in DEMOS.items():
        if (ROOT / src).exists():
            _copy(src, lab / "demo" / dst)
    for dst, src in WORLDS.items():
        _copy(src, lab / "worlds" / dst)
    for dst, src in ARCHIVE.items():
        _copy(src, lab / "archive" / dst)
    for dst, src in DOCS.items():
        _copy(src, lab / "docs" / dst)
    print(f"lab: veta demo ({n} sample objects), {len(DEMOS)} demos, {len(WORLDS)} world pages, {len(ARCHIVE)} archive pages, {len(DOCS)} docs")


if __name__ == "__main__":
    build(ROOT / "_site")
