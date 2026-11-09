// Jere's Place — the only bridge between the page and the computer. The page never gets Node itself.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const call = (ch, ...a) => ipcRenderer.invoke('jp:' + ch, ...a);

contextBridge.exposeInMainWorld('jpNative', {
  info: () => call('info'),
  pick: () => call('pick'),
  list: () => call('list'),
  stat: p => call('stat', p),
  read: p => call('read', p),
  write: (p, t) => call('write', p, t),
  remove: p => call('remove', p),
  fileUrl: p => call('fileUrl', p),
  openPath: p => call('openPath', p),
  setLogin: on => call('setLogin', on),
  onCapture: f => ipcRenderer.on('jp:capture', () => f()),
  onEsc: f => ipcRenderer.on('jp:esc', () => f()),
  onNotice: f => ipcRenderer.on('jp:notice', (e, msg) => f(msg)),
});
