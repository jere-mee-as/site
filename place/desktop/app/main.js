// Jere's Place — desktop shell (Electron).
// One window, a tray icon, a global capture hotkey, and a vault folder chosen once and remembered.
'use strict';
const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Tray, Menu, shell, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');
const { make } = require('./vaultfs');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }
app.setAppUserModelId('place.jere.app'); // taskbar grouping + notifications on Windows

/* ---------- settings (userData/config.json; editable by hand) ---------- */
const CFG = path.join(app.getPath('userData'), 'config.json');
const cfg = { vault: null, hotkey: 'Control+Alt+Space', closeToTray: true, bounds: null, maximized: false };
try { Object.assign(cfg, JSON.parse(fs.readFileSync(CFG, 'utf8'))); } catch (e) { /* first run */ }
const saveCfg = () => { try { fs.mkdirSync(path.dirname(CFG), { recursive: true }); fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2)); } catch (e) {} };

let V = (cfg.vault && fs.existsSync(cfg.vault)) ? make(cfg.vault) : null;
const need = () => { if (!V) throw new Error('No vault folder chosen yet'); return V; };
const info = () => (V ? { path: V.root, name: V.name, hotkey: cfg.hotkey, login: app.getLoginItemSettings().openAtLogin } : null);

let win = null, tray = null, quitting = false, hotkeyOk = false;
const ICON = path.join(__dirname, 'icon.png');
const notice = msg => { if (win && !win.isDestroyed()) win.webContents.send('jp:notice', msg); };

function show() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show(); win.focus();
}

function boundsOk(b) {
  if (!b) return false;
  return screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return b.x < a.x + a.width - 80 && b.x + b.width > a.x + 80 && b.y >= a.y - 10 && b.y < a.y + a.height - 80;
  });
}

function createWindow() {
  const b = boundsOk(cfg.bounds) ? cfg.bounds : { width: 1440, height: 900 };
  win = new BrowserWindow({
    ...b, minWidth: 900, minHeight: 600,
    backgroundColor: '#1c1d22', title: "Jere's Place", icon: ICON, show: false, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true, plugins: true },
  });
  win.removeMenu();
  if (cfg.maximized) win.maximize();
  // updates: a newer page dropped into the vault (_jeres-place-src/desktop/app/index.html) is used instead of the bundled one
  const live = V && path.join(V.root, '_jeres-place-src', 'desktop', 'app', 'index.html');
  win.loadFile(live && fs.existsSync(live) ? live : path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => { if (!process.argv.includes('--hidden')) win.show(); });

  // links: web pages go to the default browser, vault files (PDFs, images) to their default app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    else if (/^file:/i.test(url)) shell.openPath(fileURLToPath(url));
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file:') && /index\.html(#.*)?$/i.test(url)) return; // hash routes inside the app
    e.preventDefault();
    if (/^https?:/i.test(url)) shell.openExternal(url);
  });

  // window keys the page can't own
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    const k = (i.key || '').toLowerCase();
    if (i.key === 'Escape') win.webContents.send('jp:esc'); // lets the page take focus back from an embedded PDF
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (i.control && i.shift && k === 'i') { win.webContents.toggleDevTools(); e.preventDefault(); }
    else if ((i.control && k === 'r') || i.key === 'F5') { win.webContents.reload(); e.preventDefault(); }
    else if (i.control && k === 'w') { win.close(); e.preventDefault(); }
    else if (i.control && (k === '=' || k === '+')) { win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5); e.preventDefault(); }
    else if (i.control && k === '-') { win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5); e.preventDefault(); }
    else if (i.control && k === '0') { win.webContents.setZoomLevel(0); e.preventDefault(); }
  });

  const remember = () => { if (!win.isMaximized() && !win.isMinimized() && !win.isFullScreen()) cfg.bounds = win.getBounds(); cfg.maximized = win.isMaximized(); };
  win.on('resize', remember); win.on('move', remember);
  win.on('close', e => {
    remember(); saveCfg();
    if (quitting) return;
    e.preventDefault();
    if (cfg.closeToTray && tray) win.hide(); else app.quit(); // quitting goes through before-quit, which saves first
  });
  win.webContents.on('did-finish-load', () => {
    if (!hotkeyOk) notice(`The capture hotkey <b>${cfg.hotkey}</b> is taken by another app. Change "hotkey" in ${CFG.replace(/\\/g, '/')}.`);
  });
}

