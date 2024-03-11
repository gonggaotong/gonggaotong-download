import fs from 'fs'
import queueDB from '../datastore/queue'
import _ from 'lodash'
import striptags from 'striptags'
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const fetch = require('electron-fetch').default

export default class UtilQueue {
  private running: boolean
  private paused: boolean
  private interval: number
  private onProgress: Function
  private onDone: Function
  private onError: Function
  private abortController: any

  constructor(onProgress: Function, onDone: Function, onError: Function, interval = 0) {
    this.running = false
    this.interval = interval
    this.onProgress = onProgress
    this.onDone = onDone
    this.onError = onError
  }

  public pause() {
    this.paused = true
    queueDB.deleteAll()
    this.abortController?.abort()
  }

  public start() {
    this.paused = false
    this.run()
  }

  public push(data: any) {
    console.log('insert', data)
    queueDB.insert(data).then(() => {
      this.run()
    })
  }

  private async run() {
    if (this.paused) {
      return
    }
    if (this.running) {
      return
    }
    this.running = true
    const data: any = await queueDB.getLatestOne()
    console.log('data', data)
    if (!data) {
      this.running = false
      return
    }
    this.download(data)
      .then(() => {
        queueDB
          .remove(data._id)
          .then(() => {
            setTimeout(() => {
              if (this.paused) {
                return
              }
              this.run()
            }, this.interval)
          })
          .finally(() => {
            this.running = false
          })
      })
      .catch(error => {
        console.log('download error', error)
        this.onError(data, error)
        this.running = false
      })
  }

  private download(item: any) {
    return new Promise<any>((resolve, reject) => {
      this.abortController = new AbortController()

      fetch(item.url, {
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
        signal: this.abortController.signal,
      })
        .then(response => {
          if (item.format === 'PDF') {
            const dest = fs.createWriteStream(item.path)
            response.body.pipe(dest)
            this.onDone(item)
            resolve(item)
          } else {
            response
              .text()
              .then(body => {
                // console.log(body)
                const filename = item.url.split('/').pop()
                let content
                if (item.type !== 'juchao-report') {
                  content = body
                } else {
                  content = body.replace(/<img src="/g, `<img src="${item.url.split(filename)[0]}`)
                }
                console.log('item.path', item.path)
                fs.writeFileSync(item.path, content)
                if (_.includes(item.format, 'TXT') && filename.indexOf('.txt') === -1) {
                  content = striptags(content)
                  // content = content.replace(/\n\n/g, '\n')
                  // content = content.replace(/  /g, ' ')
                  content = _.trim(content)
                  fs.writeFileSync(item.path.replace(filename.split('.').pop(), 'txt'), content)
                }
                this.onDone(item)
                resolve(item)
              })
              .catch(error => {
                reject(error)
              })
          }
        })
        .catch(error => {
          reject(error)
        })
    })
  }
}
