import { promises as fs } from 'fs'
import path from 'path'
import pdf from 'pdf-parse'
import { sendToRender } from '../event'
import convertDB from '../../datastore/convert'
import { EventEmitter } from 'events'

interface Task {
  _id?: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  sourcePath: string
  targetPath?: string
  error?: string
}

class PDFConverter extends EventEmitter {
  db: any
  queue: Task[]
  activeTasks: number
  maxConcurrentTasks: number

  constructor() {
    super()
    this.db = convertDB
    this.queue = []
    this.activeTasks = 0
    this.maxConcurrentTasks = 2
    this.loadTasks()
  }

  async loadTasks() {
    this.queue = []
    this.activeTasks = 0
    await this.db.update({ status: { $in: ['processing', 'error'] } }, { $set: { status: 'queued' } })
    this.queue = await this.db.getAll([], { status: { $in: ['queued'] } })
    for (let i = 0; i < this.maxConcurrentTasks; i++) {
      this.startNextTask()
    }
  }

  addTask(sourcePath: string) {
    const task: Task = { status: 'queued', sourcePath }
    this.db.insert(task, (err, newDoc) => {
      if (err) {
        console.error(err)
      } else {
        this.queue.push(newDoc)
        this.startNextTask()
      }
    })
  }

  async startNextTask() {
    if (this.activeTasks < this.maxConcurrentTasks) {
      const task = this.queue.find(task => task.status === 'queued')
      this.emit('taskStarted', task)
      if (task) {
        this.activeTasks++
        task.status = 'processing'
        await this.updateTask(task)
        try {
          const targetPath = await this.convertPDF(task)

          task.status = 'completed'
          task.targetPath = targetPath
          this.updateTask(task)
          this.activeTasks--
          this.startNextTask()
        } catch (error) {
          task.status = 'error'
          task.error = error.message
          this.updateTask(task)
          this.activeTasks--
          this.startNextTask()
        }
      }
      this.emit('taskFinished', task)
    }
  }

  async convertPDF(task: Task) {
    const targetPath = task.targetPath
    // 如果targetPath已经存在并且有内容，就不再转换
    try {
      const stats = await fs.stat(targetPath)
      if (stats.size > 0) {
        // 如果目标文件已经存在并且有内容，直接返回
        return targetPath
      }
    } catch (error) {
      // 如果发生错误，说明目标文件不存在，继续执行转换
    }

    await new Promise(resolve => setTimeout(resolve, 100))
    const dataBuffer = await fs.readFile(task.sourcePath)
    const data = await pdf(dataBuffer, { version: 'v2.0.550' })
    // const targetPath = task.sourcePath.replace('.pdf', '.txt')
    // targetPath所在的文件夹可能不存在
    const targetDir = path.dirname(targetPath)
    await fs.mkdir(targetDir, { recursive: true })
    await fs.writeFile(targetPath, data.text)
    return targetPath
  }

  async updateTask(task: Task) {
    return await this.db.update({ _id: task._id }, task)
  }

  async pauseAll() {
    for (const task of this.queue) {
      if (task.status === 'processing') {
        task.status = 'queued'
        await this.updateTask(task)
      }
    }

    this.activeTasks = 0
    this.queue = []
    this.emit('allPaused')
  }

  async resumeAll() {
    await this.loadTasks()
    this.emit('allResumed')
  }

  async removeAll() {
    this.queue.forEach(task => {
      if (task.status === 'processing') {
        task.status = 'queued'
        this.updateTask(task)
      }
    })
    this.activeTasks = 0
    await this.db.deleteAll()
    this.queue = []
    this.emit('allRemoved')
  }

  async removeTask(id: string) {
    const index = this.queue.findIndex(task => task._id == id)
    if (index !== -1) {
      const task = this.queue[index]
      if (task.status === 'processing') {
        task.status = 'queued'
        this.updateTask(task)
        this.activeTasks--
      }
      await this.db.remove(id)
      this.emit('taskRemoved', id)
    }
  }
}

const convertTaskObj: any = new PDFConverter()

convertTaskObj.on('taskStarted', task => {
  console.log(`Task ${task?._id} started`)
  sendToRender('CONVERT-SINGLE-STARTED', { id: task?._id })
})

convertTaskObj.on('taskFinished', task => {
  console.log(`Task ${task?._id} started`)
  sendToRender('CONVERT-SINGLE-FINISHED', { id: task?._id })
})

convertTaskObj.on('allPaused', () => {
  console.log('All tasks paused')
  sendToRender('CONVERT-ALL-PAUSED')
})

convertTaskObj.on('allResumed', () => {
  console.log('All tasks resumed')
  sendToRender('CONVERT-ALL-RESUMED')
})

convertTaskObj.on('allRemoved', () => {
  console.log('All tasks removed')
  sendToRender('CONVERT-ALL-REMOVED')
})

convertTaskObj.on('taskRemoved', id => {
  console.log(`Task ${id} removed`)
  sendToRender('CONVERT-SINGLE-REMOVED', { id })
})
export default convertTaskObj
