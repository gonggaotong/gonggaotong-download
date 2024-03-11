import { createI18n } from 'vue-i18n'

const messages: any = {}

import en from './en/'
import cn from './cn/'

// 注册i8n实例并引入语言文件
const i18n = createI18n({
  legacy: false,
  locale: 'cn',
  messages: {
    en,
    cn,
  },
})

export default i18n
