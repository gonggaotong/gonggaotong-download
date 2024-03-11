import { usReportDB } from './index'
export default {
  getAll: (options: any = {}) => {
    return new Promise((resolve, reject) => {
      let condition = {}
      if (options.tickers && options.tickers.length > 0) {
        condition = { symbol: { $in: options.tickers } }
      }

      if (!options.skip) {
        options.skip = 0
      }

      if (!options.limit) {
        options.limit = 100000
      }

      usReportDB
        .find(condition)
        .skip(options.skip)
        .limit(options.limit)
        .exec(function (err: Error | null, result: any) {
          if (err) {
            reject(err)
            return
          }
          if (result) {
            resolve(result)
          } else {
            resolve([])
          }
        })
    })
  },
  countAll: (options: any = {}) => {
    return new Promise((resolve, reject) => {
      let condition = {}
      if (options.tickers && options.tickers.length > 0) {
        condition = { symbol: { $in: options.tickers } }
      }

      usReportDB.count(condition, function (err: Error | null, count: number) {
        if (err) {
          reject(err)
          return
        }
        resolve(count)
      })
    })
  },
  insert: values => {
    usReportDB.remove({}, { multi: true }, function (err, numRemoved) {
      usReportDB.insert(values)
    })
  },
}
