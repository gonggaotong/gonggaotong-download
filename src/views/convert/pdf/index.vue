<template>
  <div class="pdf-converter-page">
    <div class="page-header">
      <h1 class="page-title">PDF转换工具</h1>
      <p class="page-subtitle">批量将PDF文件转换为文本格式</p>
    </div>

    <!-- 配置区域 -->
    <div class="config-section">
      <div class="config-cards">
        <!-- 源文件夹选择 -->
        <div class="config-card">
          <div class="card-header">
            <div class="step-indicator">
              <span class="step-number">1</span>
            </div>
            <div class="card-title">
              <h3>选择PDF文件夹</h3>
              <p>选择包含PDF文件的源文件夹</p>
            </div>
          </div>
          <div class="card-body">
            <div class="path-selector">
              <div class="path-info">
                <div class="path-label">当前路径：</div>
                <div class="path-value" v-if="dirPath" :title="dirPath">{{ dirPath }}</div>
                <div class="path-placeholder" v-else>未选择文件夹</div>
              </div>
              <button class="btn btn-secondary" @click="openDir">
                <span class="btn-icon">📁</span>
                <span>选择文件夹</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 目标文件夹选择 -->
        <div class="config-card">
          <div class="card-header">
            <div class="step-indicator">
              <span class="step-number">2</span>
            </div>
            <div class="card-title">
              <h3>选择输出文件夹</h3>
              <p>选择转换后文件的保存位置</p>
            </div>
          </div>
          <div class="card-body">
            <div class="path-selector">
              <div class="path-info">
                <div class="path-label">当前路径：</div>
                <div class="path-value" v-if="destDirPath" :title="destDirPath">{{ destDirPath }}</div>
                <div class="path-placeholder" v-else>未选择文件夹</div>
              </div>
              <button class="btn btn-secondary" @click="openDestDir">
                <span class="btn-icon">📁</span>
                <span>选择文件夹</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件列表区域 -->
    <div class="files-section">
      <div class="files-card">
        <div class="files-header">
          <div class="files-title">
            <h2>PDF文件列表</h2>
            <div class="files-count" v-if="tableData.length > 0">
              <span class="count-icon">📄</span>
              <span class="count-text">共 {{ tableData.length }} 个文件</span>
            </div>
          </div>
          <div class="files-actions">
            <button 
              class="btn btn-primary"
              @click="onClickConvert"
              :disabled="converting || tableData.length === 0"
            >
              <span class="btn-icon" v-if="converting">⏳</span>
              <span class="btn-icon" v-else>🚀</span>
              <span>{{ converting ? '转换中...' : '开始转换' }}</span>
            </button>
          </div>
        </div>

        <div class="files-content">
          <div v-if="tableData.length === 0 && !loading" class="empty-state">
            <div class="empty-icon">📂</div>
            <div class="empty-text">
              <h3>暂无PDF文件</h3>
              <p>请先选择包含PDF文件的文件夹</p>
            </div>
          </div>

          <el-table 
            v-else
            ref="multipleTableRef" 
            :data="tableData" 
            v-loading="loading"
            class="modern-files-table"
            :border="false"
            stripe
            empty-text="该文件夹中没有PDF文件"
          >
            <el-table-column label="序号" width="80" align="center">
              <template #default="scope">
                <div class="file-index">{{ scope.row.id }}</div>
              </template>
            </el-table-column>
            
            <el-table-column label="文件信息" min-width="400">
              <template #default="scope">
                <div class="file-item">
                  <div class="file-icon">📄</div>
                  <div class="file-details">
                    <div class="file-name">{{ getFileName(scope.row.filePath) }}</div>
                    <div class="file-path">{{ scope.row.filePath }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="转换状态" width="120" align="center">
              <template #default="scope">
                <div class="status-cell">
                  <div class="status-badge ready">
                    <span class="status-icon">⏳</span>
                    <span class="status-text">待转换</span>
                  </div>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import _ from 'lodash'
import { ElMessage } from 'element-plus'

const dirPath = ref('')
const destDirPath = ref('')
const loading = ref(false)
const tableData = ref<any[]>([])
const converting = ref(false)

const openDestDir = () => {
  const dialogConfig = {
    title: '请选择目标文件夹',
    // buttonLabel: 'This one will do',
    properties: ['openDirectory', 'createDirectory'],
  }
  window.openDialog('showOpenDialog', dialogConfig).then(async (result: any) => {
    if (!result.canceled) {
      destDirPath.value = result.filePaths[0]
    }
  })
}

const openDir = () => {
  const dialogConfig = {
    title: '请选择PDF所在文件夹',
    // buttonLabel: 'This one will do',
    properties: ['openDirectory', 'createDirectory'],
  }
  window.openDialog('showOpenDialog', dialogConfig).then(async (result: any) => {
    if (!result.canceled) {
      dirPath.value = result.filePaths[0]
      if (destDirPath.value === '') {
        destDirPath.value = dirPath.value
      }
      listFiles()
    }
  })
}

const listFiles = () => {
  loading.value = true
  window
    .listFiles(dirPath.value)
    .then((res: string[]) => {
      console.log(res)
      let id = 0
      _.forEach(res, (filePath: string) => {
        const fileExtension = _.trim(_.toLower(filePath.split('.').pop()))
        if (fileExtension !== 'pdf') {
          return
        }

        const filename = _.trim(_.toLower(filePath.split('/').pop()))

        id++

        tableData.value.push({
          filename,
          filePath,
          id,
        })
      })
    })
    .catch((error: any) => {
      ElMessage.error('目标文件夹文件过多，请缩小结果集继续使用')
    })
    .finally(() => {
      loading.value = false
    })
}

const getFileName = (fullPath: string) => {
  if (!fullPath) return ''
  const parts = fullPath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || ''
}

const onClickConvert = async () => {
  if (loading.value || converting.value) {
    return
  }

  if (tableData.value.length === 0) {
    ElMessage.warning('请先选择包含PDF文件的文件夹')
    return
  }

  if (!destDirPath.value) {
    ElMessage.warning('请选择输出文件夹')
    return
  }

  converting.value = true

  try {
    const tasks: any[] = []
    for (const item of tableData.value) {
      let targetPath = item.filePath.replace(dirPath.value, destDirPath.value)
      // 将targetPath中出现的PDF或者pdf替换为txt
      targetPath = targetPath.replace(/pdf/g, 'txt')
      targetPath = targetPath.replace(/PDF/g, 'txt')

      const data = {
        status: 'queued',
        sourcePath: item.filePath,
        targetPath,
        error: '',
      }

      tasks.push(data)
    }
    await window.convertDB.insert(tasks)
    window.convert('resumeAll')
    ElMessage.success(`${tableData.value.length} 个转换任务已添加，请前往"转换任务"查看进度`)
  } catch (error) {
    ElMessage.error(`任务添加失败：${JSON.stringify(error)}`)
  } finally {
    converting.value = false
  }
}
</script>
<style lang="less" scoped>
.pdf-converter-page {
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
      content: '📄';
      font-size: var(--font-size-2xl);
    }
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.config-section {
  margin-bottom: var(--space-8);
}

.config-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

.config-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  padding: var(--space-6);
  transition: all var(--transition-base);
  
  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border-medium);
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    margin-bottom: var(--space-5);

    .step-indicator {
      background: var(--color-primary);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm);
    }

    .card-title {
      flex: 1;

      h3 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-1) 0;
      }

      p {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        margin: 0;
        line-height: var(--line-height-relaxed);
      }
    }
  }

  .card-body {
    .path-selector {
      .path-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
        padding: var(--space-3) var(--space-4);
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-base);
        border: 1px solid var(--color-border-light);

        .path-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
          white-space: nowrap;
        }

        .path-value {
          font-family: var(--font-family-mono);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .path-placeholder {
          font-size: var(--font-size-sm);
          color: var(--color-text-quaternary);
          font-style: italic;
        }
      }
    }
  }
}

