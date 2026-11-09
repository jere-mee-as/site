  // Terminals. tty1 (jere) slides up from the prompt and runs the launcher. `root` sweeps the unit with the
  // invert band and drops into tty0, fullscreen, where the site's toys live. One command table drives both.
  (function () {
    'use strict';
    const R = document.documentElement, $ = s => document.querySelector(s), JRL = window.JRL, S = window.JRLsfx, HAP = window.JRLhap, P = window.JRLpal, C = window.JRLcolony, B = window.JRLbridge, store = window.JRLstore, reduce = window.JRLreduce;
    const pad = (n, w) => String(n).padStart(w || 2, '0'), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)], log = (m, h) => window.JRLlog && JRLlog(m, h);
    const decode = window.JRLdecode;
    const U = { el: $('#cli'), out: $('#out'), inp: $('#cmd'), form: $('#cli-form'), root: false, hist: [], hi: 0, busy: false, q: [], skip: false };
    const RT = { el: $('#term'), out: $('#tout'), inp: $('#tin'), form: $('#tform'), root: true, hist: [], hi: 0, busy: false, q: [], skip: false };
    let term = U, running = false;
    const sleep = ms => new Promise(r => setTimeout(r, reduce || term.skip ? 0 : ms));
    const tick = ms => new Promise(r => setTimeout(r, ms));
    function tline(html, cls) { const d = document.createElement('div'); d.className = 'tl ' + (cls || ''); d.innerHTML = html; term.out.appendChild(d); while (term.out.children.length > 400) term.out.firstChild.remove(); term.out.scrollTop = term.out.scrollHeight; return d; }
    function tdec(d, text, o) { o = Object.assign({ frames: 9, speed: 46 }, o || {}); decode(d, String(text), o); }
    function ttxt(text, cls, o) { const d = tline('', cls); if (term.dec1) { d.textContent = String(text); return d; } term.dec1 = true; tdec(d, text, Object.assign({ frames: 7, speed: 30 }, o || {}, { frames: 7, speed: 30 })); return d; }
    function terr(text) { S.err(); if (!term.root) window.JRLerrband(String(text).split(':')[0].replace(/\s+/g, '_').toUpperCase().slice(0, 18)); else HAP('err'); return tline('<span class="tr">[FAIL] ' + esc(text) + '</span>'); }
    function tok(text) { return tline('<span class="tw">[ ok ]</span> ' + esc(text)); }
    async function art(lines, cls) { for (let i = 0; i < lines.length; i++) { const d = tline('', 'tart ' + (cls || '')); d.textContent = lines[i]; await sleep(33); } }
    function typeInto(el, s, ms) { return new Promise(res => { let i = 0; (function k() { if (i >= s.length) { res(); return; } el.textContent += s[i++]; S.key(); setTimeout(k, reduce || term.skip ? 0 : ms * (.5 + Math.random())); })(); }); }
    function spin(el, ms) { const f = '|/-\\'; let i = 0; const base = el.textContent; return new Promise(res => { const iv = setInterval(() => { el.textContent = base + f[i++ % 4] + ' ' + '.'.repeat(i % 10); }, 80); setTimeout(() => { clearInterval(iv); res(); }, reduce || term.skip ? 0 : ms); }); }
    function pbar(el, ms, label) { const t0 = performance.now(), W = Math.min(24, cols() - 18); return new Promise(res => { if (reduce) { el.textContent = '[100%] ' + '█'.repeat(W) + ' ' + (label || ''); res(); return; }
      const iv = setInterval(() => { const p = Math.min(1, (performance.now() - t0) / ms), n = Math.round(p * W); el.textContent = '[' + String(Math.round(p * 100)).padStart(3, ' ') + '%] ' + '█'.repeat(n) + '░'.repeat(W - n) + ' ' + (label || ''); if (p >= 1) { clearInterval(iv); res(); } }, 45); }); }
    function flick() { if (reduce) return; const el = RT.el; el.classList.remove('flick'); void el.offsetWidth; el.classList.add('flick'); }
    function hexrow() { let a = '0x' + rnd(0xffffff).toString(16).padStart(6, '0') + ' '; for (let i = 0; i < Math.max(4, Math.floor((cols() - 10) / 3)); i++) a += ' ' + rnd(256).toString(16).padStart(2, '0'); return a; }
    function cols() { return Math.max(24, Math.min(120, Math.floor((term.out.clientWidth - 8) / 7.3))); }
    const now = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); };
    const etHour = () => window.JRLet.hour();
    function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }
    function seeded(s) { let h = parseInt(hash(s), 16) || 1; return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e6) / 1e6; }; }
    function pre(a, b) { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; }
    function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; let p = []; for (let j = 0; j <= b.length; j++) p[j] = j; for (let i = 1; i <= a.length; i++) { const q = [i]; for (let j = 1; j <= b.length; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; } return p[b.length]; }
    function near(k, keys) { let best = null, bd = 3; keys.forEach(c => { const d = lev(k, c); if (d < bd || (d === bd && best && pre(k, c) > pre(k, best))) { bd = d; best = c; } }); return best; }
    const JERE = ['    ╻ ┏━━━╸ ┏━━━┓ ┏━━━╸', '    ┃ ┃     ┃   ┃ ┃    ', '    ┃ ┣━━╸  ┣━┳━┛ ┣━━╸ ', '╻   ┃ ┃     ┃ ┗┓  ┃    ', '┗━━━┛ ┗━━━╸ ╹  ╹  ┗━━━╸'];
    const SKULL = ['   .-------.   ', '  /  _   _  \\  ', ' |  (o) (o)  | ', ' |    /_\\    | ', '  \\  |||||  /  ', '   `-------`   '];
    const FORT = ['every program you open was already waiting for you.', 'the colony does not care which app you open. only that you came back.', 'graphic realism: limited materials, unlimited attitude.',
      'the phone is a field unit. you are the field.', 'there is no dark mode. there is only less light.', 'the newest notification is always the least important one.', 'a launcher is a door. this one has a tenant.'];

    // resolve "spotify", "spt", "17", "yt music" to a program
    function app(q) { q = String(q || '').trim(); if (!q) return null; const n = parseInt(q, 10); if (/^\d+$/.test(q)) return JRL.apps().find(a => a.n === n) || null; const r = JRL.find(q); if (r[0]) return r[0]; const ql = q.toLowerCase().replace(/\s+/g, ''); return JRL.apps().find(a => JRL.cmdName(a) === ql || a.code.toLowerCase() === ql) || null; }
    function needApp(a, verb) { const x = app(a); if (!x) { const s = a ? JRL.find(String(a).slice(0, 2))[0] : null; terr(verb + ': ' + (a || '') + ': no such program' + (s ? '. did you mean ' + JRL.cmdName(s) + '?' : '')); } return x; }
    const DECK = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, hom: 0, home: 0, console: 0, app: 1, apps: 1, manifest: 1, drawer: 1, ls: 1, agd: 2, agenda: 2, schedule: 2, cal: 2, sig: 3, signal: 3, media: 3, music: 3, com: 4, comms: 4, notifs: 4, bio: 5, colony: 5, vitals: 5 };
    function swatches(p) { return [p.sig].concat(p.c.slice(1)).map(c => '<span class="sw" style="background:' + c + '"></span>').join('') + '<span class="sw" style="background:' + p.k + ';box-shadow:inset 0 0 0 1px #3a3a40"></span><span class="sw" style="background:' + p.l + '"></span>'; }

    const TC = {
      help: function () {
        const G = [['programs', 'open X · find X · ls [X] · pin X · unpin X · hide X · unhide X · hold X · info X · uninstall X'],
          ['views', 'home · ls (manifest) · ls -a (with hidden) · go agd | sig | com | bio · back'],
          ['loadout', 'pin X [slot] · unpin X · slots'],
          ['options', 'set (every option and its value) · set KEY VALUE · set KEY (its choices)'],
          ['', 'e.g. set color utility · set palette next · set slots list · set sound on'],
          ['unit', 'np · play · pause · next · prev · cal · com · shade · battery · colony [feed|show] · time · lock · settings · search Q · update · version'],
          ['shell', 'clear · history · date · uptime · whoami · neofetch · echo · wipe · reboot · root · exit']];
        if (term.root) G.push(['readouts', 'top · ps · kill PID · scan · ping HOST · weather · decrypt'], ['toys', 'roll NdM · 8ball Q · colonysay TEXT · launch · rain · fortune · skull · banner'], ['sound', 'morse TEXT · synth'], ['games', 'snake'], ['', 'achievements · and a few that are not listed'], ['danger', 'hack TARGET · rm -rf / · chaos on|off · color lime|red|cyan|white|amber']);
        G.forEach(g => tline((g[0] ? '<span class="ti">' + g[0] + '</span> ' : '         ') + '<span class="tb">' + esc(g[1]) + '</span>'));
        if (!term.root) tline('<span class="tdim">tip: no keyboard needed to open things. slide along the lime strip. options live here: type set. root unlocks more.</span>');
      },
      clear: function () { term.out.innerHTML = ''; },
      history: function () { term.hist.forEach((h, i) => tline('<span class="tdim">' + String(i + 1).padStart(4, ' ') + '</span>  ' + esc(h))); },
      echo: function (a) { ttxt(a || ''); },
      whoami: function () { ttxt(term.root ? 'root. (you came in as jere. the colony saw.)' : 'jere. node jrl-01. tenant: the colony.', 'tb'); },
      id: function () { ttxt(term.root ? 'uid=0(root) gid=0(root) groups=0(root),42(colony),1420(carrier)' : 'uid=10142(jere) gid=10142(jere) groups=42(colony)'); },
      uname: function () { ttxt('JRL-OS 6.0.0-field-unit #1 SMP PREEMPT aarch64 GNU/jere.ing'); },
      date: function () { ttxt(window.JRLet.day() + ' ' + now() + ' America/New_York'); },
      uptime: function () { ttxt('up ' + Math.round(performance.now() / 1000) + 's,  1 user,  colony day ' + pad(C.day(), 3) + ',  load ' + [1, 2, 3].map(() => (Math.random() * 2).toFixed(2)).join(', ')); },
      pwd: function () { ttxt(term.root ? '/root' : '/home/jere'); },
      neofetch: async function () {
        const pl = P.get(), dv = B.device() || {}, b = window.JRLlife.battery();
        const info = ['<span class="tw">' + (term.root ? 'root' : 'jere') + '</span>@<span class="tw">jrl-01</span>', '-------------', '<span class="tw">OS</span>: JRL-OS 6.0.0-field-unit', '<span class="tw">Host</span>: ' + esc((dv.name || 'android') + ' ' + (dv.model || '')),
          '<span class="tw">Programs</span>: ' + JRL.apps().length, '<span class="tw">Deck</span>: ' + P.names[JRL.cur()].toLowerCase(), '<span class="tw">Palette</span>: ' + esc(pl.n.toLowerCase()) + ' // ' + P.color(), '<span class="tw">Fonts</span>: Hubot Sans · Kode Mono · JetBrains Mono · Doto',
          '<span class="tw">Power</span>: ' + (b.level != null ? Math.round(b.level * 100) + '%' : '?') + ' · life ' + R.dataset.life, '<span class="tw">Sound</span>: ' + (S.on() ? 'synth on' : 'silent') + ' · haptics ' + (HAP.on() ? 'on' : 'off'), swatches(pl)];
        const box = tline('<div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap"><div class="tart tw"></div><div class="nf"></div></div>');
        box.querySelector('.tart').textContent = JERE.join('\n');
        for (let i = 0; i < info.length; i++) { const d = document.createElement('div'); d.innerHTML = info[i]; box.querySelector('.nf').appendChild(d); term.out.scrollTop = term.out.scrollHeight; await sleep(60); }
      },
      ls: function (a) {
        if (/-\w*a/.test(a || '') && term.root) { tline('<span class="tdim">drwx------  root  .</span>'); Object.keys(DOT).forEach(k => tline('<span class="tdim">-r--------  root</span>  <span class="tw">' + k + '</span>')); }
        if (!term.root && JRL.showHidden) JRL.showHidden(/-\w*a/.test(a || ''));
        const q = (a || '').replace(/-\w+/g, '').trim(), list = q ? JRL.find(q) : JRL.apps().filter(x => JRL.layout().hidden.indexOf(x.key) < 0 || /-\w*a/.test(a || ''));
        const w = Math.max(1, Math.floor(cols() / 24)), rows = [];
        tline('<span class="tdim">total ' + list.length + (q ? ' matching "' + esc(q) + '"' : '') + '</span>');
        for (let i = 0; i < list.length; i += w) rows.push(list.slice(i, i + w).map(x => (pad(x.n, 3) + ' ' + x.code + ' ' + x.label).slice(0, 22).padEnd(24)).join(''));
        if (rows.length) tline(esc(rows.join('\n')), 'tart tb');
      },
      open: function (a) {
        a = (a || '').trim(); const fm = /^[fk]\/(.+)$/i.exec(a);
        if (fm) { const L = JRL.layout(), id = Object.keys(L.folders).find(k => L.folders[k].name.toLowerCase() === fm[1].toLowerCase()); if (!id) return terr('open: no kit ' + fm[1]); close(true); JRL.kit(id); return; }
        const x = needApp(a, 'open'); if (!x) return;
        ttxt('exec ' + x.pkg + ' // prg ' + pad(x.n, 3), 'tb', { frames: 6, speed: 30 });
        setTimeout(() => { if (term.root) exitRoot(true); else close(true); JRL.launch(x, { silent: true }); }, 220);
      },
      find: function (a) {
        if (!a) { JRL.filter(''); return ttxt('find: filter cleared', 'tdim'); }
        const r = JRL.filter(a); if (!r.length) return terr('find: nothing matches ' + a);
        if (r[0]) TC.open(String(r[0].n));
      },
      go: function (a) { const k = String(a || '').toLowerCase(), d = DECK[k]; if (d == null) return terr('go: decks are 1-6 or hom app agd sig com bio'); ttxt('→ ' + pad(d + 1) + ' ' + P.names[d].toLowerCase(), 'tb'); setTimeout(() => { if (term.root) exitRoot(true); else close(true); JRL.go(d, { silent: true }); }, 160); },
      home: function () { TC.go('1'); }, back: function () { close(true); JRL.back(); },
      index: function () { TC.set(''); },
      pin: function (a) { const m = /^(.*?)\s+(\d{1,2})$/.exec(a || ''), x = needApp(m ? m[1] : a, 'pin'); if (!x) return; const s = m ? +m[2] - 1 : null; if (s != null && (s < 0 || s > 15)) return terr('pin: slots are 1-16'); const r = JRL.pin(x, s); if (r) terr('pin: ' + r); else tok(x.label + ' loaded into slot ' + String(JRL.layout().slots.indexOf('a:' + x.key) + 1).padStart(2, '0')); },
      slots: function () { JRL.layout().slots.forEach((p, i) => { const a = p && p[0] === 'a' ? JRL.byKey(p.slice(2)) : null, f = p && p[0] === 'f' ? JRL.layout().folders[p.slice(2)] : null; tline('<span class="tdim">' + String(i + 1).padStart(2, '0') + '</span>  ' + (a ? '<span class="tw">' + esc(a.code) + '</span> ' + esc(a.label) : f ? '<span class="tw">K/</span>' + esc(f.name) + ' <span class="tdim">(' + f.apps.length + ')</span>' : '<span class="tdim">empty ////////</span>')); }); },
      unpin: function (a) { const x = needApp(a, 'unpin'); if (!x) return; const r = JRL.unpin(x); if (r) terr('unpin: ' + r); else tok('slot cleared. ' + x.label + ' is still in the manifest.'); },
      hide: function (a) { const x = needApp(a, 'hide'); if (!x) return; JRL.hide(x, true); tok(x.label + ' hidden from the manifest. ls -a shows it.'); },
      unhide: function (a) { const x = needApp(a, 'unhide'); if (!x) return; JRL.hide(x, false); tok(x.label + ' back in the manifest'); },
      hold: function (a) { const x = needApp(a, 'hold'); if (!x) return; close(true); JRL.hold(x); },
      info: function (a) { const x = needApp(a, 'info'); if (!x) return; [['prg', pad(x.n, 3) + ' / ' + x.code], ['label', x.label], ['package', x.pkg], ['activity', x.act || '?'], ['colour', x.col || 'unread'], ['slot', JRL.layout().slots.indexOf('a:' + x.key) > -1 ? pad(JRL.layout().slots.indexOf('a:' + x.key) + 1) : 'not loaded']].forEach(l => tline('<span class="tdim">' + l[0].padEnd(10) + '</span>' + esc(l[1]))); },
      uninstall: function (a) { const x = needApp(a, 'uninstall'); if (!x) return; tline('<span class="tr">[ !! ]</span> handing ' + esc(x.pkg) + ' to the package installer. it will ask you first.'); B.uninstall(x); },
      // every option lives in one registry (JRL.settings); set with no argument prints it as a table
      set: function (a) {
        const p = (a || '').trim().split(/\s+/).filter(Boolean), k = (p[0] || '').toLowerCase(), v = p.slice(1).join(' ');
        if (!k) {
          const S0 = JRL.settings(), w = Math.max(...S0.map(x => x.k.length)) + 1;
          tline('<span class="tdim">' + 'option'.padEnd(w) + ' value      choices</span>');
          S0.forEach(x => {
            const ch = x.k === 'palette' ? pad(P.list.length) + ' · next prev random' : x.opts.map(o => o === x.v ? '<span class="ti">' + esc(o) + '</span>' : esc(o)).join(' ');
            tline('<span class="tw">' + esc(x.k.padEnd(w)) + '</span><span class="tb">' + esc(String(x.v).padEnd(10)) + '</span> ' + ch);
          });
          return tline('<span class="tdim">set KEY VALUE changes one · set KEY explains it · set palette lists the palettes</span>');
        }
        const one = JRL.settings().find(x => x.k === k || x.k === ({ colour: 'color', mode: 'register', pal: 'palette', theme: 'palette', slot: 'slots', loadout: 'slots', power: 'life' })[k]);
        if (!one) { const n = near(k, JRL.settings().map(x => x.k)); return terr('set: no option ' + k + (n ? '. did you mean ' + n + '?' : '') + '. type set for all of them'); }
        if (!v) {
          if (one.k === 'palette') { P.list.forEach((q, i) => tline(swatches(q) + ' ' + (q.id === one.v ? '<span class="ti">' + pad(i + 1) + ' ' + q.id + '</span>' : '<span class="tdim">' + pad(i + 1) + '</span> <span class="tb">' + q.id + '</span>'))); return tline('<span class="tdim">set palette NAME | NUMBER | next | prev | random</span>'); }
          tline('<span class="tw">' + esc(one.k) + '</span> <span class="tb">' + esc(one.v) + '</span>  <span class="tdim">' + one.opts.map(esc).join(' | ') + '</span>');
          return tline('<span class="tdim">' + esc(one.about) + '</span>');
        }
        const r = JRL.set(one.k, v);
        if (r) { const n = one.k === 'palette' ? near(v.toLowerCase(), P.list.map(q => q.id)) : null; return terr('set ' + r + (n ? '. did you mean ' + n + '?' : '')); }
        const now = JRL.settings().find(x => x.k === one.k).v;
        tok(one.k + ' // ' + now + (one.k === 'register' && P.color() === 'radical' ? ' (grounds apply in set color utility)' : one.k === 'color' ? (now === 'radical' ? ' · every view is its own colour' : ' · grounds stay ' + P.mode()) : ''));
        if (term.root && one.k === 'palette') window.JRLach('palette');
      },
      colony: function (a) {
        if (/feed/.test(a || '')) JRL.feed();
        if (/show|look|see|draw/.test(a || '')) { const cells = C.cells(), Ls = []; for (let y = 0; y < C.H; y++) { let s = ''; for (let x = 0; x < C.W; x++) s += cells[y * C.W + x] ? '█' : '·'; Ls.push(s); } const d = tline('', 'tart tw'); d.textContent = Ls.join('\n'); }
        ttxt(JRL.colony(), 'tb');
      },
      feed: function () { TC.colony('feed'); },
      battery: function () { const b = window.JRLlife.battery(); ttxt('power ' + (b.level != null ? Math.round(b.level * 100) + '%' : '??') + ' · ' + (b.charging ? 'charging' : 'on battery') + (b.saver ? ' · power saver' : '') + ' · life support ' + R.dataset.life, 'tb'); },
      np: function () { const m = JRL.np(); if (!m) return ttxt('no carrier. nothing is playing.', 'tdim'); ttxt((m.playing ? '▶ ' : '❚❚ ') + m.title + ' // ' + m.artist + ' // ' + (m.app || m.pkg), 'tb'); },
      play: function () { JRL.media('play'); TC.np(); }, pause: function () { JRL.media('pause'); ttxt('paused', 'tdim'); },
      next: function () { JRL.media('next'); setTimeout(TC.np, 80); }, prev: function () { JRL.media('prev'); setTimeout(TC.np, 80); },
      cal: function (a) { if (/grant/.test(a || '')) { B.askCalendar(); return ttxt('asking for calendar access …', 'tdim'); } if (/open/.test(a || '')) { B.openCalendar(); return; } close(true); JRL.go(2, { silent: true }); },
      com: function () { const n = B.notifs() || {}, ks = Object.keys(n).filter(k => n[k]).sort((x, y) => n[y] - n[x]); if (!ks.length) return ttxt('all channels quiet.', 'tdim'); ks.forEach(k => { const x = JRL.apps().find(a => a.pkg === k); tline(pad(n[k]) + '  <span class="tw">' + '█'.repeat(Math.min(16, n[k])) + '</span> ' + esc(x ? x.label : k)); }); },
      shade: function () { close(true); B.expand(); }, settings: function () { close(true); B.settings(); },
      search: function (a) { if (!a) return terr('usage: search QUERY'); ttxt('handing "' + a + '" to the browser …', 'tdim'); B.webSearch(a); },
      update: function () { ttxt('ota // asking main for a new ui …', 'tb'); B.update(); },
      lock: function () { ttxt('unit // going dark', 'tdim'); setTimeout(() => { if (term.root) exitRoot(true); else close(true); JRL.lock(); }, 200); },
      time: function () { const d = new Date(); ttxt(pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' // read by touch: hours long, tens of minutes short', 'tb'); JRL.time(); },
      version: function () { ttxt('ui v3.0 (preview) · shell ' + (B.version() || '?') + ' · bridge ' + (B.mock ? 'mock' : 'live'), 'tb'); },
      wipe: function () { ttxt('wipe // invert sweep', 'tb'); const el = term.el; el.hidden = true; setTimeout(() => window.JRLwipe(), 60); setTimeout(() => { el.hidden = false; term.inp.focus(); }, 1860); },
      reboot: function () { ttxt('rebooting …', 'tr'); setTimeout(() => { if (term.root) exitRoot(true); else close(true); JRL.reboot(); }, 300); },
      root: function () { if (term.root) { flick(); return ttxt('already root.', 'tdim'); } openRoot(); },
      exit: function () { if (term.root) { ttxt('logout', 'tdim'); setTimeout(() => exitRoot(), 250); } else close(); },
      sudo: function (a) { if (!term.root) { ttxt('[sudo] password for jere: ••••••••', 'tdim'); setTimeout(openRoot, 400); return; } if (!a) return terr('usage: sudo CMD'); ttxt('you are already root. running it anyway.', 'tdim'); run(a); },
      art: function (a) { const b = $('#s-artb'); if (b) b.classList.toggle('orig', /raw|orig/.test(a || '')); },
      agenda: function () { TC.cal(); }, enter: function () { ttxt('already in.', 'tdim'); }
    };
    const SLOTLS = TC.slots;
    ['color', 'palette', 'register', 'slots', 'icons', 'labels', 'sound', 'haptics', 'life', 'launch', 'boot', 'bars'].forEach(k => { TC[k] = a => TC.set(k + ' ' + (a || '')); });
    TC.sound = a => TC.set('sound ' + (a || (S.on() ? 'off' : 'on'))); TC.haptics = a => TC.set('haptics ' + (a || (HAP.on() ? 'off' : 'on')));
    TC.slots = a => a ? TC.set('slots ' + a) : SLOTLS();
    TC.color = a => term.root && /^(lime|red|cyan|white|amber)$/.test((a || '').trim()) ? ROOT.color(a.trim()) : TC.set('color ' + (a || ''));
    TC.colour = TC.color; TC.mode = TC.register; TC.pal = TC.palette; TC.theme = TC.palette; TC.options = TC.set; TC.config = TC.set; TC.prefs = TC.set;
    TC.mute = () => TC.set('sound off'); TC.unmute = () => TC.set('sound on'); TC.bat = TC.battery; TC.now = TC.np; TC.notifs = TC.com; TC.web = TC.search;
    TC.su = TC.root; TC['~'] = TC.root; TC.logout = TC.quit = TC.exit; TC.cls = TC.clear; TC.man = TC.help; TC['?'] = TC.help; TC.dir = TC.ls; TC.ll = TC.ls; TC.cd = a => ttxt('there are no directories here. there are decks. try go ' + (a || 'app') + '.', 'tdim');

    /* ---------- root-only toys (ported from the site, v3.6) ---------- */
    const ROOT = {};
    let GAME = null;
    window.addEventListener('keydown', e => { if (!GAME || RT.el.hidden) return; e.preventDefault(); e.stopPropagation(); if (e.key === 'Escape' || (e.key === 'c' && e.ctrlKey)) return GAME.end('quit'); if (!e.repeat || GAME.repeat) GAME.key(e); }, true);
    function play(g) { return new Promise(res => { const end = g.end; g.end = why => { if (GAME !== g) return; GAME = null; endChip(false); try { end(why); } catch (err) { console.error(err); } res(); }; GAME = g; term.inp.blur(); endChip(true); }); }
    function endChip(on) { let b = $('#tend'); if (!b) { b = document.createElement('button'); b.id = 'tend'; b.type = 'button'; b.className = 'chip'; b.textContent = 'End // esc'; b.style.cssText = 'position:absolute;right:10px;bottom:62px;z-index:5;--c-fg:var(--tc);--c-bg:var(--k);background:var(--k)'; b.addEventListener('click', () => { if (GAME) GAME.end('quit'); }); RT.el.appendChild(b); } b.hidden = !on; }
    const KT = []; window.addEventListener('keydown', e => { if (e.target && e.target.id === 'tin' && e.key.length === 1) { KT.push(performance.now()); if (KT.length > 40) KT.shift(); } }, true);
    function cadence() { const d = []; for (let i = 1; i < KT.length; i++) { const x = KT[i] - KT[i - 1]; if (x > 30 && x < 1200) d.push(x); } if (d.length < 4) return 0; d.sort((a, b) => a - b); return d[d.length >> 1]; }
    function procs() {
      const low = R.dataset.life === 'low', pop = C.pop(), nt = C.night(), j = v => Math.max(0, v * (.8 + Math.random() * .4)), dk = P.names[JRL.cur()].toLowerCase();
      return [['1', 'root', 0, .1, 'S', 'init'], ['42', 'jere', j(pop / 55 * (low ? .5 : 1)), pop / 100, nt ? 'D' : 'R', 'colony --day=' + C.day() + ' --pop=' + pop],
        ['300', 'jere', j(low ? 1 : 3), .4, 'R', 'bursts --frames=3 --hold'], ['311', 'jere', JRL.np() && JRL.np().playing ? j(low ? 0 : 6) : 0, .8, JRL.np() && JRL.np().playing ? 'R' : 'S', 'eq --round-pixels'],
        ['512', 'jere', j(1.5), 2.2, 'R', 'deck --name=' + dk], ['777', 'jere', 0, 1.1, 'S', 'manifest --programs=' + JRL.apps().length], ['1420', 'root', j(.2), .1, 'S', 'carrier --mhz=1420.405'],
        ['2048', 'system', j(.6), 4.4, 'S', 'bridge --' + (B.mock ? 'mock' : 'live')], ['999', 'root', j(1.2), .3, 'R', 'jsh -i']].sort((a, b) => b[2] - a[2]);
    }
    function ptable(Pr) { return '<span style="background:var(--tc);color:var(--k)">  PID USER    %CPU  %MEM S  COMMAND          </span>\n' + Pr.map(p => p[0].padStart(5) + ' ' + p[1].padEnd(7) + p[2].toFixed(1).padStart(5) + ' ' + p[3].toFixed(1).padStart(5) + ' ' + p[4] + '  ' + (p[4] === 'R' ? '<span class="tb">' + esc(p[5]) + '</span>' : esc(p[5]))).join('\n'); }
    function orgArt(w, h) { const c = C.cells(); w = w || 10; h = h || 4; let best = -1, bx = 0, by = 0; for (let y = 0; y <= C.H - h; y++) for (let x = 0; x <= C.W - w; x += 2) { let n = 0; for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) n += c[(y + b) * C.W + x + a] ? 1 : 0; if (n > best) { best = n; bx = x; by = y; } } const Ls = []; for (let b = 0; b < h; b++) { let s = '    '; for (let a = 0; a < w; a++) s += c[(by + b) * C.W + bx + a] ? '█' : ' '; Ls.push(s); } return Ls; }
    function moon() { const syn = 29.530588853, age = (((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % syn + syn) % syn, lit = Math.round((1 - Math.cos(2 * Math.PI * age / syn)) / 2 * 100); return ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full', 'waning gibbous', 'last quarter', 'waning crescent', 'new'][Math.floor((age / syn) * 8 + .5)] + ' · ' + lit + '% lit'; }
    const INTERCEPTS = ['the programs were never the point. the tenant was.', 'if you can read this, the colony outlived the people who built it.', 'the carrier is not a signal. it is a heartbeat.', 'we built the terminal of the future and put it in a pocket.', 'do not feed it after midnight. it remembers who did.', 'every palette here was somebody\'s favorite once.', 'the white register suits whoever runs this unit.'];
    const BALL = ['affirmative.', 'negative.', 'signal unclear. ask again after the next burst.', 'the colony says no.', 'outlook: dithered.', 'yes, but in the other register.', 'confirmed by 3 of 5 instruments.', 'cannot compute while the song is playing.', 'yes. obviously.', 'don\'t count on it.'];
    const DOT = { '.plan': ['make the terminal of the future.', 'put it in a pocket.', 'don\'t drain anyone\'s battery.'], '.secrets': ['help doesn\'t list everything.', 'achievements keeps count.', 'try being nice to it.'], '.birthday': ['some dates open doors here.', 'you\'ll have to guess which one.'], '.colony': () => [JRL.colony(), 'genome ' + C.genome(0) + ' ' + C.genome(1) + ' ' + C.genome(2) + ' …'] };
    const ACH = ['neofetch', 'fortune', 'skull', 'hack', 'rm', 'top', 'scan', 'ping', 'morse', 'synth', 'snake', 'rain', 'weather', 'roll', '8ball', 'ily', 'launch', 'decrypt', 'colonysay', 'kill', 'wipe', 'chaos', 'palette', 'xyzzy', 'make', 'birthday', 'dotfiles', 'hello'];
    const ALIAS = { sl: 'launch', cowsay: 'colonysay', '<3': 'ily', love: 'ily', hi: 'hello', hey: 'hello', ps: 'top', htop: 'top', matrix: 'rain', forecast: 'weather', pal: 'palette', theme: 'palette' };
    function found() { try { return JSON.parse(store.get('jrl-l-found') || '[]'); } catch (e) { return []; } }
    window.JRLach = function (k) { k = ALIAS[k] || k; if (ACH.indexOf(k) < 0) return; const f = found(); if (f.indexOf(k) > -1) return; f.push(k); store.set('jrl-l-found', JSON.stringify(f)); tline('<span class="tdim">[ + ] discovered: ' + esc(k) + '  (' + f.length + '/' + ACH.length + ')</span>'); if (f.length === ACH.length) { S.chirp(); tline('<span class="granted">every command found. you are part of the machine now.</span>'); } };

    ROOT.top = function () {
      const box = tline('', 'tart'), t0 = Math.round(performance.now() / 1000); box.style.color = '#d7d7d2';
      const draw = () => { box.innerHTML = '<span class="tw">top - ' + now() + ' · life ' + (R.dataset.life || 'full').toUpperCase() + ' · colony d' + pad(C.day(), 3) + '</span>\n\n' + ptable(procs()); term.out.scrollTop = term.out.scrollHeight; };
      draw(); tline('<span class="tdim">q, esc or END to exit</span>');
      const iv = setInterval(() => { if (RT.el.hidden) return g.end(); draw(); S.tick(.02); }, 500), to = setTimeout(() => g.end(), 30000);
      const g = { key: e => { if (e.key === 'q') g.end(); }, end: () => { clearInterval(iv); clearTimeout(to); tline('<span class="tdim">top: exited after ' + (Math.round(performance.now() / 1000) - t0) + 's</span>'); } };
      return play(g);
    };
    ROOT.ps = function () { tline(ptable(procs()), 'tart').style.color = '#d7d7d2'; };
    ROOT.kill = function (a) { a = (a || '').replace(/^-\S+\s*/, '').trim(); if (!a) return terr('usage: kill PID|NAME'); if (/colony|^42$/.test(a)) return terr('kill: colony: operation not permitted. it is not a process. it is a tenant.'); if (a === '1' || a === 'init') return terr('kill: init refuses. someone has to keep the lights on.'); if (/carrier|^1420$/.test(a)) return ttxt('carrier silenced for 0.2s. it came back. it always comes back.', 'tdim'); if (/jsh|^999$/.test(a)) { ttxt('jsh: terminated', 'tr'); return TC.exit(); } ttxt('[' + a + '] killed', 'tdim'); };
    ROOT.scan = async function () {
      term.skip = false; ttxt('biometric scan // hold still', 'tw'); S.swell(); HAP('heavy'); const b = tline(''); await pbar(b, 1500, 'scanning');
      const cad = cadence(), bpm = cad ? Math.round(Math.max(48, Math.min(160, 60000 / cad / 4))) : 0, h = etHour(), bt = window.JRLlife.battery(), dv = B.device() || {};
      const Ls = [['subject', 'jere // currently root'], ['signature', '0x' + hash(navigator.userAgent + screen.width + 'x' + screen.height)], ['pulse', bpm ? '~' + bpm + ' bpm  (read from your typing)' : 'unreadable. type more, then scan again.'],
        ['optics', innerWidth + '×' + innerHeight + ' @' + (Math.round((devicePixelRatio || 1) * 100) / 100) + 'x'], ['unit', (dv.model || '?') + ' · android ' + (dv.android || '?')], ['power', bt.level != null ? Math.round(bt.level * 100) + '%' + (bt.charging ? ' · charging' : ' · on battery') : 'sealed'],
        ['circadian', h < 5 ? 'awake past midnight. noted.' : h < 9 ? 'early riser.' : h < 18 ? 'daylight shift.' : 'night shift.'], ['colony bond', JRL.colony()]];
      for (const l of Ls) { tline('<span class="tdim">' + l[0].padEnd(12) + '</span>' + esc(l[1])); S.tick(.04); await sleep(90); }
      await sleep(220); flick(); S.chirp(); tline('<span class="tw">' + 'verdict'.padEnd(12) + '</span><span class="granted">' + pick(['human. probably.', 'human. mostly.', 'organic. cleared.', 'human (confidence 97.2%)']) + '</span>');
    };
    ROOT.ping = async function (a) {
      term.skip = false; const h = (a || 'jrl-01.local').toLowerCase().replace(/^-\S+\s*/, '').trim() || 'jrl-01.local';
      if (h === 'mars') { ttxt('PING mars: 4–24 light-minutes each way.', 'tb'); await sleep(1400); return terr('ping: mars: request timed out. try again in about 20 minutes.'); }
      if (h === 'sun') return terr('ping: sun: too bright. no reply.');
      const base = { moon: 2560, luna: 2560, colony: 2.6, localhost: .04, '127.0.0.1': .04, jere: .7 }[h], ip = h === 'colony' ? '10.0.0.42' : /^(localhost|127\.0\.0\.1)$/.test(h) ? '127.0.0.1' : (rnd(222) + 1) + '.' + rnd(256) + '.' + rnd(256) + '.' + rnd(256);
      ttxt('PING ' + h + ' (' + ip + '): 56 data bytes', 'tb'); const T = [];
      for (let i = 0; i < 4; i++) { const ms = base != null ? base * (1 + (Math.random() - .5) * .02) : 9 + Math.random() * 38; T.push(ms); await sleep(ms > 1000 ? ms : 420); S[h === 'colony' ? 'skitter' : 'ping'](.25 + i * .12); HAP('tick');
        tline('64 bytes from ' + ip + ': seq=' + i + ' ttl=' + (h === 'colony' ? 1 : 54) + ' time=' + ms.toFixed(ms < 10 ? 3 : 1) + ' ms' + (h === 'colony' ? '  <span class="tdim">' + pick(['(it twitched)', '(it heard you)', '(a cell blinked)', '(warm)']) + '</span>' : h === 'moon' ? '  <span class="tdim">(light is slow)</span>' : '')); }
      const mn = Math.min(...T), mx = Math.max(...T), av = T.reduce((s, x) => s + x, 0) / T.length;
      tline('<span class="tdim">--- ' + esc(h) + ' ping statistics ---</span>'); tline('4 sent, 4 received, 0% loss · min/avg/max ' + [mn, av, mx].map(x => x.toFixed(2)).join('/') + ' ms');
    };
    ROOT.morse = async function (a) {
      if (!a) return terr('usage: morse TEXT'); term.skip = false;
      const M = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
      const u = 65, line = tline('', 'tw'), s = a.toLowerCase().slice(0, 48);
      for (let i = 0; i < s.length; i++) { if (s[i] === ' ') { line.textContent += '/ '; await sleep(u * 4); continue; } const m = M[s[i]]; if (!m) continue;
        for (let j = 0; j < m.length; j++) { const d = m[j] === '.' ? u : u * 3; line.textContent += m[j] === '.' ? '·' : '—'; if (!term.skip) { S.beep(640, d / 1000, 'sine', .11); HAP(m[j] === '.' ? 'tick' : 'click'); } await sleep(d + u); }
        line.textContent += ' '; await sleep(u * 2); term.out.scrollTop = term.out.scrollHeight; }
      tline('<span class="tdim">transmitted on 1420.405 MHz' + (S.on() ? '' : ' (silently: sound is off, the haptics carried it)') + '.</span>');
    };
    ROOT.synth = function () {
      const LO = 'asdfghjkl', HI = 'qwertyuio', PENT = [0, 3, 5, 7, 10], WAVES = ['square', 'sawtooth', 'triangle', 'sine']; let wv = 0, notes = 0, ht = 0; const box = tline('', 'tart');
      const freq = i => 220 * Math.pow(2, (Math.floor(i / 5) * 12 + PENT[i % 5]) / 12);
      const key = (k, lit) => '<span data-k="' + esc(k) + '" style="display:inline-block;padding:10px 0;cursor:pointer' + (lit ? ';background:var(--tc);color:var(--k)' : '') + '"> ' + esc(k.toUpperCase()) + ' </span>';
      const draw = hit => { box.innerHTML = '<span class="tb">synth // minor pentatonic // tap or type</span>\n\n' + HI.split('').map(k => key(k, k === hit)).join('') + '\n' + LO.split('').map(k => key(k, k === hit)).join('') + '\n\n<span class="tdim">wave </span>' + WAVES[wv] + '<span class="tdim"> · 1–4 wave · notes </span>' + notes; };
      function hit(k) { const i = LO.indexOf(k), j = HI.indexOf(k), f = i > -1 ? freq(i) : j > -1 ? freq(j + 5) : 0; if (!f) { const n = '1234'.indexOf(k); if (n > -1) { wv = n; draw(); } return; } S.note(f, WAVES[wv]); HAP('tick'); notes++; draw(k); clearTimeout(ht); ht = setTimeout(() => { if (GAME === g) draw(); }, 140); if (notes % 24 === 0) JRL.feed(); }
      box.addEventListener('pointerdown', e => { const t = e.target.closest('[data-k]'); if (t && GAME === g) { e.preventDefault(); hit(t.dataset.k); } });
      const g = { key: e => hit(e.key.toLowerCase()), end: () => tline('synth off · ' + notes + ' notes' + (notes >= 24 ? '<span class="tdim"> · the colony was dancing</span>' : '')) };
      draw(); if (!S.on()) tline('<span class="tdim">sound is off. END, then type sound on.</span>'); return play(g);
    };
    ROOT.snake = function () {
      ttxt('snake // eat the pink cells. swipe on the board.', 'tw');
      const W = 18, H = 14, Z = Math.max(12, Math.min(18, Math.floor((term.out.clientWidth - 10) / 18))), cv = document.createElement('canvas'), wrap = tline(''), info = tline('', 'tdim'), x = cv.getContext('2d');
      cv.width = W * Z; cv.height = H * Z; cv.style.cssText = 'display:block;width:' + W * Z + 'px;max-width:100%;border:1px solid #2a2a2e;touch-action:none;margin:6px 0'; wrap.appendChild(cv);
      const tc = getComputedStyle(RT.el).getPropertyValue('--tc').trim() || '#c2ff16'; let sn = [[6, 7], [5, 7], [4, 7]], dir = [1, 0], nd = [1, 0], food, score = 0, iv; const best = +(store.get('jrl-l-snake') || 0);
      const K = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
      const place = () => { do { food = [rnd(W), rnd(H)]; } while (sn.some(p => p[0] === food[0] && p[1] === food[1])); };
      const draw = () => { x.fillStyle = '#0a0a0b'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#1f1f24'; for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) x.fillRect(i * Z + Z / 2 - 1, j * Z + Z / 2 - 1, 2, 2); x.fillStyle = '#e0216f'; x.fillRect(food[0] * Z + 3, food[1] * Z + 3, Z - 6, Z - 6); sn.forEach((p, i) => { x.fillStyle = i ? tc : '#f2f2ee'; x.fillRect(p[0] * Z + 1, p[1] * Z + 1, Z - 2, Z - 2); }); info.textContent = 'score ' + pad(score, 3) + '   best ' + pad(Math.max(best, score), 3); };
      const step = () => { if (RT.el.hidden) return g.end('closed'); dir = nd; const h = [sn[0][0] + dir[0], sn[0][1] + dir[1]]; if (h[0] < 0 || h[1] < 0 || h[0] >= W || h[1] >= H || sn.slice(0, -1).some(p => p[0] === h[0] && p[1] === h[1])) return g.end('dead'); sn.unshift(h); if (h[0] === food[0] && h[1] === food[1]) { score++; S.feed(); HAP('click'); place(); clearInterval(iv); iv = setInterval(step, Math.max(60, 130 - score * 3)); } else sn.pop(); draw(); };
      const turn = d => { if (d && !(d[0] === -dir[0] && d[1] === -dir[1])) nd = d; };
      let tx = 0, ty = 0; cv.addEventListener('pointerdown', e => { tx = e.clientX; ty = e.clientY; e.preventDefault(); }); cv.addEventListener('pointerup', e => { const dx = e.clientX - tx, dy = e.clientY - ty; if (Math.abs(dx) + Math.abs(dy) < 14) return; turn(Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1]); });
      const g = { repeat: true, key: e => turn(K[e.key.toLowerCase()]), end: why => { clearInterval(iv); if (score > best) store.set('jrl-l-snake', String(score)); if (why === 'dead') { S.err(); HAP('err'); flick(); } tline((why === 'dead' ? '<span class="tr">[ x ]</span> ' : '') + 'score ' + score + (score > best ? '  <span class="granted">new best</span>' : '')); if (score > 0) { JRL.feed(); ttxt('the colony ate your leftovers.', 'tdim'); } } };
      place(); draw(); term.out.scrollTop = term.out.scrollHeight; iv = setInterval(step, 130); return play(g);
    };
    ROOT.rain = function () {
      const box = tline('', 'tart'), C2 = cols(), RN = 14, ch = window.JRLglyphs + '0123456789ABCDEF', drops = [], grid = [], low = R.dataset.life === 'low'; let t = 0;
      for (let i = 0; i < C2; i++) drops.push(-rnd(RN * 2)); for (let r = 0; r < RN; r++) grid.push(new Array(C2).fill(' '));
      const frame = () => { if (RT.el.hidden) return g.end(); for (let i = 0; i < C2; i++) { const y = drops[i]; if (y >= 0 && y < RN) grid[y][i] = ch[rnd(ch.length)]; const tl = y - 7; if (tl >= 0 && tl < RN) grid[tl][i] = ' '; drops[i]++; if (tl >= RN && Math.random() < .3) drops[i] = -rnd(10); }
        box.innerHTML = grid.map((row, y) => row.map((c, x) => drops[x] - 1 === y ? '<span class="tb">' + esc(c) + '</span>' : esc(c)).join('')).join('\n'); if (++t % 3 === 0) S.tick(.015); if (t > (low ? 45 : 90)) g.end(); };
      const iv = setInterval(frame, low ? 132 : 66), g = { key: () => g.end(), end: () => clearInterval(iv) }; return play(g);
    };
    ROOT.weather = function () {
      const day = window.JRLet.day(), r = seeded(day), sec = Math.floor(r() * 0xffff).toString(16).toUpperCase().padStart(4, '0'), bar = v => '█'.repeat(Math.round(v * 10)) + '░'.repeat(10 - Math.round(v * 10)), flux = r();
      const Ls = [['sky', ['overcast with static', 'clear. too clear.', 'dithered haze', 'scattered packets', 'low signal fog'][Math.floor(r() * 5)]], ['hydrogen', '1420.405 MHz · ' + (r() < .8 ? 'steady' : 'drifting')], ['ion flux', bar(flux) + '  ' + (flux < .33 ? 'calm' : flux < .66 ? 'moderate' : 'storm warning')],
        ['radiation', (r() * .6 + .05).toFixed(2) + ' mSv/h'], ['wind', Math.round(r() * 30 + 2) + ' m/s from the carrier'], ['static', Math.round(r() * 60 + 5) + '% chance'], ['moon', moon() + '  (real)'],
        ['advisory', C.night() ? 'the colony is dormant. keep your voice down.' : C.pop() > 260 ? 'the colony is crowded. expect molts.' : C.pop() < 60 ? 'the colony is thin. feed it.' : 'the colony is restless today.']];
      ttxt('surface forecast // ' + day + ' // sector ' + sec, 'tw'); Ls.forEach(l => tline('<span class="tdim">' + l[0].padEnd(11) + '</span>' + esc(l[1])));
    };
    ROOT.roll = async function (a) {
      const m = /^(\d*)d(\d+)$/i.exec((a || 'd20').trim()); if (!m) return terr('usage: roll [NdM]   e.g. roll 2d6'); const n = Math.min(+m[1] || 1, 12), s = Math.min(+m[2], 1000); if (s < 2) return terr('roll: dice need at least 2 sides');
      const th = () => { const r = []; for (let i = 0; i < n; i++) r.push(rnd(s) + 1); return r; }, d = tline(''); S.roll(10); for (let f = 0; f < 10; f++) { d.textContent = 'rolling ' + n + 'd' + s + '   ' + th().join(' '); HAP('tick'); await tick(40 + f * 14); }
      const r = th(), tot = r.reduce((x, y) => x + y, 0); d.innerHTML = 'rolled ' + n + 'd' + s + '   <span class="tw">' + r.join(' ') + '</span>' + (n > 1 ? '   = <span class="tb">' + tot + '</span>' : ''); S.click(); HAP('click');
      if (n === 1 && s === 20 && r[0] === 20) { flick(); S.chirp(); tline('<span class="granted">NAT 20</span> critical. the terminal respects you now.'); } if (n === 1 && s === 20 && r[0] === 1) terr('nat 1. somewhere, the colony laughed.');
    };
    ROOT['8ball'] = function (a) { if (!a) return terr('usage: 8ball QUESTION'); S.shutter(); HAP('click'); ttxt(pick(BALL), 'tw', { frames: 16, speed: 30 }); };
    ROOT.decrypt = async function () { term.skip = false; ttxt('intercept // carrier 1420.405 MHz // packet 0x' + rnd(65536).toString(16).toUpperCase().padStart(4, '0'), 'tdim'); for (let i = 0; i < 4; i++) { ttxt(hexrow(), 'tdim', { frames: 3, speed: 20 }); await sleep(60); } const b = tline(''); await pbar(b, 900, 'brute-forcing'); ttxt('"' + pick(INTERCEPTS) + '"', 'tb', { frames: 26, speed: 34 }); };
    ROOT.colonysay = function (a) { const t = (a || pick(FORT)).slice(0, 160), Ls = ['']; t.split(/\s+/).forEach(w => { const c = Ls[Ls.length - 1]; if ((c + ' ' + w).trim().length > Math.min(30, cols() - 8)) Ls.push(w); else Ls[Ls.length - 1] = (c + ' ' + w).trim(); }); const m = Math.max(...Ls.map(l => l.length)); return art(['┌' + '─'.repeat(m + 2) + '┐'].concat(Ls.map(l => '│ ' + l.padEnd(m) + ' │'), ['└──┬' + '─'.repeat(Math.max(0, m - 1)) + '┘', '   │']).concat(orgArt())); };
    ROOT.cowsay = function (a) { ttxt('no cows on this unit. the colony will say it.', 'tdim'); return ROOT.colonysay(a); };
    ROOT.launch = async function () {
      const c = Math.min(cols(), 60), Ls = [tline('', 'tart'), tline('', 'tart'), tline('', 'tart')], EX = ['░▒▓', '▒▓█', '░░▒', '▒▒▓']; S.swell(); HAP('heavy');
      for (let x = c; x > -34; x -= 2) { const e = pick(EX), SH = ['      ▄▟▀▀▀▀▀▙▄▄       ', ' ◀■■■█ JRL//01 █■■≡≡' + e + '·   ', '      ▀▜▄▄▄▄▄▛▀▀       ']; for (let i = 0; i < 3; i++) Ls[i].textContent = x >= 0 ? ' '.repeat(x) + SH[i] : SH[i].slice(-x); if (x % 8 === 0) S.crackle(); await tick(33); }
      Ls.forEach(l => l.remove()); S.thump(true); ttxt('dropship away. no passengers. eta: unknown.', 'tdim');
    };
    ROOT.sl = function () { ttxt('sl: you meant ls. launching anyway.', 'tdim'); return ROOT.launch(); };
    ROOT.ily = async function () { term.skip = false; const HRT = ['  ██   ██  ', ' ████ ████ ', ' █████████ ', '  ███████  ', '   █████   ', '    ███    ', '     █     ']; for (const l of HRT) { const d = tline('', 'tart'); d.style.color = '#e0216f'; d.textContent = '    ' + l; S.tick(.05); HAP('tick'); await sleep(70); } S.feed(); JRL.feed(); ttxt('ily2. the colony felt that.', 'tw', { frames: 14, speed: 28 }); };
    ROOT.love = ROOT['<3'] = ROOT.ily;
    ROOT.hello = function () { const h = etHour(); ttxt(h < 5 ? 'still up? the colony is asleep. keep your voice down.' : h < 12 ? 'good morning. coffee is not in this shell.' : h < 18 ? 'good afternoon, root.' : 'good evening. the carrier is clearest at night.', 'tw'); };
    ROOT.hi = ROOT.hey = ROOT.hello;
    ROOT.xyzzy = () => ttxt('nothing happens.', 'tdim');
    ROOT.make = function (a) { if (/sandwich/.test(a || '')) { ttxt('okay. (you\'re root. it had to.)', 'tw'); return art(['   .-----------.', '  (=============)', '   |~~~~~~~~~~~|', '   (___________)']); } terr('make: *** no rule to make target \'' + (a || '') + '\'. stop.'); };
    ROOT.fortune = () => ttxt(pick(FORT), 'tw', { frames: 16, speed: 28 });
    ROOT.skull = () => art(SKULL, 'c'); ROOT.banner = () => art(JERE, 'c');
    ROOT.achievements = ROOT.ach = function () { const f = found(); tline('<span class="tw">' + f.length + '/' + ACH.length + ' discovered</span>'); const s = ACH.map(k => f.indexOf(k) > -1 ? k : '?'.repeat(k.length)), w = Math.max(2, Math.floor(cols() / 12)); for (let i = 0; i < s.length; i += w) tline(s.slice(i, i + w).map(x => x.padEnd(11)).join(' '), 'tdim'); tline(f.length === ACH.length ? '<span class="granted">all found.</span>' : '<span class="tdim">hint: ls -a</span>'); };
    ROOT.cat = function (a) { a = (a || '').trim(); const d = DOT[a]; if (!d) return terr('cat: ' + a + ': no such file'); window.JRLach('dotfiles'); (typeof d === 'function' ? d() : d).forEach(l => { if (l) ttxt(l, 'tb'); }); };
    ROOT.hack = async function (a) {
      const tg = a || 'mainframe'; ttxt('nmap -sS -p- ' + tg, 'tw'); await sleep(300);
      for (const p of [[22, 'ssh'], [80, 'http'], [443, 'https'], [1420, 'hydrogen-line'], [4112, 'babel']]) { ttxt(String(p[0]).padEnd(6, ' ') + 'open   ' + p[1], 'tdim'); await sleep(110); }
      ttxt('injecting payload into ' + tg + ' ...', 'tr'); for (let j = 0; j < 6; j++) { ttxt(hexrow(), 'tdim', { frames: 3, speed: 20 }); await sleep(55); }
      const b = tline(''); await pbar(b, 1300, 'exfiltrating'); flick(); HAP('heavy'); tline('<span class="tw">[ ok ]</span> <span class="granted">' + esc(tg) + ' owned</span>'); await sleep(400); ttxt('(just kidding. nothing left this phone.)', 'tdim');
    };
    ROOT.rm = async function (a) {
      if (!/-rf/.test(a || '')) return terr('rm: missing operand'); ttxt('rm -rf / --no-preserve-root', 'tr');
      for (const x of JRL.apps().slice(0, 12)) { ttxt('removed /data/app/' + x.pkg, 'tr', { frames: 3, speed: 18 }); HAP('tick'); await sleep(70); }
      ['removed /decks/signal', 'removed /decks/schedule', 'removed /colony'].forEach(x => ttxt(x, 'tr', { frames: 3, speed: 18 }));
      await sleep(300); flick(); HAP('err'); await art(SKULL, 'c'); await sleep(300); tline('<span class="tr">[FAIL]</span> <span class="granted no">kernel panic</span>'); await sleep(700);
      ttxt('...restoring. the colony kept a copy of everything. nothing was lost.', 'tb', { frames: 16, speed: 26 });
    };
    let chaosT = 0;
    ROOT.chaos = function (a) { const on = a !== 'off'; clearInterval(chaosT); if (on && !reduce) chaosT = setInterval(() => { const pool = [].slice.call(document.querySelectorAll('.deck.on .tile, .deck.on .pn, .tab, .clock, .tag')).filter(e => e.offsetParent); const el = pick(pool); if (!el) return; const st = 'steps(1,end)', j = n => Math.round((Math.random() - .5) * n) + 'px'; el.animate([{ transform: 'translateX(' + j(30) + ')', clipPath: 'inset(0 0 55% 0)', filter: 'invert(1)', easing: st }, { offset: .3, transform: 'translateX(' + j(16) + ')', clipPath: 'inset(35% 0 0 0)', filter: 'hue-rotate(120deg)', easing: st }, { offset: .6, transform: 'none', clipPath: 'inset(0)', filter: 'invert(1)', easing: st }, { transform: 'none', filter: 'none' }], { duration: 360 }); }, 1200); ttxt(on ? 'chaos on. exit to watch the decks misbehave. chaos off to stop.' : 'chaos contained.', on ? 'tr' : 'tb'); };
    ROOT.invert = function (a) { R.classList.toggle('inv', a !== 'off'); ttxt('unit ' + (a !== 'off' ? 'inverted' : 'restored'), 'tb'); };
    ROOT.color = function (a) { const m = { lime: '#c2ff16', red: '#ff3b30', cyan: '#2ddccd', white: '#f2f2ee', amber: '#ffb000' }; if (!m[a]) return terr('color: lime | red | cyan | white | amber'); RT.el.style.setProperty('--tc', m[a]); ttxt('ink set to ' + a); };
    async function bday() {
      window.JRLach('birthday'); const CAKE = ['      *  *  *  *', '      ╻  ╻  ╻  ╻', '      ┃  ┃  ┃  ┃', '   ┏━━┻━━┻━━┻━━┻━━┓', '   ┃ 11 . 01 . 98 ┃', ' ┏━┻━━━━━━━━━━━━━━┻━┓', ' ┃ ~ ~ ~ ~ ~ ~ ~ ~ ~┃', ' ┗━━━━━━━━━━━━━━━━━━┛'];
      ttxt('[ ok ] date match: 1998-11-01', 'tb'); await sleep(250); flick(); HAP('heavy'); await art(CAKE, 'c'); await sleep(200); tline('<span class="tw">[ ok ]</span> <span class="granted">happy birthday, jere</span>');
      const n = new Date(), age = n.getFullYear() - 1998 - (n < new Date(n.getFullYear(), 10, 1) ? 1 : 0); await sleep(250); ttxt('another lap around the sun logged. ' + age + ' and counting.', 'tw', { frames: 14, speed: 26 }); log('tty // happy birthday', true);
    }

    /* ---------- runner ---------- */
    function run(v) {
      v = String(v || '').trim(); if (!v) return; const parts = v.split(/\s+/); let k = parts[0].toLowerCase(); const arg = parts.slice(1).join(' ');
      if (/^(11[\/\-. ]?0?1[\/\-. ]?(19)?98|1998[\/\-. ]?11[\/\-. ]?0?1)$/.test(v.replace(/\s+/g, ''))) { if (!term.root) return terr('jsh: that date means something. not here. try root.'); return busy(bday()); }
      if (k === 'cat' && term.root && /^\./.test(arg)) return ROOT.cat(arg);
      const fn = TC[k] || (term.root ? ROOT[k] : null);
      if (!fn) {
        if (!term.root && ROOT[k]) { return terr(k + ': permission denied. this is a root toy. type root.'); }
        const x = app(v); if (x && JRL.find(v).length && v.length > 2) { tline('<span class="tdim">no command ' + esc(k) + '. opening the program that matches.</span>'); return TC.open(v); }
        const dm = near(k, Object.keys(TC).concat(term.root ? Object.keys(ROOT) : [])); return terr('jsh: ' + k + ': command not found' + (dm ? '. did you mean ' + dm + '?' : ''));
      }
      if (term.root) window.JRLach(k);
      let r; running = true; term.dec1 = false; try { r = fn(arg); } catch (err) { console.error(err); running = false; return terr('jsh: ' + k + ': crashed. try again.'); } running = false;
      if (r && r.then) busy(r);
    }
    function busy(p) { term.busy = true; p.then(free, free); }
    function free() { term.busy = false; term.skip = false; if (!term.el.hidden && !GAME) term.inp.focus({ preventScroll: true }); const n = term.q.shift(); if (n) { prompt(n); run(n); if (!term.busy && term.q.length) free(); } }
    function prompt(v) { tline('<span class="tw">' + (term.root ? 'root@jrl-01:~#' : 'jere@jrl-01:~$') + '</span> ' + esc(v)); term.hist.push(v); term.hi = term.hist.length; }
    [U, RT].forEach(T => {
      T.form.addEventListener('submit', e => {
        e.preventDefault(); term = T; const v = T.inp.value; T.inp.value = ''; S.click(); HAP('tick');
        if (T.busy) { if (v.trim()) T.q.push(v.trim()); T.skip = true; return; }
        if (!T.root && /^(f|find)\s+\S/i.test(v.trim())) { const top = JRL.top() || JRL.find(v.trim().replace(/^(f|find)\s+/i, ''))[0]; prompt(v); if (top) TC.open(String(top.n)); else terr('find: nothing matches ' + v.replace(/^(f|find)\s+/i, '')); return; }
        prompt(v); running = true; if (window.JRLecho) JRLecho(v.trim(), true); running = false; run(v);
      });
      T.inp.addEventListener('keydown', e => {
        if (e.key === 'ArrowUp') { if (T.hi > 0) { T.hi--; T.inp.value = T.hist[T.hi]; } e.preventDefault(); }
        else if (e.key === 'ArrowDown') { if (T.hi < T.hist.length) { T.hi++; T.inp.value = T.hist[T.hi] || ''; } e.preventDefault(); }
        else if (e.key === 'Tab') { e.preventDefault(); const v = T.inp.value.toLowerCase(), m = Object.keys(TC).concat(T.root ? Object.keys(ROOT) : []).filter(k => k.indexOf(v) === 0); if (m.length === 1) T.inp.value = m[0] + ' '; else if (m.length) { term = T; tline('<span class="tdim">' + m.join('  ') + '</span>'); } }
        else if (e.key === 'Escape') { e.preventDefault(); if (T.root) exitRoot(); else close(); }
        else if (e.key.length === 1 || e.key === 'Backspace') S.key();
      });
      T.el.addEventListener('click', e => { if (!String(window.getSelection()) && !e.target.closest('button,[data-k],canvas')) T.inp.focus({ preventScroll: true }); });
    });
    // live find: typing "find sp" filters the manifest under the terminal
    U.inp.addEventListener('input', () => { const m = /^(f|find)\s+(.*)$/i.exec(U.inp.value); if (m) JRL.filter(m[2]); else if (JRL.top && JRL.top()) JRL.filter(''); });
    RT.el.addEventListener('pointerdown', () => { if (RT.busy) RT.skip = true; });

    /* ---------- tty1 open/close ---------- */
    let greeted = false;
    function open(pre) {
      if (pre === '~') { openRoot(); return; }
      if (!RT.el.hidden) return; JRL.close(true); term = U;
      if (U.el.hidden) { U.el.hidden = false; if (!reduce) { U.el.classList.remove('stepin'); void U.el.offsetWidth; U.el.classList.add('stepin'); } HAP('tick'); S.click(); R.dataset.term = 'on'; }
      if (!greeted) { greeted = true; tline('<span class="tdim">tty1 // jere@jrl-01 // type help. every tap types its command here.</span>'); }
      U.inp.value = pre || ''; setTimeout(() => { U.inp.focus({ preventScroll: true }); try { U.inp.setSelectionRange(U.inp.value.length, U.inp.value.length); } catch (e) {} if (pre) U.inp.dispatchEvent(new Event('input')); U.out.scrollTop = U.out.scrollHeight; }, 30);
    }
    function close(quiet) { if (U.el.hidden) return; U.el.hidden = true; delete R.dataset.term; U.inp.blur(); if (JRL.top && JRL.top()) JRL.filter(''); if (!quiet) { HAP('tick'); S.click(); } }
    $('#cli-x').addEventListener('click', () => close());
    window.JRLterm = {
      open: open, close: close, toggle: () => U.el.hidden ? open('') : close(), isOpen: () => !U.el.hidden,
      run: v => { term = U; prompt(v); run(v); },
      hist: cmd => { if (running || U.busy) return; const d = document.createElement('div'); d.className = 'tl'; d.innerHTML = '<span class="tdim">$ ' + esc(cmd) + '</span>'; U.out.appendChild(d); while (U.out.children.length > 400) U.out.firstChild.remove(); U.out.scrollTop = U.out.scrollHeight; }
    };

    /* ---------- tty0: root, behind the invert sweep ---------- */
    let rootT = [];
    function invFlick(times, gap) { for (let i = 0; i < times; i++) rootT.push(setTimeout(() => R.classList.toggle('inv'), i * gap)); rootT.push(setTimeout(() => R.classList.remove('inv'), times * gap)); }
    function openRoot() {
      if (!RT.el.hidden) return; close(true); JRL.close(true); rootT.forEach(clearTimeout); rootT = [];
      HAP('heavy'); log('tty // root requested', true); window.JRLecho('root', true);
      if (reduce) { showRoot(); return; }
      window.JRLwipe(); // the band crosses the whole unit
      rootT.push(setTimeout(() => invFlick(3, 33), 420));
      rootT.push(setTimeout(() => { R.classList.add('inv'); HAP('heavy'); }, 760));
      rootT.push(setTimeout(() => { showRoot(); }, 900));
      rootT.push(setTimeout(() => { R.classList.remove('inv'); flick(); }, 1130));
    }
    function showRoot() { RT.el.hidden = false; term = RT; RT.out.innerHTML = ''; RT.q = []; setTimeout(() => RT.inp.focus({ preventScroll: true }), 40); busy(login()); }
    async function login() {
      term = RT; RT.skip = false; RT.dec1 = false;
      tok('tty0 allocated on /dev/pts/0'); await sleep(110); tok('carrier 1420.405 MHz ........ locked'); await sleep(110);
      tok('mount -o ro /data/app ....... ' + pad(JRL.apps().length, 3) + ' programs'); await sleep(110); tok('colony d' + pad(C.day(), 3) + ' ............... pop ' + C.pop()); await sleep(160);
      tline(' '); await art(JERE); tline(' ');
      ttxt('JRL-OS :: field unit :: tty build 6.0.0-graphic-realism', 'tw'); await sleep(220);
      const lg = tline('login: '); await sleep(200); await typeInto(lg, 'jere', 70); await sleep(180);
      const pw = tline('password: '); await sleep(160); await typeInto(pw, '••••••••', 45); await sleep(200);
      const sp = tline('[....] escalating '); await spin(sp, 900);
      sp.innerHTML = '<span class="tw">[ ok ]</span> uid=0(root) gid=0(root) groups=0(root),42(colony),1420(carrier)'; flick(); HAP('click'); await sleep(240);
      tline('<span class="tw">[ ok ]</span> <span class="granted">access granted</span>'); await sleep(200); RT.skip = false;
      ttxt("shell is yours. 'help' for what it does, 'achievements' for what you've found, 'exit' to jack back in.", 'tw', { frames: 14, speed: 26 });
      log('tty // root shell open', true);
    }
    function exitRoot(quick) {
      if (RT.el.hidden) return; if (GAME) GAME.end('quit'); rootT.forEach(clearTimeout); rootT = []; term = U;
      const done = () => { RT.el.hidden = true; R.classList.remove('inv'); RT.inp.blur(); log('tty // logged out'); };
      if (reduce || quick) { done(); if (!quick && window.JRLsnap) JRLsnap(); return; }
      HAP('heavy'); window.JRLwipe(true); invFlick(2, 33); rootT.push(setTimeout(done, 520)); rootT.push(setTimeout(() => { if (window.JRLsnap) JRLsnap(); }, 560));
    }
    window.JRLroot = { open: openRoot, exit: exitRoot, isOpen: () => !RT.el.hidden };
  })();
