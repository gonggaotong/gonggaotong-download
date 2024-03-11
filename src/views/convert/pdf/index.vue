<template>
  <div class="convert-container">
    <div class="desc">
      <div>请选择PDF所在文件夹</div>
      <div><el-button class="open-dir" type="default" @click="openDir()">选择</el-button></div>
      <div>
        <a href="###">{{ dirPath }}</a>
      </div>
    </div>
    <div class="desc">
      <div>请选择转换后的文件夹</div>
      <div><el-button class="open-dir" type="default" @click="openDestDir()">选择</el-button></div>
      <div>
        <a href="###">{{ destDirPath }}</a>
      </div>
    </div>
    <div class="hr"></div>
    <div class="convert-container-header">
      <div>
        <el-button type="primary" @click="onClickConvert" :loading="converting">一键转换</el-button>
      </div>
      <div>共{{ tableData.length }}个文件</div>
    </div>
    <div class="convert-container-body">
      <el-table ref="multipleTableRef" border :data="tableData" v-loading="loading" style="width: 100%">
        <!-- <el-table-column type="selection" width="55" /> -->
        <el-table-column label="序号" property="id" width="100"></el-table-column>
        <el-table-column label="文件路径" property="filePath" />
        <!-- <el-table-column label="操作" property="announcementTitle"></el-table-column> -->
      </el-table>
    </div>
    <div class="convert-container-footer"></div>
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

const onClickConvert = async () => {
  if (loading.value || converting.value) {
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
    ElMessage.success(`${tableData.value.length}个转换任务已添加，请至左侧转换任务处查看`)
  } catch (error) {
    ElMessage.error(`任务添加失败，${JSON.stringify(error)}`)
  } finally {
    converting.value = false
  }
}
</script>
<style lang="less">
.convert-container {
  font-size: 14px;
  .desc {
    display: flex;
    align-items: center;
    div {
      margin-right: 10px;
    }
    margin-bottom: 20px;
  }

  .hr {
    border-top: 1px solid #ccc;
    margin: 10px 0;
  }

  &-header {
    display: flex;
    align-items: center;
    div {
      margin-right: 20px;
    }
  }
  &-body {
    margin-top: 10px;
  }
}
</style>
