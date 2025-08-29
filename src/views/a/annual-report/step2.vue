<template>
  <div class="a-stock-results">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">A股公告列表</h1>
      <p class="page-subtitle">筛选结果预览，确认后可开始批量下载</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <div class="action-card">
        <div class="action-header">
          <button class="btn btn-ghost" @click="onClickPrev">
            <span class="btn-icon">←</span>
            <span>返回上一步</span>
          </button>
          <div class="results-info">
            <div class="stat-badge">
              <span class="stat-icon">📊</span>
              <span class="stat-text">筛选结果：{{ total }} 个</span>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-item">
            <label class="filter-label">
              <span class="label-text">屏蔽关键词</span>
              <span class="label-hint">（可选，多个关键词用空格分隔）</span>
            </label>
            <div class="filter-input-group">
              <el-input
                v-model="keywords"
                placeholder="例如：已取消 英文版 补充更正"
                class="modern-input filter-input"
                clearable
              />
              <button 
                class="btn btn-primary download-btn" 
                @click="onClickDownload" 
                :disabled="downloding || total === 0"
              >
                <span class="btn-icon" v-if="downloding">⏳</span>
                <span class="btn-icon" v-else>📥</span>
                <span>{{ downloding ? '准备下载...' : '立即下载' }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-item warning">
            <span class="info-icon">⚠️</span>
            <span class="info-text">
              注意：批量下载一次最多下载前3000个文件。如需下载更多，请调整筛选条件，将结果控制在3000个以内。
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <div class="table-card">
        <div class="table-header">
          <h2 class="table-title">公告列表</h2>
        </div>
        <div class="table-content">
          <el-table 
            ref="multipleTableRef" 
            :data="tableData" 
            v-loading="loading" 
            class="modern-table"
            :border="false"
            stripe
          >
            <el-table-column label="公司代码" property="secCode" width="120" align="center">
              <template #default="scope">
                <div class="code-cell">{{ scope.row.secCode }}</div>
              </template>
            </el-table-column>
            
            <el-table-column label="公司名称" property="secName" width="200">
              <template #default="scope">
                <div class="company-cell">{{ scope.row.secName }}</div>
              </template>
            </el-table-column>
            
            <el-table-column label="公告标题" property="announcementTitle" min-width="300">
              <template #default="scope">
                <div class="title-cell">
                  <a 
                    href="#" 
                    class="title-link" 
                    @click.prevent="onClickItem(scope.row)"
                    :title="scope.row.announcementTitle"
                  >
                    {{ scope.row.announcementTitle }}
                  </a>
                  <span class="file-ext">.PDF</span>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="发布时间" width="120" align="center">
              <template #default="scope">
                <div class="date-cell">
                  <span class="date-text">{{ getFormatDate(scope.row.announcementTime) }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页器 -->
        <div class="pagination-section">
          <el-pagination
            background
            :total="total"
            v-model:current-page="page"
            v-model:page-size="limit"
            :page-sizes="[30]"
            layout="total, prev, pager, next, jumper"
            @current-change="handleCurrentChange"
            class="modern-pagination"
          />
        </div>
      </div>
    </div>

    <!-- 下载进度对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      title="批量下载进度" 
      width="500px" 
      :show-close="false"
      class="modern-dialog"
    >
      <div class="progress-content">
        <div class="progress-info">
          <div class="progress-text">正在获取完整列表，请耐心等待...</div>
          <div class="progress-warning">关闭对话框会中断列表获取过程</div>
        </div>
        
        <div class="progress-display">
          <el-progress 
            :percentage="percent" 
            :stroke-width="12"
            :show-text="false"
          />
          <div class="progress-stats">
            <div class="progress-icon">
              <el-icon class="rotating"><Loading /></el-icon>
            </div>
            <div class="progress-detail">{{ percentText }}</div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-actions">
          <button class="btn btn-ghost" @click="onClickCloseDialog">
            <span class="btn-icon">✖️</span>
            <span>中断获取</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { ref, defineProps, PropType, onMounted, toRaw, computed } from 'vue'
import electron from 'electron'
import dayjs from 'dayjs'
import juchaoService from '@/services/juchao'
import _ from 'lodash'
import { ElMessage, ElMessageBox } from 'element-plus'
import striptags from 'striptags'
import { generateTask } from '@/utils/index'

const props = defineProps({
  basicSetting: Object as PropType<any>,
  onClickPrev: Function as PropType<any>,
})
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref<number>(0)
const page = ref<number>(1)
const limit = ref(30)
const downloding = ref(false)
const dialogVisible = ref(false)
const keywords = ref('')

const totalPage = computed(() => {
  return _.ceil(total.value / 30)
})

const percent = computed(() => {
  const res = _.ceil((_.toNumber(page.value) / _.toNumber(totalPage.value)) * 100)
  return res > 100 ? 100 : res
})

const percentText = computed(() => {
  return `(${page.value}/${totalPage.value})`
})

const onClickCloseDialog = () => {
  ElMessageBox.confirm('关闭对话框会导致列表获取中断，是否继续', '注意', {
    confirmButtonText: '是',
    cancelButtonText: '否',
    type: 'warning',
  })
    .then(() => {
      dialogVisible.value = false
    })
    .catch(() => {
      console.log('否')
    })
}

onMounted(() => {
  getAllData()
})

const getAllData = async () => {
  loading.value = true
  try {
    const params = props.basicSetting.params
    const submitParams = { ...params, pageNum: page.value, pageSize: limit.value }
    const result = await juchaoService.getAllData(submitParams)
    if (!total.value) {
      total.value = result.totalRecordNum
    }
    tableData.value = formatTitle(result.announcements)

    return tableData.value
  } catch (error) {
    ElMessage.error('网络错误 请返回上一步之后重试')
  } finally {
    loading.value = false
  }
}

const getFormatDate = (time: number) => {
  return dayjs(time).format('YYYY-MM-DD')
}

const sanitizeFilename = (filename: string) => {
  return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/[\x00-\x1f\x80-\x9f]/g, '_').trim()
}

const formatTitle = (items: any[]) => {
  return _.map(items, (item: any) => {
    return {
      ...item,
      announcementTitle: striptags(item.announcementTitle),
    }
  })
}

const onClickItem = (item: any) => {
  const url = `http://static.cninfo.com.cn/${item.adjunctUrl}`
  electron.shell.openExternal(url)
}

const handleCurrentChange = () => {
  getAllData()
}

const inFilterKeywords = (filename: string) => {
  if (!keywords.value || !_.trim(keywords.value)) {
    return false
  }
  let ret = false
  _.forEach(_.split(_.trim(keywords.value, ' ')), (keyword: string) => {
    if (filename.indexOf(keyword) >= 0) {
      ret = true
      return false
    }
  })

  return ret
}

const onClickDownload = async () => {
  if (total.value === 0) {
    return
  }

  // await window.downloadDB.deleteAll()

  const dbCount = await window.downloadDB.countAll()
  if (dbCount >= 100000) {
    ElMessage.error('下载任务已达到10万个，请先前往“下载任务”清理下载任务')
    return
  }

  downloding.value = true
  const existTasks = await window.downloadDB.getAll(['url'], {}, 0, 100000)
  const existTaskHashes = _.map(existTasks, (item: any) => item.url)

  let count = 0
  let totalNum = 0
  const tasks: any[] = []
  dialogVisible.value = true
  console.log(_.range(1, totalPage.value + 1))
  for (const p of _.range(1, totalPage.value + 1)) {
    console.log('page', p)
    page.value = p
    const announcements = await getAllData()
    _.forEach(announcements, (item: any) => {
      if (inFilterKeywords(item.announcementTitle)) {
        return
      }

      totalNum++

      const url = `http://static.cninfo.com.cn/${item.adjunctUrl}`
      const filename = sanitizeFilename(`${item.secCode}${item.secName}_${item.announcementTitle}_${getFormatDate(
        item.announcementTime,
      )}.PDF`)
      if (existTaskHashes.includes(url)) {
        count++
        return
      }
      existTaskHashes.push(url)
      // unix毫秒级时间戳
      tasks.push(
        generateTask({
          url,
          directory: props.basicSetting?.path || '',
          filename,
        }),
      )
    })

    if (p >= totalPage.value) {
      ElMessage.success('列表获取成功，正在下载中，具体可以在下载任务中查看')
      dialogVisible.value = false
    }
  }

  window.downloadDB.insert(tasks)
  window.download('loadTasks')

  const downloadNum = totalNum - count
  ElMessage.success(`共有${totalNum}个任务，已存在${count}个，本次新增${downloadNum}个`)
  downloding.value = false
}
</script>
<style lang="less" scoped>
.a-stock-results {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-8);

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

.action-section {
  margin-bottom: var(--space-8);
}

.action-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  padding: var(--space-6);
  
  .action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
  }

  .results-info {
    .stat-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--color-success-light);
      color: #34c759;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      border: 1px solid rgba(52, 199, 89, 0.25);

      .stat-icon {
        font-size: var(--font-size-base);
      }
    }
  }
}

