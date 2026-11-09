  // Palettes and registers. A palette is a small spec; every token (field, ink, accent, slab, system layer)
  // is computed from it with contrast checks, so new palettes can't produce unreadable text.
  // f = dark-register fields per deck ('k' = the palette's black), c = identity colours (swatches, white-register accents),
  // a = optional dark-register accents, i = optional dark-register inks.
  (function () {
    'use strict';
    var R = document.documentElement, store = window.JRLstore;
    var PAL = [
      { id: 'standard', n: 'Standard', sig: '#c2ff16', k: '#0a0a0b', w: '#f2f2ee', l: '#f1f0f0', f: ['k', '#0400f5', '#c7c2b6', '#ef4606', '#e0216f', 'k'], c: ['#c2ff16', '#0400f5', '#c7c2b6', '#ef4606', '#e0216f', '#2ddccd'], a: [0, 0, '#ef4606', '#0400f5', '#c2ff16', '#f2f2ee'], i: [0, 0, 0, 0, '#f2f2ee', '#2ddccd'] },
      { id: 'reel', n: 'Reel', sig: '#c2ff16', k: '#0a0a0b', w: '#f2f2ee', l: '#f1f0f0', f: ['k', '#441eec', '#e0216f', '#ef4606', '#441eec', 'k'], c: ['#c2ff16', '#441eec', '#e0216f', '#ef4606', '#8476bf', '#e0216f'], i: [0, 0, 0, 0, 0, '#e0216f'] },
      { id: 'signal', n: 'Signal', sig: '#c2ff16', k: '#05051a', w: '#f2f2ee', l: '#eef0ff', f: ['k', '#0400f5', '#0400f5', '#441eec', '#0400f5', 'k'], c: ['#c2ff16', '#0400f5', '#441eec', '#0400f5', '#441eec', '#c2ff16'], i: [0, 0, 0, 0, 0, '#c2ff16'] },
      { id: 'ember', n: 'Ember', sig: '#ff5a1f', k: '#07140d', w: '#f4f1ea', l: '#f4f1ea', f: ['k', '#0f3d2a', '#ef4606', '#0f3d2a', '#ef4606', 'k'], c: ['#ff5a1f', '#0f3d2a', '#ef4606', '#1d6b40', '#ef4606', '#ff5a1f'], i: [0, 0, 0, 0, 0, '#ff5a1f'] },
      { id: 'hazard', n: 'Hazard', sig: '#eae00b', k: '#0a0a0b', w: '#f5f3e6', l: '#f5f3e6', f: ['k', '#e9042b', '#eae00b', '#e9042b', '#eae00b', 'k'], c: ['#eae00b', '#e9042b', '#eae00b', '#e9042b', '#eae00b', '#e9042b'], i: [0, 0, 0, 0, 0, '#eae00b'] },
      { id: 'orchid', n: 'Orchid', sig: '#cce4dc', k: '#150a10', w: '#fbeef3', l: '#fbeef3', f: ['k', '#e0216f', '#cce4dc', '#e0216f', '#cce4dc', 'k'], c: ['#cce4dc', '#e0216f', '#cce4dc', '#e0216f', '#ff7ab0', '#cce4dc'], i: [0, 0, 0, 0, 0, '#ff7ab0'] },
      { id: 'moss', n: 'Moss', sig: '#9cf2c0', k: '#06140c', w: '#eef4ef', l: '#eef4ef', f: ['k', '#0e4d2e', '#cce4dc', '#1d6b40', '#0e4d2e', 'k'], c: ['#9cf2c0', '#0e4d2e', '#cce4dc', '#1d6b40', '#2f8f5b', '#9cf2c0'], i: [0, 0, 0, 0, 0, '#9cf2c0'] },
      { id: 'cobalt', n: 'Cobalt', sig: '#cce4dc', k: '#0a0a0b', w: '#f2f2ee', l: '#f1f0f0', f: ['k', '#0047ab', '#cce4dc', '#e0216f', '#0047ab', 'k'], c: ['#cce4dc', '#0047ab', '#cce4dc', '#e0216f', '#0047ab', '#e0216f'], i: [0, 0, 0, 0, 0, '#cce4dc'] },
      { id: 'ultraviolet', n: 'Ultraviolet', sig: '#c2ff16', k: '#0a0614', w: '#f2f2ee', l: '#f1eefa', f: ['k', '#441eec', '#8476bf', '#441eec', '#e0216f', 'k'], c: ['#c2ff16', '#441eec', '#8476bf', '#441eec', '#e0216f', '#8476bf'], i: [0, 0, 0, 0, 0, '#c2ff16'] },
      { id: 'dusk', n: 'Dusk', sig: '#ef4606', k: '#120e1c', w: '#f2f2ee', l: '#f2eff7', f: ['k', '#8476bf', '#2c2240', '#ef4606', '#8476bf', 'k'], c: ['#ef4606', '#8476bf', '#2c2240', '#ef4606', '#8476bf', '#ef4606'], i: [0, 0, 0, 0, 0, '#8476bf'] },
      { id: 'ice', n: 'Ice', sig: '#2ddccd', k: '#0b1a24', w: '#f4fbff', l: '#eaf6fb', f: ['k', '#bfe6f5', '#eaf6fb', '#7fd3ea', '#bfe6f5', 'k'], c: ['#2ddccd', '#3aa6d8', '#bfe6f5', '#7fd3ea', '#3aa6d8', '#2ddccd'], i: [0, 0, 0, 0, 0, '#2ddccd'] },
      { id: 'boneyard', n: 'Boneyard', sig: '#ef4606', k: '#0a0a0b', w: '#efebe2', l: '#efebe2', f: ['k', '#c7c2b6', '#c7c2b6', 'k', '#c7c2b6', 'k'], c: ['#ef4606', '#c7c2b6', '#ef4606', '#c7c2b6', '#ef4606', '#c7c2b6'], i: [0, 0, 0, 0, 0, '#c7c2b6'] },
      { id: 'paper', n: 'Paper', sig: '#d7261e', k: '#141414', w: '#f7f3ea', l: '#f7f3ea', f: ['#f7f3ea', '#efe8d8', '#e6dcc6', '#d7261e', '#efe8d8', 'k'], c: ['#d7261e', '#141414', '#e6dcc6', '#d7261e', '#141414', '#d7261e'], a: ['#d7261e', '#d7261e', '#d7261e', '#141414', '#d7261e', '#d7261e'] },
      { id: 'mono', mono: 1, n: 'Mono', sig: '#f2f2ee', k: '#0a0a0b', w: '#f2f2ee', l: '#f2f2ee', f: ['k', 'k', '#f2f2ee', 'k', '#f2f2ee', 'k'], c: ['#f2f2ee', '#8b8b92', '#f2f2ee', '#8b8b92', '#f2f2ee', '#8b8b92'], a: ['#f2f2ee', '#f2f2ee', '#0a0a0b', '#f2f2ee', '#0a0a0b', '#f2f2ee'] },
      { id: 'phosphor', mono: 1, n: 'Phosphor', sig: '#33ff66', k: '#020a04', w: '#7dff9e', l: '#06210f', f: ['k', '#04260f', '#06210f', '#0a3a18', '#04260f', 'k'], c: ['#33ff66', '#1f9e45', '#33ff66', '#1f9e45', '#33ff66', '#7dff9e'] },
      { id: 'amber', mono: 1, n: 'Amber', sig: '#ffb000', k: '#0a0600', w: '#ffc94d', l: '#1f1500', f: ['k', '#2a1c00', '#1f1500', '#3a2600', '#2a1c00', 'k'], c: ['#ffb000', '#b37a00', '#ffb000', '#b37a00', '#ffb000', '#ffc94d'] },
      { id: 'nightshift', mono: 1, n: 'Nightshift', sig: '#ff2a2a', k: '#000000', w: '#ff3b30', l: '#160000', f: ['k', '#1e0000', '#2a0000', '#3a0000', '#1e0000', 'k'], c: ['#ff2a2a', '#7a0000', '#a00000', '#ff2a2a', '#7a0000', '#ff2a2a'] }
    ];
    var BYID = {}; PAL.forEach(function (p) { BYID[p.id] = p; });

    function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return isNaN(n) ? [0, 0, 0] : [n >> 16, n >> 8 & 255, n & 255]; }
    function hex(c) { return '#' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join(''); }
    function lum(h) { return window.JRLlum(h); }
    function con(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
    function best(bg, opts) { var b = opts[0], bc = 0; opts.forEach(function (o) { var c = con(bg, o); if (c > bc) { bc = c; b = o; } }); return b; }
    function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
    var NAMES = ['Console', 'Manifest', 'Schedule', 'Signal', 'Comms', 'Bio'];

    var cur = BYID[store.get('jrl-l-pal')] ? store.get('jrl-l-pal') : 'standard';
    var mode = /^(auto|white|dark)$/.test(store.get('jrl-l-mode') || '') ? store.get('jrl-l-mode') : 'auto';
    function regOf(d) {
      if (mode !== 'auto') return mode;
      var C = window.JRLcolony; if (C && C.night()) return 'dark';
      var daily = C && C.day() % 2 ? 'white' : 'dark';
      return ['white', daily, 'white', 'dark', 'white', 'dark'][d] || 'dark';
    }
    function tokens(d, P) {
      P = P || BYID[cur]; var reg = regOf(d), T = { reg: reg }, fc = function (v) { return v === 'k' ? P.k : v; };
      if (reg === 'dark') {
        T.fld = fc(P.f[d]); T.ink = (P.i && P.i[d]) || best(T.fld, [P.k, P.w]);
        T.acc = (P.a && P.a[d]) || (con(P.sig, T.fld) >= 2.2 ? P.sig : con(P.c[d], T.fld) >= 2.2 ? P.c[d] : T.ink);
        T.tagbg = T.acc; T.tagfg = best(T.acc, [P.k, P.w]);
      } else {
        T.fld = P.l; T.ink = best(P.l, [P.k, P.w]);
        T.acc = con(P.c[d], T.fld) >= 1.3 ? P.c[d] : con(P.sig, T.fld) >= 1.3 ? P.sig : T.ink;
        T.tagbg = T.ink; T.tagfg = T.fld;
      }
      T.onacc = best(T.acc, [P.k, P.w]);
      T.hl = con(T.acc, T.fld) >= 3 ? T.acc : T.ink;
      T.slab = con(T.fld, P.k) < 1.3 ? mix(P.k, P.w, .07) : P.k;
      T.slabink = best(T.slab, [P.w, P.k]);
      if (reg === 'dark') { T.sbg = P.k; T.sfg = best(P.k, [P.w, P.k]); T.ssig = P.sig; }
      else { T.sbg = P.l; T.sfg = best(P.l, [P.k, P.w]); T.ssig = T.sfg; }
      T.onssig = best(T.ssig, [P.k, P.w, P.l]); T.sdim = mix(T.sfg, T.sbg, .45); T.srule = mix(T.sfg, T.sbg, .82);
      T.fc = con(T.ink, T.fld) < 7;
      T.duohi = con(T.fld, P.k) > 3 ? T.fld : (con(T.acc, P.k) > 3 ? T.acc : P.w);
      return T;
    }
    function setDuo(lo, hi, sel) { var f = document.querySelector(sel || '#duo'); if (!f) return; var a = rgb(lo), b = rgb(hi); ['R', 'G', 'B'].forEach(function (ch, i) { var fn = f.querySelector('feFunc' + ch); if (fn) fn.setAttribute('tableValues', (a[i] / 255).toFixed(3) + ' ' + (b[i] / 255).toFixed(3)); }); }
    function apply(d) {
      var P = BYID[cur], T = tokens(d, P), s = R.style;
      var set = function (k, v) { s.setProperty(k, v); };
      set('--k', P.k); set('--w', P.w); set('--l', P.l); set('--sig', P.sig); set('--on-sig', best(P.sig, [P.k, P.w]));
      set('--fld', T.fld); set('--ink', T.ink); set('--acc', T.acc); set('--on-acc', T.onacc); set('--hl', T.hl);
      set('--slab', T.slab); set('--slab-ink', T.slabink); set('--tag-bg', T.tagbg); set('--tag-fg', T.tagfg);
      set('--sys-bg', T.sbg); set('--sys-fg', T.sfg); set('--sys-dim', T.sdim); set('--sys-rule', T.srule); set('--sys-sig', T.ssig); set('--on-sys-sig', T.onssig);
      P.c.forEach(function (c, i) { set('--id' + i, i === 0 ? P.sig : c); });
      var stroke = encodeURIComponent(T.ink);
      set('--reg', 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'56\'%3E%3Cpath d=\'M1 6h11M6.5 0.5v11\' stroke=\'' + stroke + '\' stroke-opacity=\'.3\'/%3E%3C/svg%3E")');
      R.dataset.reg = T.reg; if (T.fc) R.dataset.fc = '1'; else delete R.dataset.fc;
      R.style.colorScheme = lum(T.sbg) > .4 ? 'light' : 'dark';
      setDuo(P.k, T.duohi); var dk = lum(T.fld) < lum(T.ink) ? T.fld : T.ink, lt = dk === T.fld ? T.ink : T.fld; if (P.mono) { dk = P.k; lt = P.w; } setDuo(dk, lt, '#duo-ic'); R.dataset.pal = cur; if (P.mono) R.dataset.mono = '1'; else delete R.dataset.mono;
      var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = T.sbg;
      return T;
    }
    window.JRLpal = {
      list: PAL, names: NAMES,
      cur: function () { return cur; }, get: function (id) { return BYID[id || cur]; },
      set: function (id) { if (!BYID[id]) return false; cur = id; store.set('jrl-l-pal', id); return true; },
      step: function (dir) { var i = PAL.findIndex(function (p) { return p.id === cur; }); return PAL[(i + dir + PAL.length) % PAL.length].id; },
      random: function () { var p; do { p = PAL[Math.floor(Math.random() * PAL.length)].id; } while (p === cur && PAL.length > 1); return p; },
      mode: function (v) { if (v) { mode = v; store.set('jrl-l-mode', v); } return mode; },
      regOf: regOf, tokens: tokens, apply: apply, con: con, best: best, mix: mix
    };
  })();
