import axios from 'axios'

function isCnInfo(url: string) {
  return url.includes('cninfo.com.cn')
}

function isPdfContent(contentType: string | undefined, data: any): boolean {
  if (!contentType) return false
  if (contentType.includes('application/pdf')) return true
  if (typeof data === 'string' && data.startsWith('%PDF')) return true
  if (Buffer.isBuffer(data) && data.slice(0, 4).toString() === '%PDF') return true
  return false
}

const createInstance = () => {
  const instance = axios.create({
    timeout: 30000,
    withCredentials: true,
    adapter: 'http',
  })

  // 使用请求拦截器动态设置 headers
  instance.interceptors.request.use(config => {
    const url = config.url || ''
    if (isCnInfo(url)) {
      config.headers = {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'http://www.cninfo.com.cn/',
        'Accept': 'application/pdf',
      }
    } else {
      config.headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/112.0 Safari/537.36',
        'accept-language': 'zh-CN,zh;q=0.9',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8',
      }
    }
    return config
  })

  return instance
}

function createClient() {
  return {
    instance: createInstance(),
    errorMiddleware: null,
    retryUrl: null,
    promiseCache: {},

    get(url: string, options = {}): Promise<any> {
      return this.request('get', url, null, options)
    },
    post(url: string, data = {}, options = {}): Promise<any> {
      return this.request('post', url, data, options)
    },

    request(method: string, url: string, data: any, options = {}): Promise<any> {
      const params: any = { method, url, data, ...options }
      return this.instance.request(params).then(res => {
        const contentType = res.headers?.['content-type']
        const data = res.data
        if (!isPdfContent(contentType, data)) {
          console.warn(`⚠️ 非 PDF 内容，已跳过下载：${url}`)
          throw new Error('Invalid PDF content received.')
        }
        return res
      })
    },
  }
}

export const http = createClient()