.filter-section {
  margin-bottom: var(--space-6);

  .filter-item {
    .filter-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-3);

      .label-text {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
      }

      .label-hint {
        font-size: var(--font-size-xs);
        color: var(--color-text-quaternary);
      }
    }

    .filter-input-group {
      display: flex;
      gap: var(--space-4);
      align-items: flex-end;

      .filter-input {
        flex: 1;
        max-width: 400px;
      }

      .download-btn {
        white-space: nowrap;
      }
    }
  }
}

.info-section {
  .info-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-base);

    &.warning {
      background: var(--color-warning-light);
      border: 1px solid rgba(255, 149, 0, 0.2);
    }

    .info-icon {
      font-size: var(--font-size-base);
      margin-top: 2px;
    }

    .info-text {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
    }
  }
}

.table-section {
  margin-bottom: var(--space-8);
}

.table-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  overflow: hidden;

  .table-header {
    background: var(--color-bg-tertiary);
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--color-border-light);

    .table-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }
  }

  .table-content {
    overflow-x: auto;
  }

  .pagination-section {
    padding: var(--space-4) var(--space-6);
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border-light);
    display: flex;
    justify-content: center;
  }
}

/* 表格单元格样式 */
.code-cell {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  display: inline-block;
}

.company-cell {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.title-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  .title-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-primary-hover);
      text-decoration: underline;
    }
  }

  .file-ext {
    font-size: var(--font-size-xs);
    color: var(--color-text-quaternary);
    background: var(--color-bg-tertiary);
    padding: 1px var(--space-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
  }
}

