<template>
  <div class="download-tasks">
    <!-- 操作控制栏 -->
    <div class="control-panel">
      <div class="panel-info">
        <div class="stats-display">
          <div class="stat-item">
            <span class="stat-icon">📊</span>
            <span class="stat-label">任务总数</span>
            <span class="stat-value">{{ total }}</span>
          </div>
        </div>
      </div>

      <div class="panel-controls">
        <el-select 
          v-model="status" 
          placeholder="筛选状态" 
          @change="onStatusChange"
          class="status-filter"
        >
          <el-option key="all" label="全部任务" value="all" />
          <el-option key="downloading" label="下载中" value="downloading" />
          <el-option key="completed" label="已完成" value="completed" />
          <el-option key="error" label="下载失败" value="error" />
        </el-select>

        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" @click="handleBegin">
            <span class="btn-icon">▶️</span>
            <span>全部开始</span>
          </button>
          <button class="btn btn-secondary btn-sm" @click="handleStop">
            <span class="btn-icon">⏸️</span>
            <span>全部暂停</span>
          </button>
          <button class="btn btn-ghost btn-sm" @click="handleDelete">
            <span class="btn-icon">🗑️</span>
            <span>全部删除</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-list">
      <el-table 
        :data="tableData" 
        v-loading="loading" 
        class="modern-tasks-table"
        :border="false"
        stripe
        empty-text="暂无下载任务"
      >
        <el-table-column label="文件名称" min-width="400">
          <template #default="scope">
            <div class="filename-cell">
              <div class="file-icon">📄</div>
              <div class="file-info">
                <div class="file-name" :title="scope.row.filename">{{ scope.row.filename }}</div>
                <div class="file-path" :title="scope.row.directory">{{ scope.row.directory }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="下载状态" width="200" align="center">
          <template #default="scope">
            <div class="status-cell">
              <!-- 错误状态 -->
              <div v-if="scope.row.status === 'error'" class="status-badge error">
                <span class="status-icon">❌</span>
                <span class="status-text">下载失败</span>
              </div>
              
              <!-- 等待状态 -->
              <div v-else-if="scope.row.status === 'queued'" class="status-badge queued">
                <span class="status-icon">⏳</span>
                <span class="status-text">等待中</span>
              </div>
              
              <!-- 暂停状态 -->
              <div v-else-if="scope.row.status === 'paused'" class="status-badge paused">
                <span class="status-icon">⏸️</span>
                <span class="status-text">已暂停</span>
              </div>
              
              <!-- 下载中状态 -->
              <div v-else-if="scope.row.status === 'downloading'" class="status-progress">
                <el-progress 
                  :percentage="Math.min(scope.row.progress * 100, 100)"
                  :stroke-width="6"
                  :show-text="false"
                />
                <div class="progress-info">
                  <el-icon class="rotating progress-icon"><Loading /></el-icon>
                  <span class="progress-text">{{ Math.round(scope.row.progress * 100) }}%</span>
                </div>
              </div>
              
              <!-- 完成状态 -->
              <div v-else-if="scope.row.status === 'completed'" class="status-badge completed">
                <span class="status-icon">✅</span>
                <span class="status-text">下载完成</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" align="center">
          <template #default="scope">
            <div class="action-cell">
              <!-- 重试按钮 -->
              <button 
                v-if="scope.row.status === 'error'"
                class="btn btn-primary btn-xs"
                @click="handleClickRetry(scope.$index, scope.row)"
              >
                <span class="btn-icon">🔄</span>
                <span>重试</span>
              </button>
              
              <!-- 打开文件夹按钮 -->
              <button 
                v-if="scope.row.status === 'completed'"
                class="btn btn-secondary btn-xs"
                @click="handleClickOpenOne(scope.$index, scope.row)"
              >
                <span class="btn-icon">📂</span>
                <span>打开文件夹</span>
              </button>
              
              <!-- 删除按钮 -->
              <el-tooltip 
                content="仅删除下载任务，不会删除已下载的文件" 
                placement="top"
              >
                <button 
                  class="btn btn-ghost btn-xs"
                  @click="handleDeleteOne(scope.$index, scope.row)"
                >
                  <span class="btn-icon">🗑️</span>
                  <span>删除</span>
                </button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog 
      v-model="deleteAllVisible" 
      title="确认删除" 
      width="450px"
      class="modern-dialog"
    >
      <div class="confirm-content">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-text">
          <h3>确定删除全部下载任务吗？</h3>
          <p>此操作仅删除任务记录，不会删除已下载的文件</p>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-actions">
          <button class="btn btn-ghost" @click="deleteAllVisible = false">取消</button>
          <button 
            class="btn btn-primary" 
            :disabled="deleting" 
            @click="confirmDeleteAll"
          >
            <span class="btn-icon" v-if="deleting">⏳</span>
            <span>{{ deleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, toRaw, watch, computed } from 'vue'
import { downloadItemType } from '@/types/download'
import _ from 'lodash'
import { ipcRenderer } from 'electron'
import { ElMessage } from 'element-plus'
import electron from 'electron'

const tableData = ref<any[]>([])
const loading = ref(true)
const total = ref(0)
const current = ref<downloadItemType>()
const deleteAllVisible = ref(false)
const deleting = ref(false)
const status = ref('all')

const findStatus = computed(() => {
  let findStatus = ['queued', 'downloading', 'paused', 'completed', 'error']
  if (status.value === 'downloading') {
    findStatus = ['queued', 'downloading', 'paused']
  } else if (status.value === 'completed') {
    findStatus = ['completed']
  } else if (status.value === 'error') {
    findStatus = ['error']
  }
  return findStatus
})

onMounted(() => {
  countAllData()
  getAllData()
  ipcRenderer.on('DOWNLOAD-SINGLE-PROGRESS', function (event, data) {
    console.log('DOWNLOAD-SINGLE-PROGRESS', data)
    const { id, progress } = data
    const index = _.findIndex(tableData.value, { id })
    if (index > -1) {
      ;(tableData.value[index] as any).status = 'downloading'
      ;(tableData.value[index] as any).progress = progress
    }
  })
  ipcRenderer.on('DOWNLOAD-SINGLE-COMPLETED', function (event, data) {
    console.log('DOWNLOAD-SINGLE-COMPLETED', data)
    const { id } = data
    const index = _.findIndex(tableData.value, { id })
    if (index > -1) {
      ;(tableData.value[index] as any).status = 'completed'
    }
  })
  ipcRenderer.on('DOWNLOAD-SINGLE-PAUSED', function (event, data) {
    console.log('DOWNLOAD-SINGLE-PAUSED', data)
  })
  ipcRenderer.on('DOWNLOAD-SINGLE-REMOVED', function (event, data) {
    console.log('DOWNLOAD-SINGLE-REMOVED', data)
    const { id } = data
    const index = _.findIndex(tableData.value, { id })
    if (index > -1) {
      tableData.value.splice(index, 1)
    }
  })
  ipcRenderer.on('DOWNLOAD-REMOVED-ALL', function (event, data) {
    console.log('DOWNLOAD-REMOVED-ALL', data)
    getAllData()
    countAllData()
    deleteAllVisible.value = false
    deleting.value = false
  })
  ipcRenderer.on('DOWNLOAD-STOPPED-ALL', function (event, data) {
    console.log('DOWNLOAD-STOPPED-ALL', data)
    getAllData()
    countAllData()
  })

  ipcRenderer.on('DOWNLOAD-SINGLE-ERROR', function (event, data) {
    console.log('DOWNLOAD-SINGLE-ERROR', data)
    const { id } = data
    const index = _.findIndex(tableData.value, { id })
    if (index > -1) {
      ;(tableData.value[index] as any).status = 'error'
    }
  })
})

watch(current, (value: downloadItemType | undefined) => {
  const index = _.findIndex(tableData.value, { hash: value?.hash })
  if (value) {
    tableData.value.splice(index, 1, value)
  }
})

onUnmounted(() => {
  ipcRenderer.removeAllListeners('DOWNLOAD-SINGLE-PROGRESS')
  ipcRenderer.removeAllListeners('DOWNLOAD-SINGLE-COMPLETED')
  ipcRenderer.removeAllListeners('DOWNLOAD-SINGLE-PAUSED')
  ipcRenderer.removeAllListeners('DOWNLOAD-SINGLE-REMOVED')
  ipcRenderer.removeAllListeners('DOWNLOAD-REMOVED-ALL')
  ipcRenderer.removeAllListeners('DOWNLOAD-STOPPED-ALL')
  ipcRenderer.removeAllListeners('DOWNLOAD-SINGLE-ERROR')
})

const onStatusChange = () => {
  getAllData()
  countAllData()
}

const countAllData = () => {
  window.downloadDB.countAll({ status: { $in: findStatus.value } }).then((res: any) => {
    total.value = res
  })
}

const getAllData = () => {
  window.downloadDB
    .getAll([], { status: { $in: findStatus.value } })
    .then((res: any) => {
      console.log('allData', res)
      tableData.value = res
    })
    .finally(() => {
      loading.value = false
    })
}

const getPercent = (value: any) => {
  console.log('progress', value.progress)
  const percent = value.progress * 100 > 100 ? 100 : value.progress * 100
  return percent > 100 ? 100 : percent
}

const getCompleteText = (value: downloadItemType) => {
  return ''
}

const handleClickStartOne = (index: number, item: downloadItemType) => {
  // window.downloadOne(toRaw(item))
}

const handleDeleteOne = (index: number, item: any) => {
  window.download('remove', item.id)
}

const handleBegin = () => {
  window.download('bulkStart')
}

const handleStop = () => {
  window.download('bulkStop')
}

const handleDelete = () => {
  deleteAllVisible.value = true
}

const confirmDeleteAll = async () => {
  deleting.value = true
  await window.download('bulkRemove')
}

const handleClickOpenOne = (index: number, item: any) => {
  electron.shell.openPath(item.directory)
}

const handleClickRetry = (index: number, item: any) => {
  window.download('resume', item.id)
  // window.retryDownloadTask(toRaw(item))
}

const handleClickPause = (index: number, item: any) => {
  // window.pauseDownloadTask(toRaw(item))
}
</script>
<style lang="less" scoped>
.download-tasks {
  .control-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) 0;
    border-bottom: 1px solid var(--color-border-light);
    margin-bottom: var(--space-6);

    .panel-info {
      .stats-display {
        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-primary-light);
          color: var(--color-primary);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          border: 1px solid rgba(0, 122, 255, 0.2);

          .stat-icon {
            font-size: var(--font-size-base);
          }

          .stat-value {
            font-weight: var(--font-weight-bold);
          }
        }
      }
    }

    .panel-controls {
      display: flex;
      align-items: center;
      gap: var(--space-4);

      .status-filter {
        min-width: 120px;
      }

      .action-buttons {
        display: flex;
        gap: var(--space-2);
      }
    }
  }

  .tasks-list {
    .filename-cell {
      display: flex;
      align-items: center;
      gap: var(--space-3);

      .file-icon {
        font-size: var(--font-size-lg);
        flex-shrink: 0;
      }

      .file-info {
        flex: 1;
        overflow: hidden;

        .file-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: var(--space-1);
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

    .status-cell {
      .status-badge {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        white-space: nowrap;

        &.error {
          background: var(--color-error-light);
          color: var(--color-error);
          border: 1px solid rgba(255, 59, 48, 0.2);
        }

        &.queued {
          background: var(--color-gray-100);
          color: var(--color-text-tertiary);
          border: 1px solid var(--color-border-medium);
        }

        &.paused {
          background: var(--color-warning-light);
          color: var(--color-warning);
          border: 1px solid rgba(255, 149, 0, 0.2);
        }

        &.completed {
          background: rgba(52, 199, 89, 0.1);
          color: #34c759;
          border: 1px solid rgba(52, 199, 89, 0.25);
        }

        .status-icon {
          font-size: var(--font-size-sm);
        }
      }

      .status-progress {
        width: 100%;

        .progress-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-1);
          margin-top: var(--space-2);

          .progress-icon {
            font-size: var(--font-size-sm);
            
            &.rotating {
              animation: rotate 2s linear infinite;
            }
          }

          .progress-text {
            font-size: var(--font-size-xs);
            color: var(--color-text-tertiary);
            font-weight: var(--font-weight-medium);
          }
        }
      }
    }

    .action-cell {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
      flex-wrap: wrap;
    }
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.status-filter) {
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

:deep(.modern-tasks-table) {
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

/* 确认对话框样式 */
.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4) 0;

  .confirm-icon {
    font-size: var(--font-size-3xl);
    flex-shrink: 0;
  }

  .confirm-text {
    flex: 1;

    h3 {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-2) 0;
    }

    p {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      margin: 0;
      line-height: var(--line-height-relaxed);
    }
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
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
  .download-tasks {
    .control-panel {
      flex-direction: column;
      gap: var(--space-4);
      align-items: stretch;

      .panel-controls {
        flex-direction: column;
        gap: var(--space-3);

        .action-buttons {
          justify-content: center;
        }
      }
    }

    .filename-cell {
      .file-info {
        .file-name {
          font-size: var(--font-size-xs);
        }
      }
    }

    .action-cell {
      flex-direction: column;
      gap: var(--space-1);
    }
  }
}
</style>
