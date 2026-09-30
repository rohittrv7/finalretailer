import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDatabase } from '../db/index'
import { registerIpcHandlers } from './ipc'

// Prevent Windows GPU cache lock error in multi-process/dev environments
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'renderer/public')
  : RENDERER_DIST

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    title: 'Retailer POS Terminal',
    width: 1366,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: '#0C0E12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Hide default Windows menu bar
  win.setMenuBarVisibility(false)

  // Maximize by default for full-screen counter POS experience
  win.maximize()

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
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // Initialize SQLite database in the user's data directory (not project folder)
  const userDataPath = app.getPath('userData')
  initDatabase(userDataPath)

  // Register safe IPC handlers for database and auth operations
  registerIpcHandlers()

  // Create application window
  createWindow()
})
