const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  setFullScreen: (enabled) => ipcRenderer.invoke('window:setFullScreen', enabled),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeToggle: () => ipcRenderer.invoke('window:maximizeToggle'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  getWindowState: () => ipcRenderer.invoke('window:getState'),
  onWindowState: (callback) => {
    const handler = (_, payload) => {
      callback(payload)
    }
    ipcRenderer.on('window:state', handler)
    return () => ipcRenderer.removeListener('window:state', handler)
  },
})
