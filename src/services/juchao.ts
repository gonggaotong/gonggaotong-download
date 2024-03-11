import service from '@/services'
import _ from 'lodash'
import qs from 'qs'

export default {
  getAllCompany: async () => {
    let codeMap: any = await window.cacheDB.getJuchaoCompanies()
    if (!codeMap) {
      codeMap = {}
      const url = 'http://www.cninfo.com.cn/new/data/szse_stock.json'
      const res = await service.get(url)
      _.forEach(res.data.stockList, (single: any) => {
        codeMap[single.code] = single
      })

      window.cacheDB.setJuchaoCompanies(codeMap)
    }

    return codeMap
  },
  getAllData: async (params: any) => {
    const url = 'http://www.cninfo.com.cn/new/hisAnnouncement/query'
    const res = await service.post(url, qs.stringify(params), {
      headers: { 'Content-type': 'application/x-www-form-urlencoded', Referer: 'http://www.cninfo.com.cn' },
    })
    return res.data
  },
}
