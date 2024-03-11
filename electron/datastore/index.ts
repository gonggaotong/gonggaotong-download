import datastore from 'nedb'
import path from 'path'
import { app } from 'electron'

function createDatastore(dbname: string) {
  console.log(
    path.join(app.getPath('userData') || (process.env._system_type === 'Darwin' ? '/tmp' : 'c:'), `/${dbname}.db`),
  )
  return new datastore({
    autoload: true,
    filename: path.join(
      app.getPath('userData') || (process.env._system_type === 'Darwin' ? '/tmp' : 'c:'),
      `/${dbname}.db`,
    ),
  })
}

/**
 * {key: 'xxx', value: 'xxx'}
 */
export const cacheDB = createDatastore('cache')

/**
 * symbol	name	lastsale	netchange	pctchange	volume	marketCap	country	ipoyear	industry	sector	url
 */
export const usReportDB = createDatastore('usReport')

/**
 * {url: ', path: '', state: 'pending', startTime: 0, endTime: 0, error: '', paused: true, createdTime: 0}
 */
export const queueDB = createDatastore('queue')

/**
 * {hash, type: 'us-report', config: {ticker: 'xxx', startYear: 2019, endYear: 2020, format: ['xxx', 'xxx']}, startTime: 0, paused: true, state: 'pending'}
 */
export const downloadDB = createDatastore('download')
// downloadDB.ensureIndex({ fieldName: 'hash', unique: true }, function (err) {
//   if (err) console.log('添加download索引失败', err)
// })

/**
 * {filepath: '', destType: 'txt', state: 'pending|processing|success|error', paused: false, createdTime: 0}
 */
export const convertDB = createDatastore('convert')