function capture() { show(); win.webContents.send('jp:capture'); }

function buildTray() {
  let img = nativeImage.createFromPath(ICON);
  if (!img.isEmpty()) img = img.resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip("Jere's Place");
  const menu = () => Menu.buildFromTemplate([
    { label: "Open Jere's Place", click: show },
    { label: 'Capture to today', accelerator: hotkeyOk ? cfg.hotkey : undefined, click: capture },
    { type: 'separator' },
    { label: 'Start with Windows', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
      click: it => { app.setLoginItemSettings({ openAtLogin: it.checked, args: ['--hidden'] }); } },
    { label: 'Closing the window keeps it in the tray', type: 'checkbox', checked: cfg.closeToTray,
      click: it => { cfg.closeToTray = it.checked; saveCfg(); } },
    { label: 'Choose vault folder…', click: async () => { show(); if (await pickVault()) win.webContents.reload(); } },
    { label: 'Open settings file', click: () => { saveCfg(); shell.openPath(CFG); } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu());
  tray.on('click', () => { if (win.isVisible() && win.isFocused()) win.hide(); else show(); });
  tray.on('right-click', () => tray.setContextMenu(menu()));
}

async function pickVault() {
  const guess = cfg.vault || path.join(app.getPath('home'), 'Proton Drive');
  const r = await dialog.showOpenDialog(win, { title: 'Choose your Jere’s Place folder', properties: ['openDirectory'], defaultPath: fs.existsSync(guess) ? guess : app.getPath('home') });
  if (r.canceled || !r.filePaths[0]) return null;
  V = make(r.filePaths[0]); cfg.vault = V.root; saveCfg();
  return info();
}

/* ---------- the page's file API ---------- */
ipcMain.handle('jp:info', () => info());
ipcMain.handle('jp:pick', () => pickVault());
ipcMain.handle('jp:list', () => need().list());
ipcMain.handle('jp:stat', (e, p) => need().stat(p));
ipcMain.handle('jp:read', (e, p) => need().read(p));
ipcMain.handle('jp:write', (e, p, t) => need().write(p, t));
ipcMain.handle('jp:remove', (e, p) => need().remove(p));
ipcMain.handle('jp:fileUrl', (e, p) => need().fileUrl(p));
ipcMain.handle('jp:openPath', (e, p) => shell.openPath(need().abs(p)));
ipcMain.handle('jp:setLogin', (e, on) => { app.setLoginItemSettings({ openAtLogin: !!on, args: ['--hidden'] }); return app.getLoginItemSettings().openAtLogin; });

/* ---------- lifecycle ---------- */
app.on('second-instance', show);
app.whenReady().then(() => {
  createWindow();
  try { hotkeyOk = globalShortcut.register(cfg.hotkey, capture); } catch (e) { hotkeyOk = false; }
  try { buildTray(); } catch (e) { tray = null; }
});
// flush unsaved edits before quitting (max 3 s), then really quit
app.on('before-quit', e => {
  if (quitting) return;
  quitting = true;
  if (win && !win.isDestroyed()) {
    e.preventDefault();
    const flush = win.webContents.executeJavaScript('window.__jpFlush ? window.__jpFlush() : null').catch(() => {});
    Promise.race([flush, new Promise(r => setTimeout(r, 3000))]).finally(() => app.quit());
  }
});
app.on('window-all-closed', () => { if (!tray) app.quit(); });
app.on('will-quit', () => globalShortcut.unregisterAll());
