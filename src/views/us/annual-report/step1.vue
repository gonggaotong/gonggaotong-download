<template>
  <div>
    <el-form ref="form" label-width="200px" label-position="left">
      <el-form-item label="步骤一、设置下载路径：">
        <a href="###" @click="openLocalPath(savePath)">{{ savePath }}</a>
        <el-button class="save-position" size="small" type="default" @click="openSavePathDialog()">
          {{ savePath ? '更换存储位置' : '请选择存储位置' }}
        </el-button>
      </el-form-item>
      <el-form-item label="步骤二、同步最新美股公司：">
        <el-button size="small" type="primary" @click="downloadNewestCompanies" :loading="saving">
          点击立即同步
        </el-button>
        <span class="span">共{{ companyNums }}家公司</span>
        <a href="###" style="margin-left: 10px" @click="exportCompaniesToCsv()">导出至csv</a>
      </el-form-item>
      <el-form-item label="步骤三、基本设置：">
        <el-form class="form-setting" ref="form-setting" label-width="95px" label-position="left" size="small">
          <el-form-item class="form-setting-item" label="1、下载类型：">
            <el-checkbox-group v-model="typeList">
              <el-checkbox label="10-K"></el-checkbox>
              <el-checkbox label="20-F"></el-checkbox>
              <el-checkbox label="10-Q"></el-checkbox>
              <el-checkbox label="S-1"></el-checkbox>
              <el-checkbox label="F-1"></el-checkbox>
              <el-checkbox label="8-K"></el-checkbox>
              <el-checkbox label="6-K"></el-checkbox>
              <el-checkbox label="14-A"></el-checkbox>
              <el-checkbox label="S-4"></el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item class="form-setting-item" label="2、下载格式：">
            <el-checkbox-group v-model="formatList">
              <el-checkbox label="TXT"></el-checkbox>
              <el-checkbox label="HTML"></el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item class="form-setting-item" label="3、发布年份：">
            <div class="year">
              <el-select v-model="startYear" placeholder="起始年份">
                <el-option v-for="item in startYears" :key="item" :label="item" :value="item" />
              </el-select>
              <span>-</span>
              <el-select v-model="endYear" placeholder="结束年份">
                <el-option v-for="item in endYears" :key="item" :label="item" :value="item" />
              </el-select>
            </div>
          </el-form-item>
          <el-form-item class="form-setting-item" label="4、公司筛选：">
            <el-input
              rows="6"
              v-model="tickers"
              placeholder="请输入公司ticker,多个请一行一个,留空为全部公司"
              type="textarea"
            ></el-input>
          </el-form-item>
        </el-form>
      </el-form-item>
    </el-form>
    <div class="main-footer">
      <el-button class="main-footer-button" type="primary" @click="onClickNext">下一步</el-button>
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
    .year {
      display: flex;
      width: 280px;
      justify-content: space-between;
      &-input {
        width: 130px;
      }
    }
    &-item {
      margin-bottom: 10px;
    }
    label {
      font-size: 12px;
    }
  }

  .data {
    margin-top: 20px;
    &-title {
      text-align: center;
      background: #1696e7;
      color: white;
      padding: 10px;
    }
  }
}
</style>
