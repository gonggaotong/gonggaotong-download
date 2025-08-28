<template>
  <div class="main-content">
    <el-form ref="form" label-width="200px" label-position="left">
      <el-form-item label="步骤一、设置下载路径：">
        <a href="###" @click="openLocalPath(savePath)">{{ savePath }}</a>
        <el-button class="save-position" size="small" type="default" @click="openSavePathDialog()">
          {{ savePath ? '更换存储位置' : '请选择存储位置' }}
        </el-button>
      </el-form-item>
      <el-form-item label="步骤二、筛选条件：">
        <el-form class="form-setting" ref="form-setting" label-width="105px" label-position="left" size="small">
          <el-form-item class="form-setting-item" label="1、起始时间：">
            <el-date-picker
              v-model="dateRage"
              type="daterange"
              unlink-panels
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :shortcuts="shortcuts"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              size="small"
            />
          </el-form-item>
          <el-form-item class="form-setting-item" label="2、标题关键词：">
            <div class="keyowrd">
              <el-input size="small" v-model="keywords" placeholder="请输入"></el-input>
            </div>
          </el-form-item>
          <el-form-item class="form-setting-item" label="3、板块：">
            <div class="plate">
              <el-select v-model="plate" multiple placeholder="请选择" size="small">
                <el-option v-for="item in plateOptions" :key="item.key" :label="item.value" :value="item.key" />
              </el-select>
            </div>
          </el-form-item>
          <el-form-item class="form-setting-item" label="4、分类：">
            <div class="category">
              <el-select v-model="category" multiple placeholder="请选择" size="small">
                <el-option v-for="item in categoryOptions" :key="item.key" :label="item.value" :value="item.key" />
              </el-select>
            </div>
          </el-form-item>
          <el-form-item class="form-setting-item" label="5、行业：">
            <div class="industry">
              <el-select v-model="industry" multiple placeholder="请选择" size="small">
                <el-option v-for="item in industryOptions" :key="item.key" :label="item.value" :value="item.key" />
              </el-select>
            </div>
          </el-form-item>
          <el-form-item class="form-setting-item" label="6、公司筛选：">
            <el-input
              rows="6"
              v-model="codes"
              placeholder="请输入公司代码,多个请一行一个,留空为全部公司"
              type="textarea"
            ></el-input>
          </el-form-item>
        </el-form>
      </el-form-item>
    </el-form>
    <div class="main-content-footer">
      <el-button type="primary" @click="onClickNext" :loading="submitting">下一步</el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, defineProps, PropType, onMounted, watch } from 'vue'
import electron from 'electron'
import { ElMessage } from 'element-plus'
import _ from 'lodash'
import dayjs from 'dayjs'
import juchaoService from '@/services/juchao'

const props = defineProps({
  onClickNext: Function as PropType<any>,
})

const submitting = ref(false)

const end = new Date()
const start = new Date()
start.setFullYear(start.getFullYear() - 1)
const dateRage = ref<[string, string]>([dayjs(start).format('YYYY-MM-DD'), dayjs(end).format('YYYY-MM-DD')])

