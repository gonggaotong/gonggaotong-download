<template>
  <div class="convert-tasks-page">
    <div class="page-header">
      <h1 class="page-title">转换任务管理</h1>
      <p class="page-subtitle">管理和监控所有PDF文件转换任务</p>
    </div>

    <div class="tasks-container">
      <div class="tasks-content">
        <div class="convert-tasks">
          <!-- 操作控制栏 -->
          <div class="control-panel">
            <div class="panel-info">
              <div class="stats-display">
                <div class="stat-item">
                  <span class="stat-icon">🔄</span>
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
                <el-option key="processing" label="转换中" value="processing" />
                <el-option key="completed" label="转换成功" value="completed" />
                <el-option key="error" label="转换失败" value="error" />
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
              empty-text="暂无转换任务"
            >
              <el-table-column label="文件信息" min-width="400">
                <template #default="scope">
                  <div class="file-cell">
                    <div class="file-icon">📄</div>
                    <div class="file-info">
                      <div class="file-name" :title="scope.row.sourcePath">
                        {{ getFileName(scope.row.sourcePath) }}
                      </div>
                      <div class="file-path" :title="scope.row.sourcePath">
                        {{ scope.row.sourcePath }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="转换状态" width="180" align="center">
                <template #default="scope">
                  <div class="status-cell">
                    <!-- 错误状态 -->
                    <div v-if="scope.row.status === 'error'" class="status-badge error">
                      <span class="status-icon">❌</span>
                      <span class="status-text">转换失败</span>
                    </div>
                    
                    <!-- 等待状态 -->
                    <div v-else-if="scope.row.status === 'queued'" class="status-badge queued">
                      <span class="status-icon">⏳</span>
                      <span class="status-text">等待中</span>
                    </div>
                    
                    <!-- 转换中状态 -->
                    <div v-else-if="scope.row.status === 'processing'" class="status-badge processing">
                      <el-icon class="rotating status-icon"><Loading /></el-icon>
                      <span class="status-text">转换中</span>
                    </div>
                    
                    <!-- 完成状态 -->
                    <div v-else-if="scope.row.status === 'completed'" class="status-badge completed">
                      <span class="status-icon">✅</span>
                      <span class="status-text">转换完成</span>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="240" align="center">
                <template #default="scope">
                  <div class="action-cell">
                    <!-- 查看转换结果 -->
                    <button 
                      v-if="scope.row.status === 'completed'"
                      class="btn btn-primary btn-xs"
                      @click="handleClickOpenOne(scope.$index, scope.row)"
                    >
                      <span class="btn-icon">👁️</span>
                      <span>查看结果</span>
                    </button>
                    
                    <!-- 查看原始文件 -->
                    <button 
                      v-if="scope.row.status === 'error'"
                      class="btn btn-secondary btn-xs"
                      @click="handleClickOpenOrgOne(scope.$index, scope.row)"
                    >
                      <span class="btn-icon">📁</span>
                      <span>查看原文件</span>
                    </button>
                    
                    <!-- 删除按钮 -->
                    <button 
                      class="btn btn-ghost btn-xs"
                      @click="handleDeleteOne(scope.row)"
                    >
                      <span class="btn-icon">🗑️</span>
                      <span>删除</span>
                    </button>
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
                <h3>确定删除全部转换任务吗？</h3>
                <p>此操作将删除所有转换任务记录</p>
              </div>
            </div>
            
            <template #footer>
              <div class="dialog-actions">
                <button class="btn btn-ghost" @click="deleteAllVisible = false">取消</button>
                <button class="btn btn-primary" @click="confirmDeleteAll">
                  <span>确认删除</span>
                </button>
              </div>
            </template>
          </el-dialog>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, toRaw, watch } from 'vue'
import { downloadItemType } from '@/types/download'
import _ from 'lodash'
import { ipcRenderer } from 'electron'
import { ElMessage } from 'element-plus'
import electron from 'electron'

const tableData = ref<any[]>([])
const loading = ref(true)
const total = ref(0)
const current = ref<any>()
const deleteAllVisible = ref(false)
const status = ref('all')

