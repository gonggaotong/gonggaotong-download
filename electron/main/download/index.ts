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

      const scraperWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          offscreen: true,
        },
      })

      let content = ''
      try {
        await scraperWindow.loadURL(task.url)
        content = await scraperWindow.webContents.executeJavaScript('document.documentElement.outerHTML')
        console.log(content)
      } catch (error) {
        console.log('error', error)
        throw error
      } finally {
        scraperWindow.close()
      }

      task.status = 'downloading'
      this.emit('started', task.id)

      // 将content写入文件
      fs.writeFileSync(destination, content, 'utf-8')

      console.log('---------------')
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
