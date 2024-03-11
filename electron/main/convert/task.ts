import _ from 'lodash'
import { sendToRender } from '../event'
import convertDB from '../../datastore/convert'
import { pdf2txt } from '../../utils'
import fs from 'fs'

interface convertItemType {
  filepath: string
  sourceDir: string
  destType: string
  destDir: string
  destFilepath: string
  state: 'pending' | 'processing' | 'success' | 'error'
  paused: boolean
  createdTime: number
}
class ConvertTask {
  private running: boolean
  private paused: boolean
  private existDirs: any[]
  private item: any
  constructor() {
    this.running = false
    this.paused = false
    this.existDirs = []
  }

  public setItem(item) {
    this.item = item
  }

  public start() {
    this.paused = false
    this.run()
  }

  public stop() {
    this.paused = true
    this.running = false
  }

  public pause() {
    this.paused = true
    if (this.item) {
      convertDB.update({ filepath: this.item.filepath }, { $set: { state: 'pending' } })
    }
  }

  private async run() {
    const processingItem = await convertDB.getLatestOne({ state: 'processing' })
    if (processingItem && this.item) {
      console.log('有正转换的item 不再转换')
      return
    } else {
      this.item = await convertDB.getLatestOne({ state: { $in: ['processing', 'pending', 'error'] } })
    }
    console.log('convert-run')
    if (!this.item) {
      return
    }

    console.log(this.paused, this.running)

    if (this.paused) {
      return
    }
    if (this.running) {
      return
    }
    this.running = true

    await this.convert()
  }

  public checkDir(dir) {
    if (this.existDirs.includes(dir)) {
      return true
    }

    const exist = fs.existsSync(dir)
    if (!exist) {
      fs.mkdirSync(dir)
    }
    this.existDirs.push(dir)
  }

  public async checkDirs(filepath) {
    const dirs = filepath.split('/')
    let dir = ''
    // D:/AAA/BBB/aaa.pdf
    // /data/tmp/aaa.pdf
    _.forEach(dirs, (dirStr, index: number) => {
      if (index === 0) {
        dir = dirStr + '/'
        return
      }

      if (index === dirs.length - 1) {
        return
      }

      dir = `${dir}${dirStr}/`
      this.checkDir(dir)
    })
  }

  public async convert() {
    await convertDB.update(
      { filepath: this.item.filepath, destDir: this.item.destDir },
      { $set: { state: 'processing', startTime: _.now() } },
    )
    sendToRender('CONVERT-START', this.item)

    let { filepath: sourceFilepath, sourceDir, destDir } = this.item
    let destFilepath = ''
    const extension = sourceFilepath.split('.').pop()
    if (!destDir) {
      destFilepath = sourceFilepath.replace(`.${extension}`, '.txt')
    } else {
      destFilepath = sourceFilepath.replace(`.${extension}`, '.txt')
      destFilepath = destFilepath.replace(sourceDir, destDir)
    }

    this.checkDirs(destFilepath)

    if (fs.existsSync(destFilepath)) {
      await convertDB.update(
        { filepath: this.item.filepath, destDir: this.item.destDir },
        { $set: { state: 'success', destFilepath } },
      )
      sendToRender('CONVERT-SUCCESS', this.item)
      this.running = false
      this.run()
      return
    }

    try {
      await pdf2txt(sourceFilepath, destFilepath)
      await convertDB.update(
        { filepath: this.item.filepath, destDir: this.item.destDir },
        { $set: { state: 'success', destFilepath } },
      )
      sendToRender('CONVERT-SUCCESS', this.item)
    } catch (error) {
      console.log('转换失败', error)
      await convertDB.update({ filepath: this.item.filepath, destDir: this.item.destDir }, { $set: { state: 'error' } })
      sendToRender('CONVERT-ERROR', this.item, error)
    }
    this.running = false
    this.run()
  }
}

const convertTaskObj: any = new ConvertTask()
export default convertTaskObj
