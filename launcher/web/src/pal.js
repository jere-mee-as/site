  // Colour. A palette is six full-bleed hues (one per view: console, manifest, schedule, signal, comms, bio),
  // a deep, a light, a light ink and the signal colour of the strip. Every token is computed from that with
  // contrast checks, so no palette can produce unreadable text.
  //   radical: every view IS its hue. The whole screen changes when the palette does.
  //   utility: grounds stay deep or light (the register decides); the hues become accents only.
  //   night (00–06 ET, the colony's dormant hours): always deep grounds, never a bright field.
  (function () {
    'use strict';
    var R = document.documentElement, store = window.JRLstore;
    var PAL = [
      { id: 'standard', n: 'Standard', sig: '#c2ff16', k: '#0a0a0b', w: '#f2f2ee', l: '#f1f0f0', c: ['#0400f5', '#e0216f', '#c7c2b6', '#ef4606', '#8476bf', '#0a0a0b'] },
      { id: 'reel', n: 'Reel', sig: '#c2ff16', k: '#0a0a0b', w: '#f2f2ee', l: '#f1f0f0', c: ['#441eec', '#e0216f', '#ef4606', '#0400f5', '#8476bf', '#2ddccd'] },
      { id: 'signal', n: 'Signal', sig: '#c2ff16', k: '#05051a', w: '#f2f2ee', l: '#eef0ff', c: ['#0400f5', '#2a1fd6', '#441eec', '#0400f5', '#1a12a8', '#05051a'] },
      { id: 'ember', n: 'Ember', sig: '#ff5a1f', k: '#07140d', w: '#f4f1ea', l: '#f4f1ea', c: ['#0f3d2a', '#ef4606', '#1d6b40', '#ef4606', '#0f3d2a', '#07140d'] },
      { id: 'hazard', n: 'Hazard', sig: '#eae00b', k: '#0a0a0b', w: '#f5f3e6', l: '#f5f3e6', c: ['#eae00b', '#0a0a0b', '#e9042b', '#eae00b', '#e9042b', '#0a0a0b'] },
      { id: 'orchid', n: 'Orchid', sig: '#cce4dc', k: '#150a10', w: '#fbeef3', l: '#fbeef3', c: ['#e0216f', '#cce4dc', '#ff7ab0', '#e0216f', '#cce4dc', '#150a10'] },
      { id: 'moss', n: 'Moss', sig: '#9cf2c0', k: '#06140c', w: '#eef4ef', l: '#eef4ef', c: ['#0e4d2e', '#cce4dc', '#1d6b40', '#0e4d2e', '#2f8f5b', '#06140c'] },
      { id: 'cobalt', n: 'Cobalt', sig: '#cce4dc', k: '#0a0a0b', w: '#f2f2ee', l: '#f1f0f0', c: ['#0047ab', '#cce4dc', '#e0216f', '#0047ab', '#cce4dc', '#0a0a0b'] },
      { id: 'ultraviolet', n: 'Ultraviolet', sig: '#c2ff16', k: '#0a0614', w: '#f2f2ee', l: '#f1eefa', c: ['#441eec', '#8476bf', '#e0216f', '#441eec', '#8476bf', '#0a0614'] },
      { id: 'dusk', n: 'Dusk', sig: '#ef4606', k: '#120e1c', w: '#f2f2ee', l: '#f2eff7', c: ['#8476bf', '#2c2240', '#ef4606', '#8476bf', '#2c2240', '#120e1c'] },
      { id: 'ice', n: 'Ice', sig: '#2ddccd', k: '#0b1a24', w: '#f4fbff', l: '#eaf6fb', c: ['#bfe6f5', '#eaf6fb', '#7fd3ea', '#3aa6d8', '#bfe6f5', '#0b1a24'] },
      { id: 'boneyard', n: 'Boneyard', sig: '#ef4606', k: '#0a0a0b', w: '#efebe2', l: '#efebe2', c: ['#c7c2b6', '#efebe2', '#c7c2b6', '#ef4606', '#c7c2b6', '#0a0a0b'] },
      { id: 'paper', n: 'Paper', sig: '#d7261e', k: '#141414', w: '#f7f3ea', l: '#f7f3ea', c: ['#f7f3ea', '#efe8d8', '#e6dcc6', '#d7261e', '#efe8d8', '#141414'] },
      { id: 'mono', n: 'Mono', sig: '#f2f2ee', k: '#0a0a0b', w: '#f2f2ee', l: '#f2f2ee', c: ['#0a0a0b', '#f2f2ee', '#0a0a0b', '#f2f2ee', '#0a0a0b', '#0a0a0b'], mono: 1 },
      { id: 'phosphor', n: 'Phosphor', sig: '#33ff66', k: '#020a04', w: '#7dff9e', l: '#06210f', c: ['#04260f', '#06210f', '#0a3a18', '#04260f', '#06210f', '#020a04'], mono: 1 },
      { id: 'amber', n: 'Amber', sig: '#ffb000', k: '#0a0600', w: '#ffc94d', l: '#1f1500', c: ['#2a1c00', '#1f1500', '#3a2600', '#2a1c00', '#1f1500', '#0a0600'], mono: 1 },
      { id: 'nightshift', n: 'Nightshift', sig: '#ff2a2a', k: '#000000', w: '#ff3b30', l: '#160000', c: ['#1e0000', '#160000', '#2a0000', '#3a0000', '#1e0000', '#000000'], mono: 1 }
    ];
    var BYID = {}; PAL.forEach(function (p) { BYID[p.id] = p; });
    var NAMES = ['Console', 'Manifest', 'Schedule', 'Signal', 'Comms', 'Bio'];

    function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return isNaN(n) ? [0, 0, 0] : [n >> 16, n >> 8 & 255, n & 255]; }
    function hex(c) { return '#' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join(''); }
    function lum(h) { return window.JRLlum(h); }
    function con(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
    function best(bg, opts) { var b = opts[0], bc = 0; opts.forEach(function (o) { var c = con(bg, o); if (c > bc) { bc = c; b = o; } }); return b; }
    function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }

    var cur = BYID[store.get('jrl-l-pal')] ? store.get('jrl-l-pal') : 'standard';
    var mode = /^(auto|white|dark)$/.test(store.get('jrl-l-mode') || '') ? store.get('jrl-l-mode') : 'auto';
    var color = store.get('jrl-l-color') === 'utility' ? 'utility' : 'radical';
    function night() { var C = window.JRLcolony; return !!(C && C.night()); }
    function regOf(d) {
      if (night()) return 'dark';
      if (color === 'radical') return 'radical';
      if (mode !== 'auto') return mode;
      var C = window.JRLcolony, daily = C && C.day() % 2 ? 'white' : 'dark';
      return ['white', daily, 'white', 'dark', 'white', 'dark'][d] || 'dark';
    }
    function tokens(d, P) {
      P = P || BYID[cur]; d = Math.max(0, Math.min(5, d | 0));
      var reg = regOf(d), T = { reg: reg }, hue = P.c[d];
      if (reg === 'radical') T.fld = hue;
      else if (reg === 'white') T.fld = P.l;
      else T.fld = P.k;
      var colored = con(T.fld, P.k) >= 1.3 && con(T.fld, P.l) >= 1.3;
      T.ink = best(T.fld, [P.k, P.w]);
      if (colored) T.acc = con(P.sig, T.fld) >= 2.2 ? P.sig : con(P.w, T.fld) >= 2.2 ? P.w : T.ink;
      else T.acc = con(hue, T.fld) >= 1.4 ? hue : con(P.sig, T.fld) >= 1.4 ? P.sig : T.ink;
      T.onacc = best(T.acc, [P.k, P.w]);
      T.hl = con(T.acc, T.fld) >= 3 ? T.acc : T.ink;
      T.slab = con(T.fld, P.k) < 1.3 ? mix(P.k, P.w, .07) : P.k;
      T.slabink = best(T.slab, [P.w, P.k]);
      if (reg === 'white') { T.tagbg = T.ink; T.tagfg = T.fld; } else { T.tagbg = T.acc; T.tagfg = T.onacc; }
      T.fc = con(T.ink, T.fld) < 7;
      T.duohi = con(T.fld, P.k) > 3 ? T.fld : (con(T.acc, P.k) > 3 ? T.acc : P.w);
      return T;
    }
    function setDuo(sel, lo, hi) { var f = document.querySelector(sel); if (!f) return; var a = rgb(lo), b = rgb(hi); ['R', 'G', 'B'].forEach(function (ch, i) { var fn = f.querySelector('feFunc' + ch); if (fn) fn.setAttribute('tableValues', (a[i] / 255).toFixed(3) + ' ' + (b[i] / 255).toFixed(3)); }); }
    function apply(d) {
      var P = BYID[cur], T = tokens(d, P), s = R.style, set = function (k, v) { s.setProperty(k, v); };
      set('--k', P.k); set('--w', P.w); set('--l', P.l); set('--sig', P.sig); set('--on-sig', best(P.sig, [P.k, P.w]));
      set('--fld', T.fld); set('--ink', T.ink); set('--acc', T.acc); set('--on-acc', T.onacc); set('--hl', T.hl);
      set('--slab', T.slab); set('--slab-ink', T.slabink); set('--tag-bg', T.tagbg); set('--tag-fg', T.tagfg);
      set('--reg', 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'56\'%3E%3Cpath d=\'M1 6h11M6.5 0.5v11\' stroke=\'' + encodeURIComponent(T.ink) + '\' stroke-opacity=\'.28\'/%3E%3C/svg%3E")');
      R.dataset.reg = T.reg === 'radical' ? 'radical' : T.reg; R.dataset.color = color; R.dataset.pal = cur;
      if (T.fc) R.dataset.fc = '1'; else delete R.dataset.fc;
      if (P.mono) R.dataset.mono = '1'; else delete R.dataset.mono;
      R.style.colorScheme = lum(T.fld) > .4 ? 'light' : 'dark';
      setDuo('#duo', P.k, T.duohi); setDuo('#duo-ic', P.k, P.w);
      var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = T.fld;
      return T;
    }
    window.JRLpal = {
      list: PAL, names: NAMES,
      cur: function () { return cur; }, get: function (id) { return BYID[id || cur]; },
      set: function (id) { if (!BYID[id]) return false; cur = id; store.set('jrl-l-pal', id); return true; },
      step: function (dir) { var i = PAL.findIndex(function (p) { return p.id === cur; }); return PAL[(i + dir + PAL.length) % PAL.length].id; },
      random: function () { var p; do { p = PAL[Math.floor(Math.random() * PAL.length)].id; } while (p === cur && PAL.length > 1); return p; },
      mode: function (v) { if (v) { mode = v; store.set('jrl-l-mode', v); } return mode; },
      color: function (v) { if (v) { color = v; store.set('jrl-l-color', v); } return color; },
      regOf: regOf, tokens: tokens, apply: apply, con: con, best: best, mix: mix
    };
  })();
