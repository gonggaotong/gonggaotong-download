import { queueDB } from './index'
import _ from 'lodash'
export default {
  insert: (data: any) => {
    return new Promise((resolve, reject) => {
      queueDB.findOne({ url: data.url }, function (err: Error | null, result: any) {
        if (result) {
          resolve(result)
          return
        }
        queueDB.insert(data, function (err: Error | null, res: any) {
          if (err) {
            reject(err)
            return
          }
          resolve(res)
        })
      })
    })
  },
  getLatestOne: () => {
    return new Promise((resolve, reject) => {
      queueDB
        .find({})
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
      queueDB.remove({ _id: _id }, { multi: true }, function (err: Error | null, numRemoved: number) {
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
      queueDB.remove(conditions, { multi: true }, function (err: Error | null) {
        if (err) {
          reject(err)
          return
        }
        resolve('')
      })
    })
  },
}
