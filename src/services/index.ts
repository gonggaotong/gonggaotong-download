import axios from 'axios'

const createInstance = () => {
  const instance = axios.create({
    timeout: 30000,
    withCredentials: true,
    adapter: 'xhr',
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
