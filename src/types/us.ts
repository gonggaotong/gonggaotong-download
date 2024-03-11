export interface basicSettingType {
  tickers: string[]
  format: string[]
  startYear: number
  endYear: number
  savePath: string
  types: string[]
}

export interface companyType {
  symbol: string
  name: string
  lastsale: string
  netchange: string
  pctchange: string
  volume: string
  marketCap: string
  country: string
  ipoyear: string
  industry: string
  sector: string
  url: string
}

export interface filterOptionsType {
  tickers?: string[]
  skip?: number
  limit?: number
}