.files-section {
  margin-bottom: var(--space-8);
}

.files-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  overflow: hidden;

  .files-header {
    background: var(--color-bg-tertiary);
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--color-border-light);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .files-title {
      display: flex;
      align-items: center;
      gap: var(--space-4);

      h2 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0;
      }

      .files-count {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--color-primary-light);
        color: var(--color-primary);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        border: 1px solid rgba(0, 122, 255, 0.2);

        .count-icon {
          font-size: var(--font-size-sm);
        }
      }
    }

    .files-actions {
      display: flex;
      gap: var(--space-3);
    }
  }

  .files-content {
    min-height: 300px;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12) var(--space-6);
      text-align: center;

      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }

      .empty-text {
        h3 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-2) 0;
        }

        p {
          font-size: var(--font-size-base);
          color: var(--color-text-quaternary);
          margin: 0;
        }
      }
    }
  }
}

/* 文件表格项样式 */
.file-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  .file-icon {
    font-size: var(--font-size-lg);
    flex-shrink: 0;
  }

  .file-details {
    flex: 1;
    overflow: hidden;

    .file-name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      margin-bottom: var(--space-1);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-path {
      font-size: var(--font-size-xs);
      color: var(--color-text-quaternary);
      font-family: var(--font-family-mono);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.file-index {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
}

.status-cell {
  display: flex;
  justify-content: center;

  .status-badge {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;

    &.ready {
      background: var(--color-gray-100);
      color: var(--color-text-tertiary);
      border: 1px solid var(--color-border-medium);
    }

    .status-icon {
      font-size: var(--font-size-sm);
    }
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.modern-files-table) {
  .el-table__header {
    th {
      background: var(--color-bg-secondary);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-semibold);
      border-bottom: 2px solid var(--color-border-light);
      font-size: var(--font-size-sm);
    }
  }

  .el-table__body {
    tr {
      &:hover {
        background: var(--color-bg-tertiary);
      }

      td {
        border-bottom: 1px solid var(--color-border-light);
        padding: var(--space-4);
      }
    }

    .el-table__row--striped {
      background: rgba(0, 122, 255, 0.02);
    }
  }

  .el-table__empty-text {
    color: var(--color-text-quaternary);
    font-size: var(--font-size-sm);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .config-cards {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
}

@media (max-width: 768px) {
  .page-header .page-title {
    font-size: var(--font-size-2xl);
  }

  .config-card {
    padding: var(--space-4);

    .card-header {
      flex-direction: column;
      text-align: center;
      gap: var(--space-3);

      .step-indicator {
        align-self: center;
      }
    }
  }

  .files-card {
    .files-header {
      padding: var(--space-4);
      flex-direction: column;
      gap: var(--space-3);
      align-items: stretch;

      .files-title {
        justify-content: center;
      }
    }
  }

  .file-item {
    .file-details {
      .file-name {
        font-size: var(--font-size-xs);
      }
    }
  }
}
</style>
