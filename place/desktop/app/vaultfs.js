// Jere's Place — vault file layer for the desktop app (plain Node, no Electron imports, so it can be tested anywhere).
// Every path the page sends is vault-relative with forward slashes; anything that resolves outside the vault is refused.
'use strict';
const fs = require('fs/promises');
const path = require('path');
const { pathToFileURL } = require('url');

const SKIP_DIRS = new Set(['Media', 'node_modules']);
const stripBom = t => (t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
const ms = st => Math.round(st.mtimeMs);

function make(root) {
  root = path.resolve(root);
  const abs = p => {
    const parts = String(p).split('/').filter(Boolean);
    const a = path.resolve(root, ...parts);
    const rel = path.relative(root, a);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Path outside the vault: ' + p);
    return a;
  };
  return {
    root,
    name: path.basename(root),
    abs,
    async list() {
      const out = [];
      async function walk(dir, pre) {
        let ents;
        try { ents = await fs.readdir(dir, { withFileTypes: true }); } catch (e) { return; }
        for (const e of ents) {
          const n = e.name;
          if (n[0] === '.' || n[0] === '_') continue;
          const full = path.join(dir, n);
          if (e.isDirectory()) { if (!SKIP_DIRS.has(n)) await walk(full, pre + n + '/'); }
          else if (e.isFile() && /\.md$/i.test(n)) {
            try {
              const [t, st] = await Promise.all([fs.readFile(full, 'utf8'), fs.stat(full)]);
              out.push({ path: pre + n, text: stripBom(t), mtime: ms(st) });
            } catch (err) { /* unreadable file: skip, never crash the load */ }
          }
        }
      }
      await walk(root, '');
      return out;
    },
    async stat(p) {
      try { return { mtime: ms(await fs.stat(abs(p))) }; } catch (e) { return null; }
    },
    async read(p) {
      const a = abs(p);
      const [t, st] = await Promise.all([fs.readFile(a, 'utf8'), fs.stat(a)]);
      return { text: stripBom(t), mtime: ms(st) };
    },
    // write to a temp file beside the target, then rename over it: a crash or sync mid-write never leaves half a note
    async write(p, text) {
      const a = abs(p);
      await fs.mkdir(path.dirname(a), { recursive: true });
      const tmp = a + '.jp-tmp';
      await fs.writeFile(tmp, String(text), 'utf8');
      try { await fs.rename(tmp, a); }
      catch (e) { await fs.writeFile(a, String(text), 'utf8'); await fs.unlink(tmp).catch(() => {}); }
      return ms(await fs.stat(a));
    },
    async remove(p) { await fs.unlink(abs(p)); },
    fileUrl(p) { return pathToFileURL(abs(p)).href; },
  };
}

module.exports = { make };
