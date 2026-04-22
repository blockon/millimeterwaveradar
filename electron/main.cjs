const path = require('path')
const { app, BrowserWindow, Menu, ipcMain } = require('electron')

let mainWindow = null

function removeAppMenu() {
  Menu.setApplicationMenu(null)
}

function sendWindowState(win) {
  if (!win || win.isDestroyed()) return
  win.webContents.send('window:state', {
    isMaximized: win.isMaximized(),
    isFullScreen: win.isFullScreen(),
  })
}

function bindWindowShortcuts(win) {
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') {
      event.preventDefault()
      win.setFullScreen(!win.isFullScreen())
      return
    }
    const openDevToolsKey =
      input.key === 'F12' ||
      (input.control && input.shift && (input.key === 'I' || input.key === 'i'))
    if (openDevToolsKey) {
      event.preventDefault()
      if (win.webContents.isDevToolsOpened()) win.webContents.closeDevTools()
      else win.webContents.openDevTools({ mode: 'detach' })
    }
  })
}

function wireWindowStateEvents(win) {
  const push = () => sendWindowState(win)
  win.on('maximize', push)
  win.on('unmaximize', push)
  win.on('enter-full-screen', push)
  win.on('leave-full-screen', push)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    frame: false,
    fullscreenable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  })

  wireWindowStateEvents(mainWindow)
  bindWindowShortcuts(mainWindow)

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  const isDev = !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:1573')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'www', 'controllPage', 'html', 'index.html'))
  }

  mainWindow.webContents.once('did-finish-load', () => {
    sendWindowState(mainWindow)
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    removeAppMenu()

    ipcMain.handle('window:toggleFullscreen', () => {
      const win = BrowserWindow.getFocusedWindow() || mainWindow
      if (!win) return false
      const next = !win.isFullScreen()
      win.setFullScreen(next)
      return next
    })

    ipcMain.handle('window:setFullScreen', (_, flag) => {
      const win = BrowserWindow.getFocusedWindow() || mainWindow
      if (!win) return
      win.setFullScreen(!!flag)
    })

    ipcMain.handle('window:minimize', () => {
      const win = BrowserWindow.getFocusedWindow() || mainWindow
      if (win) win.minimize()
    })

    ipcMain.handle('window:maximizeToggle', () => {
      const win = BrowserWindow.getFocusedWindow() || mainWindow
      if (!win) return false
      if (win.isMaximized()) win.unmaximize()
      else win.maximize()
      return win.isMaximized()
    })

    ipcMain.handle('window:close', () => {
      const win = BrowserWindow.getFocusedWindow() || mainWindow
      if (win) win.close()
    })

    ipcMain.handle('window:getState', () => {
      const win = BrowserWindow.getFocusedWindow() || mainWindow
      if (!win || win.isDestroyed()) {
        return { isMaximized: false, isFullScreen: false }
      }
      return {
        isMaximized: win.isMaximized(),
        isFullScreen: win.isFullScreen(),
      }
    })

    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
