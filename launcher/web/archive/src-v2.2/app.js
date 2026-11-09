  // The launcher, v2.2. The Console is the only place you live. Schedule, Signal, Comms and Bio are instruments
  // that burst open full screen; the Manifest is one swipe up. Programs live in a 16-slot loadout and are scrub-launched
  // from the lime strip. Every tap types its command into the prompt. Terminal commands live in term.js and call window.JRL.
  (function () {
    'use strict';
    const R = document.documentElement, DEV = document.getElementById('device');
    const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [].slice.call((r || document).querySelectorAll(s));
    const B = window.JRLbridge, S = window.JRLsfx, HAP = window.JRLhap, P = window.JRLpal, C = window.JRLcolony, store = window.JRLstore, reduce = window.JRLreduce;
    const pad = (n, w) => String(n).padStart(w || 2, '0');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rint = n => Math.floor(Math.random() * n);
    const VIEWS = ['hom', 'app', 'agd', 'sig', 'com', 'bio'], CODES = ['HOM', 'APP', 'AGD', 'SIG', 'COM', 'BIO'], NAMES = P.names;
    const J = (k, d) => { try { const v = JSON.parse(store.get(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
    const cfg = Object.assign({ icons: 'duo', launch: 'burst', boot: 'smart', bars: 'off', labels: 'code' }, J('jrl-l-cfg', {}));
    if (cfg.v !== 21) { cfg.icons = 'duo'; cfg.v = 21; }
    const saveCfg = () => store.set('jrl-l-cfg', JSON.stringify(cfg)); saveCfg();
    const ICONS = ['duo', 'app', 'mosaic', 'pixel', 'code'];
    let cur = 0, visible = true, booted = false, APPS = [], BYKEY = {}, L = J('jrl-l-layout', null), EV = { granted: true, list: [] }, MED = null, NOTI = null;
    let launches = +(store.get('jrl-l-launches') || 0), USE = J('jrl-l-uses', {}), assignSlot = null;
    const T0 = Date.now(), zoom = () => parseFloat(getComputedStyle(DEV).zoom) || 1;
    const JRL = window.JRL = { cfg: cfg };
    R.dataset.ic = cfg.icons;

    /* ---------- preview harness: frame the phone on a desktop ---------- */
    const pv = $('#pv');
    if (B.mock && innerWidth > 1000 && !/[?&]nopv/.test(location.search)) {
      const SZ = { cover: [412, 915], main: [984, 1092] };
      const setPv = m => {
        $$('#pv button').forEach(b => b.setAttribute('aria-pressed', b.dataset.pv === m));
        if (m === 'fill') { R.classList.remove('framed'); DEV.style.zoom = ''; }
        else { const s = SZ[m], k = Math.min(1, (innerHeight - 70) / s[1]); R.classList.add('framed'); R.style.setProperty('--fw', s[0] + 'px'); R.style.setProperty('--fh', s[1] + 'px'); DEV.style.zoom = k < 1 ? k : ''; }
        store.set('jrl-l-pv', m); setTimeout(() => { checkFold(); layoutField(); fitHome(); }, 30);
      };
      pv.hidden = false; $$('#pv button').forEach(b => b.addEventListener('click', () => setPv(b.dataset.pv)));
      setPv(store.get('jrl-l-pv') || 'cover');
    }

    /* ---------- feed: the unit's telemetry log ---------- */
    let FEED = J('jrl-l-feed', []);
    const stamp = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); };
    function log(m, hot) { FEED.push([Date.now(), String(m), hot ? 1 : 0]); if (FEED.length > 60) FEED = FEED.slice(-60); store.set('jrl-l-feed', JSON.stringify(FEED)); if (cur === 4) renderFeed(); }
    function renderFeed() { const f = $('#feed'); if (!f) return; f.innerHTML = FEED.slice(-16).reverse().map(e => '<div class="' + (e[2] ? 'st' : '') + '">' + stamp(e[0]) + '  <b>' + esc(e[1]) + '</b></div>').join(''); }
    window.JRLlog = log;

    /* ---------- the prompt: every tap types its command; arrivals run across it ---------- */
    const echoEl = $('#echo'); let echoT = 0, lastEcho = '', tickQ = [], tickOn = false;
    window.JRLecho = function (cmd, quiet) {
      lastEcho = cmd; if (window.JRLterm && window.JRLterm.hist) window.JRLterm.hist(cmd);
      if (tickOn || !echoEl) return; clearInterval(echoT); let i = 0; echoEl.textContent = '';
      if (reduce) { echoEl.textContent = cmd; return; }
      echoT = setInterval(() => { echoEl.textContent = cmd.slice(0, ++i); if (i % 2 && !quiet) S.key(); if (i >= cmd.length) clearInterval(echoT); }, 33);
    };
    const echo = window.JRLecho;
    const echoNow = t => { if (tickOn) return; clearInterval(echoT); echoEl.textContent = t; };
    function ticker(m) { tickQ.push(m); if (!tickOn) nextTick(); }
    function nextTick() {
      const m = tickQ.shift(); clearInterval(echoT);
      if (!m) { tickOn = false; echoEl.classList.remove('inc'); $('#bstrip').classList.remove('inc'); echoEl.textContent = lastEcho; return; }
      tickOn = true; echoEl.classList.add('inc'); $('#bstrip').classList.add('inc'); echoEl.textContent = m; HAP('double'); S.chirp(); if (window.JRLsnap && !reduce && !window.JRLdim()) $('#bstrip').animate([{ filter: 'invert(1)' }, { filter: 'invert(1)' }], { duration: 33 }); setTimeout(nextTick, 3000);
    }
    JRL.ticker = ticker;
    let toastT = 0;
    window.JRLtoast = function (m) {
      let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; DEV.appendChild(t); }
      t.textContent = m; t.hidden = false; t.classList.remove('stepin'); void t.offsetWidth; t.classList.add('stepin'); clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 1800);
    };

    /* ---------- programs ---------- */
    // program codes are identifiers, so they are unique: first letter + consonants, the next word's initial for
    // multi-word names (Proton Mail → PRM), then other letter pairs, then a digit
    function codeOf(label, taken) {
      taken = taken || {}; const W = label.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean); if (!W.length) return 'PRG';
      const sk = w => w[0] + w.slice(1).replace(/[AEIOU]/g, ''), all = W.join(''), S = sk(W[0]) + W.slice(1).map(sk).join(''), cands = [];
      if (W.length > 1) { cands.push((sk(W[0]) + 'XX').slice(0, 2) + W[1][0]); if (W[2]) cands.push(W[0][0] + W[1][0] + W[2][0]); cands.push(W[0][0] + W[1][0] + (sk(W[1])[1] || W[1][1] || 'X')); }
      if (S.length < 3 && all.length >= 3) cands.push(S.slice(0, 2) + all[all.length - 1]);
      cands.push((S + 'XXX').slice(0, 3));
      [S, all].forEach(src => { for (let i = 1; i < src.length; i++) for (let k = i + 1; k < src.length; k++) cands.push(src[0] + src[i] + src[k]); });
      for (const c of cands) if (c.length === 3 && !taken[c]) return c;
      for (let d = 2; d < 99; d++) { const c = all.slice(0, 2) + d; if (!taken[c]) return c.slice(0, 4); }
      return all.slice(0, 3);
    }
    const cmdName = a => a.label.toLowerCase().replace(/[^a-z0-9.]+/g, '');
    const keyOf = a => a.pkg + '/' + a.act;
    const vis = () => APPS.filter(a => L.hidden.indexOf(a.key) < 0);
    const uses = a => (USE[a.key] || [0, 0])[0];
    function used(a) { const u = USE[a.key] || [0, 0]; u[0]++; u[1] = Date.now(); USE[a.key] = u; store.set('jrl-l-uses', JSON.stringify(USE)); }
    function setApps(list) {
      APPS = list.slice().sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
      BYKEY = {}; const TK = {}; APPS.forEach((a, i) => { a.key = keyOf(a); a.n = i + 1; a.code = codeOf(a.label, TK); TK[a.code] = 1; BYKEY[a.key] = a; });
      if (L && L.pins && !L.slots) { L.slots = L.pins; delete L.pins; }
      if (!L || !L.slots) L = defaultLayout(); else cleanLayout();
      renderAll(); buildRuler();
    }
    function byPkg(p) { return APPS.find(a => a.pkg === p); }
    function defaultLayout() {
      const want = ['com.samsung.android.dialer', 'com.google.android.dialer', 'com.google.android.apps.messaging', 'com.samsung.android.messaging', 'com.android.chrome', 'com.sec.android.app.camera', 'com.google.android.GoogleCamera',
        'com.google.android.gm', 'com.whatsapp', 'com.google.android.apps.maps', 'com.google.android.apps.youtube.music', 'ch.protonmail.android', 'com.google.android.calendar', 'com.anthropic.claude', 'com.instagram.android'];
      const slots = []; want.forEach(p => { const a = byPkg(p); if (a && slots.length < 12 && slots.indexOf('a:' + a.key) < 0) slots.push('a:' + a.key); });
      const folders = {}, F = [['Music', ['com.spotify.music', 'com.soundcloud.android', 'com.shazam.android', 'com.bandcamp.android']], ['AI', ['com.openai.chatgpt', 'com.google.android.apps.bard', 'ai.perplexity.app.android']],
        ['Finance', ['com.chase.sig.android', 'com.venmo', 'com.robinhood.android', 'com.squareup.cash']], ['Dating', ['co.hinge.app', 'com.bumble.app', 'com.tinder']]];
      F.forEach((f, i) => { const apps = f[1].map(byPkg).filter(Boolean).map(a => a.key); if (apps.length > 1) { const id = 'f' + (i + 1); folders[id] = { name: f[0], apps: apps }; slots.push('f:' + id); } });
      while (slots.length < 16) slots.push(null);
      return { slots: slots.slice(0, 16), folders: folders, hidden: [] };
    }
    function cleanLayout() {
      L.hidden = (L.hidden || []).filter(k => BYKEY[k]); L.folders = L.folders || {};
      Object.keys(L.folders).forEach(id => { const f = L.folders[id]; f.apps = f.apps.filter(k => BYKEY[k]); });
      L.slots = (L.slots || []).slice(0, 16).map(p => !p ? null : p[0] === 'a' ? (BYKEY[p.slice(2)] ? p : null) : (L.folders[p.slice(2)] && L.folders[p.slice(2)].apps.length ? p : null));
      while (L.slots.length < 16) L.slots.push(null);
    }
    const saveL = () => store.set('jrl-l-layout', JSON.stringify(L));

    /* ---------- icons: duo (ink + one block of the app's own colour), app, mosaic, pixel, code ---------- */
    const ICO = {};
    function swc(a) { return '<i class="swc" data-sw="' + esc(a.key) + '"' + (a.col ? ' style="background:' + a.col + '"' : '') + '></i>'; }
    function iconHTML(a) {
      const m = cfg.icons; if (!a.col) ensureCol(a);
      if (m === 'code') return '<span class="ic code">' + esc(a.code) + '</span>' + swc(a);
      const px = m === 'mosaic' || m === 'pixel';
      return '<img class="ic' + (px ? ' px' : '') + '" src="' + esc(px ? (ICO[a.key + m] || a.icon) : a.icon) + '" data-ik="' + esc(a.key) + '" alt="" draggable="false">' + (m === 'duo' ? swc(a) : '');
    }
    function setCol(a, c) { if (!c) return; a.col = c; $$('[data-sw="' + CSS.escape(a.key) + '"]').forEach(e => { e.style.background = c; }); }
    function ensureCol(a) { if (a.col || a._colp) return; a._colp = 1; const im = new Image(); im.onload = () => setCol(a, dominant(im)); im.src = a.icon; }
    function processIcon(img) {
      const a = BYKEY[img.dataset.ik]; if (!a || !img.naturalWidth) return;
      if (!a.col) setCol(a, dominant(img));
      const m = cfg.icons; if ((m !== 'mosaic' && m !== 'pixel') || ICO[a.key + m] || img.dataset.done === m) return;
      const n = m === 'mosaic' ? 13 : 12, s = document.createElement('canvas'); s.width = s.height = n;
      const x = s.getContext('2d'); let d; try { x.drawImage(img, 0, 0, n, n); d = x.getImageData(0, 0, n, n).data; } catch (e) { return; }
      const o = document.createElement('canvas'), u = 8; o.width = o.height = n * u; const y = o.getContext('2d');
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const p = (j * n + i) * 4; if (d[p + 3] < 110) continue; y.fillStyle = 'rgb(' + d[p] + ',' + d[p + 1] + ',' + d[p + 2] + ')';
        if (m === 'mosaic') { y.beginPath(); y.arc(i * u + u / 2, j * u + u / 2, u * .42, 0, 7); y.fill(); } else y.fillRect(i * u, j * u, u - 1, u - 1); }
      ICO[a.key + m] = o.toDataURL(); $$('img[data-ik="' + CSS.escape(a.key) + '"]').forEach(im => { if (!im.closest('.fold')) { im.src = ICO[a.key + m]; im.dataset.done = m; } });
    }
    function dominant(img) {
      try { const c = document.createElement('canvas'); c.width = c.height = 10; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 10, 10); const d = x.getImageData(0, 0, 10, 10).data;
        let best = null, bs = -1; const acc = [0, 0, 0, 0];
        for (let p = 0; p < d.length; p += 4) { if (d[p + 3] < 120) continue; const r = d[p], g = d[p + 1], b = d[p + 2], sat = Math.max(r, g, b) - Math.min(r, g, b); acc[0] += r; acc[1] += g; acc[2] += b; acc[3]++; if (sat > bs) { bs = sat; best = [r, g, b]; } }
        const c3 = bs > 40 ? best : acc[3] ? [acc[0] / acc[3], acc[1] / acc[3], acc[2] / acc[3]] : [40, 40, 44];
        return '#' + c3.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
      } catch (e) { return null; }
    }
    document.addEventListener('load', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.dataset && t.dataset.ik) processIcon(t); }, true);
    function setIcons(m) { if (ICONS.indexOf(m) < 0) return false; cfg.icons = m; saveCfg(); R.dataset.ic = m; renderAll(); if (cur === 1) renderApps(); if (cur === 4) renderCom(); log('icons // ' + m); return true; }
    JRL.icons = setIcons;

    /* ---------- tiles and the loadout ---------- */
    function appTile(a, extra, pre) { return '<button type="button" class="tile' + (L.hidden.indexOf(a.key) > -1 ? ' hid' : '') + (NOTI && NOTI[a.pkg] ? ' lit' : '') + '" role="listitem" data-k="' + esc(a.key) + '"' + (extra || '') + '>' + (pre || '') + '<span class="icw">' + iconHTML(a) + '</span><span class="lb">' + esc(cfg.labels === 'name' ? a.label : a.code) + '</span></button>'; }
    function folderTile(id, extra, pre) {
      const f = L.folders[id]; if (!f) return ''; let n = 0;
      const ic = f.apps.slice(0, 4).map(k => { const a = BYKEY[k]; return a ? (cfg.icons === 'code' ? '<span class="fc">' + esc(a.code) + '</span>' : '<img src="' + esc(a.icon) + '" data-ik="' + esc(a.key) + '" alt="" draggable="false">') : ''; }).join('');
      f.apps.forEach(k => { const a = BYKEY[k]; if (a && NOTI) n += NOTI[a.pkg] || 0; });
      return '<button type="button" class="tile' + (n ? ' lit' : '') + '" role="listitem" data-f="' + esc(id) + '"' + (extra || '') + '>' + (pre || '') + '<span class="fold">' + ic + '</span><span class="lb"><span class="f">F/</span>' + esc(f.name) + '</span></button>';
    }
    function renderPins() {
      if (!APPS.length || !L || !L.slots) return;
      $('#pins').innerHTML = L.slots.map((p, i) => {
        const sn = '<span class="sn">' + pad(i + 1) + '</span>', ex = ' data-slot="' + i + '"';
        if (!p) return '<button type="button" class="tile slot-empty"' + ex + ' aria-label="Empty slot ' + (i + 1) + '">' + sn + '<span class="lb">empty</span></button>';
        return p[0] === 'a' ? appTile(BYKEY[p.slice(2)], ex, sn) : folderTile(p.slice(2), ex, sn);
      }).join('');
      fitHome();
    }

    /* ---------- views: the Console, the Manifest, four instruments ---------- */
    function theme() { const t = P.apply(cur); drawColonies(); return t; }
    function go(d, o) {
      o = o || {}; if (typeof d === 'string') d = Math.max(0, VIEWS.indexOf(d)); d = Math.max(0, Math.min(5, d | 0));
      const prev = cur, same = d === prev, from = getComputedStyle(R).getPropertyValue('--fld').trim(); cur = d; R.dataset.deck = VIEWS[d];
      if (d !== 1) assignSlot = null;
      $$('.deck').forEach((s, i) => s.classList.toggle('on', i === d));
      theme(); $('#st-where').textContent = pad(d + 1) + ' ' + CODES[d]; const sl = $('#slate'); if (sl) sl.textContent = pad(d + 1) + ' / 06 ' + NAMES[d];
      $('#in-h').textContent = 'Instruments // ' + pad(d + 1);
      if (!same && !o.quiet) {
        // opening an instrument from the Console is a big move; everything else is a cut
        if (window.JRLsnap) JRLsnap(); HAP('tick');
      }
      if (!o.silent) echo((d === 0 ? 'home' : d === 1 ? 'ls' : 'go ' + CODES[d].toLowerCase()));
      if (!same) log('view // ' + pad(d + 1) + ' ' + NAMES[d].toLowerCase());
      renderView(d); layoutField();
      const deck = $('.deck.on'); if (deck && !o.keepScroll) deck.scrollTop = 0;
      if (d === 0) setTimeout(fitHome, 0);
      return d;
    }
    JRL.go = go; JRL.cur = () => cur;
    function renderView(d) { if (d === 0) renderHome(); else if (d === 1) renderApps(); else if (d === 2) renderAgenda(); else if (d === 3) renderSig(); else if (d === 4) renderCom(); else if (d === 5) renderBio(); }
    function renderAll() { renderPins(); renderHome(); if (cur === 1) renderApps(); }

    /* ---------- 01 the Console: giant time, one line, four instruments, the loadout ---------- */
    const DAY3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const week = d => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y) / 864e5 + 1) / 7); };
    const doy = d => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
    const hm = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
    function dur(ms, secs) { ms = Math.abs(ms); const h = Math.floor(ms / 36e5), m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60; return '-' + pad(h) + ':' + pad(m) + (secs ? ':' + pad(s) : ''); }
    const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
    function nextEv() { const now = Date.now(); return EV.list.filter(e => !e.allDay && e.end > now).sort((a, b) => a.start - b.start)[0] || null; }
    function clock() {
      const d = new Date(); $('#hh').textContent = pad(d.getHours()); $('#mm').textContent = pad(d.getMinutes());
      $('#h-sec').textContent = pad(d.getSeconds()); $('#secbar').style.setProperty('--s', (Math.floor(d.getSeconds() / 5) / 12).toFixed(3));
      $('#h-day').textContent = DAY3[d.getDay()] + ' ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + ' · W' + pad(week(d)) + ' · D' + pad(C.day(), 3);
      $('#h-meta').textContent = 'Day ' + pad(doy(d), 3) + ' / ' + (d.getFullYear() % 4 ? 365 : 366);
      $('#st-time').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
      if (cur === 0) { renderLine(); renderInstrs(); }
      if (cur === 2) agendaTick();
      if (cur === 5) bioTick();
      const tc = $('#tclock'); if (tc && !$('#term').hidden) tc.textContent = window.JRLet.day() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    function renderHome() { clock(); instrCol(); }
    // one line: whatever is happening soonest. A song that's playing beats the next event.
    let lineKey = '';
    function renderLine() {
      const el = $('#h-line'), m = MED, n = nextEv(), now = Date.now();
      const soon = n && n.start - now < 30 * 6e4, mode = soon ? 'agd' : m && m.playing ? 'sig' : n ? 'agd' : m ? 'sig' : 'none', key = mode + (mode === 'sig' ? m.title : mode === 'agd' ? n.id : '');
      if (key !== lineKey) {
        lineKey = key;
        if (mode === 'sig') el.innerHTML = '<button type="button" class="hl-tx" data-go="3"><span class="hl-k">Sig //</span><span class="hl-t"><b id="hl-a"></b><span id="hl-b"></span></span></button><span class="np-ctl"><button type="button" data-mc="prev" aria-label="Previous">◀◀</button><button type="button" data-mc="toggle" id="hl-pp" aria-label="Play or pause">❚❚</button><button type="button" data-mc="next" aria-label="Next">▶▶</button></span>';
        else if (mode === 'agd') el.innerHTML = '<button type="button" class="hl-tx" data-go="2"><span class="hl-k" id="hl-k">Next //</span><span class="hl-t"><b id="hl-a"></b><span id="hl-b"></span></span><span class="hl-c" id="hl-c"></span></button>';
        else el.innerHTML = '<button type="button" class="hl-tx" data-go="2"><span class="hl-k">Clear //</span><span class="hl-t"><b>Nothing scheduled</b><span>nothing playing</span></span></button>';
        fitHome();
      }
      if (mode === 'sig') { $('#hl-a').textContent = m.title; $('#hl-b').textContent = m.artist + ' // ' + mmss(m.pos) + ' / ' + mmss(m.dur); $('#hl-pp').textContent = m.playing ? '❚❚' : '▶'; }
      else if (mode === 'agd') { const on = n.start <= now; $('#hl-k').textContent = on ? 'Now //' : 'Next //'; $('#hl-a').textContent = n.title; $('#hl-b').textContent = hm(n.start) + '–' + hm(n.end) + ' · ' + (n.cal || 'calendar'); $('#hl-c').textContent = on ? 'ends ' + hm(n.end) : 'T' + dur(n.start - now); }
    }
    function renderInstrs() {
      const n = nextEv(), now = Date.now(), m = MED, tot = NOTI ? Object.keys(NOTI).reduce((s, k) => s + (NOTI[k] || 0), 0) : 0, chans = NOTI ? Object.keys(NOTI).filter(k => NOTI[k]).length : 0;
      $('#iv-agd').textContent = n ? (n.start <= now ? 'NOW' : 'T' + dur(n.start - now)) : 'CLEAR';
      $('#il-agd').textContent = n ? hm(n.start) + ' ' + n.title : EV.granted ? 'next 7 days' : 'locked';
      $('#iv-sig').textContent = m ? mmss(m.pos) : 'NO CAR'; const pp = $('#ins-pp'); pp.hidden = !m; pp.textContent = m && m.playing ? '❚❚' : '▶';
      $('#il-sig').textContent = m ? m.title : 'no carrier';
      $('#iv-com').textContent = pad(tot); $('#il-com').textContent = tot ? pad(chans) + ' programs' : 'quiet';
      $('#iv-bio').textContent = 'POP ' + pad(C.pop(), 3); $('#il-bio').textContent = 'd' + pad(C.day(), 3) + ' · ' + (R.dataset.doze ? 'doze' : C.night() ? 'dormant' : 'awake');
    }
    let fitting = false;
    function fitHome() {
      if (fitting || cur !== 0) return; fitting = true;
      const hmn = $('.h-main'), ck = $('#clock');
      ck.style.fontSize = ''; const avail = hmn.clientWidth, cw = ck.scrollWidth; let fs = parseFloat(getComputedStyle(ck).fontSize);
      if (cw > avail * .99) { fs = fs * avail * .97 / cw; ck.style.fontSize = fs + 'px'; }
      let guard = 0; while (hmn.scrollHeight > hmn.clientHeight + 1 && fs > 56 && guard++ < 12) { fs *= .9; ck.style.fontSize = fs + 'px'; }
      fitting = false; placeTags();
    }
    function instrCol() {
      if (!NOTI) return; const b = window.JRLlife.battery(); $('#i-batt').textContent = b.level != null ? Math.round(b.level * 100) + '%' : '--'; $('#i-battbar').style.setProperty('--v', b.level || 0);
      const rows = Object.keys(NOTI).filter(k => NOTI[k]).sort((a, b) => NOTI[b] - NOTI[a]).slice(0, 5), mx = Math.max(1, ...rows.map(k => NOTI[k]));
      $('#i-bars').innerHTML = rows.map(k => { const a = byPkg(k); return '<div><span>' + esc(a ? a.code : k.split('.').pop().slice(0, 6)) + '</span><i style="width:' + Math.ceil(NOTI[k] / mx * 5) * 20 + '%"></i><b>' + pad(NOTI[k]) + '</b></div>'; }).join('') || '<div><span>quiet</span><i style="width:0"></i><b>00</b></div>';
    }

    /* ---------- the status strip: time, signal, colony, power ---------- */
    function pollSignal() {
      let s = null; try { s = B.signal && B.signal(); } catch (e) {}
      const set = (id, n) => { const el = $(id); if (el) el.dataset.n = n == null ? 0 : n; };
      set('#sg-wifi', s && s.wifi); set('#sg-cell', s && s.cell); $('#sg-net').textContent = s && s.net ? s.net : s && s.airplane ? '✈' : '--';
      $('#st-sig').classList.toggle('none', !s);
      $('#st-colt').textContent = 'D' + pad(C.day(), 3);
    }

    /* ---------- 02 the Manifest ---------- */
    let showHidden = false, filterQ = '', topMatch = null;
    function score(a, q) { const l = a.label.toLowerCase(); if (l.indexOf(q) === 0) return 4; if (l.split(/[\s.\-]+/).some(w => w.indexOf(q) === 0)) return 3; if (l.indexOf(q) > -1) return 2; if (a.code.toLowerCase() === q) return 2; if (a.pkg.indexOf(q) > -1) return 1; return 0; }
    function find(q) { q = String(q || '').toLowerCase().trim(); if (!q) return []; return APPS.filter(a => L.hidden.indexOf(a.key) < 0 || showHidden).map(a => [a, score(a, q)]).filter(x => x[1]).sort((x, y) => y[1] - x[1] || uses(y[0]) - uses(x[0]) || x[0].label.localeCompare(y[0].label)).map(x => x[0]); }
    JRL.find = find;
    // the Manifest is a table: number, glyph, code, name, how often you open it. Letters are quiet ruler rows.
    function mRow(a, top) {
      const n = uses(a);
      return '<button type="button" class="mrow' + (L.hidden.indexOf(a.key) > -1 ? ' hid' : '') + (NOTI && NOTI[a.pkg] ? ' lit' : '') + (top ? ' drop' : '') + '" role="listitem" data-k="' + esc(a.key) + '"' + (top ? ' data-top="1"' : '') + '><span class="m-n">' + pad(a.n, 3) + '</span><span class="icw sm">' + iconHTML(a) + '</span><b class="m-c">' + esc(a.code) + '</b><span class="m-l">' + esc(a.label) + '</span><span class="m-u">' + (n ? pad(n, 3) + '×' : '---') + '</span></button>';
    }
    const TH = '<div class="m-th" aria-hidden="true"><span>Prg</span><span></span><span>Code</span><span>Program</span><span>Opened</span></div>';
    function renderApps() {
      const g = $('#a-grid'), list = APPS.filter(a => showHidden || L.hidden.indexOf(a.key) < 0);
      $('#a-n').textContent = pad(list.length, 3); $('#a-hid').textContent = (showHidden ? 'Shown ' : 'Hidden ') + pad(L.hidden.length); $('#a-hid').setAttribute('aria-pressed', showHidden);
      $('#a-ico').textContent = 'Icons // ' + cfg.icons;
      $('#a-meta').textContent = assignSlot != null ? 'Assign // slot ' + pad(assignSlot + 1) : filterQ ? 'find // ' + filterQ : 'A–Z // ' + list.length;
      if (filterQ) {
        const r = find(filterQ); topMatch = r[0] || null;
        g.innerHTML = TH + '<div class="a-cols">' + (r.length ? r.map((a, i) => mRow(a, i === 0)).join('') : '<div class="a-hid-note">no program matches "' + esc(filterQ) + '"</div>') + '</div>';
      } else {
        topMatch = null; let html = TH + '<div class="a-cols">'; const groups = {};
        list.forEach(a => { const c = /[a-z]/i.test(a.label[0]) ? a.label[0].toUpperCase() : '#'; (groups[c] = groups[c] || []).push(a); });
        Object.keys(groups).sort((a, b) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)).forEach(c => { html += '<div class="m-h" data-let="' + c + '"><b>' + c + '</b><i></i><span>' + pad(groups[c].length) + '</span></div>' + groups[c].map(a => mRow(a)).join(''); });
        g.innerHTML = html + '</div>';
      }
    }
    JRL.filter = function (q) { filterQ = String(q || '').trim(); if (filterQ && cur !== 1) go(1, { silent: true }); else if (cur === 1) renderApps(); return find(filterQ); };
    JRL.top = () => topMatch;
    $('#a-find').addEventListener('click', () => { if (window.JRLterm) JRLterm.open('find '); });
    $('#a-hid').addEventListener('click', () => { showHidden = !showHidden; renderApps(); echo(showHidden ? 'ls -a' : 'ls'); HAP('tick'); });
    $('#a-ico').addEventListener('click', () => { const n = ICONS[(ICONS.indexOf(cfg.icons) + 1) % ICONS.length]; setIcons(n); echo('icons ' + n); });

    /* ---------- scrub-to-launch: the lime strip is an A–Z ruler ---------- */
    const strip = $('#bs-prompt'), rulerEl = $('#ruler'), SO = $('#scrubov'), LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
    const letterOf = a => /[a-z]/i.test(a.label[0]) ? a.label[0].toUpperCase() : '#';
    function buildRuler() { if (!L) return; const have = {}; vis().forEach(a => { have[letterOf(a)] = 1; }); rulerEl.innerHTML = LETTERS.map(c => '<b data-l="' + c + '"' + (have[c] ? '' : ' class="dis"') + '>' + c + '</b>').join(''); }
    function matchesFor(l) { return vis().filter(a => letterOf(a) === l).sort((x, y) => uses(y) - uses(x) || x.label.localeCompare(y.label)).slice(0, 6); }
    let sp = null;
    function letterAt(x) { const r = rulerEl.getBoundingClientRect(); return LETTERS[Math.max(0, Math.min(LETTERS.length - 1, Math.floor((x - r.left) / r.width * LETTERS.length)))]; }
    function soRender() {
      const m = sp.matches, a = sp.row >= 0 ? m[sp.row] : null;
      $('#so-l').textContent = sp.letter; $('#so-n').textContent = m.length ? pad(m.length) + (m.length === 6 ? '+' : '') + ' under ' + sp.letter : 'nothing under ' + sp.letter;
      $('#so-giant').textContent = sp.row === -1 ? 'Cancel' : a ? a.label : sp.letter;
      $('#so-list').innerHTML = m.length ? m.map((x, i) => '<div class="so-row' + (i === sp.row ? ' on' : '') + '" data-i="' + i + '"><span class="icw">' + iconHTML(x) + '</span><b>' + esc(x.code) + '</b><span>' + esc(x.label) + '</span><em>' + pad(uses(x), 3) + '×</em></div>').join('') : '<div class="so-row none">No programs under ' + sp.letter + '</div>';
      SO.classList.toggle('cancel', sp.row === -1);
      $$('b', rulerEl).forEach(b => b.classList.toggle('on', b.dataset.l === sp.letter));
      echoNow(sp.row === -1 ? '^C' : a ? 'open ' + cmdName(a) : 'find ' + sp.letter.toLowerCase());
    }
    function soUpdate(e) {
      const sr = strip.getBoundingClientRect(), above = sr.top - e.clientY, z = zoom();
      if (above < 14 * z) {
        const l = letterAt(e.clientX);
        if (l !== sp.letter) { sp.letter = l; sp.matches = matchesFor(l); sp.row = sp.matches.length ? 0 : -2; HAP('tick'); S.tick(.04); soRender(); }
        else if (sp.row !== 0 && sp.matches.length) { sp.row = 0; soRender(); }
        return;
      }
      const rows = $$('.so-row[data-i]', SO); let row = sp.row;
      const hit = rows.find(r => { const b = r.getBoundingClientRect(); return e.clientY >= b.top && e.clientY <= b.bottom; });
      if (hit) row = +hit.dataset.i;
      else if (rows.length) { const top = rows[rows.length - 1].getBoundingClientRect().top; if (e.clientY < top - 24 * z) row = -1; }
      else row = -1;
      if (row !== sp.row) { sp.row = row; HAP('tick'); S.tick(.03); soRender(); }
    }
    function soStart(e) {
      sp.mode = 'scrub'; if (!rulerEl.children.length) buildRuler(); closeOverlays(true);
      SO.hidden = false; R.classList.add('scrubbing'); HAP('click'); S.crackle(); soUpdate(e);
    }
    function soEnd(cancel) {
      const a = !cancel && sp && sp.row >= 0 ? sp.matches[sp.row] : null; SO.hidden = true; R.classList.remove('scrubbing'); SO.classList.remove('cancel');
      $$('b', rulerEl).forEach(b => b.classList.remove('on')); const l = sp.letter; sp = null;
      if (a) launch(a); else { echoNow(lastEcho); HAP('tick'); if (!cancel) log('scrub // cancelled at ' + l); }
    }
    strip.addEventListener('pointerdown', e => {
      if (e.button) return; sp = { x: e.clientX, y: e.clientY, t: Date.now(), mode: 'pending', letter: '', matches: [], row: 0 };
      try { strip.setPointerCapture(e.pointerId); } catch (x) {}
      const ev0 = { clientX: e.clientX, clientY: e.clientY }; sp.hold = setTimeout(() => { if (sp && sp.mode === 'pending') soStart(ev0); }, 280);
    });
    strip.addEventListener('pointermove', e => { if (!sp) return; if (sp.mode === 'pending' && Math.abs(e.clientX - sp.x) > 6 * zoom()) { clearTimeout(sp.hold); soStart(e); } else if (sp.mode === 'scrub') soUpdate(e); });
    strip.addEventListener('pointerup', e => { if (!sp) return; clearTimeout(sp.hold); if (sp.mode === 'pending') { sp = null; if (window.JRLterm) JRLterm.toggle(); return; } soUpdate(e); soEnd(false); });
    strip.addEventListener('pointercancel', () => { if (!sp) return; clearTimeout(sp.hold); if (sp.mode === 'scrub') soEnd(true); else sp = null; });
    strip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (window.JRLterm) JRLterm.toggle(); } });

    /* ---------- 03 Schedule ---------- */
    const DN = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    function fitW(el) { if (!el || !el.offsetParent) return; if (el._fs == null) el._fs = parseFloat(getComputedStyle(el).fontSize); const w = el.parentNode.clientWidth; if (!w) return; el.style.fontSize = el._fs + 'px'; const sw = el.scrollWidth; if (sw > w) el.style.fontSize = Math.floor(el._fs * w / sw * .98) + 'px'; }
    function evRow(e) {
      const past = e.end < Date.now(), tm = e.allDay ? 'ALL<small>DAY</small>' : hm(e.start) + '<small>' + hm(e.end) + '</small>';
      return '<button type="button" class="g-ev' + (past ? ' past' : '') + '" data-ev="' + esc(e.id) + '" style="--evc:' + esc(e.color || 'var(--sig)') + '"><span class="tm">' + tm + '</span><i></i><span><b>' + esc(e.title) + '</b><span class="cl">' + esc(e.cal || 'calendar') + '</span></span></button>';
    }
    function renderAgenda() {
      const gl = $('#g-list'), wk = $('#g-week'); $('#g-grant').hidden = EV.granted;
      if (!EV.granted) { gl.innerHTML = '<div class="g-none">Calendar locked // grant access to see the next 7 days</div>'; wk.innerHTML = ''; agendaTick(); return; }
      const d0 = new Date(); d0.setHours(0, 0, 0, 0); let html = '', wh = '';
      for (let i = 0; i < 7; i++) {
        const a = +d0 + i * 864e5, b = a + 864e5, dd = new Date(a), list = EV.list.filter(e => e.start < b && e.end > a).sort((x, y) => (y.allDay ? 1 : 0) - (x.allDay ? 1 : 0) || x.start - y.start);
        wh += '<button type="button" class="g-day' + (i === 0 ? ' today' : '') + '" data-day="' + i + '"><span>' + DN[dd.getDay()] + '</span><span class="dn">' + pad(dd.getDate()) + '</span><span class="db">' + list.slice(0, 6).map(() => '<i></i>').join('') + '</span></button>';
        html += '<div class="g-dh" id="g-d' + i + '"><span>' + (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYN[dd.getDay()]) + ' ' + pad(dd.getDate()) + '.' + pad(dd.getMonth() + 1) + '</span><span>D' + pad(C.day() + i, 3) + ' · ' + pad(list.length) + '</span></div>' + (list.length ? list.map(evRow).join('') : '<div class="g-none">clear</div>');
      }
      wk.innerHTML = wh; gl.innerHTML = html; agendaTick(); $('#g-meta').textContent = pad(EV.list.length) + ' events // 7 days';
    }
    function agendaTick() {
      const n = nextEv(), now = Date.now();
      if (!n) { $('#g-cap').textContent = EV.granted ? 'Next // none' : 'Calendar // locked'; $('#g-cd').textContent = 'T-  :  :  '; $('#g-t').textContent = EV.granted ? 'Clear for 7 days' : 'No access'; $('#g-w').textContent = ''; return; }
      const on = n.start <= now; $('#g-cap').textContent = on ? 'Now // running, ends in' : 'Next // in';
      $('#g-cd').textContent = 'T' + dur(on ? n.end - now : n.start - now, true); fitW($('#g-cd'));
      $('#g-t').textContent = n.title; $('#g-t').dataset.ev = n.id; $('#g-w').textContent = hm(n.start) + '–' + hm(n.end) + ' · ' + (n.cal || 'calendar');
    }
    $('#g-week').addEventListener('click', e => { const b = e.target.closest('.g-day'); if (!b) return; const h = $('#g-d' + b.dataset.day), dk = $('.deck.on'); if (h && dk) dk.scrollTop = h.offsetTop - 60; HAP('tick'); echo('cal +' + b.dataset.day); });
    $('#g-open').addEventListener('click', () => { echo('cal open'); B.openCalendar(); });
    $('#g-grant').addEventListener('click', () => { echo('cal grant'); B.askCalendar(); });
    $('#g-t').addEventListener('click', e => { const id = e.currentTarget.dataset.ev; if (id) { echo('cal open ' + id); B.openEvent(id); } });
    function loadEvents() { return B.events(7).then(r => { EV = r || { granted: false, list: [] }; if (cur === 0) { lineKey = ''; clock(); } if (cur === 2) renderAgenda(); }).catch(() => {}); }

    /* ---------- 04 Signal ---------- */
    function pollMedia() { let m = null; try { m = B.media(); } catch (e) {} MED = m; if (m && m.playing) R.dataset.playing = '1'; else delete R.dataset.playing; if (cur === 3) renderSig(); }
    function renderSig() {
      const m = MED; $('#s-body').hidden = !m; $('#s-none').hidden = !!m; $('#s-src').textContent = m ? 'via ' + (m.app || m.pkg || 'player') + ' ↗' : '';
      if (!m) return; const p = m.dur ? Math.min(1, m.pos / m.dur) : 0; $('#s-ring').style.setProperty('--p', (Math.floor(p * 60) / 60).toFixed(4));
      $('#s-pct').textContent = pad(Math.round(p * 100), 3) + '%'; $('#s-tc').innerHTML = mmss(m.pos) + '<span> / ' + mmss(m.dur) + '</span>'; fitW($('#s-tc'));
      if ($('#s-title').textContent !== m.title) $('#s-title').textContent = m.title;
      $('#s-artist').textContent = m.artist; const im = $('#s-art'); if (m.art && im.getAttribute('src') !== m.art) im.src = m.art;
    }
    function media(c) { try { B.mediaCmd(c); } catch (e) {} HAP('click'); echo(c === 'toggle' ? (MED && MED.playing ? 'pause' : 'play') : c); log('signal // ' + c); setTimeout(() => { pollMedia(); if (cur === 0) { renderLine(); renderInstrs(); } }, 60); }
    JRL.media = media; JRL.np = () => MED;
    document.addEventListener('click', e => { const b = e.target.closest('[data-mc]'); if (b) { e.stopPropagation(); media(b.dataset.mc); } }, true);
    $('#s-artb').addEventListener('click', () => { const a = $('#s-artb'); a.classList.toggle('orig'); echo(a.classList.contains('orig') ? 'art raw' : 'art duo'); S.shutter(); });
    $('#s-src').addEventListener('click', () => { const a = MED && byPkg(MED.pkg); if (a) launch(a); });
    const eq = $('#s-eq'), ex = eq.getContext('2d'); let eqLv = [];
    function eqFrame() {
      const w = eq.clientWidth, h = eq.clientHeight; if (!w) return; const dpr = Math.min(2, devicePixelRatio || 1);
      if (eq.width !== Math.round(w * dpr)) { eq.width = Math.round(w * dpr); eq.height = Math.round(h * dpr); }
      const u = 8 * dpr, cols = Math.floor(eq.width / u), rows = Math.floor(eq.height / u), ink = getComputedStyle(eq).color, live = MED && MED.playing && R.dataset.life !== 'low' && visible;
      ex.clearRect(0, 0, eq.width, eq.height);
      for (let i = 0; i < cols; i++) {
        const tgt = live ? Math.max(1, Math.round(rows * (.25 + .6 * Math.abs(Math.sin(i * .37 + performance.now() / 260)) * Math.random()))) : 1;
        eqLv[i] = eqLv[i] == null ? tgt : tgt > eqLv[i] ? tgt : Math.max(tgt, eqLv[i] - 1);
        for (let j = 0; j < rows; j++) { ex.globalAlpha = j < eqLv[i] ? 1 : .18; ex.fillStyle = ink; ex.beginPath(); ex.arc(i * u + u / 2, eq.height - j * u - u / 2, u * .32, 0, 7); ex.fill(); }
      }
      ex.globalAlpha = 1;
    }
    setInterval(() => { if (cur === 3 && visible && !document.hidden) eqFrame(); }, 33);

    /* ---------- 05 Comms: counts live here; arrivals run across the strip ---------- */
    function pollNotifs() {
      let n = {}; try { n = B.notifs() || {}; } catch (e) {}
      const first = NOTI === null, old = NOTI || {}, ch = JSON.stringify(n) !== JSON.stringify(old);
      if (!first) Object.keys(n).forEach(k => { if ((n[k] || 0) > (old[k] || 0)) { const a = byPkg(k); C.drop(); drawField(true); setTimeout(() => drawField(), 66); ticker('INCOMING // ' + (a ? a.label : k.split('.').pop()).toUpperCase() + ' ' + pad(n[k])); log('comms // ' + (a ? cmdName(a) : k) + ' ' + pad(n[k]), true); } });
      NOTI = n; if (ch || first) { renderPins(); if (cur === 4) renderCom(); if (cur === 0) renderInstrs(); instrCol(); }
    }
    function renderCom() {
      const N = NOTI || {}, ks = Object.keys(N).filter(k => N[k] > 0).sort((a, b) => N[b] - N[a]), tot = ks.reduce((s, k) => s + N[k], 0);
      $('#c-n').textContent = pad(tot); $('#c-sub').innerHTML = 'unread across<br>' + pad(ks.length) + ' programs'; $('#c-meta').textContent = tot ? 'signal // incoming' : 'quiet';
      $('#c-rows').innerHTML = ks.length ? ks.map(k => { const a = byPkg(k); return '<button type="button" class="c-row"' + (a ? ' data-k="' + esc(a.key) + '"' : '') + '>' + (a ? '<span class="icw sm">' + iconHTML(a) + '</span>' : '<i></i>') + '<b>' + esc(a ? a.label : k) + '</b><span class="cn">' + pad(N[k]) + '</span><span class="blk">' + '<i></i>'.repeat(Math.min(12, N[k])) + '</span></button>'; }).join('') : '<div class="c-none">No incoming. All channels quiet.</div>';
      $('#c-sess').textContent = 'up ' + upStr(); renderFeed();
    }
    $('#c-shade').addEventListener('click', () => { echo('shade'); B.expand(); HAP('tick'); });
    const upStr = () => { const s = Math.floor((Date.now() - T0) / 1000); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); };

    /* ---------- 06 Bio ---------- */
    function renderBio() {
      const s0 = C.state(), b = window.JRLlife.battery(), pref = window.JRLlife.pref();
      $('#b-stats').innerHTML = [['Day', pad(C.day(), 3)], ['Pop', pad(C.pop(), 3)], ['Gen', String(s0.gen)], ['Energy', Math.round(C.energy() * 100) + '%'], ['Lost', pad(s0.lost || 0)], ['Mut', String(s0.mut || 0)]].map(x => '<div><b>' + x[1] + '</b><span>' + x[0] + '</span></div>').join('');
      $('#b-state').textContent = 'colony // ' + (R.dataset.doze ? 'dozing' : C.night() ? 'dormant' : 'awake');
      $('#b-batt').textContent = b.level != null ? Math.round(b.level * 100) + '%' : '--';
      $('#b-chg').innerHTML = (b.charging ? 'charging' : 'on battery') + (b.saver ? '<br>power saver' : '') + '<br>bridge ' + (B.mock ? 'mock' : 'live');
      $('#b-life-st').textContent = (pref === 'auto' ? 'auto // ' : '') + R.dataset.life;
      $$('#b-life-seg button').forEach(x => x.setAttribute('aria-pressed', x.dataset.life === pref));
      $('#b-life-cap').textContent = R.dataset.life === 'low' ? 'LOW: bursts at half rate, no EQ, no escapes, launch burst becomes a cut. Reason: ' + window.JRLlife.why() + '.' : 'FULL: every loop runs. Drops to LOW by itself under 20% battery, on power saver, data saver or reduced motion. Reason now: ' + window.JRLlife.why() + '.';
      const dv = B.device() || {};
      $('#b-dev').innerHTML = [['Node', 'JRL-01'], ['Unit', (dv.name || 'android') + ' // ' + (dv.model || '?')], ['Android', dv.android || '?'], ['Shell', 'jrl launcher ' + (B.version() || '?')], ['UI', 'v2.2 // 30fps grid'], ['Palette', P.get().n + ' // ' + P.mode()], ['Session', upStr()], ['Launches', pad(launches, 4)]].map(x => '<div><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></div>').join('');
      bioHex(); drawColonies();
    }
    function bioTick() { const s = $$('#b-dev b')[6]; if (s) s.textContent = upStr(); }
    function bioHex() { const L2 = []; for (let r = 0; r < C.H; r++) L2.push('R' + pad(r) + '  ' + C.genome(r).replace(/(.{4})/g, '$1 ') + ' ' + rint(256).toString(16).toUpperCase().padStart(2, '0')); $('#b-hex').textContent = L2.join('\n'); }
    $('#b-life-seg').addEventListener('click', e => { const b = e.target.closest('button[data-life]'); if (b) setLife(b.dataset.life); });
    function setLife(v) { if (['auto', 'full', 'low'].indexOf(v) < 0) return false; window.JRLlife(v); echo('life ' + v); HAP('tick'); log('life support // ' + v + ' (' + R.dataset.life + ')', true); if (cur === 5) renderBio(); lifeChip(); return true; }
    JRL.life = setLife;
    function lifeChip() { $('#bs-life').textContent = 'Life // ' + R.dataset.life; }
    window.JRLonLife = function () { lifeChip(); if (cur === 5) renderBio(); };
    $('#bs-life').addEventListener('click', () => { const o = ['auto', 'full', 'low']; setLife(o[(o.indexOf(window.JRLlife.pref()) + 1) % 3]); });
    window.JRLonBattery = function (b) { battUI(b); };
    function battUI(b) { b = b || window.JRLlife.battery(); const el = $('#batt'); el.style.setProperty('--b', b.level != null ? b.level : .5); el.classList.toggle('low', b.level != null && b.level < .2 && !b.charging); el.classList.toggle('chg', !!b.charging); $('#batt-n').textContent = b.level != null ? Math.round(b.level * 100) : '--'; instrCol(); if (cur === 5) renderBio(); }
    function pollBattery() { let b = null; try { b = B.battery(); } catch (e) {} if (b) window.JRLlife.battery(b); battUI(); }

    /* ---------- the colony ---------- */
    function drawCv(cv, flash) {
      if (!cv) return; const x = cv.getContext('2d'), cells = C.cells(), e = C.energy(), col = getComputedStyle(R).getPropertyValue('--sig').trim() || '#c2ff16';
      x.fillStyle = '#000'; x.fillRect(0, 0, C.W, C.H); x.globalAlpha = .35 + .65 * e; x.fillStyle = flash ? '#fff' : col;
      for (let i = 0; i < cells.length; i++) if (cells[i]) x.fillRect(i % C.W, (i / C.W) | 0, 1, 1); x.globalAlpha = 1;
    }
    // the Console's wallpaper: the 32×18 culture in square cells, cropped to fill, turned upright on a tall screen
    const FC = $('#fcol');
    function drawField(flash) {
      if (!FC || cur !== 0) return; const w = FC.clientWidth, h = FC.clientHeight; if (!w || !h) return;
      const port = h > w, cols = port ? C.H : C.W, rows = port ? C.W : C.H, s = Math.ceil(Math.max(w / cols, h / rows)), dpr = Math.min(2, devicePixelRatio || 1);
      if (FC.width !== Math.round(w * dpr) || FC.height !== Math.round(h * dpr)) { FC.width = Math.round(w * dpr); FC.height = Math.round(h * dpr); }
      const x = FC.getContext('2d'), ox = Math.round((w - cols * s) / 2), oy = Math.round((h - rows * s) / 2), cells = C.cells(), cs = getComputedStyle(R);
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
      x.fillStyle = flash ? cs.getPropertyValue('--hl').trim() : cs.getPropertyValue('--ink').trim();
      x.globalAlpha = (R.dataset.reg === 'white' ? .075 : .1) * (.45 + .55 * C.energy()) * (C.night() ? .6 : 1) * (flash ? 2.4 : 1);
      for (let i = 0; i < cells.length; i++) if (cells[i]) { const cx = i % C.W, cy = (i / C.W) | 0, gx = port ? cy : cx, gy = port ? cx : cy; x.fillRect(ox + gx * s + 1, oy + gy * s + 1, s - 2, s - 2); }
      x.globalAlpha = 1; FC._g = { port: port, s: s, ox: ox, oy: oy };
    }
    function cellAt(px, py) { const g = FC._g; if (!g) return null; const gx = Math.floor((px - g.ox) / g.s), gy = Math.floor((py - g.oy) / g.s); return g.port ? [gy, gx] : [gx, gy]; }
    function cellXY(cx, cy) { const g = FC._g; if (!g) return [0, 0]; const gx = g.port ? cy : cx, gy = g.port ? cx : cy; return [g.ox + gx * g.s + g.s / 2, g.oy + gy * g.s + g.s / 2]; }
    function drawColonies(flash) { drawField(flash); drawCv($('#col-cv2'), flash); if (cur === 5) drawCv($('#b-cv'), flash); }
    function colonyTick() {
      const ev = C.step(); drawColonies(); $('#bio-st').textContent = 'colony d' + pad(C.day(), 3) + ' · ' + (R.dataset.doze ? 'dozing' : C.night() ? 'dormant' : 'awake');
      if (cur === 0) renderInstrs();
      if (cur === 5) { const st = $$('#b-stats b'); if (st.length) { st[1].textContent = pad(C.pop(), 3); st[2].textContent = String(C.state().gen); st[5].textContent = String(C.state().mut || 0); } }
      if (ev === 'molt') { S.molt(); log('colony // molted · pop ' + C.pop(), true); drawColonies(true); setTimeout(drawColonies, 66); }
      else if (ev === 'bloom') { S.crackle(); log('colony // bloomed from its genome'); }
    }
    let fedT = 0;
    function feed(why, quiet) {
      if (Date.now() - fedT < 4000 && why !== 'launch') return false; fedT = Date.now(); C.feed(why === 'launch' ? 4 : 8); drawColonies(true); setTimeout(drawColonies, 66);
      if (!quiet) { S.feed(); HAP('click'); }
      log(why === 'visit' ? 'colony // fed by your return' : why === 'launch' ? 'colony // fed by launch ' + pad(launches, 4) : 'colony // fed', true);
      if (!why) echo('colony feed'); if (cur === 5) renderBio(); return true;
    }
    JRL.feed = () => feed(); JRL.colony = () => 'colony day ' + pad(C.day(), 3) + ' · pop ' + C.pop() + ' · gen ' + C.state().gen + ' · energy ' + Math.round(C.energy() * 100) + '% · lost ' + (C.state().lost || 0);
    $('#col-cv2').addEventListener('click', () => feed()); $('#b-cvw').addEventListener('click', () => feed());
    if (C.died) setTimeout(() => { log('colony // died after ' + C.died.days + ' days unfed · memorial ' + pad(C.died.lost), true); S.die(); }, 3000);
    if (Date.now() - C.state().fed > 10 * 60e3) setTimeout(() => feed('visit'), 2600);
    let lastAct = Date.now();
    function act() { lastAct = Date.now(); if (!R.dataset.doze) return; delete R.dataset.doze; if (window.JRLsnap) JRLsnap(); S.wake(); log('colony // awake'); }
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, act, { capture: true, passive: true }));
    setInterval(() => { if (!R.dataset.doze && visible && Date.now() - lastAct > 120000) { R.dataset.doze = '1'; S.doze(); log('colony // dozing'); } }, 5000);
    function escape() {
      if (!visible || R.dataset.doze || R.dataset.life === 'low' || reduce || cur !== 0 || DEV.querySelector('#index:not([hidden]),#cli:not([hidden]),#sheet:not([hidden])')) return;
      const fx = $('.fieldfx'), live = []; C.cells().forEach((c, i) => { if (c) live.push(i); }); if (!live.length) return;
      const i0 = live[rint(live.length)], p0 = cellXY(i0 % C.W, (i0 / C.W) | 0), x0 = p0[0], y0 = p0[1], bugs = [];
      for (let i = 0; i < 4; i++) { const d = document.createElement('i'); d.className = 'esc'; fx.appendChild(d); bugs.push({ el: d, x: x0 + rint(40), y: y0 + i * 10 }); }
      S.skitter(); log('colony // cells escaped'); let n = 0;
      const iv = setInterval(() => { bugs.forEach(b => { b.x -= 7 + (rint(3) - 1) * 7; b.y -= 14; b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px)'; }); if (++n > 34 || bugs[0].y < 0) { clearInterval(iv); bugs.forEach(b => b.el.remove()); } }, 100);
    }
    (function esc2() { setTimeout(() => { escape(); esc2(); }, 180000 + Math.random() * 180000); })();

    /* ---------- the field: rulers, coordinate tags, reticle ---------- */
    const G = 56;
    function layoutField() {
      const m = $('main'), w = m.clientWidth, h = m.clientHeight; let hx = '', hy = '';
      for (let x = G * 2; x < w; x += G * 2) hx += '<span style="left:' + x + 'px">' + pad(x / G) + '</span>';
      for (let y = G * 2; y < h; y += G * 2) hy += '<span style="top:' + y + 'px">' + pad(y / G) + '</span>';
      $('.ruler-x').innerHTML = hx; $('.ruler-y').innerHTML = hy; placeTags();
    }
    function placeTags() {
      const c1 = $('#ct1'), c2 = $('#ct2'); if (cur !== 0) return;
      const air = $('#h-air'), m = $('main'), mr = m.getBoundingClientRect(), ar = air.getBoundingClientRect(), z = zoom(), cols = Math.floor(m.clientWidth / G);
      const r1 = Math.ceil(((ar.top - mr.top) / z + 8) / G), r2 = Math.floor(((ar.bottom - mr.top) / z - 22) / G);
      if (r2 < r1) { c1.style.visibility = c2.style.visibility = 'hidden'; return; }
      c1.style.visibility = c2.style.visibility = '';
      c1.style.left = (G * Math.max(2, cols - 3)) + 'px'; c1.style.top = (G * r2) + 'px'; c2.style.left = G + 'px'; c2.style.top = (G * r1) + 'px'; if (r1 === r2) c2.style.visibility = 'hidden';
      if (!c1.textContent) { c1.textContent = tagText(); c2.textContent = tagText(); }
    }
    const tagText = () => pad(rint(99)) + '·' + pad(rint(99)) + ' // ' + (Math.random() * 9).toFixed(3);
    let retT = 0;
    function reticle(e) {
      const m = $('main'), r = m.getBoundingClientRect(), z = zoom(), c = Math.round((e.clientX - r.left) / z / G), rr = Math.round((e.clientY - r.top) / z / G);
      const ret = $('#reticle'); ret.hidden = false; ret.style.transform = 'translate(' + (c * G) + 'px,' + (rr * G) + 'px)'; ret.textContent = 'C ' + pad(c) + ' · R ' + pad(rr);
      HAP('tick'); S.tick(.05); clearTimeout(retT); retT = setTimeout(() => { ret.hidden = true; }, 1400);
      if (cur === 0) { const k = cellAt((e.clientX - r.left) / z, (e.clientY - r.top) / z); if (k) { C.plant(k[0], k[1]); S.feed(); drawField(true); setTimeout(() => drawField(), 66); ret.textContent = 'PLANT ' + pad(k[0]) + '·' + pad(k[1]); log('colony // planted at ' + pad(k[0]) + '·' + pad(k[1]), true); echo('colony plant ' + k[0] + ' ' + k[1], true); renderInstrs(); } }
    }
    // unfolding the Fold7 is a big move
    let wasWide = null;
    function checkFold() {
      const w = DEV.clientWidth >= 700; if (wasWide === null) { wasWide = w; return; } if (w === wasWide) return; wasWide = w;
      if (booted && !reduce && R.dataset.life !== 'low') { window.JRLcut({ kind: 'flip', label: w ? 'Stage' : 'Cover', n: w ? '12 COL' : '04 COL' }); HAP('heavy'); }
      log('display // ' + (w ? 'unfolded · 12-column stage' : 'folded · cover'), true); renderAll();
    }
    window.addEventListener('resize', () => { checkFold(); layoutField(); fitHome(); $$('.g-cd,.s-tc').forEach(e => { e._fs = null; e.style.fontSize = ''; fitW(e); }); });

    /* ---------- background bursts: every 2–4s, 1–3 things update over 3 frames, then hold ---------- */
    const GL = $('#in-glyphs'), HX = $('#in-hex'), BC = $('#in-bc'); let hexLines = [], gRow = 0;
    function glyph() { let cols = []; for (let c = 0; c < 3; c++) { const col = []; for (let r = 0; r < 5; r++) col.push(Math.random() < .5); cols.push(col); } cols = [cols[0], cols[1], cols[2], cols[1], cols[0]]; let s = ''; for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) s += '<b' + (cols[c][r] ? ' class="on"' : '') + '></b>'; return '<div class="glyph">' + s + '</div>'; }
    function glyphs(n) { if (!GL.children.length || n === 4) { GL.innerHTML = glyph() + glyph() + glyph() + glyph() + glyph() + glyph(); return; } const g = GL.children[rint(GL.children.length)], b = g.children; for (let i = 0, m = 1 + rint(3); i < m; i++) { const r = rint(5), c = rint(3), on = !b[r * 5 + c].classList.contains('on'); b[r * 5 + c].classList.toggle('on', on); b[r * 5 + 4 - c].classList.toggle('on', on); } }
    function hexRows(n) { for (let i = 0; i < n; i++) { hexLines.push('R' + pad(gRow) + '  ' + C.genome(gRow).replace(/(.{4})/g, '$1 ') + rint(256).toString(16).toUpperCase().padStart(2, '0')); gRow = (gRow + 1) % C.H; if (hexLines.length > 6) hexLines.shift(); } HX.textContent = hexLines.join('\n'); }
    function barcode() { let h = ''; for (let i = 0; i < 44; i++) h += '<span style="width:' + (1 + rint(3)) + 'px;margin-right:' + (1 + rint(3)) + 'px"></span>'; BC.innerHTML = h; }
    glyphs(4); hexRows(6); barcode();
    const TK = [f => glyphs(f === 2 ? 0 : 1), () => hexRows(1), f => { if (f !== 1) barcode(); }, f => { $('#ct1').textContent = tagText(); if (f === 2) $('#ct2').textContent = tagText(); }, () => { $('#in-led').classList.toggle('on'); $('#st-led').classList.toggle('on'); }, f => { if (cur === 5 && f === 0) bioHex(); }];
    (function loop() {
      setTimeout(() => {
        if (visible && !document.hidden) {
          if (!C.night() || Math.random() < .3) colonyTick();
          if (!reduce) for (let i = 0, n = 1 + rint(3); i < n; i++) (fn => { fn(0); setTimeout(() => fn(1), 33); setTimeout(() => fn(2), 66); })(TK[rint(TK.length)]);
        }
        loop();
      }, (2000 + Math.random() * 2000) * (R.dataset.doze ? 3 : 1) * (C.night() ? 1.6 : 1) * (R.dataset.life === 'low' ? 2 : 1));
    })();

    /* ---------- launching: the app starts on frame 0; the burst covers Android's own load time ---------- */
    function launch(a, o) {
      o = o || {}; if (!a) return false; closeOverlays(true); if (window.JRLterm && JRLterm.isOpen()) JRLterm.close(true);
      if (!(cfg.launch === 'burst' && !reduce && R.dataset.life !== 'low')) HAP('click'); if (!o.silent) echo('open ' + cmdName(a)); launches++; store.set('jrl-l-launches', String(launches)); used(a);
      log('exec // ' + a.pkg + ' // prg ' + pad(a.n, 3), true);
      if (launches % 5 === 0) setTimeout(() => feed('launch', true), 400);
      try { B.launch(a); } catch (e) { log('exec // failed ' + a.pkg, true); }
      const big = cfg.launch === 'burst' && !reduce && R.dataset.life !== 'low';
      if (big) { const pid = 1000 + rint(30000); window.JRLcut({ kind: 'launch', col: a.col || getComputedStyle(R).getPropertyValue('--acc').trim(), label: a.label, n: 'PRG ' + pad(a.n, 3), lines: ['$ exec ' + a.pkg, 'am start -n ' + a.pkg + '/' + (a.act || '.Main').replace(a.pkg, ''), 'pid ' + pid + ' // uid u0_a' + (100 + a.n), 'code ' + a.code + ' // prg ' + pad(a.n, 3), 'handoff → surface 0', 'jrl: going dark'] }); }
      else if (window.JRLsnap) JRLsnap();
      return true;
    }
    JRL.launch = launch; JRL.apps = () => APPS; JRL.byKey = k => BYKEY[k]; JRL.layout = () => L; JRL.code = codeOf; JRL.cmdName = cmdName; JRL.uses = uses;

    /* ---------- loadout, folders, hidden ---------- */
    const slotOf = a => L.slots.indexOf('a:' + a.key);
    const folderOf = a => Object.keys(L.folders).find(id => L.folders[id].apps.indexOf(a.key) > -1);
    JRL.pin = function (a, slot) {
      if (slotOf(a) > -1 && slot == null) return 'already in slot ' + pad(slotOf(a) + 1);
      const s = slot != null ? slot : L.slots.indexOf(null); if (s < 0 || s > 15) return 'loadout full // 16 of 16. clear a slot first';
      const was = slotOf(a); if (was > -1) L.slots[was] = null; const fid = folderOf(a); if (fid) outOfFolder(a, true);
      L.slots[s] = 'a:' + a.key; saveL(); renderPins(); log('loadout // ' + cmdName(a) + ' → slot ' + pad(s + 1)); return '';
    };
    JRL.unpin = function (a) { const i = slotOf(a); if (i < 0) return 'not in the loadout'; L.slots[i] = null; saveL(); renderPins(); log('loadout // cleared slot ' + pad(i + 1)); return ''; };
    JRL.move = function (a, dir) { const i = slotOf(a), j = i + dir; if (i < 0 || j < 0 || j > 15) return false; const t = L.slots[j]; L.slots[j] = L.slots[i]; L.slots[i] = t; saveL(); renderPins(); return true; };
    JRL.hide = function (a, v) { const i = L.hidden.indexOf(a.key); if (v && i < 0) { L.hidden.push(a.key); if (slotOf(a) > -1) L.slots[slotOf(a)] = null; } else if (!v && i > -1) L.hidden.splice(i, 1); saveL(); renderPins(); buildRuler(); if (cur === 1) renderApps(); log('manifest // ' + (v ? 'hid ' : 'unhid ') + cmdName(a)); return true; };
    function toFolder(a, fid) {
      const was = folderOf(a); if (was === fid) return fid; if (was) outOfFolder(a, true);
      const si = slotOf(a);
      if (!fid) { fid = 'f' + Date.now().toString(36); L.folders[fid] = { name: 'Folder', apps: [a.key] }; if (si > -1) L.slots[si] = 'f:' + fid; else { const e = L.slots.indexOf(null); if (e > -1) L.slots[e] = 'f:' + fid; } }
      else { L.folders[fid].apps.push(a.key); if (si > -1) L.slots[si] = null; }
      saveL(); renderPins(); log('loadout // ' + cmdName(a) + ' → F/' + L.folders[fid].name.toLowerCase()); return fid;
    }
    function outOfFolder(a, quiet) {
      const fid = folderOf(a); if (!fid) return; const f = L.folders[fid]; f.apps.splice(f.apps.indexOf(a.key), 1);
      const si = L.slots.indexOf('f:' + fid);
      if (f.apps.length <= 1) { const rest = f.apps[0]; delete L.folders[fid]; if (si > -1) L.slots[si] = rest ? 'a:' + rest : null; }
      if (!quiet) { const e = L.slots.indexOf(null); if (slotOf(a) < 0 && e > -1) L.slots[e] = 'a:' + a.key; saveL(); renderPins(); }
    }
    function ungroup(fid) { const f = L.folders[fid]; if (!f) return; const si = L.slots.indexOf('f:' + fid); delete L.folders[fid]; if (si > -1) L.slots[si] = null; f.apps.forEach(k => { const e = L.slots.indexOf(null); if (e > -1) L.slots[e] = 'a:' + k; }); saveL(); renderPins(); log('loadout // ungrouped F/' + f.name.toLowerCase()); }

    /* ---------- overlays: index, the program file, folder ---------- */
    const IX = $('#index'), SH = $('#sheet'), FO = $('#folder');
    function stepIn(el) { if (reduce) return; el.classList.remove('stepin'); void el.offsetWidth; el.classList.add('stepin'); }
    function closeOverlays(quiet) { let any = false; [IX, SH, FO].forEach(o => { if (!o.hidden) { o.hidden = true; any = true; } }); if (any && !quiet && window.JRLsnap) JRLsnap(); return any; }
    JRL.close = closeOverlays;
    function idxCount(i) {
      if (i === 0) { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
      if (i === 1) return pad(APPS.length - L.hidden.length, 3) + ' programs';
      if (i === 2) { const n = nextEv(); return n ? 'next ' + hm(n.start) : 'clear'; }
      if (i === 3) return MED ? (MED.playing ? 'playing' : 'paused') : 'no carrier';
      if (i === 4) return pad(NOTI ? Object.keys(NOTI).reduce((s, k) => s + (NOTI[k] || 0), 0) : 0) + ' unread';
      return 'pop ' + pad(C.pop(), 3);
    }
    function seg(name, opts, curv) { return '<div class="seg" data-sys="' + name + '">' + opts.map(o => '<button type="button" data-v="' + o + '" aria-pressed="' + (o === curv) + '">' + o + '</button>').join('') + '</div>'; }
    function setLabels(m) { if (m !== 'code' && m !== 'name') return false; cfg.labels = m; saveCfg(); renderPins(); echo('set labels ' + m); log('labels // ' + m); return true; }
    JRL.labels = setLabels;
    function buildIndex() {
      const Pl = P.get(), sw = p => '<span class="sw6">' + [p.sig].concat(p.c.slice(1)).map(c => '<i style="background:' + c + '"></i>').join('') + '<i style="background:' + p.k + '"></i><i style="background:' + p.l + '"></i></span>';
      IX.innerHTML = '<div class="ihead"><span>SYS // this unit</span><span>back closes</span></div>' +
        '<div class="isys"><div class="ph"><span>Palette // ' + pad(P.list.indexOf(Pl) + 1) + ' of ' + P.list.length + '</span><span>' + esc(Pl.n) + '</span></div><div class="ipals">' +
        P.list.map((p, i) => '<button type="button" data-pal="' + p.id + '" aria-pressed="' + (p.id === Pl.id) + '"><span>' + pad(i + 1) + ' ' + esc(p.n) + '</span>' + sw(p) + '</button>').join('') + '</div></div>' +
        '<div class="isys"><div class="ph"><span>Look and feel</span><span></span></div>' +
        '<div class="irow"><span>Register</span>' + seg('mode', ['auto', 'white', 'dark'], P.mode()) + '</div>' +
        '<div class="irow"><span>Icons</span>' + seg('icons', ICONS, cfg.icons) + '</div>' +
        '<div class="irow"><span>Labels</span>' + seg('labels', ['code', 'name'], cfg.labels) + '</div>' +
        '<div class="irow"><span>Sound</span>' + seg('sound', ['off', 'on'], S.on() ? 'on' : 'off') + '</div>' +
        '<div class="irow"><span>Haptics</span>' + seg('haptics', ['on', 'off'], HAP.on() ? 'on' : 'off') + '</div>' +
        '<div class="irow"><span>Life</span>' + seg('life', ['auto', 'full', 'low'], window.JRLlife.pref()) + '</div>' +
        '<div class="irow"><span>Launch</span>' + seg('launch', ['burst', 'cut'], cfg.launch) + '</div>' +
        '<div class="irow"><span>Android bars</span>' + seg('bars', ['off', 'on'], cfg.bars) + '</div>' +
        '<div class="irow"><span>Boot</span>' + seg('boot', ['smart', 'always', 'off'], cfg.boot) + '</div>' +
        '</div><div class="ifoot"><span>JRL launcher v2.2 // ' + (B.mock ? 'mock bridge' : 'live') + '</span><span>colony d' + pad(C.day(), 3) + ' · pop ' + pad(C.pop(), 3) + '</span></div>';
    }
    function openIndex() { if (!IX.hidden) { closeOverlays(); return; } closeOverlays(true); buildIndex(); IX.hidden = false; stepIn(IX); HAP('tick'); if (window.JRLsnap) JRLsnap(); echo('index'); }
    JRL.index = openIndex;
    IX.addEventListener('click', e => {
      const g = e.target.closest('[data-go]'); if (g) { e.stopPropagation(); IX.hidden = true; go(+g.dataset.go); return; }
      const pp = e.target.closest('button[data-pal]'); if (pp) { setPalette(pp.dataset.pal); buildIndex(); return; }
      const pb = e.target.closest('[data-pstep]'); if (pb) { const v = pb.dataset.pstep, id = v === 'r' ? P.random() : P.step(+v); setPalette(id); buildIndex(); return; }
      const sb = e.target.closest('[data-sys] button'); if (!sb) return; const k = sb.parentNode.dataset.sys, v = sb.dataset.v;
      if (k === 'mode') setMode(v); else if (k === 'sound') { S.set(v === 'on'); echo('sound ' + v); log('sound // ' + v); }
      else if (k === 'haptics') { HAP.set(v === 'on'); echo('haptics ' + v); log('haptics // ' + v); }
      else if (k === 'life') setLife(v); else if (k === 'icons') { setIcons(v); echo('icons ' + v); }
      else if (k === 'launch') { cfg.launch = v; saveCfg(); echo('set launch ' + v); log('launch fx // ' + v); }
      else if (k === 'bars') setBars(v);
      else if (k === 'labels') setLabels(v);
      else if (k === 'boot') { cfg.boot = v; saveCfg(); echo('set boot ' + v); log('boot // ' + v); }
      HAP('tick'); buildIndex();
    });
    function setBars(v) { if (v !== 'on' && v !== 'off') return false; cfg.bars = v; saveCfg(); try { B.bars(v === 'on'); } catch (e) {} echo('set bars ' + v); log('android bars // ' + (v === 'on' ? 'shown' : 'hidden, the status strip is the status bar')); return true; }
    JRL.bars = setBars;
    function setMode(v) { if (['auto', 'white', 'dark'].indexOf(v) < 0) return false; P.mode(v); theme(); if (window.JRLsnap) JRLsnap(); echo('mode ' + v); log('register // ' + v + ' (' + R.dataset.reg + ')', true); return true; }
    JRL.mode = setMode;
    function setPalette(id) {
      if (!P.set(id)) return false; theme(); HAP('heavy');
      if (!reduce && R.dataset.life !== 'low') window.JRLcut({ kind: 'flip', label: P.get().n, n: 'PAL ' + pad(P.list.indexOf(P.get()) + 1) }); else if (window.JRLsnap) JRLsnap();
      echo('palette ' + id); log('palette // ' + id, true); if (cur === 5) renderBio(); if (cur === 4) renderCom(); return true;
    }
    JRL.palette = setPalette;

    // the program file: holding a program opens everything this unit knows about it, in its own colour
    function ago(t) { const s = (Date.now() - t) / 1000; return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'; }
    function dossier(a) {
      closeOverlays(true); HAP('heavy'); S.thump(true);
      const Pl = P.get(), col = a.col || getComputedStyle(R).getPropertyValue('--acc').trim(), ink = P.best(col, [Pl.k, Pl.w]);
      const si = slotOf(a), fid = folderOf(a), hid = L.hidden.indexOf(a.key) > -1, u = USE[a.key] || [0, 0], cn = cmdName(a), unread = NOTI && NOTI[a.pkg] || 0, empty = L.slots.indexOf(null);
      const stat = (k, v) => '<div><b>' + esc(v) + '</b><span>' + k + '</span></div>';
      const cmd = (k, line, desc, cls) => '<button type="button" class="dos-cmd ' + (cls || '') + '" data-act="' + k + '"><span>&gt; ' + esc(line) + '</span><em>' + esc(desc) + '</em></button>';
      SH.style.setProperty('--dfld', col); SH.style.setProperty('--dink', ink);
      SH.innerHTML = '<div class="dos"><div class="dos-top"><span class="tag">PRG ' + pad(a.n, 3) + ' / ' + esc(a.code) + '</span><button type="button" class="chip" data-act="close">Close</button></div>' +
        '<div class="dos-hero"><span class="icw">' + iconHTML(a) + '</span><div class="dos-t"><b>' + esc(a.label) + '</b><small>' + esc(a.pkg) + '</small></div></div>' +
        '<div class="dos-stats">' + stat('Opened', pad(u[0], 4)) + stat('Last', u[1] ? ago(u[1]) : 'never') + stat('Unread', pad(unread)) + stat('Slot', si > -1 ? pad(si + 1) : fid ? 'F/' + L.folders[fid].name : '--') + '</div>' +
        '<div class="dos-cmds">' + cmd('open', 'open ' + cn, 'Open') +
        (fid ? cmd('out', 'unfold ' + cn, 'Take out of F/' + L.folders[fid].name) : si > -1 ? cmd('unpin', 'unpin ' + cn, 'Clear slot ' + pad(si + 1)) : cmd('pin', 'pin ' + cn, empty > -1 ? 'Load into slot ' + pad(empty + 1) : 'Loadout full')) +
        (si > -1 ? '<div class="dos-mv"><button type="button" data-act="earlier"' + (si < 1 ? ' disabled' : '') + '>&gt; move ' + esc(cn) + ' -1</button><button type="button" data-act="later"' + (si > 14 ? ' disabled' : '') + '>&gt; move ' + esc(cn) + ' +1</button></div>' : '') +
        cmd('folder', 'fold ' + cn, 'Put in a folder') + '<div class="sh-f" hidden>' + Object.keys(L.folders).filter(id => id !== fid).map(id => '<button type="button" class="chip" data-fold="' + id + '">F/' + esc(L.folders[id].name) + '</button>').join('') + '<button type="button" class="chip" data-fold="">+ New folder</button></div>' +
        cmd(hid ? 'unhide' : 'hide', (hid ? 'unhide ' : 'hide ') + cn, hid ? 'Back in the manifest' : 'Hide from the manifest') + cmd('info', 'info ' + cn, 'Android app info ↗') + cmd('uninstall', 'uninstall ' + cn, 'Uninstall', 'haz') + '</div>' +
        '<div class="giantw"><span class="giant">' + esc(a.label) + '</span></div></div>';
      SH.hidden = false; SH.dataset.k = a.key;
      if (!reduce && R.dataset.life !== 'low') window.JRLcut({ kind: 'mini', col: col }); echo('hold ' + cn);
    }
    SH.addEventListener('click', e => {
      const a = BYKEY[SH.dataset.k]; if (!a) return; const cn = cmdName(a);
      const fb = e.target.closest('[data-fold]'); if (fb) { const fid = toFolder(a, fb.dataset.fold || null); closeOverlays(true); echo('fold ' + cn + ' ' + (fb.dataset.fold ? L.folders[fb.dataset.fold].name.toLowerCase() : 'new')); if (!fb.dataset.fold) openFolder(fid, true); HAP('click'); return; }
      const b = e.target.closest('[data-act]'); if (!b) return; const k = b.dataset.act; HAP('tick');
      if (k === 'close') { closeOverlays(); echo('back'); }
      else if (k === 'open') launch(a);
      else if (k === 'pin' || k === 'unpin') { const r = JRL[k](a); echo(k + ' ' + cn); if (r) window.JRLtoast(r); dossier(a); }
      else if (k === 'earlier' || k === 'later') { JRL.move(a, k === 'earlier' ? -1 : 1); echo('move ' + cn + (k === 'earlier' ? ' -1' : ' +1')); dossier(a); }
      else if (k === 'folder') { const f = SH.querySelector('.sh-f'); f.hidden = !f.hidden; }
      else if (k === 'out') { outOfFolder(a); echo('unfold ' + cn); dossier(a); }
      else if (k === 'hide' || k === 'unhide') { JRL.hide(a, k === 'hide'); echo(k + ' ' + cn); dossier(a); }
      else if (k === 'info') { echo('info ' + cn); B.info(a); }
      else if (k === 'uninstall') { echo('uninstall ' + cn); B.uninstall(a); }
    });
    JRL.hold = dossier;
    // folders open as a panel flip over the loadout
    function openFolder(fid, rename) {
      const f = L.folders[fid]; if (!f) return; closeOverlays(true);
      FO.innerHTML = '<div class="fpanel' + (reduce ? '' : ' flip') + '"><div class="fh"><span class="code">F/ ' + pad(Object.keys(L.folders).indexOf(fid) + 1) + '</span><input id="f-name" value="' + esc(f.name) + '" maxlength="16" aria-label="Folder name" enterkeyhint="done"></div><div class="fgrid" role="list">' +
        f.apps.map(k => BYKEY[k] ? appTile(BYKEY[k]) : '').join('') + '</div><div class="ffoot"><button type="button" class="chip" data-act="ungroup">Ungroup</button><button type="button" class="chip" data-act="close">Close</button></div></div>';
      FO.hidden = false; FO.dataset.f = fid; HAP('tick'); S.crackle(); echo('open f/' + f.name.toLowerCase());
      const inp = $('#f-name'); inp.addEventListener('change', () => { f.name = inp.value.trim().slice(0, 16) || 'Folder'; saveL(); renderPins(); echo('rename f/' + f.name.toLowerCase()); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
      if (rename) setTimeout(() => { inp.focus(); inp.select(); }, 140);
    }
    FO.addEventListener('click', e => {
      if (e.target === FO) { closeOverlays(); return; }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'ungroup') { ungroup(FO.dataset.f); echo('ungroup'); closeOverlays(); } else closeOverlays();
    });

    /* ---------- pointer layer: press = instant invert, hold = program file, drag = gesture ---------- */
    let pd = null, suppress = false;
    const TAPPABLE = '.ins-pp,.mrow,.tile,.chip,.g-ev,.g-day,.c-row,.icard,.dos-cmd,.dos-mv button,.ins,.hl-tx,.np-ctl button,.s-ctl button,.bs-idx,.seg button,.ipal button';
    DEV.addEventListener('pointerdown', e => {
      if (e.button) return; const t = e.target.closest(TAPPABLE);
      pd = { x: e.clientX, y: e.clientY, t: Date.now(), el: t, held: false, deck: e.target.closest('.deck'), main: !!e.target.closest('main'), top: !!e.target.closest('#top'), ov: !!e.target.closest('#index,#sheet,#folder,#cli,#term,#boot,#fakeapp,#scrubov') };
      if (t) t.classList.add('press');
      const tile = e.target.closest('.tile[data-k], .tile[data-f], .c-row[data-k], .mrow[data-k]');
      if (tile) pd.lp = setTimeout(() => { if (!pd) return; pd.held = true; tile.classList.remove('press'); if (tile.dataset.k) dossier(BYKEY[tile.dataset.k]); else if (tile.dataset.f) openFolder(tile.dataset.f, true); }, 460);
    }, true);
    DEV.addEventListener('pointermove', e => {
      if (!pd) return; if (Math.abs(e.clientX - pd.x) > 10 || Math.abs(e.clientY - pd.y) > 10) { clearTimeout(pd.lp); if (pd.el) pd.el.classList.remove('press'); pd.moved = true; }
    }, true);
    function endPtr(e, cancel) {
      if (!pd) return; const p = pd; pd = null; clearTimeout(p.lp); if (p.el) p.el.classList.remove('press');
      if (p.held) { suppress = true; return; }
      if (cancel || p.rail || p.ov) return;
      const z = zoom(), dx = (e.clientX - p.x) / z, dy = (e.clientY - p.y) / z, dt = Date.now() - p.t;
      const vert = Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.4 && dt < 700, horiz = Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 700;
      if (p.top) { if (vert && dy > 0) { suppress = true; echo('shade'); B.expand(); HAP('tick'); } else if (!p.moved) { suppress = true; openIndex(); } return; }
      if (!p.main) return;
      if (vert) {
        if (cur === 0 && dy < 0) { suppress = true; go(1); return; }
        if (cur === 0 && dy > 0) { suppress = true; echo('shade'); B.expand(); HAP('tick'); return; }
        if (cur === 1 && dy > 0 && $('#a-grid').scrollTop <= 0 && !filterQ) { suppress = true; go(0); return; }
      }
      if (horiz && cur >= 2) { suppress = true; go(2 + ((cur - 2 + (dx < 0 ? 1 : -1)) + 4) % 4, { small: true }); return; }
      if (!p.moved && !p.el && (e.target === p.deck || e.target.matches('.h-main,.hom,.d-head,.h-air,.g-next,.s-body,main,.fieldfx,.d-big,.giantw,.giant'))) reticle(e);
    }
    DEV.addEventListener('pointerup', e => endPtr(e), true);
    let pendTouch = null;
    DEV.addEventListener('pointercancel', e => { if (e.pointerType === 'touch' && pd && !pd.held) { pendTouch = pd; clearTimeout(pd.lp); if (pd.el) pd.el.classList.remove('press'); pd = null; return; } endPtr(e, true); }, true);
    DEV.addEventListener('touchend', e => { if (!pendTouch) return; const t = e.changedTouches[0]; pd = pendTouch; pendTouch = null; pd.moved = true; endPtr({ clientX: t.clientX, clientY: t.clientY, target: e.target }); }, true);
    DEV.addEventListener('click', e => { if (suppress) { suppress = false; e.stopPropagation(); e.preventDefault(); } }, true);
    DEV.addEventListener('contextmenu', e => e.preventDefault());
    DEV.addEventListener('click', e => {
      if (e.target.closest('#sheet')) return;
      const tile = e.target.closest('.tile[data-k], .c-row[data-k], .mrow[data-k]');
      if (tile) { const a = BYKEY[tile.dataset.k]; if (assignSlot != null && cur === 1) { const s = assignSlot; assignSlot = null; const r = JRL.pin(a, s); echo('pin ' + cmdName(a) + ' ' + (s + 1)); if (r) window.JRLtoast(r); go(0, { silent: true }); } else launch(a); return; }
      const em = e.target.closest('.slot-empty'); if (em) { assignSlot = +em.dataset.slot; go(1, { silent: true }); echo('assign slot ' + pad(assignSlot + 1)); window.JRLtoast('Pick a program for slot ' + pad(assignSlot + 1)); renderApps(); return; }
      const fold = e.target.closest('.tile[data-f]'); if (fold) { openFolder(fold.dataset.f); return; }
      const g = e.target.closest('main [data-go]'); if (g) { const d = +g.dataset.go; if (cur === 0 && d >= 2 && xpand(d, g)) return; go(d); return; }
      const ev = e.target.closest('.g-ev[data-ev]'); if (ev) { HAP('tick'); echo('cal open ' + ev.dataset.ev); B.openEvent(ev.dataset.ev); }
    });
    $('#bs-idx').addEventListener('click', openIndex);

    /* ---------- instruments grow into their readout; Back shrinks them home ---------- */
    let xpT = [], xpEl = null;
    function xrect(el) { const a = DEV.getBoundingClientRect(), r = el.getBoundingClientRect(), z = zoom(); return { l: (r.left - a.left) / z, t: (r.top - a.top) / z, w: r.width / z, h: r.height / z }; }
    const lerp = (A, M, k) => ({ l: A.l + (M.l - A.l) * k, t: A.t + (M.t - A.t) * k, w: A.w + (M.w - A.w) * k, h: A.h + (M.h - A.h) * k });
    function xbox(d, src) {
      xpT.forEach(clearTimeout); xpT = []; if (xpEl) xpEl.remove();
      const T = P.tokens(d), el = document.createElement('div'), v = src && src.querySelector('.iv');
      el.className = 'xpand'; el.setAttribute('aria-hidden', 'true');
      el.style.cssText = '--xf:' + T.fld + ';--xi:' + T.ink + ';--xtb:' + T.tagbg + ';--xtf:' + T.tagfg;
      el.innerHTML = '<span class="xt">' + pad(d + 1) + ' / ' + esc(NAMES[d]) + '</span><span class="xv">' + esc(v ? v.textContent : '') + '</span>';
      DEV.appendChild(el); xpEl = el; return el;
    }
    const place = (el, q) => { el.style.left = q.l + 'px'; el.style.top = q.t + 'px'; el.style.width = q.w + 'px'; el.style.height = q.h + 'px'; };
    function xpand(d, src) {
      if (reduce || R.dataset.life === 'low' || !src || !src.offsetParent) return false;
      const A = xrect(src), M = xrect($('main')), el = xbox(d, src), F = [0, .4, .78, 1];
      place(el, A); HAP('click'); S.click(); echo('go ' + CODES[d].toLowerCase());
      F.forEach((k, i) => xpT.push(setTimeout(() => { place(el, lerp(A, M, k)); if (i === F.length - 1) { go(d, { quiet: true, silent: true }); xpT.push(setTimeout(() => { el.remove(); if (xpEl === el) xpEl = null; }, 33)); } }, i * 33)));
      return true;
    }
    function collapse(d) {
      const src = $('.instrs [data-go="' + d + '"]');
      if (reduce || R.dataset.life === 'low') return false;
      go(0, { quiet: true, silent: true }); if (!src || !src.offsetParent) { if (window.JRLsnap) JRLsnap(); return true; }
      const A = xrect(src), M = xrect($('main')), el = xbox(d, src), F = [0, .4, .78, 1];
      place(el, M); HAP('tick'); S.tick(.06);
      F.forEach((k, i) => xpT.push(setTimeout(() => { place(el, lerp(M, A, k)); if (i === F.length - 1) xpT.push(setTimeout(() => { el.remove(); if (xpEl === el) xpEl = null; }, 33)); }, i * 33)));
      return true;
    }
    // waking the phone: the Console re-acquires in four block steps, coarse to fine
    function wake() { if (reduce || R.dataset.life === 'low') { if (window.JRLsnap) JRLsnap(); return; } window.JRLresolve($('main'), getComputedStyle(R).getPropertyValue('--fld').trim(), true); HAP('tick'); S.crackle(); }
    JRL.wake = wake;

    /* ---------- the clock: hold it to feel the time, double-tap it to lock ---------- */
    function hapTime() {
      const d = new Date(), h = d.getHours() % 12 || 12, t = Math.floor(d.getMinutes() / 10), p = [];
      for (let i = 0; i < h; i++) p.push(220, 160); p[p.length - 1] = 520;
      for (let i = 0; i < t; i++) p.push(70, 150); if (!t) p.push(0, 0); p.pop();
      HAP.pattern(p); window.JRLtoast('TIME // ' + h + ' long · ' + t + ' short = ' + h + ':' + t + '0'); echo('time', true); log('clock // read by touch ' + h + ':' + t + '0');
      if (S.on()) { let at = 0; for (let i = 0; i < p.length; i += 2) { const on = p[i], f = on > 100 ? 440 : 880; if (on) setTimeout(() => S.beep(f, on / 1000, 'sine', .08), at); at += on + (p[i + 1] || 0); } }
    }
    function lockUnit() { echo('lock'); log('unit // locked', true); HAP('heavy'); if (window.JRLsnap) JRLsnap(); try { B.lock(); } catch (e) {} }
    JRL.time = hapTime; JRL.lock = lockUnit;
    (function () {
      const ck = $('#clock'); let t = 0, held = false, last = 0;
      ck.addEventListener('pointerdown', e => { held = false; clearTimeout(t); t = setTimeout(() => { held = true; hapTime(); }, 520); });
      const up = () => { clearTimeout(t); if (held) return; const n = Date.now(); if (n - last < 320) { last = 0; lockUnit(); } else last = n; };
      ck.addEventListener('pointerup', up); ck.addEventListener('pointercancel', () => clearTimeout(t)); ck.addEventListener('pointermove', e => { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(t); });
    })();

    /* ---------- back, home, keys ---------- */
    function back() {
      if (window.JRLroot && JRLroot.isOpen()) { JRLroot.exit(); return true; }
      if (window.JRLterm && JRLterm.isOpen()) { JRLterm.close(); return true; }
      if (closeOverlays()) { echo('back'); return true; }
      if (filterQ) { JRL.filter(''); echo('find'); return true; }
      if (cur !== 0) { if (cur >= 2 && collapse(cur)) { echo('back'); return true; } go(0, { silent: true }); echo('back'); return true; }
      return false;
    }
    JRL.back = back;
    document.addEventListener('keydown', e => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') { if (B.mock && B._home && B._home()) return; if (!$('#boot').hidden) return; back(); return; }
      const a = document.activeElement; if (a && /^(input|textarea)$/i.test(a.tagName)) return;
      if (!$('#boot').hidden || $('#intro') || (window.JRLroot && JRLroot.isOpen())) return;
      if (/^[1-6]$/.test(e.key)) { e.preventDefault(); closeOverlays(true); go(+e.key - 1); return; }
      const k = e.key.toLowerCase();
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && cur >= 2) { e.preventDefault(); go(2 + ((cur - 2 + (e.key === 'ArrowRight' ? 1 : -1)) + 4) % 4, { small: true }); return; }
      if (e.key === 'ArrowUp' && cur === 0) { go(1); return; }
      if (e.key === 'Tab') { e.preventDefault(); openIndex(); return; }
      if (k === '/' || k === '`' || k === '~') { e.preventDefault(); if (window.JRLterm) JRLterm.open(k === '~' ? '~' : ''); return; }
      if (k === 'm') { S.toggle(); echo('sound ' + (S.on() ? 'on' : 'off')); }
    });

    /* ---------- native events from the Kotlin shell ---------- */
    let hiddenAt = 0;
    window.JRLnative = {
      event: function (name, data) {
        if (name === 'back') back();
        else if (name === 'home') { const any = closeOverlays(true); if (window.JRLterm && JRLterm.isOpen()) JRLterm.close(true); if (window.JRLroot && JRLroot.isOpen()) JRLroot.exit(true); if (cur !== 0) go(0, { quiet: true, silent: true }); else if (!any && window.JRLsnap) JRLsnap(); }
        else if (name === 'show') { visible = true; R.classList.remove('away'); if (hiddenAt) wake(); pollAll(); if (hiddenAt && Date.now() - C.state().fed > 10 * 60e3) setTimeout(() => feed('visit'), 300); hiddenAt = 0; }
        else if (name === 'hide') { visible = false; hiddenAt = Date.now(); R.classList.add('away'); }
        else if (name === 'apps') { B.apps().then(setApps); log('manifest // changed'); }
        else if (name === 'calendar') loadEvents();
        else if (name === 'notifs') pollNotifs();
        else if (name === 'updated') { const ok = data && data.ok !== false; log(ok ? 'ota // new ui staged, applies next time you leave home' : 'ota // ' + ((data && data.why) || 'no update'), true); window.JRLtoast(ok ? 'UI update staged' : 'OTA // ' + ((data && data.why) || 'no update')); }
        else if (name === 'error') log('bridge // error ' + (data && data.msg || ''), true);
      }
    };
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) pollAll(); });

    /* ---------- polling: cheap reads, only while visible ---------- */
    function pollAll() { pollMedia(); pollNotifs(); pollBattery(); pollSignal(); }
    setInterval(() => { if (!visible || document.hidden) return; if (cur === 0 || cur === 3) pollMedia(); clock(); }, 1000);
    setInterval(() => { if (!visible || document.hidden) return; pollNotifs(); }, 4000);
    setInterval(() => { if (!visible || document.hidden) return; pollBattery(); pollSignal(); }, 30000);
    setInterval(() => { if (visible && !document.hidden) loadEvents(); }, 5 * 60e3);
    if (window.visualViewport) { const vv = window.visualViewport; const kb = () => { const h = Math.max(0, innerHeight - vv.height - vv.offsetTop); R.style.setProperty('--kb', h + 'px'); R.classList.toggle('kb', h > 80); }; vv.addEventListener('resize', kb); vv.addEventListener('scroll', kb); }

    /* ---------- boot ---------- */
    const boot = $('#boot'), bl = $('#bootlog');
    function bootLines() {
      const h = () => '0x' + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0'), dv = B.device() || {}, b = window.JRLlife.battery();
      const bar = p => '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10)) + ' ' + pad(p) + '%';
      return [['sys', 'jrl-os 6.0.0-field-unit #1 SMP PREEMPT aarch64'], ['hw', (dv.model || 'unit') + ' · 2 displays · cover 412dp · main 984dp'], ['mem', 'heap ok · ecc on · 0 bad sectors'],
        ['dma', h() + ' → ' + h() + '  ' + bar(37)], ['pm', 'scan /data/app … ' + pad(APPS.length, 3) + ' programs'], ['icon', 'render ' + APPS.length + ' icons → ' + cfg.icons],
        ['slot', 'loadout ' + pad(L.slots.filter(Boolean).length) + ' / 16 slots armed'], ['ui', 'palette ' + P.get().n.toLowerCase() + ' · register ' + P.mode() + ' · status strip ' + (cfg.bars === 'off' ? 'owns the bar' : 'under android')],
        ['cal', 'sync calendars … ' + EV.list.length + ' events in 7 days'], ['sig', 'media session … ' + (MED ? 'carrier found' : 'no carrier')], ['com', 'notification listener … ' + Object.keys(NOTI || {}).length + ' channels'],
        ['bio', 'colony day ' + pad(C.day(), 3) + ' · pop ' + C.pop() + (C.night() ? ' · dormant' : ' · awake')], ['pwr', 'battery ' + (b.level != null ? Math.round(b.level * 100) + '%' : '??') + ' · life support ' + (R.dataset.life || 'full').toUpperCase()],
        ['snd', 'synth ' + (S.on() ? 'armed' : 'silent') + ' · haptics ' + (HAP.on() ? 'armed' : 'off')], ['dma', h() + ' → ' + h() + '  ' + bar(100)], ['auth', 'jere@jrl-01 … ok'], ['ready', 'JERE.ING']];
    }
    let bk = 0, bdone = true, btimer = 0, blines = [];
    function bstep() {
      if (bk >= blines.length) { bootPrompt(); return; }
      const Ln = blines[bk++], d = document.createElement('div'), cls = Ln[0] === 'ready' ? 'g' : Ln[0] === 'dma' ? 'h' : '';
      d.innerHTML = '<span class="n">' + pad(bk) + '</span><span class="' + cls + '">[' + esc(Ln[0]) + ']</span> <span class="' + (cls === 'h' ? 'h' : '') + '"></span>';
      bl.appendChild(d); window.JRLdecode(d.lastElementChild, Ln[1], { frames: 7, speed: 44, keep: Ln[0] === 'ready' ? 2 : 0, force: true });
      const p = Math.round(bk / blines.length * 100); $('#bootpct').textContent = p + '%'; $('#bootbar').style.width = p + '%';
      btimer = setTimeout(bstep, bk === blines.length ? 280 : 50 + Math.random() * 100);
    }
    function bootPrompt() {
      const e = document.createElement('div'); e.innerHTML = '<span class="n">' + pad(bl.children.length + 1) + '</span><button type="button" class="go tap"></button><span class="cur"></span>';
      e.querySelector('.tap').addEventListener('click', ev => { ev.stopPropagation(); finishBoot(); }); bl.appendChild(e); window.JRLdecode(e.querySelector('.tap'), '[enter] tap here', { frames: 12, keep: 1, force: true });
    }
    function finishBoot() { if (bdone) return; bdone = true; clearTimeout(btimer); boot.classList.add('gone'); S.enter(); HAP('heavy'); setTimeout(() => { boot.hidden = true; boot.classList.remove('gone'); }, 400); log('boot // complete', true); echo('enter'); }
    function runBoot() { clearTimeout(btimer); bl.innerHTML = ''; bk = 0; bdone = false; blines = bootLines(); $('#bootpct').textContent = '0%'; $('#bootbar').style.width = '0%'; boot.hidden = false; const bt = $('#boot .bt'); bt._fs = null; bt.style.fontSize = ''; fitW(bt); window.JRLintro(bstep); }
    boot.addEventListener('keydown', e => { if (e.key === 'Enter' && !bdone && bk >= blines.length) finishBoot(); });
    JRL.reboot = function () { closeOverlays(true); log('session // rebooting', true); setTimeout(runBoot, 200); };
    JRL.cfgSet = function (k, v) { if (!(k in cfg)) return false; if (k === 'bars') return setBars(v); cfg[k] = v; saveCfg(); return true; };

    /* ---------- start ---------- */
    go(0, { quiet: true, silent: true }); lifeChip(); pollAll(); layoutField(); checkFold();
    try { B.bars(cfg.bars === 'on'); } catch (e) {}
    Promise.all([B.apps().then(setApps), loadEvents()]).then(() => {
      let seen = false; try { seen = sessionStorage.getItem('jrl-l-boot'); sessionStorage.setItem('jrl-l-boot', '1'); } catch (e) {}
      const first = !store.get('jrl-l-visited'); store.set('jrl-l-visited', '1');
      const cold = /[#&]cold/.test(location.hash) || (window.JRLAndroid && JRLAndroid.coldStart && JRLAndroid.coldStart());
      if (cfg.boot === 'always' || (cfg.boot === 'smart' && (first || cold))) runBoot();
      else if (cfg.boot === 'smart' && !seen) window.JRLintro(() => { S.enter(); });
      log('session // open · ' + APPS.length + ' programs'); booted = true; renderAll();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitHome(); layoutField(); });
    });
  })();
