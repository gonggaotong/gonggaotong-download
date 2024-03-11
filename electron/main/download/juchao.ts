import _ from 'lodash'
import { sendToRender } from '../event'
import downloadDB from '../../datastore/download'
import queueUtil from '../../utils/queue'
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const fetch = require('electron-fetch').default
import dayjs from 'dayjs'

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
class DownloadJuchao {
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

  public async download() {
    await downloadDB.update({ hash: this.item.hash }, { $set: { state: 'downloading', startTime: _.now() } })
    sendToRender('US-REPORT-SINGLE-DOWNLOAD-START', this.item)
    const {
      adjunctSize,
      adjunctUrl,
      secCode,
      secName,
      announcementTitle,
      announcementTime,
      adjunctType: extension,
      pageColumn,
    } = this.item.config.item

    let filename = `${secCode}${secName}_${announcementTitle}_${pageColumn}_${dayjs(announcementTime).format(
      'YYYY-MM-DD',
    )}.${extension}`

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

    // console.log('savePath', {
    //   url: `http://static.cninfo.com.cn/${adjunctUrl}`,
    //   path,
    //   size: adjunctSize,
    //   format: '',
    //   group: this.item.hash,
    //   item: this.item,
    //   createdTime: _.now(),
    // })

    this.queueObj.push({
      url: `http://static.cninfo.com.cn/${adjunctUrl}`,
      path,
      size: adjunctSize,
      format: extension,
      group: this.item.hash,
      item: this.item,
      createdTime: _.now(),
    })
  }

  onProgress = (data, receiveByte, totalByte) => {}

  onDone = async data => {
    downloadDB.update(
      { hash: data.item.hash },
      { $set: { state: 'complete', message: '', endTime: _.now(), path: data.path } },
    )
    console.log('onDone', data)
    sendToRender('US-REPORT-SINGLE-DOWNLOAD-COMPLETE', data.item, this.downloadItems.length)
    this.onComplete('not exist')
  }

  onError = async (data, error) => {
    console.log('download error', data, error)
    await downloadDB.update(
      { hash: data.item.hash },
      { $set: { state: 'error', message: 'part-error', endTime: _.now() } },
    )
    console.log('onError', data, error)
    sendToRender('US-REPORT-SINGLE-DOWNLOAD-ERROR', data.item, 'NETWORK', error)
    this.onComplete('not exist')
  }
}

export default DownloadJuchao
// const downloadJuchaoObj = new DownloadJuchao()
// export default downloadJuchaoObj
