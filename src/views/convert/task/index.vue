<template>
  <div class="downloading-operation">
    <div class="downloading-operation-left">
      统计：共{{ total }}个
      <br />
    </div>
    <div class="downloading-operation-right">
      <el-select v-model="status" class="m-2" placeholder="Select" @change="onStatusChange">
        <el-option key="all" label="全部" value="all" />
        <el-option key="processing" label="转换中" value="processing" />
        <el-option key="completed" label="转换成功" value="completed" />
        <el-option key="error" label="转换失败" value="error" />
      </el-select>
      <el-button type="primary" @click="handleBegin">全部开始</el-button>
      <el-button type="default" @click="handleStop">全部暂停</el-button>
      <el-button type="danger" @click="handleDelete">全部删除</el-button>
    </div>
  </div>
  <div class="downloading-content">
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column label="文件路径">
        <template #default="scope">
          <div class="name">{{ scope.row.sourcePath }}</div>
        </template>
      </el-table-column>
      <el-table-column label="转换状态" width="120">
        <template #default="scope">
          <div class="status" v-if="scope.row.status === 'error'">
            <div class="status-pending">转换出错[{{ scope.row.message }}]</div>
          </div>
          <div class="status" v-if="scope.row.status === 'queued'">
            <div class="status-pending">等待中</div>
          </div>
          <div class="status" v-if="scope.row.status === 'processing'">
            <div class="status-downloading">
              <el-icon><Loading /></el-icon>
              <div>转换中</div>
            </div>
          </div>
          <div class="status" v-if="scope.row.status === 'completed'">
            <div class="status-pending" style="color: #67c23a">转换完成</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="操作" width="300">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 'completed'"
            size="small"
            type="primary"
            @click="handleClickOpenOne(scope.$index, scope.row)"
          >
            查看
          </el-button>

          <el-button
            v-if="scope.row.status === 'error'"
            size="small"
            type="primary"
            @click="handleClickOpenOrgOne(scope.$index, scope.row)"
          >
            查看原始文件
          </el-button>
          <el-button size="small" type="danger" @click="handleDeleteOne(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="deleteAllVisible" title="二次确认" width="400">
      <span>确定删除全部转换任务？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteAllVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDeleteAll">确定</el-button>
        </span>
      </template>
    </el-dialog>
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
