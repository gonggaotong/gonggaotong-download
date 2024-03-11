<template>
  <div class="task-container">
    <div class="task-top">
      <div class="task-top-title">下载任务</div>
      <div class="task-top-tab">
        <el-tabs type="card" v-model="current" @tab-change="onTabChange">
          <el-tab-pane name="downloading" label="全部">
            <downloading v-if="current == 'downloading'" />
          </el-tab-pane>
          <!-- <el-tab-pane name="complete" label="已完成">
            <complete v-if="current == 'complete'" />
          </el-tab-pane> -->
        </el-tabs>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import complete from './complete.vue'
import downloading from './downloading.vue'

const current = ref('downloading')

const onTabChange = (tab: any) => {
  console.log(tab)
}
</script>
<style lang="less">
.task-container {
  .task-top {
    &-title {
      font-size: 16px;
      font-weight: bold;
      text-align: center;
    }
  }
}
</style>