onMounted(() => {
  countAllData()
  getAllData()
  ipcRenderer.on('CONVERT-SINGLE-STARTED', function (event, single) {
    const { id } = single
    console.log('CONVERT-SINGLE-STARTED', single)
    const index = _.findIndex(tableData.value, { _id: id })
    if (index > -1) {
      ;(tableData.value[index] as any).status = 'processing'
    }
  })
  ipcRenderer.on('CONVERT-SINGLE-FINISHED', function (event, single) {
    const { id } = single
    console.log('CONVERT-SINGLE-FINISHED', single)
    const index = _.findIndex(tableData.value, { _id: id })
    if (index > -1) {
      ;(tableData.value[index] as any).status = 'completed'
    }
  })
  ipcRenderer.on('CONVERT-SINGLE-REMOVED', function (event, single) {
    const { id } = single
    console.log('CONVERT-SINGLE-REMOVED', single)
    const index = _.findIndex(tableData.value, { _id: id })
    if (index > -1) {
      tableData.value.splice(index, 1)
    }
  })
  ipcRenderer.on('CONVERT-ALL-PAUSED', function (event) {
    console.log('CONVERT-ALL-PAUSED')
  })
  ipcRenderer.on('CONVERT-ALL-RESUMED', function (event) {
    console.log('CONVERT-ALL-RESUMED')
  })
  ipcRenderer.on('CONVERT-ALL-REMOVED', function (event) {
    console.log('CONVERT-ALL-REMOVED')
  })
})

watch(current, (value: any) => {
  const index = _.findIndex(tableData.value, { filepath: value?.filepath, destDir: value?.destDir })
  if (value) {
    tableData.value.splice(index, 1, value)
  }
})

onUnmounted(() => {
  ipcRenderer.removeAllListeners('CONVERT-SINGLE-STARTED')
  ipcRenderer.removeAllListeners('CONVERT-SINGLE-FINISHED')
  ipcRenderer.removeAllListeners('CONVERT-SINGLE-REMOVED')
  ipcRenderer.removeAllListeners('CONVERT-ALL-PAUSED')
  ipcRenderer.removeAllListeners('CONVERT-ALL-RESUMED')
  ipcRenderer.removeAllListeners('CONVERT-ALL-REMOVED')
})

const getQuery = () => {
  if (status.value === 'all') {
    return {}
  }

  if (status.value === 'processing') {
    return { status: { $in: ['queued', 'processing'] } }
  }

  if (status.value === 'error') {
    return { status: { $in: ['error'] } }
  }

  if (status.value === 'completed') {
    return { status: { $in: ['completed'] } }
  }
}

const onStatusChange = () => {
  getAllData()
  countAllData()
}

const countAllData = () => {
  window.convertDB.countAll(getQuery()).then((res: any) => {
    total.value = res
  })
}

const getAllData = () => {
  window.convertDB
    .getAll([], getQuery())
    .then((res: any) => {
      console.log('allData', res)
      tableData.value = res
    })
    .finally(() => {
      loading.value = false
    })
}

const handleBegin = () => {
  window.convert('resumeAll')
}

const handleStop = () => {
  window.convert('pauseAll')
}

const handleDelete = () => {
  deleteAllVisible.value = true
}

const confirmDeleteAll = async () => {
  await window.convert('removeAll')
  ElMessage.success('删除成功')
  deleteAllVisible.value = false
  getAllData()
  countAllData()
}

const handleDeleteOne = (task: any) => {
  window.convert('removeTask', task._id)
  ElMessage.success('删除成功')
  getAllData()
  countAllData()
}

const handleClickOpenOne = (index: number, item: any) => {
  console.log(item)
  electron.shell.showItemInFolder(item.targetPath)
}

const handleClickOpenOrgOne = (index: number, item: any) => {
  console.log(item)
  electron.shell.showItemInFolder(item.sourcePath)
}

const getFileName = (fullPath: string) => {
  if (!fullPath) return ''
  const parts = fullPath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || ''
}
</script>
<style lang="less" scoped>
.convert-tasks-page {
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
      content: '🔄';
      font-size: var(--font-size-2xl);
    }
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.tasks-container {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.tasks-content {
  padding: var(--space-6);
}

.convert-tasks {
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
          background: var(--color-warning-light);
          color: var(--color-warning);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          border: 1px solid rgba(255, 149, 0, 0.2);

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
    .file-cell {
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

        &.processing {
          background: var(--color-warning-light);
          color: var(--color-warning);
          border: 1px solid rgba(255, 149, 0, 0.2);
          
          .status-icon {
            &.rotating {
              animation: rotate 2s linear infinite;
            }
          }
        }

        &.completed {
          background: var(--color-success-light);
          color: #34c759;
          border: 1px solid rgba(52, 199, 89, 0.25);
        }

        .status-icon {
          font-size: var(--font-size-sm);
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
      background: rgba(255, 149, 0, 0.02);
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
  .page-header .page-title {
    font-size: var(--font-size-2xl);
  }

  .tasks-content {
    padding: var(--space-4);
  }

  .convert-tasks {
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

    .file-cell {
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
