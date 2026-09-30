import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDatabase } from '../db/index'
import { registerIpcHandlers } from './ipc'

// Prevent Windows GPU cache lock error in multi-process/dev environments
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const APP_ROOT = path.join(__dirname, '..')
process.env.APP_ROOT = APP_ROOT

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')

export const VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(APP_ROOT, 'renderer/public')
  : RENDERER_DIST
process.env.VITE_PUBLIC = VITE_PUBLIC

let win: BrowserWindow | null = null
let splash: BrowserWindow | null = null

function createSplashScreen() {
  const iconPath = path.join(APP_ROOT, 'build/icon.ico')
  splash = new BrowserWindow({
    width: 480,
    height: 310,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: false,
    icon: iconPath,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const splashFile = path.join(VITE_PUBLIC, 'splash.html')
  splash.loadFile(splashFile)
  splash.once('ready-to-show', () => {
    splash?.show()
  })
}

function createWindow() {
  const iconPath = path.join(APP_ROOT, 'build/icon.ico')
  win = new BrowserWindow({
    title: 'Retailer POS Terminal',
    width: 1366,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0C0E12',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Hide default Windows menu bar
  win.setMenuBarVisibility(false)

  // Prevent accidental page reloads in production (disable Ctrl+R, F5, Ctrl+Shift+R)
  // Keeps shortcuts active in dev mode for development
  win.webContents.on('before-input-event', (event, input) => {
    if (app.isPackaged) {
      const isReload =
        (input.control && input.key.toLowerCase() === 'r') ||
        input.key === 'F5' ||
        (input.control && input.shift && input.key.toLowerCase() === 'r')
      if (isReload) {
        event.preventDefault()
      }
    }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  let splashDismissed = false
  const showMainWindow = () => {
    if (splashDismissed) return
    splashDismissed = true

    if (splash && !splash.isDestroyed()) {
      splash.close()
      splash = null
    }

    if (win && !win.isDestroyed()) {
      win.show()
      win.maximize()
    }
  }

  // Smooth transition after splash display (1.4s minimum for animation)
  win.once('ready-to-show', () => {
    setTimeout(showMainWindow, 1400)
  })

  // Fallback in case ready-to-show takes longer or fires early
  setTimeout(showMainWindow, 3200)

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Window management IPC
ipcMain.handle('app:toggleFullscreen', async () => {
  if (!win) return false
  const next = !win.isFullScreen()
  win.setFullScreen(next)
  return next
})

ipcMain.handle('app:isFullscreen', async () => {
  return win?.isFullScreen() ?? false
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
    splash = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // Show sleek splash screen immediately on launch
  createSplashScreen()

  // Initialize SQLite database in the user's data directory (not project folder)
  const userDataPath = app.getPath('userData')
  initDatabase(userDataPath)

  // Register safe IPC handlers for database and auth operations
  registerIpcHandlers()

  // Create application window
  createWindow()
})
