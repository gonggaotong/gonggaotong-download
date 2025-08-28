import fs from 'fs'
import queueDB from '../datastore/queue'
import _ from 'lodash'
import striptags from 'striptags'
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const fetch = require('electron-fetch').default
const { BrowserWindow } = require('electron')

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

  private async download(item: any) {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.abortController = new AbortController()
        
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('begin-download', item.url)

        // 首先尝试直接下载
        if (item.format === 'PDF' || item.format === 'pdf') {
          try {
            console.log('尝试直接下载PDF...')
            const response = await fetch(item.url, {
              headers: {
                accept: 'application/pdf,application/octet-stream,*/*',
                'accept-language': 'zh-CN,zh;q=0.9',
                'cache-control': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.104 Safari/537.36',
                'Referer': 'http://www.cninfo.com.cn/'
              },
              signal: this.abortController.signal,
            })

            const contentType = response.headers.get('content-type') || ''
            console.log('Content-Type:', contentType)
            
            if (contentType.includes('application/pdf') || item.url.toLowerCase().endsWith('.pdf')) {
              console.log('直接下载PDF成功')
              const buffer = await response.buffer()
              fs.writeFileSync(item.path, buffer)
              this.onDone(item)
              resolve(item)
              return
            } else {
              console.log('响应不是PDF，尝试浏览器下载...')
              throw new Error('Not a PDF response')
            }
          } catch (directError) {
            console.log('直接下载失败，使用浏览器方式:', directError.message)
          }
        }

        // 使用浏览器下载
        const scraperWindow = new BrowserWindow({
          show: false,
          webPreferences: {
            offscreen: true,
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
          },
        })

        try {
          await scraperWindow.loadURL(item.url)
          
          // 如果是PDF格式，尝试查找真实PDF链接
          if (item.format === 'PDF' || item.format === 'pdf') {
            await new Promise(resolve => setTimeout(resolve, 3000))
            
            const pdfUrl = await scraperWindow.webContents.executeJavaScript(`
              (function() {
                const embed = document.querySelector('embed[type="application/pdf"]');
                if (embed && embed.src && embed.src !== 'about:blank') {
                  return embed.src;
                }
                
                const object = document.querySelector('object[type="application/pdf"]');
                if (object && object.data) {
                  return object.data;
                }
                
                const iframe = document.querySelector('iframe[src*=".pdf"]');
                if (iframe && iframe.src) {
                  return iframe.src;
                }
                
                if (window.location.href.includes('.PDF') || window.location.href.includes('.pdf')) {
                  return window.location.href;
                }
                
                return null;
              })()
            `)

            if (pdfUrl) {
              console.log('找到PDF真实链接:', pdfUrl)
              const response = await fetch(pdfUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.104 Safari/537.36',
                  'Accept': 'application/pdf,application/octet-stream,*/*',
                  'Referer': item.url
                },
                signal: this.abortController.signal,
              })
              
              const buffer = await response.buffer()
              fs.writeFileSync(item.path, buffer)
              console.log('PDF下载完成')
            } else {
              console.log('未找到PDF链接，保存HTML内容')
              const content = await scraperWindow.webContents.executeJavaScript('document.documentElement.outerHTML')
              fs.writeFileSync(item.path.replace('.pdf', '.html'), content, 'utf-8')
            }
          } else {
            // 非PDF文件的处理
            const content = await scraperWindow.webContents.executeJavaScript('document.documentElement.outerHTML')
            const filename = item.url.split('/').pop()
            let processedContent
            
            if (item.type !== 'juchao-report') {
              processedContent = content
            } else {
              processedContent = content.replace(/<img src="/g, `<img src="${item.url.split(filename)[0]}`)
            }
            
            console.log('item.path', item.path)
            fs.writeFileSync(item.path, processedContent, 'utf-8')
            
            if (_.includes(item.format, 'TXT') && filename.indexOf('.txt') === -1) {
              const txtContent = _.trim(striptags(processedContent))
              fs.writeFileSync(item.path.replace(filename.split('.').pop(), 'txt'), txtContent, 'utf-8')
            }
          }
        } finally {
          scraperWindow.close()
        }

        this.onDone(item)
        resolve(item)
      } catch (error) {
        console.log('download error', error)
        reject(error)
      }
    })
  }
}
