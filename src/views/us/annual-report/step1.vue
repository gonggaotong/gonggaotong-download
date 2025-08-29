<template>
  <div class="us-stock-config">
    <div class="page-header">
      <h1 class="page-title">美股公告下载配置</h1>
      <p class="page-subtitle">配置下载参数，开始批量下载SEC美股公告文件</p>
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

      <!-- 同步公司数据 -->
      <section class="config-card">
        <div class="card-header">
          <div class="step-badge">2</div>
          <h2 class="card-title">同步美股公司数据</h2>
        </div>
        <div class="card-body">
          <div class="sync-section">
            <div class="sync-info">
              <div class="company-stats">
                <div class="stat-item">
                  <span class="stat-icon">🏢</span>
                  <span class="stat-label">已同步公司</span>
                  <span class="stat-value">{{ companyNums }} 家</span>
                </div>
              </div>
              <p class="sync-description">
                首次使用需要同步最新的美股公司数据，确保下载的准确性和完整性
              </p>
            </div>
            <div class="sync-actions">
              <button 
                class="btn btn-primary" 
                @click="downloadNewestCompanies" 
                :disabled="saving"
              >
                <span class="btn-icon" v-if="saving">⏳</span>
                <span class="btn-icon" v-else>🔄</span>
                <span>{{ saving ? '同步中...' : '立即同步' }}</span>
              </button>
              <button 
                class="btn btn-ghost" 
                @click="exportCompaniesToCsv()"
                :disabled="companyNums === 0"
                v-if="companyNums > 0"
              >
                <span class="btn-icon">📊</span>
                <span>导出CSV</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 基本设置 -->
      <section class="config-card">
        <div class="card-header">
          <div class="step-badge">3</div>
          <h2 class="card-title">基本设置</h2>
        </div>
        <div class="card-body">
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">文档类型</label>
              <div class="checkbox-grid">
                <el-checkbox-group v-model="typeList" class="modern-checkbox-group">
                  <el-checkbox label="10-K" class="modern-checkbox">年报 (10-K)</el-checkbox>
                  <el-checkbox label="20-F" class="modern-checkbox">外国公司年报 (20-F)</el-checkbox>
                  <el-checkbox label="10-Q" class="modern-checkbox">季报 (10-Q)</el-checkbox>
                  <el-checkbox label="S-1" class="modern-checkbox">IPO注册声明 (S-1)</el-checkbox>
                  <el-checkbox label="F-1" class="modern-checkbox">外国公司注册 (F-1)</el-checkbox>
                  <el-checkbox label="8-K" class="modern-checkbox">重大事件报告 (8-K)</el-checkbox>
                  <el-checkbox label="6-K" class="modern-checkbox">外国公司报告 (6-K)</el-checkbox>
                  <el-checkbox label="14-A" class="modern-checkbox">代理声明 (14-A)</el-checkbox>
                  <el-checkbox label="S-4" class="modern-checkbox">合并注册 (S-4)</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>

            <div class="setting-item">
              <label class="setting-label">下载格式</label>
              <el-checkbox-group v-model="formatList" class="modern-checkbox-group format-group">
                <el-checkbox label="TXT" class="modern-checkbox">纯文本 (TXT)</el-checkbox>
                <el-checkbox label="HTML" class="modern-checkbox">网页格式 (HTML)</el-checkbox>
              </el-checkbox-group>
            </div>

            <div class="setting-item">
              <label class="setting-label">发布年份范围</label>
              <div class="year-range">
                <el-select v-model="startYear" placeholder="起始年份" class="modern-select year-select">
                  <el-option v-for="item in startYears" :key="item" :label="item + '年'" :value="item" />
                </el-select>
                <span class="year-separator">至</span>
                <el-select v-model="endYear" placeholder="结束年份" class="modern-select year-select">
                  <el-option v-for="item in endYears" :key="item" :label="item + '年'" :value="item" />
                </el-select>
              </div>
            </div>

            <div class="setting-item full-width">
              <label class="setting-label">
                <span>公司筛选</span>
                <span class="label-hint">（可选，留空下载所有公司）</span>
              </label>
              <el-input
                v-model="tickers"
                type="textarea"
                :rows="4"
                placeholder="请输入公司Ticker代码，每行一个&#10;例如：&#10;AAPL&#10;MSFT&#10;GOOGL"
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
      <button class="btn btn-primary btn-lg" @click="onClickNext">
        <span class="btn-icon">🚀</span>
        <span>下一步</span>
      </button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, defineProps, PropType } from 'vue'
import electron from 'electron'
import { ElMessage } from 'element-plus'
import _ from 'lodash'
import nasdaqService from '@/services/nasdaq'
import { basicSettingType } from '@/types/us'

const props = defineProps({
  onClickNext: Function as PropType<any>,
})

const thisYear = new Date().getFullYear()

const savePath = ref('')
const saving = ref(false)