const keywords = ref('')
const savePath = ref('')
const codes = ref('')
const shortcuts = [
  {
    text: '过去一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '过去30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '过去90天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
  {
    text: '过去1年',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setFullYear(start.getFullYear() - 1)
      // start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
  {
    text: '过去10年',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setFullYear(start.getFullYear() - 10)
      // start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

const plate = ref([])
const plateOptions = [
  { key: 'sz', value: '深市' },
  { key: 'szmb', value: '深主板' },
  // {"key": "szzx", "value": "中小板"},
  { key: 'szcy', value: '创业板' },
  { key: 'sh', value: '沪市' },
  { key: 'shmb', value: '沪主板' },
  { key: 'shkcp', value: '科创板' },
  { key: 'bj', value: '北交所' },
]

const category = ref([])
const categoryOptions = [
  { key: 'category_ndbg_szsh', value: '年报' },
  { key: 'category_bndbg_szsh', value: '半年报' },
  { key: 'category_yjdbg_szsh', value: '一季报' },
  { key: 'category_sjdbg_szsh', value: '三季报' },
  { key: 'category_yjygjxz_szsh', value: '业绩预告' },
  { key: 'category_qyfpxzcs_szsh', value: '权益分派' },
  { key: 'category_dshgg_szsh', value: '董事会' },
  { key: 'category_jshgg_szsh', value: '监事会' },
  { key: 'category_gddh_szsh', value: '股东大会' },
  { key: 'category_rcjy_szsh', value: '日常经营' },
  { key: 'category_gszl_szsh', value: '公司治理' },
  { key: 'category_zj_szsh', value: '中介报告' },
  { key: 'category_sf_szsh', value: '首发' },
  { key: 'category_zf_szsh', value: '增发' },
  { key: 'category_gqjl_szsh', value: '股权激励' },
  { key: 'category_pg_szsh', value: '配股' },
  { key: 'category_jj_szsh', value: '解禁' },
  { key: 'category_gszq_szsh', value: '公司债' },
  { key: 'category_kzzq_szsh', value: '可转债' },
  { key: 'category_qtrz_szsh', value: '其他融资' },
  { key: 'category_gqbd_szsh', value: '股权变动' },
  { key: 'category_bcgz_szsh', value: '补充更正' },
  { key: 'category_cqdq_szsh', value: '澄清致歉' },
  { key: 'category_fxts_szsh', value: '风险提示' },
  { key: 'category_tbclts_szsh', value: '特别处理和退市' },
  { key: 'category_tszlq_szsh', value: '退市整理期' },
]

const industry = ref([])
const industryOptions = [
  { key: '农、林、牧、渔业', value: '农、林、牧、渔业' },
  { key: '采矿业', value: '采矿业' },
  { key: '制造业', value: '制造业' },
  { key: '电力、热力、燃气及水生产和供应业', value: '电力、热力、燃气及水生产和供应业' },
  { key: '建筑业', value: '建筑业' },
  { key: '批发和零售业', value: '批发和零售业' },
  { key: '交通运输、仓储和邮政业', value: '交通运输、仓储和邮政业' },
  { key: '住宿和餐饮业', value: '住宿和餐饮业' },
  { key: '信息传输、软件和信息技术服务业', value: '信息传输、软件和信息技术服务业' },
  { key: '金融业', value: '金融业' },
  { key: '房地产业', value: '房地产业' },
  { key: '租赁和商务服务业', value: '租赁和商务服务业' },
  { key: '科学研究和技术服务业', value: '科学研究和技术服务业' },
  { key: '水利、环境和公共设施管理业', value: '水利、环境和公共设施管理业' },
  { key: '居民服务、修理和其他服务业', value: '居民服务、修理和其他服务业' },
  { key: '教育', value: '教育' },
  { key: '卫生和社会工作', value: '卫生和社会工作' },
  { key: '文化、体育和娱乐业', value: '文化、体育和娱乐业' },
  { key: '综合', value: '综合' },
]

onMounted(() => {
  window.cacheDB.getJuchaoDownloadDirectory().then((path: string) => {
    savePath.value = path
  })
  loadFilterFromStorage()
})

const openLocalPath = (path: string) => {
  if (!path) {
    return
  }
  electron.shell.openPath(path)
}

const openSavePathDialog = () => {
  const dialogConfig = {
    title: '请选择文件夹',
    // buttonLabel: 'This one will do',
    properties: ['openDirectory', 'createDirectory'],
  }
  window.openDialog('showOpenDialog', dialogConfig).then(async (result: any) => {
    if (!result.canceled) {
      savePath.value = result.filePaths[0]
      window.cacheDB.setJuchaoDownloadDirectory(result.filePaths[0])
    }
  })
}

const loadFilterFromStorage = () => {
  const filter = localStorage.getItem('a_filter')
  if (!filter) {
    return
  }

  const data = JSON.parse(filter)
  console.log('load-data', data)
  dateRage.value = data.dateRage
  keywords.value = data.keywords
  plate.value = data.plate
  category.value = data.category
  industry.value = data.industry
  codes.value = data.codes
}

const saveToStorage = () => {
  const data = {
    dateRage: dateRage.value,
    keywords: keywords.value,
    plate: plate.value,
    category: category.value,
    industry: industry.value,
    codes: codes.value,
  }

  localStorage.setItem('a_filter', JSON.stringify(data))
}

watch(
  () => [dateRage.value, keywords.value, plate.value, category.value, industry.value, codes.value],
  () => {
    saveToStorage()
  },
)

const onClickNext = async () => {
  submitting.value = true
  try {
    let filteredCodes = _.trim(codes.value)
    filteredCodes = _.replace(filteredCodes, /\\r/g, '')
    filteredCodes = _.split(filteredCodes, '\n')

    let stocks: string[] = []
    if (filteredCodes && filteredCodes.length > 0) {
      const allCompanies = await juchaoService.getAllCompany()
      let hasError = false
      if (allCompanies) {
        _.forEach(filteredCodes, (code: string) => {
          const orgId = allCompanies[code]?.orgId
          if (code && !orgId) {
            ElMessage.error(`公司代码${code}不存在`)
            hasError = true
            return
          }
          stocks.push(`${code},${orgId}`)
        })
      }
      if (hasError) {
        return
      }
    }
    const dateStart = dateRage.value[0]
    const dateEnd = dateRage.value[1]
    // 000001,gssz0000001;000002,gssz0000002

    const params = {
      pageNum: 1,
      pageSize: 30,
      column: 'szse',
      tabName: 'fulltext',
      plate: _.join(plate.value, ';'),
      stock: _.join(stocks, ';'),
      searchkey: keywords.value,
      secid: '',
      category: _.join(category.value, ';'),
      trade: _.join(industry.value, ';'),
      seDate: `${dateStart}~${dateEnd}`,
      sortName: '',
      sortType: '',
      isHLtitle: true,
    }
    props.onClickNext({ params, path: savePath.value })
  } finally {
    submitting.value = false
  }
}
</script>
<style lang="less">
.main-container {
  .save-position {
    margin-left: 10px;
  }
  .span {
    color: #606266;
    margin-left: 5px;
  }
  .main-title {
    text-align: center;
    margin-bottom: 20px;
  }
  .form-setting {
    padding-top: 8px;
    &-item {
      margin-bottom: 10px;
    }
    label {
      font-size: 12px;
    }
  }

  .data {
    margin-top: 20px;
    &-title {
      text-align: center;
      background: #1696e7;
      color: white;
      padding: 10px;
    }
  }
}
.main-footer {
  margin-top: 20px;
  border-top: 1px solid #ccc;
  padding-top: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  &-button {
    width: 200px;
  }
}
</style>
