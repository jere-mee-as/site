/* jere.ing front door sounds. Everything is synthesized with Web Audio; no sound files.
   Picks (Nov 10, 2026 soundboard): air swell intro, far-away chimes per row to open and close,
   rising pair for links out, major third for the email copy, small chime for every choice in the weather panel (the button itself appears silently), far roll thunder with storm flashes. Hover is silent.
   Ambience is off by default and switched in the weather panel: birds with barely any wind by day,
   crickets and insects by night, drizzle for rain, heavy storm for storm.
   Nothing is built until the first tap or key press, and the audio sleeps while the tab is hidden. */
(function () {
  'use strict';
  var root = document.documentElement;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  // UI sounds remember their on/off; ambience always starts off on a new visit
  var prefs = { sounds: load('jere.sounds', '1') === '1', ambience: false };

  var ctx = null, master, verbIn, buf = {}, tex = {};
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function noise(kind) {
    var len = ctx.sampleRate * 3, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    var last = 0, p0 = 0, p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === 'pink') { p0 = .99886 * p0 + w * .0555179; p1 = .99332 * p1 + w * .0750759; p2 = .969 * p2 + w * .153852; p3 = .8665 * p3 + w * .3104856; p4 = .55 * p4 + w * .5329522; p5 = -.7616 * p5 - w * .016898; d[i] = (p0 + p1 + p2 + p3 + p4 + p5 + p6 + w * .5362) * .11; p6 = w * .115926; }
      else d[i] = w;
    }
    return b;
  }
  function build() {
    if (master) return;
    if (!ctx) ctx = new AC();
    master = ctx.createGain(); master.gain.value = .7;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    var len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    var verb = ctx.createConvolver(); verb.buffer = ir; verbIn = ctx.createGain(); verbIn.gain.value = .5; verbIn.connect(verb); verb.connect(master);
    buf.white = noise('white'); buf.pink = noise('pink'); buf.brown = noise('brown');
  }
  // true when sound can actually play right now
  function ready() { return ctx && ctx.state === 'running' && !document.hidden; }

  function out(node, wet, pan, dest) {
    var n = node;
    if (pan) { var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); n = p; }
    n.connect(dest || master);
    if (wet) { var g = ctx.createGain(); g.gain.value = wet; n.connect(g); g.connect(verbIn); }
  }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function tone(o) {
    var t = ctx.currentTime + (o.at || 0), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.d));
    if (o.detune) osc.detune.value = o.detune;
    env(g, t, o.a || .005, o.peak || .2, o.d);
    var node = g;
    if (o.lp) { var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); node = f; }
    osc.connect(g); out(node, o.wet, o.pan, o.dest); osc.start(t); osc.stop(t + (o.a || .005) + o.d + .05);
  }
  function hiss(o) {
    var t = ctx.currentTime + (o.at || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf[o.buf || 'white']; s.loop = true;
    f.type = o.ft || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.a || .01) + o.d);
    env(g, t, o.a || .01, o.peak || .2, o.d);
    s.connect(f); f.connect(g); out(g, o.wet, o.pan, o.dest);
    s.start(t, Math.random() * 2); s.stop(t + (o.a || .01) + o.d + .1);
  }
  // bell partials so the chimes ring like tubes
  function chime(f, at, peak, decay, pan) {
    tone({ at: at, f: f, d: decay, a: .002, peak: peak, wet: .75, pan: pan });
    tone({ at: at, f: f * 2.756, d: decay * .45, a: .002, peak: peak * .32, wet: .75, pan: pan });
    tone({ at: at, f: f * 5.404, d: decay * .2, a: .002, peak: peak * .12, wet: .75, pan: pan });
  }
  // one pentatonic family; each row gets its own range, panned left to right in page order
  var TUNING = [
    { notes: [784, 880, 988, 1175, 1319], pan: -.35 },
    { notes: [587, 659, 784, 880, 988], pan: -.12 },
    { notes: [988, 1175, 1319, 1568, 1760], pan: .12 },
    { notes: [1175, 1319, 1568, 1760, 1976], pan: .35 }
  ];
  function shuffled(a) { return a.slice().sort(function () { return Math.random() - .5; }); }

  var FX = {
    intro: function () {
      [220, 330, 440].forEach(function (f, i) { tone({ f: f, d: 2.2, a: .9, peak: .05, detune: i * 4 - 4, wet: .6 }); });
      hiss({ buf: 'pink', f: 1200, q: .4, a: .9, d: 1.6, peak: .03, wet: .5 });
    },
    // "far away" (picked Nov 10, both at 200%): heard only through the reverb, like chimes on a porch down the street
    open: function (r, quiet) {
      var k = quiet ? .6 : 1;
      shuffled(r.notes).slice(0, 3).forEach(function (f, i) { tone({ at: i * rnd(.1, .18), f: f, d: 1.4, a: .02, peak: .06 * k, lp: 2600, pan: r.pan, dest: verbIn }); });
    },
    close: function (r, quiet) {
      var k = quiet ? .6 : 1;
      [r.notes[3], r.notes[1]].forEach(function (f, i) { tone({ at: i * .14, f: f, d: .9, a: .02, peak: .044 * k, lp: 2400, pan: r.pan, dest: verbIn }); });
    },
    link: function () { tone({ f: 660, d: .18, a: .003, peak: .09, wet: .4 }); tone({ at: .07, f: 990, d: .3, a: .003, peak: .08, wet: .5 }); },
    copy: function () { tone({ f: 784, d: .3, a: .003, peak: .08, wet: .45 }); tone({ at: .09, f: 988, d: .5, a: .003, peak: .08, wet: .5 }); },
    appear: function () { tone({ f: 1568, d: 1, a: .01, peak: .04, wet: .8 }); },
    tick: function () { tone({ f: 1100, d: .06, a: .002, peak: .08, lp: 2500, wet: .2 }); },
    thunder: function () {
      var t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), T = rnd(5, 7);
      s.buffer = buf.brown; s.loop = true; f.type = 'lowpass'; f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(60, t + T);
      g.gain.setValueAtTime(.0001, t);
      for (var x = .2, k = 0; x < T - .8; x += rnd(.25, .7), k++) g.gain.setTargetAtTime(rnd(.25, .65) * Math.pow(.85, k), t + x, rnd(.08, .2));
      g.gain.setTargetAtTime(.0001, t + T - .8, .35);
      s.connect(f); f.connect(g); out(g, .55); s.start(t, Math.random()); s.stop(t + T + 1);
      for (var c = 0; c < 6; c++) hiss({ at: rnd(.1, 1.4), buf: 'brown', f: rnd(250, 600), q: 1.5, a: .01, d: rnd(.08, .2), peak: .12, wet: .6 });
    }
  };
  function fx(name, a, b) { if (prefs.sounds && ready()) FX[name](a, b); }

  /* ---- ambience ---- */
  function loopSrc(b, ft, f, q, gain) {
    var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; s.loop = true; fl.type = ft; fl.frequency.value = f; fl.Q.value = q || .7; g.gain.value = 0;
    s.connect(fl); fl.connect(g); s.start(0, Math.random() * Math.max(0, b.duration - .5));
    return { s: [s], f: fl, g: g, gain: gain };
  }
  function wideBed(hp, lp, gain) {
    var m = ctx.createChannelMerger(2), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g = ctx.createGain(), s1 = ctx.createBufferSource(), s2 = ctx.createBufferSource();
    s1.buffer = s2.buffer = buf.pink; s1.loop = s2.loop = true;
    s1.connect(m, 0, 0); s2.connect(m, 0, 1); f1.type = 'highpass'; f1.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.value = lp;
    m.connect(f1); f1.connect(f2); f2.connect(g); g.gain.value = 0;
    s1.start(0, Math.random() * 1.4); s2.start(0, 1.5 + Math.random() * 1.4);
    return { s: [s1, s2], f: f2, g: g, gain: gain };
  }
  function lfo(param, rate, depth) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); return o; }
  function wind(level, center, swing) {
    var L = loopSrc(buf.brown, 'bandpass', center, .55, level), m = ctx.createGain();
    m.gain.value = 1; L.f.disconnect(); L.f.connect(m); m.connect(L.g);
    L.osc = [lfo(L.f.frequency, .05 + Math.random() * .04, swing), lfo(m.gain, .03 + Math.random() * .03, .45)];
    return L;
  }
  // drops as tiny unpitched clicks, rendered once into a seamless stereo loop
  function dropTexture(key, secs, perSec, nearEvery) {
    if (tex[key]) return tex[key];
    var sr = ctx.sampleRate, len = Math.floor(sr * secs), b = ctx.createBuffer(2, len, sr), L = b.getChannelData(0), R = b.getChannelData(1), n = Math.floor(secs * perSec);
    for (var k = 0; k < n; k++) {
      var near = nearEvery && Math.random() < 1 / nearEvery;
      var amp = Math.exp(rnd(-4.2, -1.6)) * (near ? 3 : 1), tau = (near ? rnd(.0015, .004) : rnd(.0002, .0012)) * sr;
      var a = near ? rnd(.55, .8) : rnd(.05, .55), pan = rnd(-1, 1), gl = Math.sqrt((1 - pan) / 2) * amp, gr = Math.sqrt((1 + pan) / 2) * amp;
      var start = Math.floor(Math.random() * len), y = 0, prev = 0;
      for (var i = 0, m = Math.floor(tau * 5); i < m; i++) {
        var x = (Math.random() * 2 - 1) * Math.exp(-i / tau); y = a * y + (1 - a) * x; var hp = y - prev; prev = y;
        var j = (start + i) % len; L[j] += hp * gl; R[j] += hp * gr;
      }
    }
    var peak = 0; for (var i2 = 0; i2 < len; i2++) peak = Math.max(peak, Math.abs(L[i2]), Math.abs(R[i2]));
    var sc = .9 / (peak || 1); for (i2 = 0; i2 < len; i2++) { L[i2] *= sc; R[i2] *= sc; }
    return (tex[key] = b);
  }
  function bird(dest) {
    var kind = Math.random(), pan = rnd(-.8, .8), base = rnd(2400, 3600), at = 0, i;
    if (kind < .5) { var n = 2 + (Math.random() * 4 | 0); for (i = 0; i < n; i++) { tone({ at: at, f: base * rnd(.95, 1.05), f2: base * rnd(1.25, 1.5), glide: .05, d: .07, a: .004, peak: .028, wet: .5, pan: pan, dest: dest }); at += rnd(.09, .14); } }
    else if (kind < .8) { tone({ f: base * .8, d: .28, a: .03, peak: .022, wet: .55, pan: pan, dest: dest }); tone({ at: .32, f: base * .67, d: .35, a: .03, peak: .02, wet: .55, pan: pan, dest: dest }); }
    else { for (i = 0; i < 6; i++) tone({ at: i * .045, f: base * 1.2, f2: base * .9, glide: .03, d: .035, a: .003, peak: .016, wet: .45, pan: pan, dest: dest }); }
  }
  function cricket(dest, quiet) {
    var f = rnd(4300, 4800), pan = rnd(-.7, .7), pk = quiet ? .011 : .016;
    for (var k = 0; k < 2; k++) for (var i = 0; i < 4; i++) tone({ at: k * .32 + i * .045, f: f, d: .03, a: .004, peak: pk, pan: pan, wet: .3, dest: dest });
  }
  function katydid(dest) { var pan = rnd(-.9, .9), f = rnd(6200, 7600); for (var i = 0; i < 3; i++) hiss({ at: i * .16, f: f, q: 6, a: .01, d: .07, peak: .05, wet: .3, pan: pan, dest: dest }); }
  function peeper(dest) { var pan = rnd(-.9, .9), f = rnd(2700, 3000); tone({ f: f, f2: f * 1.12, glide: .1, d: .12, a: .02, peak: .014, wet: .5, pan: pan, dest: dest }); }

  function scene(layers, timers) {
    var bus = ctx.createGain(); out(bus, .2);
    layers.forEach(function (L) { L.g.connect(bus); L.g.gain.setTargetAtTime(L.gain, ctx.currentTime, .8); });
    var ids = timers.map(function (fn) { var id = { t: 0 }; (function tick() { id.t = setTimeout(tick, fn(bus)); })(); return id; });
    return function stop() {
      ids.forEach(function (i) { clearTimeout(i.t); });
      bus.gain.setTargetAtTime(.0001, ctx.currentTime, .5);
      setTimeout(function () {
        layers.forEach(function (L) { L.s.concat(L.osc || []).forEach(function (s) { try { s.stop(); } catch (e) {} }); });
        bus.disconnect();
      }, 3000);
    };
  }
  var SCENES = {
    // clear day: birds, barely any wind (wind at 62%)
    day: function () { return scene([wind(.06 * .62, 700, 220)], [function (b) { bird(b); return rnd(1400, 4500); }, function (b) { if (Math.random() < .5) bird(b); return rnd(4000, 9000); }]); },
    // clear night: crickets and insects (wind at 46%)
    night: function () {
      return scene([wind(.12 * .46, 340, 140)], [
        function (b) { cricket(b); return rnd(700, 1500); },
        function (b) { cricket(b, 1); return rnd(1100, 2300); },
        function (b) { katydid(b); return rnd(3500, 8000); },
        function (b) { peeper(b); return rnd(900, 2600); }]);
    },
    // rain: drizzle
    rain: function () {
      var d = loopSrc(dropTexture('drizzle', 8, 1400, 0), 'lowpass', 6000, .5, .4), bed = wideBed(250, 2400, .14), low = loopSrc(buf.brown, 'lowpass', 260, .5, .02);
      d.osc = [lfo(d.g.gain, .05, .08)]; bed.osc = [lfo(bed.g.gain, .037, .035)];
      return scene([d, bed, low], []);
    },
    // storm: heavy storm, mixed drops 22%, hiss 57%, roar 79%, wind 98%, gusts 92%
    storm: function () {
      var o = { drops: .55 * .22, bed: .34 * .57, bedLp: 3800, low: .12 * .79, wind: .12 * .98, gust: .92, boost: 1.35, wBoost: 1.8 };
      var d = loopSrc(dropTexture('storm', 8, 9000, 40), 'lowpass', 8500, .5, o.drops), bed = wideBed(180, o.bedLp, o.bed);
      var low = loopSrc(buf.brown, 'lowpass', 320, .5, o.low), w = wind(o.wind, 380, 180), first = true;
      function gust() {
        if (first) { first = false; return rnd(2500, 5000); }
        var t = ctx.currentTime, hold = rnd(2.5, 4.5), b = 1 + (rnd(.75, 1) * o.boost - 1) * o.gust;
        [[d, b], [bed, b], [low, 1 + (b - 1) * .6], [w, 1 + (o.wBoost - 1) * o.gust]].forEach(function (p) {
          var g = p[0].g.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
          g.setTargetAtTime(p[0].gain * p[1], t, 1.1); g.setTargetAtTime(p[0].gain, t + hold, 1.8);
        });
        var ff = bed.f.frequency; ff.cancelScheduledValues(t); ff.setValueAtTime(ff.value, t);
        ff.setTargetAtTime(o.bedLp * (1 + .35 * o.gust), t, 1.1); ff.setTargetAtTime(o.bedLp, t + hold, 1.8);
        return rnd(7000, 14000);
      }
      return scene([d, bed, low, w], [gust]);
    }
  };
  var current = '', stopScene = null;
  function wanted() {
    if (!prefs.ambience) return '';
    var w = root.getAttribute('data-weather');
    if (w === 'storm' || w === 'rain') return w;
    return root.getAttribute('data-sky') === 'night' ? 'night' : 'day';
  }
  function syncAmbience() {
    var next = ctx ? wanted() : '';
    if (next === current) return;
    if (stopScene) { stopScene(); stopScene = null; }
    current = next;
    if (next) stopScene = SCENES[next]();
  }

  /* ---- wake up on the first gesture; sleep while hidden ---- */
  var woke = false;
  function wake() {
    if (woke) return; woke = true;
    build();
    var p = ctx.resume(); if (p && p.then) p.then(syncAmbience, function () {}); else syncAmbience();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, wake, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  // the intro swell only plays if the browser lets sound start on its own (most block it until a tap)
  if (root.classList.contains('play') && !root.classList.contains('quick') && prefs.sounds) {
    try {
      // a bare context costs nothing; only build the rest if the browser lets it run
      ctx = new AC();
      if (ctx.state === 'running') { build(); woke = true; setTimeout(function () { fx('intro'); }, 900); }
      else { ctx.close(); ctx = null; }
    } catch (e) { ctx = null; }
  }

  /* ---- hooks into the page ---- */
  var rows = Array.prototype.slice.call(document.querySelectorAll('.q:not(.sub)'));
  function tuningFor(btn) {
    var top = btn.classList.contains('sub') ? btn.closest('section') && btn.closest('section').querySelector('.q:not(.sub)') : btn;
    var i = rows.indexOf(top); return TUNING[(i < 0 ? 0 : i) % TUNING.length];
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('button, a');
    if (!t) return;
    if (t.classList.contains('q')) {
      // the page's own handler has already flipped aria-expanded by the time this runs
      var open = t.getAttribute('aria-expanded') === 'true';
      fx(open ? 'open' : 'close', tuningFor(t), t.classList.contains('sub'));
    } else if (t.id === 'copy') fx('copy');
    else if (t.matches('#wx-pop button[data-sky], #wx-pop button[data-w]')) fx('appear');
    else if (t.tagName === 'A' && /^https?:/i.test(t.getAttribute('href') || '') && t.hostname !== location.hostname) fx('link');
  });

  // weather button arriving at the bottom of the page: silent on purpose (Nov 10); kept so a sound can come back easily
  var wx = document.querySelector('.wx');
  if (wx) {
    var shown = wx.classList.contains('show');
    new MutationObserver(function () {
      var now = wx.classList.contains('show');
      shown = now;
    }).observe(wx, { attributes: true, attributeFilter: ['class'] });
  }
  // lightning: thunder rolls in a moment after each flash, only with ambience on
  var bolt = document.querySelector('.bolt');
  if (bolt) new MutationObserver(function () {
    if (bolt.classList.contains('on') && prefs.ambience && current === 'storm' && ready()) setTimeout(function () { if (ready()) FX.thunder(); }, rnd(400, 1600));
  }).observe(bolt, { attributes: true, attributeFilter: ['class'] });
  // sky and weather changes swap the ambience
  new MutationObserver(syncAmbience).observe(root, { attributes: true, attributeFilter: ['data-sky', 'data-weather'] });

  // the two switches in the weather panel
  function paint() {
    var a = document.getElementById('snd-amb'), s = document.getElementById('snd-ui');
    if (a) a.setAttribute('aria-pressed', String(prefs.ambience));
    if (s) s.setAttribute('aria-pressed', String(prefs.sounds));
  }
  var ambBtn = document.getElementById('snd-amb'), uiBtn = document.getElementById('snd-ui');
  if (ambBtn) ambBtn.addEventListener('click', function () {
    wake(); prefs.ambience = !prefs.ambience; paint(); fx('appear');
    if (ctx && ctx.state !== 'running') ctx.resume().then(syncAmbience, function () {}); else syncAmbience();
  });
  if (uiBtn) uiBtn.addEventListener('click', function () {
    wake(); prefs.sounds = !prefs.sounds; store('jere.sounds', prefs.sounds ? '1' : '0'); paint();
    if (prefs.sounds) setTimeout(function () { fx('appear'); }, 30);
  });
  paint();
})();
