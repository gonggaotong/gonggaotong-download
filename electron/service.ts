import axios from 'axios'

const createInstance = () => {
  const instance = axios.create({
    timeout: 30000,
    withCredentials: true,
    adapter: 'http',
    headers: {
      server: null,
      'mime-version': null,
      authority: 'www.sec.gov',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    },
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
    put(url: string, data?: any, options = {}): Promise<any> {
      return this.request('put', url, data, options)
    },
    post(url: string, data = {}, options = {}): Promise<any> {
      return this.request('post', url, data, options)
    },
    patch(url: string, data: any, options = {}): Promise<any> {
      return this.request('patch', url, data, options)
    },
    delete(url: string, data: any = {}, options = {}): Promise<any> {
      return this.request('delete', url, data, options)
    },
    request(method: string, url: string, data: any, options = {}): Promise<any> {
      const params: any = { method, url, data, ...options }
      return this.instance.request(params)
    },
    // 设置参数
    setBaseUrl(baseURL: string): void {
      this.instance.defaults.baseURL = baseURL
    },
    setToken(token: string | null): void {
      this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },
    delToken(): void {
      this.instance.defaults.headers.common['Authorization'] = ''
    },
    setI18n(lang?: string): void {
      if (lang) {
        this.instance.defaults.headers.common['X-I18n-Language'] = lang
      } else {
        this.instance.defaults.headers.common['X-I18n-Language'] =
          localStorage.getItem('i18nLanguage') === 'en' ? 'en-US' : 'zh-CN'
      }
    },
  }
}

const service = createClient()

export default service
