/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true'
    DIST_ELECTRON: string
    DIST: string
    /** /dist/ or /public/ */
    PUBLIC: string
  }
}

interface Window {
  electronRequire: any
  exportCSV: any
  getUserDataDirectory: any
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
