const { contextBridge, ipcRenderer } = require('electron');

// Steam 기본 정보
contextBridge.exposeInMainWorld('steam', {
  isAvailable:  () => ipcRenderer.sendSync('steam:available'),
  getUserName:  () => ipcRenderer.sendSync('steam:getUserName'),
});

// Steam 클라우드 세이브
contextBridge.exposeInMainWorld('steamCloud', {
  isEnabled: ()           => ipcRenderer.sendSync('steamCloud:isEnabled'),
  save:      (key, data)  => ipcRenderer.invoke('steamCloud:save', key, data),
  load:      (key)        => ipcRenderer.invoke('steamCloud:load', key),
  delete:    (key)        => ipcRenderer.invoke('steamCloud:delete', key),
});

// Steam 도전과제
contextBridge.exposeInMainWorld('steamAchievement', {
  unlock: (id)  => ipcRenderer.invoke('achievement:unlock', id),
  isUnlocked: (id) => ipcRenderer.sendSync('achievement:isUnlocked', id),
});
