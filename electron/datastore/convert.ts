import { convertDB } from './index'
import _ from 'lodash'
export default {
  insert: values => {
    return new Promise((resolve, reject) => {
      if (values.length === 0) {
        resolve('')
        return
      }
      convertDB.insert(values, (err: Error | null) => {
        console.log('插入下载记录失败', err)
        resolve('')
      })
    })
  },
  getLatestOne: (query = {}) => {
    return new Promise((resolve, reject) => {
      convertDB
        .find(query)
        .sort({ createdTime: 1 })
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
  remove: (_id: string) => {
    return new Promise((resolve, reject) => {
      convertDB.remove({ _id: _id }, { multi: true }, function (err: Error | null, numRemoved: number) {
        if (err) {
          reject(err)
          return
        }
        resolve(numRemoved)
      })
    })
  },
  deleteAll: (conditions: any = {}) => {
    return new Promise((resolve, reject) => {
      convertDB.remove(conditions, { multi: true }, function (err: Error | null) {
        if (err) {
          reject(err)
          return
        }
        resolve('')
      })
    })
  },
  update(query, data) {
    return new Promise<void>((resolve, reject) => {
      convertDB.update(query, data, {}, (err: Error | null) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  },
  getAll: (keys: string[], conditions: any = {}, skip = 0, limit = 1000) => {
    return new Promise((resolve, reject) => {
      const referField: any = {}
      _.forEach(keys, (key: string) => {
        referField[key] = 1
      })
      convertDB
        .find(conditions, referField)
        .skip(skip)
        .limit(limit)
        .sort({ createdTime: 1 })
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
      convertDB.findOne(conditions, {}, (err: Error | null, ret: any) => {
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
      convertDB.count(conditions, function (err: Error | null, count: number) {
        if (err) {
          reject(err)
          return
        }
        resolve(count)
      })
    })
  },
  deleteOne: (conditions: any = {}) => {
    return new Promise((resolve, reject) => {
      convertDB.remove(conditions, { multi: false }, function (err: Error | null, count: number) {
        if (err) {
          reject(err)
          return
        }
        resolve(count)
      })
    })
  },
}