const companyNums = ref(0)
const excelPath = ref('')
const formatList = ref(['HTML'])
const typeList = ref(['10-K', '20-F'])
const startYear = ref(1994)
const endYear = ref(thisYear)
const tickers = ref('')

const startYears = _.range(1994, thisYear + 1)
const endYears = _.range(thisYear, 1989)

onMounted(() => {
  window.cacheDB.getUSDownloadDirectory().then((path: string) => {
    savePath.value = path
  })
  window.usReportDB.getAll().then((data: any) => {
    companyNums.value = data.length
  })
})

const openLocalPath = (path: string) => {
  if (!path) {
    return
  }
  electron.shell.openPath(path)
}

const showItemInFolder = (path: string) => {
  if (!path) {
    return
  }
  electron.shell.showItemInFolder(path)
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
      window.cacheDB.setUSDownloadDirectory(result.filePaths[0])
    }
  })
}

const downloadNewestCompanies = () => {
  if (savePath.value === '') {
    ElMessage.error('存储位置不能为空')
    return
  }
  saving.value = true
  nasdaqService
    .getAllCompany()
    .then(result => {
      companyNums.value = result.length
      window.usReportDB.insert(result)
    })
    .catch(err => {
      console.log(err)
      ElMessage.error(`网络错误: ${err.message}`)
    })
    .finally(() => {
      saving.value = false
    })
}

const exportCompaniesToCsv = () => {
  if (companyNums.value === 0) {
    ElMessage.error('请先同步最新美股公司')
    return
  }
  excelPath.value = `${savePath.value}/companies-nasdaq.csv`
  window.usReportDB.getAll().then((data: any) => {
    window.exportCSV(excelPath.value, data).then(() => {
      showItemInFolder(excelPath.value)
    })
  })
}

const onClickNext = () => {
  // 验证
  if (savePath.value === '') {
    ElMessage.error('存储位置不能为空')
    return
  }

  if (companyNums.value === 0) {
    ElMessage.error('请先同步最新美股公司')
    return
  }

  if (companyNums.value === 0) {
    ElMessage.error('请先同步最新美股公司')
    return
  }

  if (formatList.value.length === 0) {
    ElMessage.error('下载格式必填')
    return
  }

  let filteredTickers = []
  if (tickers.value) {
    tickers.value = _.trim(tickers.value)
    tickers.value = _.replace(tickers.value, /\\r/g, '')
    filteredTickers = _.filter(_.split(tickers.value, '\n'), (single: string) => !!single)
  }

  const data: basicSettingType = {
    tickers: filteredTickers,
    format: formatList.value,
    types: typeList.value,
    startYear: startYear.value,
    endYear: endYear.value,
    savePath: savePath.value,
  }
  console.log(data)
  props.onClickNext(data)
}
</script>
<style lang="less" scoped>
.us-stock-config {
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
      content: '🇺🇸';
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

.sync-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-6);

  .sync-info {
    flex: 1;

    .company-stats {
      margin-bottom: var(--space-4);

      .stat-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background: var(--color-success-light);
        border-radius: var(--radius-base);
        border: 1px solid rgba(52, 199, 89, 0.2);

        .stat-icon {
          font-size: var(--font-size-lg);
        }

        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-tertiary);
          font-weight: var(--font-weight-medium);
        }

        .stat-value {
          font-size: var(--font-size-base);
          color: var(--color-success);
          font-weight: var(--font-weight-bold);
          margin-left: auto;
        }
      }
    }

    .sync-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
      margin: 0;
    }
  }

  .sync-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-8);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &.full-width {
    grid-column: 1 / -1;
  }

  .setting-label {
    font-size: var(--font-size-base);
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

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-2);
}

.format-group {
  display: flex;
  gap: var(--space-4);
}

.year-range {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  .year-select {
    flex: 1;
    max-width: 140px;
  }

  .year-separator {
    font-size: var(--font-size-base);
    color: var(--color-text-tertiary);
    font-weight: var(--font-weight-medium);
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
:deep(.modern-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  .el-checkbox {
    margin-right: 0;
    
    .el-checkbox__input {
      .el-checkbox__inner {
        border-radius: var(--radius-sm);
        border-color: var(--color-border-medium);
        transition: all var(--transition-fast);
        
        &:hover {
          border-color: var(--color-primary);
        }
      }
      
      &.is-checked {
        .el-checkbox__inner {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
        }
      }
    }
    
    .el-checkbox__label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
      padding-left: var(--space-2);
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
  
  .settings-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .config-card .card-body {
    padding: var(--space-4);
  }
  
  .sync-section {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-6);
    
    .sync-actions {
      flex-direction: row;
      justify-content: center;
    }
  }
  
  .checkbox-grid {
    grid-template-columns: 1fr;
  }
  
  .format-group {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .year-range {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
    
    .year-select {
      max-width: none;
    }
  }
}
</style>
