<template>
  <div class="downloading-operation">
    <div class="downloading-operation-left">统计：共{{ total }}个</div>
    <div class="downloading-operation-right">
      <el-button type="danger" @click="handleDelete">全部删除</el-button>
    </div>
  </div>
  <div class="downloading-content">
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column label="名称">
        <template #default="scope">
          <div class="name">[{{ scope.row.type }}]{{ scope.row.hash }}</div>
        </template>
      </el-table-column>
      <el-table-column label="下载状态">
        <template #default="scope">
          <div class="status" v-if="scope.row.state === 'pending'">
            <div class="status-pending">等待中</div>
          </div>
          <div class="status" v-if="scope.row.state === 'downloading'">
            <el-progress :percentage="getPercent(scope.row)">
              <div class="status-downloading">
                <el-icon><Loading /></el-icon>
                <div>{{ getCompleteText(scope.row) }}</div>
              </div>
            </el-progress>
          </div>
          <div class="status" v-if="scope.row.state === 'complete'">
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
          <el-button size="small" type="primary" @click="handleClickOpenOne(scope.$index, scope.row)">
            查看所在文件夹
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="deleteAllVisible" title="二次确认" width="400">
      <div>确定删除全部已完成任务？</div>
      <div style="font-size: 12px; color: red">注：电脑上的文件不会一同删除</div>
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
import { ref, onMounted } from 'vue'
import { downloadItemType } from '@/types/download'
import _ from 'lodash'
import { ElMessage } from 'element-plus'
import electron from 'electron'

const tableData = ref<downloadItemType[]>([])
const loading = ref(true)
const total = ref(0)
const deleteAllVisible = ref(false)
const isPaused = ref(false)

onMounted(() => {
  countAllData()
  getAllData()
})

const countAllData = () => {
  window.downloadDB.countAll({ state: { $in: ['complete'] } }).then((res: any) => {
    total.value = res
  })
}

const getAllData = () => {
  window.downloadDB
    .getAll([], { state: { $in: ['complete'] } })
    .then((res: any) => {
      console.log('allData', res)
      tableData.value = res
    })
    .finally(() => {
      loading.value = false
    })
}

const getPercent = (value: downloadItemType) => {
  if (!value.items || value.items.length === 0) {
    return 0
  }

  const completeItems: [] = _.filter(value.items, { state: 'complete' })
  console.log('getPercent', completeItems.length, value.items.length)
  const percent = parseInt(_.toNumber((completeItems.length / value.items.length) * 100))
  return percent > 100 ? 100 : percent
}

const getCompleteText = (value: downloadItemType) => {
  if (value.type === 'juchao-report') {
    return ''
  }
  if (!value.items || value.items.length === 0) {
    return '0/0'
  }

  const completeItems: [] = _.filter(value.items, { state: 'complete' })
  return `${completeItems.length}/${value.items.length}`
}

const handleDelete = () => {
  deleteAllVisible.value = true
}

const confirmDeleteAll = () => {
  window.downloadDB.deleteAll({ state: { $in: ['complete'] } }).then(() => {
    ElMessage.success('删除成功')
    deleteAllVisible.value = false
    getAllData()
    countAllData()
  })
}

const handleClickOpenOne = (index: number, item: any) => {
  electron.shell.openPath(item.config.savePath)
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
