import { downloadDB as DB } from './index'
import _ from 'lodash'

export const downloadDB = DB

export default {
  update(query, data) {
    return new Promise<void>((resolve, reject) => {
      downloadDB.update(query, data, { multi: true }, (err: Error | null) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  },
  getLatestOne: (query = {}) => {
    return new Promise((resolve, reject) => {
      downloadDB
        .find(query)
        .sort({ hash: 1 })
        .skip(0)
        .limit(1)
        .exec(function (err: Error | null, result: any) {
          if (err) {
            reject(err)
            return
          }
          if (result && result.length > 0) {
            resolve(result[0])
          } else {
            resolve(null)
          }
        })
    })
  },
  insert: values => {
    return new Promise((resolve, reject) => {
      if (values.length === 0) {
        resolve('')
        return
      }
      downloadDB.insert(values, (err: Error | null) => {
        console.log('插入下载记录失败', err)
        resolve('')
      })
    })
  },
  getAll: (keys: string[], conditions: any = {}, skip = 0, limit = 100000) => {
    return new Promise((resolve, reject) => {
      const referField: any = {}
      _.forEach(keys, (key: string) => {
        referField[key] = 1
      })
      downloadDB
        .find(conditions, referField)
        .skip(skip)
        .limit(limit)
        // .sort({ hash: 1 })
        .exec((err: Error | null, ret: any) => {
          if (err) {
            reject(err)
            return
          }
          resolve(ret)
        })
    })
  },
  getOne(conditions: any = {}) {
    return new Promise((resolve, reject) => {
      downloadDB.findOne(conditions, {}, (err: Error | null, ret: any) => {
        if (err) {
          reject(err)
          return
        }
        resolve(ret)
      })
    })
  },
  countAll: (conditions: any = {}) => {
    return new Promise((resolve, reject) => {
      downloadDB.count(conditions, function (err: Error | null, count: number) {
        if (err) {
          reject(err)
          return
        }
        resolve(count)
      })
    })
  },
  deleteAll: (conditions: any = {}) => {
    return new Promise((resolve, reject) => {
      downloadDB.remove(conditions, { multi: true }, function (err: Error | null) {
        if (err) {
          reject(err)
          return
        }
        resolve('')
      })
    })
  },
  deleteOne: (conditions: any = {}) => {
    return new Promise((resolve, reject) => {
      downloadDB.remove(conditions, { multi: false }, function (err: Error | null, count: number) {
        if (err) {
          reject(err)
          return
        }
        resolve(count)
      })
    })
  },
}
