import _ from 'lodash'
import { sendToRender } from '../event'
import downloadDB from '../../datastore/download'
import queueUtil from '../../utils/queue'
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const fetch = require('electron-fetch').default

interface downloadItemType {
  date: string
  url: string
  ticker: string
  type: string
  size?: string
  downloaded: number
  total: number
  state: 'pending' | 'downloading' | 'complete'
}
class DownloadUs {
  private item: any
  private downloadItems: downloadItemType[]
  private paused: boolean
  private queueObj: queueUtil
  private onComplete: Function
  constructor() {
    this.downloadItems = []
    this.paused = false
    this.queueObj = new queueUtil(this.onProgress, this.onDone, this.onError)
  }

  public setItem(item) {
    this.item = item
  }

  public setOnComplete(onComplete) {
    this.onComplete = onComplete
  }

  public pause() {
    this.paused = true
    this.queueObj.pause()
    if (this.item) {
      downloadDB.update({ hash: this.item.hash }, { $set: { state: 'pending' } })
    }
  }

  public start() {
    this.paused = false
    this.queueObj.start()
  }

  private get10Number(num) {
    if (!num) {
      return ''
    }

    return _.padStart(String(num), 10, '0')
  }

  public async downloadUSReport() {
    await downloadDB.update({ hash: this.item.hash }, { $set: { state: 'downloading', startTime: _.now() } })
    sendToRender('US-REPORT-SINGLE-DOWNLOAD-START', this.item)
    let { startYear, endYear, format, item: itemConfig, types } = this.item.config
    const { name, path, symbol, cik } = itemConfig
    const url = `https://data.sec.gov/submissions/CIK${this.get10Number(cik)}.json`
    startYear = parseInt(startYear)
    endYear = parseInt(endYear)
    console.log(symbol, types)
    try {
      const response = await fetch(url, {
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'zh-CN,zh;q=0.9',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.104 Safari/537.36',
        },
        referrerPolicy: 'strict-origin-when-cross-origin',
        body: null,
        method: 'GET',
      })
      const body: any = await response.json()

      const recentFillings = body.filings.recent

      this.downloadItems = []
      _.forEach(recentFillings.form, (type, index) => {
        if (!_.includes(types, type)) {
          return
        }

        const date = recentFillings.filingDate[index]
        if (date) {
          const year = parseInt(date.substring(0, 4))
          if (year < startYear || year > endYear) {
            return
          }
        }

        this.downloadItems.push({
          type,
          date: recentFillings.filingDate[index],
          total: recentFillings.size[index],
          url: `https://www.sec.gov/Archives/edgar/data/${cik}/${recentFillings.accessionNumber[index].replace(
            /-/g,
            '',
          )}/${recentFillings.primaryDocument[index]}`,
          ticker: symbol,
          downloaded: 0,
          state: 'pending',
        })
      })
    } catch (error) {
      console.log('获取列表出错', error)
      await downloadDB.update(
        { hash: this.item.hash },
        { $set: { state: 'error', message: 'network', endTime: _.now() } },
      )
      sendToRender('US-REPORT-SINGLE-DOWNLOAD-ERROR', this.item, 'NETWORK', error)
      this.onComplete('not exist')
      return
    }

    console.log('downloadItems', this.downloadItems.length)

    if (this.downloadItems.length === 0) {
      await downloadDB.update(
        { hash: this.item.hash },
        { $set: { state: 'complete', message: '', endTime: _.now(), items: [] } },
      )
      sendToRender('US-REPORT-SINGLE-DOWNLOAD-COMPLETE', this.item, this.downloadItems.length)
      this.onComplete('not exist')
      return
    }

    await downloadDB.update({ hash: this.item.hash }, { $set: { items: this.downloadItems } })
    sendToRender('US-REPORT-SINGLE-DOWNLOAD-LIST-COMPLETE', this.item, this.downloadItems.length)
    this.beginDownloadItems()
  }

  onProgress = (data, receiveByte, totalByte) => {
    // console.log('download progress', data.item, data, receiveByte, totalByte)
    downloadDB.update(
      { hash: data.item.hash },
      { $set: { [`items.${data.index}.total`]: totalByte, [`items.${data.index}.download`]: receiveByte } },
    )
    // sendToRender('US-REPORT-SINGLE-DOWNLOAD-PROGRESS', data.item, receiveByte, totalByte)
  }

  onDone = async data => {
    // console.log('download complete', data)
    downloadDB.update(
      { hash: data.item.hash },
      {
        $set: {
          [`items.${data.index}.download`]: data.size,
          [`items.${data.index}.state`]: 'complete',
          [`items.${data.index}.path`]: data.path,
        },
      },
    )
    sendToRender('US-REPORT-SINGLE-DOWNLOAD-PART-COMPLETE', data.item, data.index)

    const isComplete = await this.isComplete(data)
    if (isComplete) {
      downloadDB.update({ hash: data.item.hash }, { $set: { state: 'complete', message: '', endTime: _.now() } })
      sendToRender('US-REPORT-SINGLE-DOWNLOAD-COMPLETE', data.item, this.downloadItems.length)
      this.onComplete('not exist')
    }
  }

  onError = async (data, error) => {
    console.log('download error', data, error)
    downloadDB.update(
      { hash: data.item.hash },
      { $set: { [`items.${data.index}.download`]: data.size, [`items.${data.index}.state`]: 'error' } },
    )
    sendToRender('US-REPORT-SINGLE-DOWNLOAD-PART-ERROR', data.item, data.index)

    const isComplete = await this.isComplete(data)
    if (isComplete) {
      await downloadDB.update(
        { hash: data.item.hash },
        { $set: { state: 'error', message: 'part-error', endTime: _.now() } },
      )
      sendToRender('US-REPORT-SINGLE-DOWNLOAD-ERROR', data.item, 'NETWORK', error)
      this.onComplete('not exist')
    }
  }

  private async isComplete(data) {
    const item: any = await downloadDB.getOne({ hash: data.item.hash })
    if (!item) {
      return false
    }
    const completeItems: any[] = _.filter(item.items, { state: 'complete' })
    return completeItems.length === item.items.length
  }

  private async beginDownloadItems() {
    let index = -1
    for (const downloadItem of this.downloadItems) {
      index++
      const { date, url, ticker, type, total } = downloadItem
      const year = date.split('-')[0]
      try {
        const extension = url.split('.').pop()
        let filename = `${ticker}_${year}_${type}_${_.toLower(this.item.config.item.industry).replace(
          / /g,
          '-',
        )}_${_.toLower(this.item.config.item.country)}_${date}.${extension}`

        filename = filename.replace(/\//g, '')
        filename = filename.replace(/\n/g, '')
        filename = filename.replace(/ /g, '')
        filename = filename.replace(/:/g, '')
        filename = filename.replace(/\*/g, '')
        filename = filename.replace(/\?/g, '')
        filename = filename.replace(/"/g, '')
        filename = filename.replace(/</g, '')
        filename = filename.replace(/>/g, '')
        filename = filename.replace(/|/g, '')
        filename = filename.replace(/'/g, '')
        filename = filename.replace(/\(/g, '-')
        filename = filename.replace(/\)/g, '-')

        const path = `${this.item.config.savePath}/${filename}`

        this.queueObj.push({
          url,
          path,
          size: total,
          format: this.item.config.format,
          group: this.item.hash,
          index,
          item: this.item,
          createdTime: _.now() + index,
        })
      } catch (error) {
        console.log(error)
      }
    }
  }
}

export default DownloadUs
// const downloadUsObj = new DownloadUs()
// export default downloadUsObj
