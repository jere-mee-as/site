# Jere's Place: desktop app setup (one time, about 5 minutes)

1. **Download Electron.** Go to https://github.com/electron/electron/releases, pick the newest release marked *Latest* (not a beta), and under *Assets* download `electron-v…-win32-x64.zip`. It's a public download, so no GitHub login is needed.
2. **Unzip it** into a normal folder outside any sync folder (Proton Drive, OneDrive), for example `C:\Users\<you>\Apps\Jere's Place`.
3. **Copy this `app` folder** (the one next to this file) into that folder's `resources` folder, so that `C:\Users\<you>\Apps\Jere's Place\resources\app\main.js` exists.
4. **Rename `electron.exe` to `Jere's Place.exe`** and double-click it. Pick your `Jere's Place` vault folder once. It is remembered from then on.
5. While it's running, right-click its taskbar icon and choose **Pin to taskbar**. *(Optional: give the pinned shortcut the crystal icon. Shortcut → Properties → Change Icon → `resources\app\icon.ico`.)*

## What you get
- **Ctrl + Alt + Space** from anywhere in Windows brings it forward and starts a timestamped entry in today's note.
- **Closing the window keeps it in the tray** (crystal icon by the clock) so the hotkey keeps working. Right-click the tray icon for **Start with Windows**, **Quit**, and **Choose vault folder**.
- **Window keys:**
  - F11: full screen
  - Ctrl + / Ctrl − / Ctrl 0: zoom in / zoom out / reset
  - Ctrl R: reload
  - Ctrl Shift I: developer tools
- Settings live in `%APPDATA%\jeres-place\config.json`: hotkey, close-to-tray, window position. Tray → *Open settings file*.

## Updates
The app prefers the page at `Jere's Place\_jeres-place-src\desktop\app\index.html` in your vault. New versions land there, and **Ctrl R** loads them. You only re-copy the `app` folder if `main.js` or `preload.js` change. Updates will say when that's needed.
