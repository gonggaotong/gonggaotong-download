<template>
  <div class="data">
    <div class="data-filters">筛选：tickers-{{ (basicSetting?.tickers || []).length || '全部' }}</div>
    <div class="data-operation">
      <div class="data-operation-desc">操作：</div>
      <el-button class="main-footer-button" type="default" @click="onClickPrev">上一步</el-button>
      <el-button type="primary" @click="onClickDownload" :loading="downloding">立即下载</el-button>
    </div>
    <!-- <div class="data-tips">注：如不选择则下载全部</div> -->
    <div class="data-title">公司列表</div>
    <div class="data-content">
      <el-table ref="multipleTableRef" border :data="tableData" v-loading="loading" style="width: 100%">
        <!-- <el-table-column type="selection" width="55" /> -->
        <el-table-column label="symbol" property="symbol" width="80"></el-table-column>
        <el-table-column property="name" label="name" />
        <el-table-column label="country" property="country" width="120"></el-table-column>
        <el-table-column label="industry" property="industry"></el-table-column>
        <el-table-column label="sector" property="sector"></el-table-column>
        <el-table-column label="ipo-year" property="ipoyear" width="90"></el-table-column>
      </el-table>
    </div>
    <div class="data-pager">
      <el-pagination
        background
        :total="total"
        v-model:current-page="page"
        v-model:page-size="limit"
        :page-sizes="[20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
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
import _ from 'lodash'
import { basicSettingType } from '@/types/us'
import { downloadItemType } from '@/types/download'
import { ElMessage, ElMessageBox } from 'element-plus'
import SecService from '@/services/sec'
import { generateTask } from '@/utils/index'

const props = defineProps({
  basicSetting: Object as PropType<basicSettingType>,
  onClickPrev: Function as PropType<any>,
})

const tableData = ref<basicSettingType[]>([])
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const downloding = ref(false)
const dialogVisible = ref(false)

const totalCompany = ref(0)
const handledCompany = ref(0)

const percent = computed(() => {
  const res = _.ceil((_.toNumber(handledCompany.value) / _.toNumber(totalCompany.value)) * 100)
  return res > 100 ? 100 : res
})

const percentText = computed(() => {
  return `(${handledCompany.value}/${totalCompany.value})`
})

onMounted(() => {
  getTableCount()
  getTableData()
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

const onClickDownload = async () => {
  downloding.value = true
  const data: any = await window.usReportDB.getAll({
    tickers: toRaw(props.basicSetting?.tickers) || [],
  })

  const dbCount = await window.downloadDB.countAll()
  if (dbCount >= 100000) {
    ElMessage.error('下载任务已达到10万个，请先前往“下载任务”清理下载任务')
    return
  }

  totalCompany.value = data.length

  dialogVisible.value = true

  const existTasks = await window.downloadDB.getAll(['url'], {}, 0, 100000)
  const existTaskHashes = _.map(existTasks, (item: any) => item.url)

  let startYear = props.basicSetting?.startYear || 0
  let endYear = props.basicSetting?.endYear || 0
  const format = toRaw(props.basicSetting?.format) || []
  const types = toRaw(props.basicSetting?.types) || []

  let count = 0
  let totalNum = 0
  let failedNum = 0
  startYear = _.toNumber(startYear)
  endYear = _.toNumber(endYear)
  for (const item of data) {
    const { cik, symbol: ticker, industry, country } = item
    try {
      const result = await SecService.getDetail(cik)
      console.log(result)
      const recentFillings = result.filings.recent
      const tasks: any[] = []
      _.forEach(recentFillings.form, (type: any, index: any) => {
        if (!_.includes(types, type)) {
          return
        }

        const date = recentFillings.filingDate[index]
        let year
        if (date) {
          year = parseInt(date.substring(0, 4))
          if (year < startYear || year > endYear) {
            return
          }
        }

        totalNum++

        const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${recentFillings.accessionNumber[index].replace(
          /-/g,
          '',
        )}/${recentFillings.primaryDocument[index]}`

        if (existTaskHashes.includes(url)) {
          count++
          return
        }
        existTaskHashes.push(url)

        const extension = url.split('.').pop()
        let filename = `${ticker}_${year}_${type}_${_.toLower(industry).replace(/ /g, '-')}_${_.toLower(
          country,
        )}_${date}.${extension}`
        filename = filename.replace(/\//g, '')
        filename = filename.replace(/\n/g, '')
        filename = filename.replace(/ /g, '')
        filename = filename.replace(/:/g, '')
        filename = filename.replace(/\*/g, '')
        filename = filename.replace(/\?/g, '')
        filename = filename.replace(/"/g, '')
        filename = filename.replace(/</g, '')
        filename = filename.replace(/>/g, '')
        filename = filename.replace(/|/g, '')
        filename = filename.replace(/'/g, '')
        filename = filename.replace(/\(/g, '-')
        filename = filename.replace(/\)/g, '-')

        tasks.push(
          generateTask({
            url,
            directory: props.basicSetting?.savePath || '',
            filename,
          }),
        )
      })

      window.downloadDB.insert(tasks)
      window.download('loadTasks')
      handledCompany.value++
    } catch (error: any) {
      console.log(error)
      console.log(error.message)
      failedNum++
      continue
    }
  }
  if (failedNum === 0) {
    const downloadNum = totalNum - count
    ElMessage.success(`共有${totalNum}个任务，已存在${count}个，本次新增${downloadNum}个`)
    downloding.value = false
    dialogVisible.value = false
  } else {
    ElMessage.error(`由于网络环境，有${failedNum}个任务失败，请检查网络后重试`)
    downloding.value = false
    dialogVisible.value = false
  }
  // window.beginDownload()
}

const getTableCount = () => {
  window.usReportDB
    .countAll({
      tickers: toRaw(props.basicSetting?.tickers) || [],
    })
    .then((count: any) => {
      total.value = count
    })
}

const getTableData = () => {
  loading.value = true
  window.usReportDB
    .getAll({
      tickers: toRaw(props.basicSetting?.tickers) || [],
      skip: (page.value - 1) * limit.value,
      limit: limit.value,
    })
    .then((data: any) => {
      console.log(data)
      tableData.value = data
    })
    .finally(() => {
      loading.value = false
    })
}

const handleSizeChange = (val: number) => {
  getTableData()
}

const handleCurrentChange = (val: number) => {
  getTableData()
}
</script>
<style lang="less" scoped>
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
      margin-bottom: 15px;
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
</style>
