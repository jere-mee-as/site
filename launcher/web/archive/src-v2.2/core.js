  // Core layer (ported from the v3.6 site): synthesized sound, haptics, the flash-card cut, block resolves,
  // the cold-start intro, the invert sweep, text decode, life support and the colony.
  // Everything runs on a 30fps grid (33ms frames). Sizes come from #device, not the window,
  // so the desktop preview frame behaves like the phone.
  (function () {
    'use strict';
    var R = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var DEV = document.getElementById('device');
    var DW = function () { return DEV.clientWidth || innerWidth; }, DH = function () { return DEV.clientHeight || innerHeight; };
    var css = function (v) { return getComputedStyle(R).getPropertyValue(v).trim(); };
    var rint = function (n) { return Math.floor(Math.random() * n); };
    var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
    window.JRLstore = store;
    window.JRLreduce = reduce;
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (b) { return (b + .5) / 16; });

    /* ================= sound: synthesized, OFF by default on the phone ================= */
    var AC = null, master = null, noise = null, on = store.get('jrl-l-snd') === 'on', meter = 0, carrier = null, lastTick = 0;
    function ctx() {
      if (AC) return AC;
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      try { AC = new C(); } catch (e) { return null; }
      master = AC.createGain(); master.gain.value = on ? .5 : 0;
      var comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6;
      master.connect(comp); comp.connect(AC.destination);
      var len = AC.sampleRate, b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noise = b; return AC;
    }
    function unlock() { if (!on) return; var a = ctx(); if (a && a.state === 'suspended') a.resume(); }
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, unlock, { capture: true, passive: true }); });
    function ok() { return on && AC && AC.state === 'running' && !R.dataset.playing; }
    function bump(v) { meter = Math.min(1, meter + v); }
    function nz(t, dur, type, f, q, g) {
      var s = AC.createBufferSource(); s.buffer = noise; s.loop = true;
      var fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || .7;
      var gn = AC.createGain(); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t, Math.random() * .8); s.stop(t + dur + .02);
    }
    function osc(t, type, f0, f1, dur, g) {
      var o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      var gn = AC.createGain(); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(gn); gn.connect(master); o.start(t); o.stop(t + dur + .02);
    }
    var S = {
      tick: function (g) { if (!ok()) return; var t = AC.currentTime; if (t - lastTick < .03) return; lastTick = t; nz(t, .012, 'highpass', 6500, .7, g || .05); bump(.12); },
      key: function () { if (!ok()) return; nz(AC.currentTime, .02, 'bandpass', 2200 + Math.random() * 2600, 2, .08); bump(.12); },
      click: function () { if (!ok()) return; var t = AC.currentTime; nz(t, .015, 'highpass', 4000, .7, .1); osc(t, 'sine', 140, 60, .09, .25); bump(.35); },
      crackle: function (t0) { if (!ok()) return; var t = t0 || AC.currentTime; for (var i = 0; i < 3; i++) nz(t + i * .009 + Math.random() * .004, .014, 'bandpass', 800 + Math.random() * 6000, 1.2, .09 + Math.random() * .06); bump(.3); },
      thump: function (low) { if (!ok()) return; var t = AC.currentTime; osc(t, 'sine', low ? 90 : 120, low ? 32 : 44, .22, .7); nz(t, .03, 'lowpass', 1800, .7, .12); bump(.6); },
      burst: function (n, ms, low) { if (!ok()) return; var t = AC.currentTime; for (var i = 0; i < n; i++) S.crackle(t + i * ms / 1000); setTimeout(function () { S.thump(low); }, n * ms); },
      swell: function () {
        if (!ok()) return; var t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noise; s.loop = true;
        var fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(80, t); fl.frequency.exponentialRampToValueAtTime(900, t + .8);
        var gn = AC.createGain(); gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(.32, t + .6); gn.gain.exponentialRampToValueAtTime(.0001, t + 1.2);
        s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t); s.stop(t + 1.25); osc(t + .55, 'sine', 70, 36, .6, .5); bump(.8);
      },
      err: function () {
        if (!ok()) return; var t = AC.currentTime;
        [110, 117].forEach(function (f) { var o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; var fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900;
          var g = AC.createGain(); g.gain.setValueAtTime(.16, t); g.gain.setValueAtTime(.16, t + .14); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(fl); fl.connect(g); g.connect(master); o.start(t); o.stop(t + .22); });
        nz(t, .06, 'highpass', 2500, .7, .12); bump(.7);
      },
      roll: function (n) { if (!ok()) return; var t = AC.currentTime, at = 0; n = n || 12; for (var i = 0; i < n; i++) { at += .07 * Math.pow(.86, i) + .012; nz(t + at, .008, 'highpass', 5000 + i * 300, .7, .05); } nz(t + at + .05, .02, 'bandpass', 1400, 3, .14); osc(t + at + .05, 'square', 880, 880, .03, .03); bump(.4); },
      ping: function (y) { if (!ok()) return; var t = AC.currentTime, f = 1700 - 1200 * Math.max(0, Math.min(1, y)); osc(t, 'sine', f, f * .98, .28, .16); osc(t + .11, 'sine', f, f * .98, .22, .05); bump(.3); },
      shutter: function () { if (!ok()) return; var t = AC.currentTime; nz(t, .02, 'lowpass', 3000, .7, .25); nz(t + .045, .025, 'lowpass', 2200, .7, .2); bump(.4); },
      chirp: function () { if (!ok()) return; var t = AC.currentTime; [988, 1319, 1976, 1319].forEach(function (f, i) { osc(t + i * .06, 'square', f, f, .05, .05); }); bump(.4); },
      carrier: function (v) {
        if (!AC) return;
        if (v && ok() && !carrier) { var t = AC.currentTime, g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.008, t + .4); g.gain.setValueAtTime(.008, t + 1.6); g.gain.exponentialRampToValueAtTime(.0001, t + 2); g.connect(master);
          [1180, 2350].forEach(function (f) { var o = AC.createOscillator(); o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 2.05); }); carrier = g; setTimeout(function () { if (carrier === g) carrier = null; }, 2100); }
        if (!v && carrier) { var c = carrier, n = AC.currentTime; carrier = null; c.gain.cancelScheduledValues(n); c.gain.setValueAtTime(c.gain.value, n); c.gain.linearRampToValueAtTime(0, n + .05); setTimeout(function () { try { c.disconnect(); } catch (e) {} }, 120); }
      },
      feed: function () { if (!ok()) return; var t = AC.currentTime; nz(t, .05, 'lowpass', 900, 1, .22); osc(t, 'sine', 220, 80, .18, .4); osc(t + .07, 'sine', 160, 70, .14, .2); bump(.5); },
      molt: function () { if (!ok()) return; var t = AC.currentTime; for (var i = 0; i < 4; i++) S.crackle(t + i * .04); osc(t + .16, 'triangle', 300, 900, .12, .08); bump(.6); },
      die: function () { if (!ok()) return; var t = AC.currentTime; osc(t, 'sine', 160, 30, 1.6, .5); nz(t, 1.2, 'bandpass', 600, .5, .06); bump(1); },
      skitter: function () { if (!ok()) return; var t = AC.currentTime; for (var i = 0; i < 6; i++) nz(t + i * .05 + Math.random() * .03, .006, 'highpass', 7000, .7, .035); bump(.2); },
      wake: function () { if (!ok()) return; var t = AC.currentTime; osc(t, 'sine', 70, 140, .35, .25); nz(t, .3, 'lowpass', 600, .7, .08); bump(.5); },
      doze: function () { if (!ok()) return; osc(AC.currentTime, 'sine', 180, 70, .45, .18); bump(.3); },
      beep: function (f, dur, type, g) {
        if (!ok()) return; var t = AC.currentTime, o = AC.createOscillator(), gn = AC.createGain(); g = g || .1; dur = dur || .08;
        o.type = type || 'sine'; o.frequency.value = f; gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + .005);
        gn.gain.setValueAtTime(g, t + dur); gn.gain.exponentialRampToValueAtTime(.0001, t + dur + .02); o.connect(gn); gn.connect(master); o.start(t); o.stop(t + dur + .04); bump(.25);
      },
      note: function (f, type) {
        if (!ok()) return; var t = AC.currentTime, o = AC.createOscillator(), fl = AC.createBiquadFilter(), gn = AC.createGain();
        o.type = type || 'square'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(Math.min(16000, f * 8), t); fl.frequency.exponentialRampToValueAtTime(f * 1.5, t + .4);
        gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(.13, t + .008); gn.gain.exponentialRampToValueAtTime(.0001, t + .55);
        o.connect(fl); fl.connect(gn); gn.connect(master); o.start(t); o.stop(t + .6); bump(.4);
      },
      enter: function () { S.carrier(false); S.thump(); S.swell(); },
      on: function () { return on; },
      set: function (v) { on = !!v; store.set('jrl-l-snd', on ? 'on' : 'off'); R.dataset.snd = on ? 'on' : 'off'; if (on) { ctx(); unlock(); } if (master) master.gain.value = on ? .5 : 0; if (!on) S.carrier(false); if (on) setTimeout(S.click, 40); },
      toggle: function () { S.set(!on); }
    };
    R.dataset.snd = on ? 'on' : 'off';
    window.JRLsfx = S;

    /* ================= haptics: on by default; the bridge does the buzzing ================= */
    var hapOn = store.get('jrl-l-hap') !== 'off', hapEl = document.getElementById('hap'), hapT = 0;
    var HMS = { tick: 8, click: 14, heavy: 30, double: [14, 40, 14], err: [30, 50, 30] };
    window.JRLhap = function (kind) {
      if (!hapOn) return; kind = kind || 'tick';
      try { if (window.JRLbridge) window.JRLbridge.haptic(kind, HMS[kind] || 10); } catch (e) {}
      if (hapEl) { hapEl.classList.add('on'); clearTimeout(hapT); hapT = setTimeout(function () { hapEl.classList.remove('on'); }, 66); }
    };
    window.JRLhap.on = function () { return hapOn; };
    // a waveform: [on, off, on, off…] in ms, like navigator.vibrate. The bursts use it so you feel each card.
    window.JRLhap.pattern = function (p) {
      if (!hapOn || !p || !p.length) return;
      try { if (window.JRLbridge) window.JRLbridge.haptic('pattern', p); } catch (e) {}
      if (hapEl) { hapEl.classList.add('on'); clearTimeout(hapT); hapT = setTimeout(function () { hapEl.classList.remove('on'); }, p.reduce(function (a, b) { return a + b; }, 0)); }
    };
    window.JRLhap.set = function (v) { hapOn = !!v; store.set('jrl-l-hap', hapOn ? 'on' : 'off'); if (hapOn) window.JRLhap('click'); };

    /* ================= the cut: flash-card bursts =================
       Measured from the reference reel: ~270ms of full-frame cards held 1–4 frames, then a hard cut.
       On the phone the big moves are: launching a program, changing palette, boot, root. */
    var cut = document.getElementById('cut'), cx = cut.getContext('2d'), W = 1, H = 1, cutT = [];
    var CODE = ['ld   r4, [hex+0x4112]', 'cmp  fld, ink', 'bne  .cut', 'jsr  decode', 'mov  acc, #c2ff16', 'sync 30fps', '; graphic realism', 'push field', 'call render()', 'mask 0xffd0', 'rts', 'nop'];
    function sizeCut() { W = Math.max(1, Math.round(DW() / 2)); H = Math.max(1, Math.round(DH() / 2)); cut.width = W; cut.height = H; }
    function blocks(col, n, mw, mh) { cx.fillStyle = col; for (var i = 0; i < n; i++) cx.fillRect(rint(W), rint(H), 4 + rint(mw), 2 + rint(mh)); }
    function cross(x, y, s, col) { cx.fillStyle = col; cx.fillRect(x - s, y, s * 2 + 1, 1); cx.fillRect(x, y - s, 1, s * 2 + 1); }
    function cardCode(k, lines) {
      cx.fillStyle = k ? '#3b03e6' : '#441eec'; cx.fillRect(0, 0, W, H);
      blocks('#6751d6', 9, W * .4, H * .5); blocks('#2c04a6', 7, W * .3, H * .4);
      cx.fillStyle = '#8a7ff0'; var x0 = rint(W * .55), y0 = rint(H * .3); for (var i = 0; i < 18; i++) cx.fillRect(x0 + i * 6, y0 + rint(18), 2, 24 + rint(H * .35));
      cx.fillStyle = 'rgba(255,255,255,.88)'; cx.font = '500 9px "JetBrains Mono", monospace'; var tx = 8 + rint(W * .12), L = (lines || []).concat(CODE);
      for (var j = 0; j < Math.min(14, Math.floor(H / 12) - 1); j++) cx.fillText(L[(j + (lines ? 0 : k * 4)) % L.length], tx, 16 + j * 12);
      blocks(css('--sig') || '#c2ff16', 5, 24, 7);
    }
    function cardDither(a, b, cell) {
      cx.fillStyle = a; cx.fillRect(0, 0, W, H); cx.fillStyle = b; cx.beginPath();
      var cols = Math.ceil(W / cell), rows = Math.ceil(H / cell), t = Math.random() * 6;
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) { var v = .5 + .5 * Math.sin(i * .23 + t) * Math.cos(j * .19 - t); if (v > BAYER[(j & 3) * 4 + (i & 3)]) cx.rect(i * cell, j * cell, cell, cell); }
      cx.fill();
    }
    function cardMosaic(a, b, c, cell) {
      cx.fillStyle = a; cx.fillRect(0, 0, W, H);
      var cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) { var r = Math.random(); if (r < .32) { cx.fillStyle = b; cx.fillRect(i * cell, j * cell, cell, cell); } else if (r < .37) { cx.fillStyle = c; cx.fillRect(i * cell, j * cell, cell, cell); } }
    }
    function wide(v) { try { cx.fontStretch = v ? 'expanded' : 'normal'; } catch (e) {} }
    function cardTitle(d, label, n) {
      cx.fillStyle = d.fld; cx.fillRect(0, 0, W, H);
      var txt = String(label).toUpperCase(), fs = Math.round(Math.min(H * .5, W * .62)); cx.font = '900 ' + fs + 'px Archivo, "Arial Black", sans-serif'; wide(true);
      cx.fillStyle = d.ink; cx.textBaseline = 'alphabetic'; cx.fillText(txt, -fs * .06, H + fs * .14); wide(false);
      var tag = (n ? n + ' / ' : '') + txt; cx.font = '700 9px "Kode Mono", monospace';
      var tw = cx.measureText(tag).width + 10; cx.fillStyle = d.tagbg; cx.fillRect(12, 12, tw, 15); cx.fillStyle = d.tagfg; cx.fillText(tag, 17, 23);
      cross(W - 16, 16, 6, d.ink); cross(W - 16, Math.round(H * .5), 6, d.ink); cross(16, Math.round(H * .42), 6, d.ink);
    }
    function cardFlip(d, label, inv) {
      var cols = inv ? [d.acc, d.fld, d.acc] : [d.fld, d.acc, d.fld], ph = H / 3;
      cols.forEach(function (c, i) { cx.fillStyle = c; cx.fillRect(0, Math.round(i * ph), W, Math.ceil(ph) + 1); });
      var fs = Math.round(Math.min(H * .3, W * .4)); cx.font = '900 ' + fs + 'px Archivo, sans-serif'; wide(true);
      cx.fillStyle = inv ? d.fld : d.ink; cx.textBaseline = 'alphabetic'; cx.fillText(String(label).toUpperCase(), W * .06, H * .62); wide(false);
    }
    function lum(hex) { var n = parseInt(String(hex).replace('#', ''), 16); if (isNaN(n)) return 0; var c = [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(function (v) { return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
    window.JRLlum = lum;
    /* small move: a hard cut with one inverted frame (33ms) */
    // dark register or the colony's night: a clean hard cut, never a white frame on an OLED in a dark room
    window.JRLdim = function () { return R.dataset.reg === 'dark' || (window.JRLcolony && window.JRLcolony.night()); };
    window.JRLsnap = function () {
      var app = document.getElementById('app');
      if (!reduce && app && !window.JRLdim()) app.animate([{ filter: 'invert(1)' }, { filter: 'invert(1)' }], { duration: 33 });
      S.crackle(); S.click();
    };
    function stopCut() { cutT.forEach(clearTimeout); cutT = []; cut.style.display = 'none'; }
    window.JRLcut = function (o) {
      o = o || {}; stopCut();
      if (reduce) { S.click(); return 0; }
      sizeCut();
      var src = o.from || css('--fld') || '#0a0a0b', label = o.label || '', n = o.n || '', seq;
      var d = { fld: o.fld || css('--fld'), ink: o.ink || css('--ink'), acc: o.acc || css('--acc'), tagbg: o.tagbg || css('--tag-bg'), tagfg: o.tagfg || css('--tag-fg') };
      if (o.kind === 'mini') { var mc = o.col || d.acc; seq = [[function () { cardDither(src, mc, 8); }, 33], [function () { cardMosaic(mc, src, css('--sig'), 16); }, 33]]; }
      else if (o.kind === 'launch') {
        var col = o.col || d.acc, ink = lum(col) > .22 ? '#0a0a0b' : '#f2f2ee', T = { fld: col, ink: ink, acc: d.acc, tagbg: '#0a0a0b', tagfg: '#f2f2ee' };
        seq = [[function () { cardCode(0, o.lines); }, 33], [function () { cardDither(src, col, 6); }, 50], [function () { cardMosaic(col, src, css('--sig'), 12); }, 33], [function () { cardTitle(T, label, n); }, 67]];
      } else if (o.kind === 'flip') seq = [[function () { cardFlip(d, label, false); }, 50], [function () { cardFlip(d, label, true); }, 50], [function () { cardTitle(d, label, n); }, 67]];
      else seq = [[function () { cardCode(0); }, 33], [function () { cardCode(1); }, 33], [function () { cardDither(src, d.fld, 6); }, 50], [function () { cardMosaic(d.fld, src, d.acc, 12); }, 33], [function () { cardTitle(d, label, n); }, 67]];
      try { seq[0][0](); } catch (e) {}
      cut.style.display = 'block';
      var t = seq[0][1];
      seq.slice(1).forEach(function (f) { cutT.push(setTimeout(function () { try { f[0](); } catch (e) {} }, t)); t += f[1]; });
      cutT.push(setTimeout(stopCut, t));
      S.burst(seq.length, Math.round(t / seq.length), o.back);
      // one short pulse per card, then a heavier one on the final card: the cut is felt, not just seen
      if (window.JRLhap && window.JRLhap.pattern) { var pat = []; seq.forEach(function (f, i) { var on = i === seq.length - 1 ? 22 : 9; pat.push(on, Math.max(0, f[1] - on)); }); pat.pop(); window.JRLhap.pattern(pat); }
      return t;
    };

    /* ================= block resolve: a cover of the field colour breaks up, coarse to fine ================= */
    window.JRLresolve = function (el, col, fast) {
      if (reduce || !el || R.dataset.life === 'low') return; var r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var c = document.createElement('canvas'), w = Math.ceil(r.width / 2), h = Math.ceil(r.height / 2); c.className = 'rsv'; c.width = w; c.height = h; el.appendChild(c);
      var x = c.getContext('2d'), fill = col || css('--fld'), steps = fast ? [32, 16, 8, 4] : [24, 12, 6, 3, 2], k = 0;
      (function step() {
        if (k >= steps.length) { c.remove(); return; }
        var s = steps[k], keep = 1 - (k + 1) / (steps.length + 1); x.clearRect(0, 0, w, h); x.fillStyle = fill;
        for (var j = 0; j < h; j += s) for (var i = 0; i < w; i += s) if (Math.random() < keep) x.fillRect(i, j, s, s);
        k++; setTimeout(step, fast ? 33 : 50);
      })();
    };

    /* ================= wipe: the invert sweep, a white band in difference blend crossing the unit ================= */
    window.JRLwipe = function (back) {
      var w = document.getElementById('wipe'); w.classList.remove('go', 'back'); void w.offsetWidth; w.classList.add(back ? 'back' : 'go'); S.swell();
      return back ? 1400 : 1800;
    };

    /* ================= error band ================= */
    window.JRLerrband = function (word, host) {
      host = host || document.getElementById('cli'); if (!host || host.hidden || reduce) return;
      var b = document.createElement('div'), s = ''; for (var i = 0; i < 6; i++) s += 'ERROR_';
      b.className = 'errband'; b.setAttribute('aria-hidden', 'true');
      b.innerHTML = '<span>' + s + '<b>' + String(word || 'NOT_RECOGNISED').replace(/[<>&]/g, '') + '</b>_' + s + s + '</span>';
      host.appendChild(b); setTimeout(function () { b.remove(); }, 700); window.JRLhap('err');
    };

    /* ================= cold start: lime block fragments in bursts, then the wordmark builds out of blocks ================= */
    window.JRLintro = function (done) {
      if (reduce) { done(); return; }
      var c = document.createElement('canvas'); c.id = 'intro'; c.setAttribute('aria-hidden', 'true'); DEV.appendChild(c);
      var w = Math.max(1, Math.round(DW() / 2)), h = Math.max(1, Math.round(DH() / 2)); c.width = w; c.height = h;
      var x = c.getContext('2d'), L = '#c2ff16', D = '#5f7d0c', u = Math.max(3, Math.round(Math.min(w, h) / 60)), T = [], t = 0, ended = false;
      function frag() {
        var cw = 4 + rint(12), ch = 2 + rint(8), x0 = rint(Math.max(1, w - cw * u)), y0 = rint(Math.max(1, h - ch * u)), kind = rint(5);
        for (var j = 0; j < ch; j++) for (var i = 0; i < cw; i++) {
          var lit = kind === 0 ? 1 : kind === 1 ? ((i + j) & 1) : kind === 2 ? (j === 0 || j === ch - 1 || i % 3 === 0) : kind === 3 ? (i === j || j === 0 || j === ch - 1 || i === 0 || i === cw - 1) : Math.random() < .55;
          if (lit) { x.fillStyle = kind === 0 || Math.random() < .8 ? L : D; x.fillRect(x0 + i * u, y0 + j * u, u - (kind === 0 ? 0 : 1), u - (kind === 0 ? 0 : 1)); }
        }
      }
      function burstFrame() { x.fillStyle = '#0a0a0b'; x.fillRect(0, 0, w, h); for (var i = 0, n = 7 + rint(9); i < n; i++) frag(); S.crackle(); }
      function at(fn, ms) { T.push(setTimeout(fn, ms)); }
      function end() { if (ended) return; ended = true; T.forEach(clearTimeout); c.remove(); DEV.removeEventListener('pointerdown', skip, true); done(); }
      function skip() { end(); }
      DEV.addEventListener('pointerdown', skip, true);
      S.carrier(true);
      for (var b = 0; b < 4; b++) { at(burstFrame, t); at(burstFrame, t + 33); at(burstFrame, t + 66); t += 66 + 170; }
      var off = document.createElement('canvas'); off.width = w; off.height = h; var ox = off.getContext('2d'), data = null;
      function word(k) {
        if (!data) {
          var fs = Math.round(h * .3); ox.font = '500 ' + fs + 'px "Hubot Sans", Archivo, sans-serif'; try { ox.fontStretch = 'condensed'; } catch (e) {}
          var lines = w < h ? ['JERE.', 'ING'] : ['JERE.ING'], mw = Math.max.apply(null, lines.map(function (s) { return ox.measureText(s).width; }));
          if (mw > w * .86) { fs = Math.floor(fs * w * .86 / mw); ox.font = '500 ' + fs + 'px "Hubot Sans", Archivo, sans-serif'; try { ox.fontStretch = 'condensed'; } catch (e) {} }
          ox.textAlign = 'center'; ox.textBaseline = 'middle'; ox.fillStyle = '#fff';
          lines.forEach(function (s, i) { ox.fillText(s, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * .92); });
          data = ox.getImageData(0, 0, w, h).data;
        }
        var s = [16, 8, 4, 2][k]; x.fillStyle = '#0a0a0b'; x.fillRect(0, 0, w, h); x.fillStyle = L;
        for (var j = 0; j < h; j += s) for (var i = 0; i < w; i += s) { var px = Math.min(w - 1, i + (s >> 1)), py = Math.min(h - 1, j + (s >> 1)); if (data[(py * w + px) * 4 + 3] > 100) x.fillRect(i, j, s, s); }
        if (k === 0) S.swell();
      }
      for (var k = 0; k < 4; k++) (function (k) { at(function () { word(k); }, t); t += 66; })(k);
      t += 380; at(end, t);
    };

    /* ================= decode: text resolves out of shifting symbols (terminal, boot log only) ================= */
    var GLS = '▖▗▘▙▚▛▜▝▞▟■□▪+×≡01', KEEP = [];
    var gl = function () { return GLS[rint(GLS.length)]; };
    function unkeep(el) { KEEP = KEEP.filter(function (k) { return k.el !== el; }); }
    function keep(el, n, txt) {
      unkeep(el); txt = txt == null ? el.textContent : txt; if (!n || reduce) return;
      var spots = []; for (var i = 0; i < txt.length; i++) if (/[A-Za-z0-9]/.test(txt[i])) spots.push(i);
      var idx = []; while (spots.length && idx.length < n) idx.push(spots.splice(rint(spots.length), 1)[0]);
      if (idx.length) KEEP.push({ el: el, txt: txt, idx: idx, shown: el.textContent });
    }
    function decode(el, txt, o) {
      if (!el) return; o = o || {}; txt = txt == null ? el.textContent : String(txt);
      var id = (el._dec || 0) + 1; el._dec = id; unkeep(el);
      if (reduce || !txt || R.dataset.life === 'low' && !o.force) { el.textContent = txt; return; }
      var f = 0, tot = o.frames || Math.round(Math.min(22, 8 + txt.length / 4)), seeds = txt.split('').map(function () { return Math.random() * .35; });
      var iv = setInterval(function () {
        if (el._dec !== id) { clearInterval(iv); return; }
        f++; var prog = f / tot; if (!o.mute) S.tick(.035);
        el.textContent = txt.split('').map(function (ch, i) { return ch === ' ' || ch === '\n' || prog * 1.35 > i / txt.length + seeds[i] ? ch : gl(); }).join('');
        if (f >= tot) { clearInterval(iv); el.textContent = txt; if (o.keep) keep(el, o.keep, txt); }
      }, (o.speed || 68));
    }
    setInterval(function () {
      KEEP = KEEP.filter(function (k) { return k.el.isConnected && k.el.textContent === k.shown; });
      KEEP.forEach(function (k) { if (Math.random() > .2) return; var a = k.txt.split(''); k.idx.forEach(function (i) { a[i] = Math.random() < .35 ? k.txt[i] : gl(); }); k.el.textContent = k.shown = a.join(''); });
    }, 480);
    window.JRLdecode = decode; window.JRLglyphs = GLS;

    /* ================= life support: AUTO / FULL / LOW ================= */
    var lowBase = reduce || (navigator.connection && navigator.connection.saveData), bat = { level: null, charging: false };
    function lifePref() { return store.get('jrl-l-life') || 'auto'; }
    function lifeCalc() {
      var p = lifePref(), v = p === 'auto' ? (lowBase || (bat.level != null && !bat.charging && bat.level < .2) || bat.saver ? 'low' : 'full') : p;
      if (R.dataset.life !== v) { R.dataset.life = v; if (window.JRLonLife) window.JRLonLife(v); }
      return v;
    }
    window.JRLlife = function (v) { if (v) { store.set('jrl-l-life', v); lifeCalc(); } return R.dataset.life; };
    window.JRLlife.pref = lifePref;
    window.JRLlife.battery = function (b) { if (b) { bat = b; lifeCalc(); if (window.JRLonBattery) window.JRLonBattery(b); } return bat; };
    window.JRLlife.why = function () { var p = lifePref(); if (p !== 'auto') return 'set by hand'; if (reduce) return 'reduced motion is on'; if (navigator.connection && navigator.connection.saveData) return 'data saver is on'; if (bat.saver) return 'power saver is on'; if (bat.level != null && !bat.charging && bat.level < .2) return 'battery under 20%'; return 'nothing is low'; };
    lifeCalc();

    /* ================= the colony =================
       A 32x18 culture. Steps one generation per burst, mutates, blooms when thin, molts when crowded,
       dies after 30 days unfed. Day 001 is 2026-11-07 (ET) for everyone, the site included. */
    var DAYMS = 864e5, EPOCH = Date.UTC(2026, 10, 7), CW = 32, CH = 18;
    function etDay() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()); }
    function etHour() { return +new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(new Date()); }
    function prng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    window.JRLcolony = (function () {
      var st = null, cells = new Uint8Array(CW * CH), now = Date.now(), died = null;
      try { st = JSON.parse(store.get('jrl-l-colony') || 'null'); } catch (e) {}
      function seedCells(seed) { var r = prng(seed); cells.fill(0); for (var k = 0; k < cells.length; k++) if (r() < .28) cells[k] = 1; }
      function enc() { var s = ''; for (var i = 0; i < cells.length; i += 4) s += ((cells[i] << 3) | (cells[i + 1] << 2) | (cells[i + 2] << 1) | cells[i + 3]).toString(16); return s; }
      function dec(s) { for (var i = 0; i < s.length && i * 4 < cells.length; i++) { var v = parseInt(s[i], 16) || 0; for (var b = 0; b < 4; b++) cells[i * 4 + b] = (v >> (3 - b)) & 1; } }
      function fresh(lost) { st = { seed: (Math.random() * 1e9) | 0, born: etDay(), fed: Date.now(), feeds: 0, gen: 0, lost: lost || 0, mut: 0 }; seedCells(st.seed); }
      if (!st || !st.seed) fresh(0); else if (st.c) dec(st.c); else seedCells(st.seed);
      if (now - st.fed > 30 * DAYMS) { died = { days: Math.round((now - st.fed) / DAYMS), lost: (st.lost || 0) + 1 }; fresh(died.lost); }
      function save() { st.c = enc(); store.set('jrl-l-colony', JSON.stringify(st)); }
      function pop() { var n = 0; for (var i = 0; i < cells.length; i++) n += cells[i]; return n; }
      function energy() { return Math.max(0, 1 - (Date.now() - st.fed) / (30 * DAYMS)); }
      var moltAt = Math.max(30, pop());
      function step() {
        var N = new Uint8Array(cells.length), e = energy(), r = Math.random, ev = null;
        for (var y = 0; y < CH; y++) for (var x = 0; x < CW; x++) {
          var c = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { if (dx || dy) c += cells[((y + dy + CH) % CH) * CW + ((x + dx + CW) % CW)]; }
          var k = y * CW + x, live = cells[k] ? (c === 2 || c === 3) : c === 3;
          if (live && e < .35 && r() < (.35 - e) * .3) live = false;
          N[k] = live ? 1 : 0;
        }
        if (r() < .35) { N[(r() * N.length) | 0] ^= 1; st.mut++; }
        cells = N; st.gen++;
        var p = pop();
        if (p < 8) { var rr = prng(st.seed + st.gen); for (var q = 0; q < 46; q++) cells[(rr() * cells.length) | 0] = 1; ev = 'bloom'; }
        else if (p > moltAt * 1.6) { moltAt = p; ev = 'molt'; }
        else if (p < moltAt * .5) moltAt = Math.max(30, p);
        save(); return ev;
      }
      function feed(n) { var r = Math.random, cx2 = (r() * CW) | 0, cy = (r() * CH) | 0;
        [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]].forEach(function (p) { cells[((cy + p[0]) % CH) * CW + ((cx2 + p[1]) % CW)] = 1; });
        for (var i = 0; i < (n || 8); i++) cells[(r() * cells.length) | 0] = 1; st.fed = Date.now(); st.feeds++; save(); }
      save();
      return {
        // tap the wallpaper: a glider lands where your finger did, and it counts as feeding
        plant: function (x, y) { x = Math.max(0, Math.min(CW - 1, x | 0)); y = Math.max(0, Math.min(CH - 1, y | 0));
          [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]].forEach(function (p) { cells[((y - 1 + p[0] + CH) % CH) * CW + ((x - 1 + p[1] + CW) % CW)] = 1; }); st.fed = Date.now(); st.feeds++; save(); },
        drop: function (x, y) { if (x == null) { x = (Math.random() * CW) | 0; y = (Math.random() * CH) | 0; } cells[(y % CH) * CW + (x % CW)] = 1; save(); return [x, y]; },
        W: CW, H: CH, cells: function () { return cells; }, step: step, feed: feed, pop: pop, energy: energy, died: died, state: function () { return st; },
        day: function () { return Math.max(1, Math.floor((Date.parse(etDay()) - EPOCH) / DAYMS) + 1); },
        night: function () { return etHour() < 6; },
        genome: function (row) { var s = ''; for (var x = 0; x < CW; x += 4) { var v = 0; for (var b = 0; b < 4; b++) v = (v << 1) | cells[row * CW + x + b]; s += v.toString(16).toUpperCase(); } return s; }
      };
    })();
    window.JRLet = { day: etDay, hour: etHour };
  })();
