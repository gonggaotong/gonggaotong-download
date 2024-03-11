import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import fileService from './file'
import downloadObj from './download'

import downloadDB from '../datastore/download'
import cacheDB from '../datastore/cache'
import usReportDB from '../datastore/us-report'
import queueDB from '../datastore/queue'
import convertDB from '../datastore/convert'

import convertObj from './convert/index'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  })

  win.maximize()
  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    await win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

ipcMain.handle('getUserDataDirectory', event => {
  return app.getPath('userData')
})

// 例子
ipcMain.handle('openDialog', (event, method, params) => {
  return dialog[method](params)
})

ipcMain.handle('exportCSV', (event, path, data) => {
  return fileService.exportCSV(path, data)
})

ipcMain.handle('beginConvert', event => {
  convertTaskObj.start()
})

ipcMain.handle('stopConvert', event => {
  convertTaskObj.stop()
})

// ipcMain.handle('beginDownload', event => {
//   downloadObj.start()
// })

// ipcMain.handle('stopDownload', event => {
//   downloadObj.stop()
// })

// ipcMain.handle('isDownloadPausing', event => {
//   return {
//     pausing: Boolean(downloadObj?.pausing),
//     paused: Boolean(downloadObj?.pausing),
//   }
// })

ipcMain.handle('download', (event, method, params) => {
  return downloadObj[method](params)
})

ipcMain.handle('convert', (event, method, params) => {
  return convertObj[method](params)
})

// ipcMain.handle('generateTask', (event, data) => {
//   downloadObj.generateTask(data)
// })

// ipcMain.handle('bulkRemove', event => {
//   downloadObj.bulkRemove()
// })

// ipcMain.handle('bulkStop', event => {
//   downloadObj.bulkStop()
// })

// ipcMain.handle('bulkStart', event => {
//   downloadObj.bulkStart()
// })

// ipcMain.handle('pauseOne', (event, id) => {
//   downloadObj.pause(id)
// })

// ipcMain.handle('resumeOne', (event, id) => {
//   downloadObj.resume(id)
// })

// ipcMain.handle('removeOne', (event, id) => {
//   downloadObj.remove(id)
// })

ipcMain.handle('isConvertPausing', event => {
  return {
    pausing: Boolean(convertTaskObj?.pausing),
    paused: Boolean(convertTaskObj?.pausing),
  }
})

ipcMain.handle('cacheDBGetUSDownloadDirectory', event => {
  return cacheDB.getUSDownloadDirectory()
})
ipcMain.handle('cacheDBSetUSDownloadDirectory', (event, data) => {
  return cacheDB.setUSDownloadDirectory(data)
})

ipcMain.handle('cacheDBGetJuchaoDownloadDirectory', event => {
  return cacheDB.getJuchaoDownloadDirectory()
})
ipcMain.handle('cacheDBSetJuchaoDownloadDirectory', (event, data) => {
  return cacheDB.setJuchaoDownloadDirectory(data)
})

ipcMain.handle('downloadDBInsert', (event, values) => {
  return downloadDB.insert(values)
})
ipcMain.handle('downloadDBGetAll', (event, keys, conditions, skip, limit) => {
  return downloadDB.getAll(keys, conditions, skip, limit)
})
ipcMain.handle('downloadDBCountAll', (event, conditions) => {
  return downloadDB.countAll(conditions)
})
ipcMain.handle('downloadDBGetOne', (event, conditions) => {
  return downloadDB.getOne(conditions)
})
ipcMain.handle('downloadDBDeleteAll', (event, conditions) => {
  return downloadDB.deleteAll(conditions)
})
ipcMain.handle('downloadDBDeleteOne', (event, item) => {
  return downloadDB.deleteOne(item)
})

ipcMain.handle('usReportDBGetAll', (event, options) => {
  return usReportDB.getAll(options)
})
ipcMain.handle('usReportDBCountAll', (event, options) => {
  console.log('usReportDBCountAll', options)
  return usReportDB.countAll(options)
})
ipcMain.handle('usReportDBInsert', (event, values) => {
  return usReportDB.insert(values)
})

ipcMain.handle('queueDBDeleteAll', (event, conditions) => {
  return queueDB.deleteAll(conditions)
})

ipcMain.handle('cacheDBGetJuchaoCompanies', event => {
  return cacheDB.getJuchaoCompanies()
})

ipcMain.handle('cacheDBSetJuchaoCompanies', (event, item) => {
  return cacheDB.setJuchaoCompanies(item)
})

ipcMain.handle('listFiles', (event, filepath) => {
  return fileService.listFiles(filepath)
})

ipcMain.handle('convertDBInsert', (event, values) => {
  return convertDB.insert(values)
})
ipcMain.handle('convertDBGetAll', (event, keys, conditions, skip, limit) => {
  return convertDB.getAll(keys, conditions, skip, limit)
})
ipcMain.handle('convertDBCountAll', (event, conditions) => {
  return convertDB.countAll(conditions)
})
ipcMain.handle('convertDBGetOne', (event, conditions) => {
  return convertDB.getOne(conditions)
})
ipcMain.handle('convertDBDeleteAll', (event, conditions) => {
  return convertDB.deleteAll(conditions)
})
ipcMain.handle('convertDBDeleteOne', (event, item) => {
  return convertDB.deleteOne(item)
})

// // 例子
// ipcMain.handle('fs', (event, method, params) => {
//   return fs[method](params)
// })

// ipcMain.handle('isDirectory', (event, filePath) => {
//   return fs.statSync(filePath).isDirectory()
// })

// ipcMain.handle('isFile', (event, filePath) => {
//   return fs.statSync(filePath).isFile()
// })

// // 例子
// ipcMain.handle('readFileSync', (event, path, method, cb) => {
//   return fs.readFileSync(path, method, cb)
// })

// // 例子
// ipcMain.handle('writeFileSync', (event, path, method) => {
//   return fs.writeFileSync(path, method)
// })

// // 例子
// ipcMain.handle('copyFileSync', (event, copy_url, paste_url, cb) => {
//   return fs.copyFileSync(copy_url, paste_url)
// })
