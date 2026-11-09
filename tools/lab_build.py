"""Builds the Lab for jere.ing into _site/lab/.

Called by tools/package_site.py. Everything here is generated from files in the repo:

  _site/lab/demo/launcher.html      JRL Launcher v4.0 preview (mock phone bridge)
  _site/lab/demo/switchboard.html   Switchboard v0.2 (example data)
  _site/lab/demo/veta.html          Veta, loaded with the made-up vault in veta/demo-vault/
  _site/lab/demo/kept.html          Kept, an interactive mock with made-up files (kept/demo/)
  _site/lab/worlds/...              The site directions: FFXIII, Mirror's Edge, Uplink, Marathon
  _site/lab/archive/*.zip           Older versions, as downloads

Nothing in here talks to the network.
"""
import json, re, shutil, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _copy(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / src, dst)


def veta_demo(out):
    """Assemble Veta from veta/src and preload it with the sample vault (kept in the browser)."""
    subprocess.run([sys.executable, "assemble.py"], cwd=ROOT / "veta", check=True, capture_output=True)
    page = (ROOT / "veta" / "dist" / "Veta.html").read_text(encoding="utf-8")
    vault = ROOT / "veta" / "demo-vault"
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


WORLDS = {
    # published path under lab/worlds/      : source in the repo
    "ffxiii/index.html": "lab/ffxiii/preview.html",
    "ffxiii/audit.html": "lab/ffxiii/audit.html",
    "mirrors-edge/runner.html": "lab/mirrors-edge/runner.html",
    "mirrors-edge/vesta9.html": "lab/mirrors-edge/vesta9.html",
    "mirrors-edge/field-guide.html": "lab/mirrors-edge/city-web-field-guide.html",
    "mirrors-edge/stylebook.html": "lab/mirrors-edge/runner-stylebook.html",
    "uplink/stylebook.html": "lab/uplink/stylebook.html",
    "marathon/type.html": "lab/marathon/type-specimen.html",
    "marathon/color.html": "lab/marathon/color-map.html",
}

DEMOS = {
    "launcher.html": "launcher/previews/v4.0.html",
    "switchboard.html": "switchboard/index.html",
    "kept.html": "kept/demo/index.html",
}

# Downloads on the Archive shelf: zip name -> list of (path in zip, source in repo)
ARCHIVE = {
    "site-2026-10-paper-and-ink.zip": [("index.html", "archive/2026-10-paper-and-ink/template.html")],
    "site-2026-11-graphic-realism.zip": [("index.html", "archive/2026-11-graphic-realism/template.html")],
    "site-2026-11-terminal-of-the-future.zip": [("index.html", "archive/2026-11-terminal-of-the-future/template.html")]
        + [(f"previews/v3{v}.html", f"archive/2026-11-marathon-v3-previews/v3{v}.html") for v in ["", ".1", ".2", ".3", ".4", ".5", ".6"]],
    "launcher-previews-v0-v3.zip": [(f"{n}.html", f"launcher/previews/{n}.html") for n in ["v0-first-mockup", "v2.0", "v2.1", "v2.2", "v3.0"]],
    "ffxiii-v2.zip": [("preview-v2.html", "lab/ffxiii/preview-v2.html"), ("template-v2.html", "lab/ffxiii/template-v2.html")],
    "vesta9-v1.zip": [("vesta9-v1.html", "lab/mirrors-edge/vesta9-v1.html")],
    "scope-earlier.zip": [("scope-simple.html", "archive/scope/scope-simple.html"), ("scope-marathon.html", "archive/scope/scope-marathon.html")],
    "kept-concept-docs.zip": [(p.relative_to(ROOT / "kept/docs").as_posix(), p.relative_to(ROOT).as_posix())
                              for p in sorted((ROOT / "kept/docs").rglob("*.html"))],
}


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
    sizes = {}
    for name, items in ARCHIVE.items():
        items = [(a, s) for a, s in items if (ROOT / s).exists()]
        if not items:
            continue
        z = lab / "archive" / name
        z.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as f:
            for arc, src in items:
                f.write(ROOT / src, name[:-4] + "/" + arc)
        sizes[name] = z.stat().st_size
    (lab / "archive" / "sizes.json").write_text(json.dumps(sizes), encoding="utf-8")
    print(f"lab: veta demo ({n} sample objects), {len(DEMOS)} demos, {len(WORLDS)} world pages, {len(sizes)} archive zips")


if __name__ == "__main__":
    build(ROOT / "_site")
