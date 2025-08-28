import _ from 'lodash'
import { sendToRender } from '../event'
const fs = require('fs-extra')
const axios = require('axios')
const { EventEmitter } = require('events')
import downloadDB from '../../datastore/download'
const { BrowserWindow } = require('electron')

class DownloadQueue extends EventEmitter {
  constructor(maxConcurrent = 5) {
    super()
    this.db = downloadDB
    this.maxConcurrent = maxConcurrent
    this.activeDownloads = 0
    this.queue = []
    this.downloads = {}
    this.loadTasks()
  }

  async loadTasks() {
    this.activeDownloads = 0
    this.queue = []
    this.downloads = {}
    await this.db.update({ status: { $in: ['downloading', 'paused', 'error'] } }, { $set: { status: 'queued' } })
    this.queue = await this.db.getAll([], { status: { $in: ['queued'] } })
    for (let i = 0; i < this.maxConcurrent; i++) {
      this.checkQueue()
    }
  }

  generateTask({ url, directory, filename }) {
    const id = _.toNumber(`${Date.now()}${('' + Math.random()).slice(2, 5)}`)

    return {
      id,
      url,
      directory,
      filename,
      status: 'queued',
      progress: 0,
      downloaded: 0,
      size: null,
    }
  }

  async add({ url, directory, filename }) {
    const task = this.generateTask({ url, directory, filename })

    try {
      await this.db.insert(task)
      this.queue.push(task)
      this.checkQueue()
    } catch (err) {
      this.emit('error', err, task.id)
      return
    }
  }

  checkQueue() {
    if (this.activeDownloads < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()
      this.start(task)
    }
  }

  async start(task) {
    const destination = `${task.directory}/${task.filename}`
    if (!(await fs.pathExists(destination))) {
      await fs.ensureFile(destination)
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('begin-download', task.url)

      task.status = 'downloading'
      this.emit('started', task.id)
      this.activeDownloads++

      // 首先尝试直接下载PDF
      try {
        console.log('尝试直接下载PDF...')
        const response = await axios({
          method: 'GET',
          url: task.url,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept: 'application/pdf,application/octet-stream,*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Cache-Control': 'no-cache',
            Referer: 'http://www.cninfo.com.cn/',
          },
          timeout: 30000,
        })

        // 检查响应是否为PDF
        const contentType = response.headers['content-type'] || ''
        console.log('Content-Type:', contentType)

        if (contentType.includes('application/pdf') || task.url.toLowerCase().endsWith('.pdf')) {
          console.log('直接下载PDF成功')
          fs.writeFileSync(destination, response.data)
        } else {
          console.log('响应不是PDF，尝试浏览器下载...')
          throw new Error('Not a PDF response, try browser download')
        }
      } catch (directDownloadError) {
        console.log('直接下载失败，使用浏览器方式:', directDownloadError.message)

        // 使用浏览器下载PDF
        const scraperWindow = new BrowserWindow({
          show: false,
          webPreferences: {
            offscreen: true,
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
          },
        })

        try {
          // 设置下载处理
          scraperWindow.webContents.session.on('will-download', (event, item, webContents) => {
            console.log('开始浏览器下载...')
            item.setSavePath(destination)

            item.on('updated', (event, state) => {
              if (state === 'interrupted') {
                console.log('下载被中断')
              } else if (state === 'progressing') {
                if (item.isPaused()) {
                  console.log('下载暂停')
                } else {
                  const progress = (item.getReceivedBytes() / item.getTotalBytes()) * 100
                  console.log(`下载进度: ${progress}%`)
                  this.emit('progress', task.id, progress)
                }
              }
            })

            item.once('done', (event, state) => {
              if (state === 'completed') {
                console.log('浏览器下载完成')
                scraperWindow.close()
              } else {
                console.log(`下载失败: ${state}`)
                scraperWindow.close()
                throw new Error(`Download failed: ${state}`)
              }
            })
          })

          await scraperWindow.loadURL(task.url)

          // 等待页面加载完成
          await new Promise(resolve => setTimeout(resolve, 3000))

          // 尝试查找并点击下载链接，或者触发PDF下载
          const downloadResult = await scraperWindow.webContents.executeJavaScript(`
            (function() {
              // 方法1: 查找embed标签的src
              const embed = document.querySelector('embed[type="application/pdf"]');
              if (embed && embed.src && embed.src !== 'about:blank') {
                console.log('找到embed PDF链接:', embed.src);
                return embed.src;
              }

              // 方法2: 查找object标签
              const object = document.querySelector('object[type="application/pdf"]');
              if (object && object.data) {
                console.log('找到object PDF链接:', object.data);
                return object.data;
              }

              // 方法3: 查找iframe
              const iframe = document.querySelector('iframe[src*=".pdf"]');
              if (iframe && iframe.src) {
                console.log('找到iframe PDF链接:', iframe.src);
                return iframe.src;
              }

              // 方法4: 尝试从当前URL构造PDF链接
              if (window.location.href.includes('.PDF') || window.location.href.includes('.pdf')) {
                console.log('使用当前URL作为PDF链接');
                return window.location.href;
              }

              return null;
            })()
          `)

          if (downloadResult) {
            console.log('找到PDF真实链接:', downloadResult)
            // 直接下载找到的PDF链接
            const pdfResponse = await axios({
              method: 'GET',
              url: downloadResult,
              responseType: 'arraybuffer',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                Accept: 'application/pdf,application/octet-stream,*/*',
                Referer: task.url,
              },
              timeout: 30000,
            })

            fs.writeFileSync(destination, pdfResponse.data)
            console.log('PDF下载完成')
          } else {
            // 如果找不到PDF链接，保存HTML内容作为备用
            console.log('未找到PDF链接，保存HTML内容')
            const content = await scraperWindow.webContents.executeJavaScript('document.documentElement.outerHTML')
            fs.writeFileSync(destination.replace('.pdf', '.html'), content, 'utf-8')
          }
        } catch (error) {
          console.log('浏览器下载出错:', error)
          throw error
        } finally {
          scraperWindow.close()
        }
      }

