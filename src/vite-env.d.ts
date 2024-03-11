/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'element-plus/dist/locale/zh-cn.mjs'

interface Window {
  electronRequire: any
  getUserDataDirectory: any
  exportCSV: any
  // downloadUSReport: any
  // downloadOne: any
  // beginDownload: any
  // stopDownload: any
  // addDownloadTask: any
  // loadDownloadTasks: any
  // retryDownloadTask: any
  // pauseDownloadTask: any
  // resumeDownloadTask: any
  // bulkStartDownloadTask: any
  // bulkPauseDownloadTask: any
  download: any
  convert: any

  beginConvert: any
  stopConvert: any

  isDownloadPausing: any
  isConvertPausing: any
  openDialog: any
  fs: any
  isDirectory: any
  isFile: any
  readFileSync: any
  writeFileSync: any
  copyFileSync: any
  cacheDB: {
    getUSDownloadDirectory: any
    setUSDownloadDirectory: any
    getJuchaoDownloadDirectory: any
    setJuchaoDownloadDirectory: any
    setJuchaoCompanies: any
    getJuchaoCompanies: any
  }

  downloadDB: {
    insert: any
    getAll: any
    countAll: any
    deleteAll: any
    deleteOne: any
    getOne: any
  }

  convertDB: {
    insert: any
    getAll: any
    countAll: any
    deleteAll: any
    deleteOne: any
    getOne: any
  }

  usReportDB: {
    getAll: any
    countAll: any
    insert: any
  }

  queueDB: {
    deleteAll: any
  }

  convertPdf2Txt: any

  listFiles: any
}

declare module 'lodash'
declare module 'ali-oss'
declare module 'qs'