.date-cell {
  .date-text {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    font-family: var(--font-family-mono);
  }
}

/* Element Plus 组件样式覆盖 */
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

:deep(.modern-table) {
  .el-table__header {
    th {
      background: var(--color-bg-secondary);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-semibold);
      border-bottom: 2px solid var(--color-border-light);
    }
  }

  .el-table__body {
    tr {
      &:hover {
        background: var(--color-bg-tertiary);
      }

      td {
        border-bottom: 1px solid var(--color-border-light);
        padding: var(--space-3) var(--space-4);
      }
    }

    .el-table__row--striped {
      background: rgba(0, 122, 255, 0.02);
    }
  }
}

:deep(.modern-pagination) {
  .el-pagination__total,
  .el-pagination__jump {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .el-pager .el-pager__item {
    border-radius: var(--radius-sm);
    margin: 0 2px;
    transition: all var(--transition-fast);

    &:hover {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }

    &.is-active {
      background: var(--color-primary);
      color: white;
    }
  }

  .btn-prev,
  .btn-next {
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }
  }
}

/* 进度对话框样式 */
.progress-content {
  .progress-info {
    text-align: center;
    margin-bottom: var(--space-6);

    .progress-text {
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      margin-bottom: var(--space-2);
      font-weight: var(--font-weight-medium);
    }

    .progress-warning {
      font-size: var(--font-size-sm);
      color: var(--color-warning);
    }
  }

  .progress-display {
    margin-bottom: var(--space-4);

    .progress-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      margin-top: var(--space-4);

      .progress-icon {
        .rotating {
          animation: rotate 2s linear infinite;
        }
      }

      .progress-detail {
        font-size: var(--font-size-base);
        color: var(--color-text-secondary);
        font-weight: var(--font-weight-medium);
      }
    }
  }
}

.dialog-actions {
  display: flex;
  justify-content: center;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header .page-title {
    font-size: var(--font-size-2xl);
  }

  .action-card {
    padding: var(--space-4);

    .action-header {
      flex-direction: column;
      gap: var(--space-4);
      align-items: stretch;
    }

    .filter-input-group {
      flex-direction: column;
      gap: var(--space-3);

      .filter-input {
        max-width: none;
      }
    }
  }

  .table-card {
    .table-header,
    .pagination-section {
      padding: var(--space-3) var(--space-4);
    }
  }

  .title-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);

    .title-link {
      white-space: normal;
      line-height: var(--line-height-tight);
    }
  }
}
</style>
