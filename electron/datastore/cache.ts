import { cacheDB } from './index'
export default {
  getUSDownloadDirectory: () => {
    return new Promise((resolve, reject) => {
      cacheDB.findOne({ key: 'us_download_path' }, function (err: Error | null, result: any) {
        if (err) {
          reject(err)
          return
        }
        if (result && result.value) {
          resolve(String(result.value))
        } else {
          resolve('')
        }
      })
    })
  },
  setUSDownloadDirectory: (value: string) => {
    return new Promise((resolve, reject) => {
      cacheDB.findOne({ key: 'us_download_path' }, function (err: Error | null, result: any) {
        let path = ''
        if (result && result.value) {
          path = result.value
        }
        if (path) {
          cacheDB.update({ key: 'us_download_path' }, { value })
        } else {
          cacheDB.insert({ key: 'us_download_path', value })
        }
        resolve(true)
      })
    })
  },
  getJuchaoDownloadDirectory: () => {
    return new Promise((resolve, reject) => {
      cacheDB.findOne({ key: 'juchao_download_path' }, function (err: Error | null, result: any) {
        if (err) {
          reject(err)
          return
        }
        if (result && result.value) {
          resolve(String(result.value))
        } else {
          resolve('')
        }
      })
    })
  },
  setJuchaoDownloadDirectory: (value: string) => {
    return new Promise((resolve, reject) => {
      cacheDB.findOne({ key: 'juchao_download_path' }, function (err: Error | null, result: any) {
        let path = ''
        if (result && result.value) {
          path = result.value
        }
        if (path) {
          cacheDB.update({ key: 'juchao_download_path' }, { value })
        } else {
          cacheDB.insert({ key: 'juchao_download_path', value })
        }
        resolve(true)
      })
    })
  },
  getJuchaoCompanies: () => {
    return new Promise((resolve, reject) => {
      cacheDB.findOne({ key: 'juchao_companies' }, function (err: Error | null, result: any) {
        if (err) {
          reject(err)
          return
        }
        if (result && result.value) {
          resolve(result.value)
        } else {
          resolve('')
        }
      })
    })
  },
  setJuchaoCompanies: (companies: any) => {
    return new Promise((resolve, reject) => {
      cacheDB.findOne({ key: 'juchao_companies' }, function (err: Error | null, result: any) {
        let allCompanies = ''
        if (result && result.value) {
          allCompanies = result.value
        }
        if (allCompanies) {
          cacheDB.update({ key: 'juchao_companies' }, { value: companies })
        } else {
          cacheDB.insert({ key: 'juchao_companies', value: companies })
        }
        resolve(true)
      })
    })
  },
}
