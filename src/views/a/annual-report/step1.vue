<template>
  <div class="a-stock-config">
    <div class="page-header">
      <h1 class="page-title">A股公告下载配置</h1>
      <p class="page-subtitle">配置下载参数，开始批量下载A股公告文件</p>
    </div>

    <div class="config-sections">
      <!-- 下载路径配置 -->
      <section class="config-card">
        <div class="card-header">
          <div class="step-badge">1</div>
          <h2 class="card-title">设置下载路径</h2>
        </div>
        <div class="card-body">
          <div class="path-config">
            <div class="path-display">
              <div class="path-info">
                <span class="path-label">当前路径：</span>
                <a href="#" class="path-link" @click.prevent="openLocalPath(savePath)" v-if="savePath">
                  {{ savePath }}
                </a>
                <span class="path-placeholder" v-else>未选择存储位置</span>
              </div>
              <button class="btn btn-secondary" @click="openSavePathDialog()">
                <span class="btn-icon">📁</span>
                <span>{{ savePath ? '更换位置' : '选择位置' }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 筛选条件配置 -->
      <section class="config-card">
        <div class="card-header">
          <div class="step-badge">2</div>
          <h2 class="card-title">筛选条件</h2>
        </div>
        <div class="card-body">
          <div class="filter-grid">
            <div class="filter-item">
              <label class="filter-label">时间范围</label>
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
                class="modern-date-picker"
              />
            </div>

            <div class="filter-item">
              <label class="filter-label">标题关键词</label>
              <el-input 
                v-model="keywords" 
                placeholder="输入关键词进行筛选"
                class="modern-input"
                clearable
              />
            </div>

            <div class="filter-item">
              <label class="filter-label">交易板块</label>
              <el-select 
                v-model="plate" 
                multiple 
                placeholder="选择交易板块" 
                class="modern-select"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option v-for="item in plateOptions" :key="item.key" :label="item.value" :value="item.key" />
              </el-select>
            </div>

            <div class="filter-item">
              <label class="filter-label">公告分类</label>
              <el-select 
                v-model="category" 
                multiple 
                placeholder="选择公告分类" 
                class="modern-select"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option v-for="item in categoryOptions" :key="item.key" :label="item.value" :value="item.key" />
              </el-select>
            </div>

            <div class="filter-item">
              <label class="filter-label">所属行业</label>
              <el-select 
                v-model="industry" 
                multiple 
                placeholder="选择所属行业" 
                class="modern-select"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option v-for="item in industryOptions" :key="item.key" :label="item.value" :value="item.key" />
              </el-select>
            </div>

            <div class="filter-item full-width">
              <label class="filter-label">
                <span>公司筛选</span>
                <span class="label-hint">（可选，留空下载所有公司）</span>
              </label>
              <el-input
                v-model="codes"
                type="textarea"
                :rows="4"
                placeholder="请输入公司代码，每行一个&#10;例如：&#10;000001&#10;000002&#10;600000"
                class="modern-textarea"
                resize="vertical"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 操作按钮 -->
    <div class="action-footer">
      <button 
        class="btn btn-primary btn-lg"
        @click="onClickNext" 
        :disabled="submitting"
      >
        <span class="btn-icon" v-if="submitting">⏳</span>
        <span class="btn-icon" v-else>🚀</span>
        <span>{{ submitting ? '处理中...' : '下一步' }}</span>
      </button>
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
          if (code && orgId) {
            stocks.push(`${code},${orgId}`)
          }
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
<style lang="less" scoped>
.a-stock-config {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-10);

  .page-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    
    &::before {
      content: '🇨🇳';
      font-size: var(--font-size-2xl);
    }
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.config-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-bottom: var(--space-10);
}

.config-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  transition: box-shadow var(--transition-base);

  &:hover {
    box-shadow: var(--shadow-base);
  }

  .card-header {
    background: linear-gradient(135deg, var(--color-primary-light), var(--color-bg-tertiary));
    padding: var(--space-6);
    display: flex;
    align-items: center;
    gap: var(--space-4);
    border-bottom: 1px solid var(--color-border-light);

    .step-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: var(--color-primary);
      color: var(--color-text-white);
      border-radius: var(--radius-full);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      box-shadow: var(--shadow-sm);
    }

    .card-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }
  }

  .card-body {
    padding: var(--space-8);
  }
}

.path-config {
  .path-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border-light);
  }

  .path-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .path-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-tertiary);
      font-weight: var(--font-weight-medium);
    }

    .path-link {
      font-size: var(--font-size-sm);
      color: var(--color-primary);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      
      &:hover {
        text-decoration: underline;
      }
    }

    .path-placeholder {
      font-size: var(--font-size-sm);
      color: var(--color-text-quaternary);
      font-style: italic;
    }
  }
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &.full-width {
    grid-column: 1 / -1;
  }

  .filter-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: var(--space-1);

    .label-hint {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-regular);
      color: var(--color-text-quaternary);
    }
  }
}

.action-footer {
  display: flex;
  justify-content: center;
  padding: var(--space-8) 0;
  border-top: 1px solid var(--color-border-light);
  margin-top: var(--space-8);
}

/* Element Plus 组件样式覆盖 */
:deep(.modern-date-picker) {
  .el-input__wrapper {
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-xs);
    border: 1px solid var(--color-border-medium);
    transition: all var(--transition-fast);
    
    &:hover {
      border-color: var(--color-border-dark);
    }
    
    &.is-focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }
  }
}

:deep(.modern-input) {
  .el-input__wrapper {
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-xs);
    border: 1px solid var(--color-border-medium);
    transition: all var(--transition-fast);
    
    &:hover {
      border-color: var(--color-border-dark);
    }
    
    &.is-focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }
  }
}

:deep(.modern-select) {
  .el-select__wrapper {
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-xs);
    border: 1px solid var(--color-border-medium);
    transition: all var(--transition-fast);
    
    &:hover {
      border-color: var(--color-border-dark);
    }
    
    &.is-focused {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }
  }
  
  .el-select__tags {
    .el-tag {
      background: var(--color-primary-light);
      color: var(--color-primary);
      border: none;
      border-radius: var(--radius-sm);
    }
  }
}

:deep(.modern-textarea) {
  .el-textarea__inner {
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-xs);
    border: 1px solid var(--color-border-medium);
    transition: all var(--transition-fast);
    font-family: var(--font-family-mono);
    
    &:hover {
      border-color: var(--color-border-dark);
    }
    
    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header .page-title {
    font-size: var(--font-size-2xl);
  }
  
  .filter-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .config-card .card-body {
    padding: var(--space-4);
  }
  
  .path-display {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
}
</style>
