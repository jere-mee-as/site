#!/usr/bin/env python3
"""Inline the launcher sources into one HTML file.
usage: python3 assemble.py OUT.html   (run from anywhere; sources are read next to this script)"""
import pathlib, sys
here = pathlib.Path(__file__).resolve().parent
html = (here / 'shell.html').read_text()
parts = {'/*@CSS@*/': 'launcher.css', '/*@CORE@*/': 'core.js', '/*@BRIDGE@*/': 'bridge.js', '/*@PAL@*/': 'pal.js', '/*@APP@*/': 'app.js', '/*@TERM@*/': 'term.js'}
for k, f in parts.items():
    assert k in html, k
    html = html.replace(k, (here / f).read_text())
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else here.parent / 'previews' / 'out.html')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html)
print(out, len(html), 'bytes')
