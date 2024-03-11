import Papa from 'papaparse'
import fs from 'fs'
import { promises as pfs } from 'fs'
import path from 'path'
import _ from 'lodash'

const exportCSV = (path, data) => {
  const csv = Papa.unparse(data)
  fs.writeFileSync(path, csv)
}

const listFiles = async (dir: string) => {
  const files = await pfs.readdir(dir)
  let result: any[] = []
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stats = await pfs.stat(fullPath)
    if (stats.isDirectory()) {
      result = result.concat(await listFiles(fullPath))
    } else {
      result.push(fullPath)
    }
  }
  return result
}

export default {
  exportCSV,
  listFiles,
}
