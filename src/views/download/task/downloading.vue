<template>
  <div class="downloading-operation">
    <div class="downloading-operation-left">
      统计：共{{ total }}个
      <!-- <b>{{ isPaused ? '下载暂停' : '下载中' }}</b> -->
      <br />
      <!-- <span style="font-size: 12px; color: red">注：此页面只展示前1000条</span> -->
    </div>
    <div class="downloading-operation-right">
      <el-select v-model="status" class="m-2" placeholder="Select" @change="onStatusChange">
        <el-option key="all" label="全部" value="all" />
        <el-option key="downloading" label="下载中" value="downloading" />
        <el-option key="completed" label="下载完成" value="completed" />
        <el-option key="error" label="下载失败" value="error" />
      </el-select>
      <el-button type="primary" @click="handleBegin">全部开始</el-button>
      <el-button type="default" @click="handleStop">全部暂停</el-button>
      <el-button type="danger" @click="handleDelete">全部删除</el-button>
    </div>
  </div>
  <div class="downloading-content">
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column label="名称">
        <template #default="scope">
          <div class="name">{{ scope.row.filename }}</div>
        </template>
      </el-table-column>
      <el-table-column label="下载状态">
        <template #default="scope">
          <div class="status" v-if="scope.row.status === 'error'">
            <div class="status-pending">下载出错</div>
          </div>
          <div class="status" v-if="scope.row.status === 'queued'">
            <div class="status-pending">等待中</div>
          </div>
          <div class="status" v-if="scope.row.status === 'paused'">
            <div class="status-pending">暂停中</div>
          </div>
          <div class="status" v-if="scope.row.status === 'downloading'">
            <el-progress :percentage="scope.row.progress * 100 > 100 ? 100 : scope.row.progress * 100">
              <div class="status-downloading">
                <el-icon><Loading /></el-icon>
                <!-- <div>{{ scope.row.progress }}</div> -->
              </div>
            </el-progress>
          </div>
          <div class="status" v-if="scope.row.status === 'completed'">
            <el-progress :percentage="100">
              <div class="status-complete">
                <el-icon style="color: #67c23a"><CircleCheck /></el-icon>
                <div>{{ getCompleteText(scope.row) }}</div>
              </div>
            </el-progress>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="操作" width="300">
        <template #default="scope">
          <el-tooltip class="box-item" effect="dark" content="只会删除下载任务，不会删除源文件" placement="top">
            <el-button size="small" type="danger" @click="handleDeleteOne(scope.$index, scope.row)">删除</el-button>
          </el-tooltip>
          <el-button
            v-if="scope.row.status === 'error'"
            size="small"
            type="primary"
            @click="handleClickRetry(scope.$index, scope.row)"
          >
            重试
          </el-button>
          <el-button
            v-if="scope.row.status === 'completed'"
            size="small"
            type="primary"
            @click="handleClickOpenOne(scope.$index, scope.row)"
          >
            打开所在文件夹
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="deleteAllVisible" title="二次确认" width="400">
      <span>确定删除全部下载任务？注意：不会删除下载源文件</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteAllVisible = false">取消</el-button>
          <el-button type="primary" :loading="deleting" @click="confirmDeleteAll">确定</el-button>
        </span>
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
<style lang="less">
.downloading-operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ccc;
  .downloading-operation-left {
    font-size: 14px;
    font-weight: bold;
  }
  .downloading-operation-right {
    display: flex;
    align-items: center;
    .el-button {
      margin-left: 10px;
    }
  }
}
.downloading-content {
  padding-top: 10px;
  .status {
    font-size: 12px;
    &-downloading {
      display: flex;
      font-size: 12px;
      justify-content: space-evenly;
    }
    &-complete {
      display: flex;
      font-size: 12px;
      justify-content: space-evenly;
    }
  }
}
</style>
