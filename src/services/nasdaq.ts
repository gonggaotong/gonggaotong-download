import service from '@/services'
import _ from 'lodash'

export default {
  getAllCompany: async () => {
    const url = 'https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=25&offset=0&download=true'
    const nasdaqRes = await service.get(url)
    const secRes = await service.get('https://www.sec.gov/files/company_tickers.json')
    const tickerMap: any = {}
    _.forEach(secRes.data, (single: any) => {
      tickerMap[single.ticker] = single.cik_str
    })

    const result: any[] = []
    _.forEach(nasdaqRes.data.data.rows, (single: any) => {
      if (!tickerMap[single.symbol]) {
        return
      }
      result.push({ ...single, cik: tickerMap[single.symbol] || '' })
    })

    return result
  },
}
