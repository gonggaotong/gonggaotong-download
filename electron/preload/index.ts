import { ipcRenderer } from 'electron'
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = ev => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)

window.getUserDataDirectory = () => ipcRenderer.invoke('getUserDataDirectory')
// 打开目录
window.openDialog = (method, config) => ipcRenderer.invoke('openDialog', method, config)

// json导出到csv
window.exportCSV = (path, data) => ipcRenderer.invoke('exportCSV', path, data)

window.listFiles = path => ipcRenderer.invoke('listFiles', path)

window.download = (method, config) => ipcRenderer.invoke('download', method, config)

window.convert = (method, config) => ipcRenderer.invoke('convert', method, config)

// window.addDownloadTask = data => ipcRenderer.invoke('addDownloadTask', data)
// window.loadDownloadTasks = data => ipcRenderer.invoke('loadDownloadTasks')
// window.retryDownloadTask = data => ipcRenderer.invoke('retryDownloadTask', data)
// window.pauseDownloadTask = data => ipcRenderer.invoke('pauseDownloadTask', data)
// window.resumeDownloadTask = data => ipcRenderer.invoke('resumeDownloadTask', data)
// window.bulkStartDownloadTask = data => ipcRenderer.invoke('bulkStartDownloadTask', data)
// window.bulkPauseDownloadTask = data => ipcRenderer.invoke('bulkPauseDownloadTask', data)

// window.beginDownload = () => ipcRenderer.invoke('beginDownload')
// window.stopDownload = () => ipcRenderer.invoke('stopDownload')
// window.isDownloadPausing = () => ipcRenderer.invoke('isDownloadPausing')

// window.isConvertPausing = () => ipcRenderer.invoke('isConvertPausing')

// window.beginConvert = () => ipcRenderer.invoke('beginConvert')
// window.stopConvert = () => ipcRenderer.invoke('stopConvert')

window.cacheDB = {
  getUSDownloadDirectory: () => ipcRenderer.invoke('cacheDBGetUSDownloadDirectory'),
  setUSDownloadDirectory: data => ipcRenderer.invoke('cacheDBSetUSDownloadDirectory', data),
  getJuchaoDownloadDirectory: () => ipcRenderer.invoke('cacheDBGetJuchaoDownloadDirectory'),
  setJuchaoDownloadDirectory: data => ipcRenderer.invoke('cacheDBSetJuchaoDownloadDirectory', data),
  getJuchaoCompanies: () => ipcRenderer.invoke('cacheDBGetJuchaoCompanies'),
  setJuchaoCompanies: data => ipcRenderer.invoke('cacheDBSetJuchaoCompanies', data),
}

window.downloadDB = {
  insert: values => ipcRenderer.invoke('downloadDBInsert', values),
  getAll: (keys: string[], conditions: any = {}, skip = 0, limit = 100) =>
    ipcRenderer.invoke('downloadDBGetAll', keys, conditions, skip, limit),
  countAll: (conditions: any = {}) => ipcRenderer.invoke('downloadDBCountAll', conditions),
  deleteAll: (conditions: any = {}) => ipcRenderer.invoke('downloadDBDeleteAll', conditions),
  deleteOne: (item: any = {}) => ipcRenderer.invoke('downloadDBDeleteOne', item),
  getOne: (conditions: any = {}) => ipcRenderer.invoke('downloadDBGetOne', conditions),
}

window.convertDB = {
  insert: values => ipcRenderer.invoke('convertDBInsert', values),
  getAll: (keys: string[], conditions: any = {}, skip = 0, limit = 100) =>
    ipcRenderer.invoke('convertDBGetAll', keys, conditions, skip, limit),
  countAll: (conditions: any = {}) => ipcRenderer.invoke('convertDBCountAll', conditions),
  deleteAll: (conditions: any = {}) => ipcRenderer.invoke('convertDBDeleteAll', conditions),
  deleteOne: (item: any = {}) => ipcRenderer.invoke('convertDBDeleteOne', item),
  getOne: (conditions: any = {}) => ipcRenderer.invoke('convertDBGetOne', conditions),
}

window.queueDB = {
  deleteAll: (conditions: any = {}) => ipcRenderer.invoke('queueDBDeleteAll', conditions),
}

window.usReportDB = {
  getAll: options => ipcRenderer.invoke('usReportDBGetAll', options),
  countAll: options => ipcRenderer.invoke('usReportDBCountAll', options),
  insert: values => ipcRenderer.invoke('usReportDBInsert', values),
}

window.convertPdf2Txt = (filepath, targetFilepath) => ipcRenderer.invoke('convertPdf2Txt', filepath, targetFilepath)

// window.fs = (method, config) => ipcRenderer.invoke('fs', method, config)
// window.isDirectory = filePath => ipcRenderer.invoke('isDirectory', filePath)
// window.isFile = filePath => ipcRenderer.invoke('isFile', filePath)
// window.readFileSync = (path, method, cb) => ipcRenderer.invoke('readFileSync', path, method, cb)
// // window.writeFileSync
// window.writeFileSync = (path, method) => ipcRenderer.invoke('writeFileSync', path, method)
// window.copyFileSync = (path, method) => ipcRenderer.invoke('copyFileSync', path, method)

// window.formatExcel = filePath => ipcRenderer.invoke('isFile', filePath)
