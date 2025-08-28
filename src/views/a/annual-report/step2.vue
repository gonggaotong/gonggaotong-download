<template>
  <div class="data">
    <div>
      操&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;作：
      <el-button class="main-footer-button" type="default" @click="onClickPrev">上一步</el-button>
    </div>
    <div class="data-operation">
      <div class="data-operation-desc">屏蔽关键词：</div>
      <el-input
        placeholder="请输入屏蔽标题关键词，多个用空格隔开，留空为不屏蔽，例如：已取消 英文版"
        v-model="keywords"
      ></el-input>
      <el-button class="data-operation-button" type="primary" @click="onClickDownload" :loading="downloding">
        立即下载
      </el-button>
    </div>
    <div class="data-filters">筛选结果：{{ total }}个</div>
    <div class="data-tips">注：批量下载一次只能下载前3000个，如需下载更多，请更改时间段筛选，将结果集控制在3000个</div>
    <div class="data-title">公告列表</div>
    <div class="data-content">
      <el-table ref="multipleTableRef" border :data="tableData" v-loading="loading" style="width: 100%">
        <!-- <el-table-column type="selection" width="55" /> -->
        <el-table-column label="公司代码" property="secCode" width="100"></el-table-column>
        <el-table-column label="公司名称" property="secName" />
        <el-table-column label="公告标题" property="announcementTitle">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              <a href="###" @click.prevent="onClickItem(scope.row)">{{ `${scope.row.announcementTitle}.PDF` }}</a>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="公告发布时间" width="120">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              <span>{{ getFormatDate(scope.row.announcementTime) }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="data-pager">
      <el-pagination
        background
        :total="total"
        v-model:current-page="page"
        v-model:page-size="limit"
        :page-sizes="[30]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handleCurrentChange"
      />
    </div>
    <div class="main-footer">
      <!-- <el-button class="main-footer-button" type="default" @click="onClickPrev">上一步</el-button> -->
    </div>
    <el-dialog v-model="dialogVisible" title="下载提示" width="450px" :show-close="false">
      <div>
        <div style="margin-bottom: 20px">正在获取列表，关闭对话框会中断列表获取，目前进度如下：</div>
        <el-progress :percentage="percent">
          <div class="status-downloading">
            <el-icon><Loading /></el-icon>
            <div>{{ percentText }}</div>
          </div>
        </el-progress>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClickCloseDialog">关闭</el-button>
        </span>
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
    &-filters {
      padding: 10px 0;
    }
    &-operation {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-top: 15px;
      &-desc {
        width: 120px;
      }
      &-button {
        margin-left: 10px;
      }
    }
    &-tips {
      font-size: 12px;
      color: crimson;
      margin-bottom: 6px;
    }
    &-title {
      text-align: center;
      background: #1696e7;
      color: white;
      padding: 10px;
    }
    &-pager {
      margin-top: 20px;
    }
  }
}
.status-downloading {
  display: flex;
}
</style>