      console.log('下载完成:', destination)
      task.status = 'completed'
      this.emit('completed', task.id)
      this.activeDownloads--
      delete this.downloads[task.id]
      await this.db.update({ id: task.id }, { $set: { status: 'completed' } })
      this.checkQueue()
    } catch (error) {
      console.log('download error', error)
      this.emit('error', task.id)
      task.status = 'error'
      await this.db.update({ id: task.id }, { $set: { status: 'error' } })
      this.activeDownloads--
      this.checkQueue()
    }
  }

  pause(id) {
    if (this.downloads[id]) {
      this.downloads[id].data.pause()
      this.downloads[id].writer.end()
      this.queue.unshift({ ...this.queue.find(item => item.id === id), status: 'paused' })
      this.activeDownloads--
      this.emit('paused', id)
    }
  }

  async resume(id) {
    const taskIndex = this.queue.findIndex(item => item.id === id)
    if (taskIndex > -1) {
      const [task] = this.queue.splice(taskIndex, 1)
      if (task.status === 'paused') {
        this.start(task)
      }
    } else {
      const task = await this.db.getOne({ id })
      if (task) {
        this.start(task)
      }
    }
  }

  async remove(id) {
    if (this.downloads[id]) {
      this.downloads[id].data.destroy()
      this.downloads[id].writer.end()
      this.activeDownloads--
      delete this.downloads[id]
    }
    await this.db.deleteOne({ id })
    this.emit('removed', id)
  }

  // 全部删除
  async bulkRemove() {
    // 停止所有的下载
    for (let id in this.downloads) {
      this.downloads[id].data.destroy()
      this.downloads[id].writer.end()
      delete this.downloads[id]
    }
    this.activeDownloads = 0
    this.queue = []
    // 从数据库中删除所有的任务
    await this.db.deleteAll()

    this.emit('removedAll')
  }

  // 全部停止
  async bulkStop() {
    Object.keys(this.downloads).forEach(id => {
      this.downloads[id].data.destroy()
      this.downloads[id].writer.end()
      delete this.downloads[id]
    })
    this.activeDownloads = 0
    this.queue = []
    // await this.db.update({ status: { $in: ['downloading', 'paused', ''] } }, { status: 'queued' })
    this.emit('stopped')
  }

  // 全部开始
  async bulkStart() {
    console.log('bulkStart')
    await this.loadTasks()
  }
}

const downloadObj = new DownloadQueue(2)
downloadObj.on('progress', (id, progress) => {
  console.log(`Download ${id} progress: ${progress}`)
  sendToRender('DOWNLOAD-SINGLE-PROGRESS', { id, progress })
})

downloadObj.on('completed', id => {
  console.log(`Download ${id} completed`)
  sendToRender('DOWNLOAD-SINGLE-COMPLETED', { id })
})

downloadObj.on('paused', id => {
  console.log(`Download ${id} paused`)
  sendToRender('DOWNLOAD-SINGLE-PAUSED', { id })
})

downloadObj.on('error', id => {
  console.log(`Download ${id} error`)
  sendToRender('DOWNLOAD-SINGLE-ERROR', { id })
})

downloadObj.on('removed', id => {
  console.log(`Download ${id} removed`)
  sendToRender('DOWNLOAD-SINGLE-REMOVED', { id })
})

downloadObj.on('removedAll', () => {
  console.log(`Downloads removedAll`)
  sendToRender('DOWNLOAD-REMOVED-ALL')
})

downloadObj.on('stopped', () => {
  console.log(`Downloads stoped`)
  sendToRender('DOWNLOAD-STOPPED-ALL')
})

export default downloadObj
