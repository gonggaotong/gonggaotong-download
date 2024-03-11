export interface usReportConfigType {
  ticker?: string
  startYear?: number
  endYear?: number
  format?: string[]
  savePath?: string
  item?: any
  types?: string[]
}

export interface downloadItemType {
  hash: string
  type: 'us-report' | 'juchao-report'
  config: usReportConfigType
  startTime: number
  paused: boolean
  state: 'pending' | 'downloading' | 'completed'
  createdTime: number
  items: any[]
}
