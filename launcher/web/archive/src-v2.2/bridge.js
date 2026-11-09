  // Bridge adapter. The page only talks to window.JRLbridge (B). On the phone, B wraps window.JRLAndroid
  // from the Kotlin shell; in a browser, a mock unit with fake programs, calendar, media and comms runs instead.
  // TODO when GitHub is back: check every JRLAndroid signature below against MainActivity.kt / Bridge.kt.
  // Only this file should need to change.
  (function () {
    'use strict';
    var A = window.JRLAndroid, MOCK = !A;
    var J = function (s, d) { try { return typeof s === 'string' ? JSON.parse(s) : (s == null ? d : s); } catch (e) { return d; } };
    var call = function (name) { var args = [].slice.call(arguments, 1); try { return A && typeof A[name] === 'function' ? A[name].apply(A, args) : undefined; } catch (e) { console.warn('bridge', name, e); return undefined; } };
    var B;

    if (!MOCK) {
      B = {
        mock: false,
        apps: function () { var r = J(call('apps'), []); return Promise.resolve((r || []).map(function (a) {
          var pkg = a.pkg || a.package || a.p, act = a.act || a.activity || a.a || '';
          return { label: a.label || a.l || pkg, pkg: pkg, act: act, icon: a.icon || ('/icon/' + pkg + '/' + act) }; })); },
        launch: function (app) { return call('launch', app.pkg, app.act); },
        info: function (app) { return call('info', app.pkg); },
        uninstall: function (app) { return call('uninstall', app.pkg); },
        battery: function () { var b = J(call('battery'), null); return b ? { level: b.level > 1 ? b.level / 100 : b.level, charging: !!b.charging, saver: !!(b.saver || b.powerSave) } : null; },
        notifs: function () { var n = J(call('notifs'), {}); if (Array.isArray(n)) { var o = {}; n.forEach(function (x) { o[x.pkg] = x.count || x.n || 0; }); return o; } return n || {}; },
        device: function () { return J(call('device'), {}) || {}; },
        // TODO(kotlin): haptic(kind, patternJson) → VibrationEffect.createWaveform; kinds tick, click, heavy, double, err, pattern
        haptic: function (kind, ms) { var r = Array.isArray(ms) ? call('haptic', kind, JSON.stringify(ms)) : call('haptic', kind); if (r === undefined) call('haptic', typeof ms === 'number' ? ms : 10); },
        // TODO(kotlin): lock() via AccessibilityService GLOBAL_ACTION_LOCK_SCREEN (or DevicePolicyManager.lockNow)
        lock: function () { return call('lock'); },
        settings: function () { return call('settings'); },
        expand: function () { return call('expand'); },
        webSearch: function (q) { return call('webSearch', q); },
        view: function (url) { return call('view', url); },
        bars: function (on) { return call('bars', !!on); },
        keyboard: function (on) { return call('keyboard', !!on); },
        events: function (days) { var r = J(call('events', days || 7), null); if (!r) return Promise.resolve({ granted: false, list: [] });
          var list = Array.isArray(r) ? r : r.list || r.events || []; return Promise.resolve({ granted: r.granted !== false, list: list.map(function (e) {
            return { id: e.id, title: e.title || '(untitled)', start: +e.start || +e.begin, end: +e.end, allDay: !!(e.allDay || e.all_day), color: e.color != null ? (typeof e.color === 'number' ? '#' + ('000000' + (e.color >>> 0 & 0xffffff).toString(16)).slice(-6) : e.color) : null, cal: e.cal || e.calendar || '' }; }) }); },
        askCalendar: function () { return call('askCalendar'); },
        openEvent: function (id) { return call('openEvent', String(id)); },
        openCalendar: function () { return call('openCalendar'); },
        media: function () { var m = J(call('media'), null); if (!m || !m.title) return null; return { title: m.title, artist: m.artist || '', art: m.art || m.artwork || '', playing: !!m.playing, pos: +m.pos || +m.position || 0, dur: +m.dur || +m.duration || 0, pkg: m.pkg || m.package || '', app: m.app || '' }; },
        mediaCmd: function (c) { return call('mediaCmd', c); },
        signal: function () { return J(call('signal'), null); },
        update: function () { return call('update'); },
        version: function () { return call('version') || '?'; }
      };
    } else {
      /* ---------- mock unit: enough to drive every screen in a desktop browser ---------- */
      var APPS = [
        ['Phone', 'com.samsung.android.dialer', '#1f9d55'], ['Messages', 'com.google.android.apps.messaging', '#2b6cff'], ['Chrome', 'com.android.chrome', '#e8b100'],
        ['Camera', 'com.sec.android.app.camera', '#2a2a2e'], ['Gallery', 'com.sec.android.gallery3d', '#e8457a'], ['Gmail', 'com.google.android.gm', '#d93025'],
        ['Calendar', 'com.google.android.calendar', '#3b74e8'], ['Maps', 'com.google.android.apps.maps', '#2f9e4f'], ['WhatsApp', 'com.whatsapp', '#1faa59'],
        ['Instagram', 'com.instagram.android', '#c13584'], ['YT Music', 'com.google.android.apps.youtube.music', '#e00000'], ['YouTube', 'com.google.android.youtube', '#ff1a1a'],
        ['Spotify', 'com.spotify.music', '#1aa34a'], ['SoundCloud', 'com.soundcloud.android', '#ff5500'], ['Shazam', 'com.shazam.android', '#0a7cff'],
        ['Bandcamp', 'com.bandcamp.android', '#1b8fb3'], ['Claude', 'com.anthropic.claude', '#c96442'], ['ChatGPT', 'com.openai.chatgpt', '#0f8f6f'],
        ['Gemini', 'com.google.android.apps.bard', '#4f6bed'], ['Perplexity', 'ai.perplexity.app.android', '#1c7480'], ['Proton Mail', 'ch.protonmail.android', '#6d4aff'],
        ['Proton Drive', 'me.proton.android.drive', '#5b3fd9'], ['Proton Calendar', 'me.proton.android.calendar', '#7b5cff'], ['Proton VPN', 'ch.protonvpn.android', '#4c2fd6'],
        ['Chase', 'com.chase.sig.android', '#0f63b0'], ['Venmo', 'com.venmo', '#2f7fbf'], ['Cash App', 'com.squareup.cash', '#00b843'],
        ['Robinhood', 'com.robinhood.android', '#8ccf00'], ['Hinge', 'co.hinge.app', '#2a2a2e'], ['Bumble', 'com.bumble.app', '#e8b51f'],
        ['Tinder', 'com.tinder', '#f0445c'], ['Discord', 'com.discord', '#5865f2'], ['Reddit', 'com.reddit.frontpage', '#ff4500'],
        ['Substack', 'com.substack.app', '#ff6719'], ['X', 'com.twitter.android', '#111113'], ['Slack', 'com.Slack', '#4a154b'],
        ['Teams', 'com.microsoft.teams', '#5059c9'], ['Outlook', 'com.microsoft.office.outlook', '#0a64c2'], ['Drive', 'com.google.android.apps.docs', '#1a8f4c'],
        ['Docs', 'com.google.android.apps.docs.editors.docs', '#3b74e8'], ['Sheets', 'com.google.android.apps.docs.editors.sheets', '#138a4f'], ['Notion', 'notion.id', '#18181b'],
        ['Logseq', 'com.logseq.app', '#0b3a46'], ['Are.na', 'com.arena.android', '#2a2a2e'], ['Uber', 'com.ubercab', '#111113'],
        ['Lyft', 'me.lyft.android', '#e000b0'], ['Amazon', 'com.amazon.mShop.android.shopping', '#e88a00'], ['Kindle', 'com.amazon.kindle', '#1d2a35'],
        ['Libby', 'com.overdrive.mobile.android.libby', '#9a1d5a'], ['Letterboxd', 'com.letterboxd.letterboxd', '#202830'], ['Steam', 'com.valvesoftware.android.steam.community', '#1b2838'],
        ['Twitch', 'tv.twitch.android.app', '#8045f5'], ['Duolingo', 'com.duolingo', '#4caf00'], ['Settings', 'com.android.settings', '#5f6368'],
        ['Clock', 'com.sec.android.app.clockpackage', '#2a2a2e'], ['My Files', 'com.sec.android.app.myfiles', '#e8a200'], ['Samsung Notes', 'com.samsung.android.app.notes', '#e8941f'],
        ['Calculator', 'com.sec.android.app.popupcalculator', '#3a3a40'], ['Contacts', 'com.samsung.android.app.contacts', '#ef6c00'], ['Play Store', 'com.android.vending', '#01875f'],
        ['Weather', 'com.sec.android.daemonapp', '#2e8be6'], ['Authenticator', 'com.google.android.apps.authenticator2', '#1a73e8'], ['Bitwarden', 'com.x8bit.bitwarden', '#175ddc'],
        ['Galaxy Wearable', 'com.samsung.android.app.watchmanager', '#1259c3'], ['Procore', 'com.procore.activities', '#e8692c'], ['Home Depot', 'com.thehomedepot', '#ee5a00'],
        ['Booking.com', 'com.booking', '#0b3c8c'], ['Waze', 'com.waze', '#1fb9e6'], ['Pinterest', 'com.pinterest', '#d6001c'],
        ['Telegram', 'org.telegram.messenger', '#2aa0dc'], ['Signal', 'org.thoughtcrime.securesms', '#3a76f0'], ['LinkedIn', 'com.linkedin.android', '#0a66c2'],
        ['Strava', 'com.strava', '#f24e00'], ['Samsung Health', 'com.sec.android.app.shealth', '#00a39a'], ['Tasker', 'net.dinglisch.android.taskerm', '#2766c9']
      ];
      function icon(label, col) {
        var ch = label.replace(/[^A-Za-z0-9]/g, '').slice(0, label.length > 7 ? 1 : 2) || '?', ink = window.JRLlum && window.JRLlum(col) > .3 ? '#0a0a0b' : '#ffffff';
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect x="4" y="4" width="88" height="88" rx="26" fill="' + col + '"/>' +
          '<text x="48" y="' + (ch.length > 1 ? 61 : 64) + '" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="' + (ch.length > 1 ? 34 : 44) + '" fill="' + ink + '">' + ch + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      }
      var list = APPS.map(function (a) { return { label: a[0], pkg: a[1], act: a[1] + '.Main', icon: icon(a[0], a[2]), col: a[2] }; });
      var H = 36e5, D = 864e5, now = Date.now(), t0 = new Date(); t0.setMinutes(0, 0, 0);
      var base = +t0, day0 = new Date(); day0.setHours(0, 0, 0, 0); var d0 = +day0;
      var EV = [
        { id: 1, title: 'Site walk // retail buildout', start: base + 2 * H, end: base + 3 * H, cal: 'Work', color: '#ef4606' },
        { id: 2, title: 'Phil chat', start: d0 + 19.5 * H, end: d0 + 21 * H, cal: 'Personal', color: '#8476bf' },
        { id: 3, title: 'Subcontractor call', start: d0 + D + 10 * H, end: d0 + D + 10.5 * H, cal: 'Work', color: '#ef4606' },
        { id: 4, title: 'Permit desk closed', start: d0 + D, end: d0 + 2 * D, allDay: true, cal: 'Work', color: '#ef4606' },
        { id: 5, title: 'Permit review // statement of justification', start: d0 + 2 * D + 9 * H, end: d0 + 2 * D + 10 * H, cal: 'Work', color: '#ef4606' },
        { id: 6, title: 'SEO check-in', start: d0 + 3 * D + 14 * H, end: d0 + 3 * D + 14.5 * H, cal: 'Work', color: '#ef4606' },
        { id: 7, title: 'Gym', start: d0 + 4 * D + 7 * H, end: d0 + 4 * D + 8 * H, cal: 'Personal', color: '#2ddccd' },
        { id: 8, title: 'Schedule review // 84-day window', start: d0 + 4 * D + 11 * H, end: d0 + 4 * D + 12 * H, cal: 'Work', color: '#ef4606' },
        { id: 9, title: 'Dinner', start: d0 + 5 * D + 20 * H, end: d0 + 5 * D + 22 * H, cal: 'Personal', color: '#2ddccd' },
        { id: 10, title: 'Draft essay // second pass', start: d0 + 6 * D + 10 * H, end: d0 + 6 * D + 12 * H, cal: 'Personal', color: '#8476bf' }
      ];
      function art(seed, a, b, c) {
        var r = seed, rnd = function () { r = (r * 9301 + 49297) % 233280; return r / 233280; }, s = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="' + a + '"/>';
        for (var i = 0; i < 14; i++) s += '<rect x="' + Math.round(rnd() * 12) * 20 + '" y="' + Math.round(rnd() * 12) * 20 + '" width="' + (20 + Math.round(rnd() * 4) * 20) + '" height="' + (20 + Math.round(rnd() * 3) * 20) + '" fill="' + (rnd() < .6 ? b : c) + '"/>';
        s += '<circle cx="' + (60 + rnd() * 120) + '" cy="' + (60 + rnd() * 120) + '" r="' + (30 + rnd() * 40) + '" fill="none" stroke="' + c + '" stroke-width="10"/></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
      }
      var TR = [
        { title: 'Gantz Graf', artist: 'Autechre', dur: 236, art: art(7, '#111', '#e8e8e8', '#ef4606') },
        { title: 'Xtal', artist: 'Aphex Twin', dur: 291, art: art(21, '#e8e4dc', '#222', '#2ddccd') },
        { title: 'Roygbiv', artist: 'Boards of Canada', dur: 151, art: art(5, '#d8c9a8', '#7a2b1a', '#1f3b6b') }
      ];
      var M = { i: 0, playing: true, pos: 102, t: Date.now() };
      function mpos() { if (M.playing) { M.pos += (Date.now() - M.t) / 1000; } M.t = Date.now(); var d = TR[M.i].dur; if (M.pos >= d) { M.i = (M.i + 1) % TR.length; M.pos = 0; } return M.pos; }
      var N = { 'com.google.android.gm': 12, 'com.whatsapp': 3, 'com.Slack': 2, 'com.instagram.android': 1, 'com.google.android.apps.messaging': 1 };
      var bat = { level: .84, charging: false, saver: false };
      // something arrives a few seconds in, then every so often, so the ticker has work to do
      setTimeout(function () { N['com.whatsapp'] = (N['com.whatsapp'] || 0) + 1; }, 7000);
      setInterval(function () { var ks = ['com.whatsapp', 'com.google.android.gm', 'com.Slack', 'com.discord', 'com.google.android.apps.messaging']; var k = ks[Math.floor(Math.random() * ks.length)]; N[k] = (N[k] || 0) + 1; }, 52000);
      if (navigator.getBattery) navigator.getBattery().then(function (b) { function u() { bat = { level: b.level, charging: b.charging, saver: false }; if (window.JRLlife) JRLlife.battery(bat); } b.addEventListener('levelchange', u); b.addEventListener('chargingchange', u); if (b.level < 1 || !b.charging) u(); }).catch(function () {});
      var fake = null;
      function fakeApp(app) {
        if (!fake) { fake = document.createElement('div'); fake.id = 'fakeapp'; document.getElementById('device').appendChild(fake);
          fake.style.cssText = 'position:absolute;inset:0;z-index:970;display:flex;flex-direction:column;justify-content:space-between;padding:28px 20px;font:700 11px/1.4 "Kode Mono",monospace;letter-spacing:.08em;text-transform:uppercase';
          fake.addEventListener('click', function () { home(); }); }
        var ink = window.JRLlum(app.col || '#333') > .25 ? '#0a0a0b' : '#f2f2ee';
        fake.style.background = app.col || '#333'; fake.style.color = ink; fake.hidden = false;
        fake.innerHTML = '<span>' + app.pkg + '</span><span style="font:300 64px/.9 \'Hubot Sans\',sans-serif;font-stretch:88%;letter-spacing:-.04em;text-transform:none">' + app.label.replace(/</g, '') + '</span><span>Mock: the real program opens here. Tap or press Esc to go home.</span>';
        fakeHideT = setTimeout(function () { if (window.JRLnative) JRLnative.event('hide'); }, 30);
      }
      var lockEl = null;
      function lockScreen() {
        if (!lockEl) { lockEl = document.createElement('div'); lockEl.id = 'lockscr'; document.getElementById('device').appendChild(lockEl);
          lockEl.style.cssText = 'position:absolute;inset:0;z-index:975;display:flex;align-items:flex-end;justify-content:center;padding:40px;background:#000;color:#3a3a40;font:700 10px/1.4 "Kode Mono",monospace;letter-spacing:.1em;text-transform:uppercase;cursor:pointer';
          lockEl.textContent = 'Mock: the screen is off. Tap to unlock.';
          lockEl.addEventListener('click', function () { lockEl.hidden = true; if (window.JRLnative) JRLnative.event('show'); }); }
        lockEl.hidden = false; if (window.JRLnative) JRLnative.event('hide');
      }
      var fakeHideT = 0; function home() { if (!fake || fake.hidden) return false; clearTimeout(fakeHideT); fake.hidden = true; if (window.JRLnative) { JRLnative.event('show'); JRLnative.event('home'); } return true; }
      B = {
        mock: true,
        apps: function () { return Promise.resolve(list.slice()); },
        launch: function (app) { setTimeout(function () { fakeApp(app); }, 240); },
        info: function (app) { alertish('settings // app info // ' + app.pkg); },
        uninstall: function (app) { alertish('package installer // uninstall ' + app.pkg); },
        battery: function () { return bat; },
        signal: function () { return { wifi: 3, cell: 4, net: '5G' }; },
        notifs: function () { return Object.assign({}, N); },
        device: function () { return { model: 'SM-F966U', name: 'Galaxy Z Fold7', android: '16', sdk: 36 }; },
        haptic: function (kind, ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} },
        lock: function () { lockScreen(); },
        settings: function () { alertish('android settings'); },
        expand: function () { alertish('notification shade'); },
        webSearch: function (q) { alertish('web search // ' + q); },
        view: function (u) { alertish('view // ' + u); },
        bars: function () {}, keyboard: function () {},
        events: function () { return Promise.resolve({ granted: true, list: EV.slice() }); },
        askCalendar: function () {}, openEvent: function (id) { alertish('calendar // event ' + id); }, openCalendar: function () { alertish('calendar app'); },
        media: function () { var p = mpos(), t = TR[M.i]; return { title: t.title, artist: t.artist, art: t.art, playing: M.playing, pos: p, dur: t.dur, pkg: 'com.google.android.apps.youtube.music', app: 'YT Music' }; },
        mediaCmd: function (c) { mpos(); if (c === 'toggle') M.playing = !M.playing; else if (c === 'play') M.playing = true; else if (c === 'pause') M.playing = false;
          else if (c === 'next') { M.i = (M.i + 1) % TR.length; M.pos = 0; } else if (c === 'prev') { if (M.pos > 4) M.pos = 0; else { M.i = (M.i + TR.length - 1) % TR.length; M.pos = 0; } } },
        update: function () { setTimeout(function () { if (window.JRLnative) JRLnative.event('updated', { ok: false, why: 'mock unit: no network update' }); }, 600); },
        version: function () { return 'mock-2.1'; },
        _home: home
      };
      function alertish(m) { if (window.JRLlog) JRLlog('bridge // ' + m, true); if (window.JRLtoast) JRLtoast(m); }
    }
    window.JRLbridge = B;
  })();
