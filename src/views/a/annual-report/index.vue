<template>
  <div class="main-container">
    <div class="main-title">A股公告下载器</div>
    <Step1 v-show="current == 1" :onClickNext="onClickNext"></Step1>
    <Step2 :basicSetting="basicSetting" v-if="current == 2" :onClickPrev="onClickPrev"></Step2>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import Step1 from './step1.vue'
import Step2 from './step2.vue'

const basicSetting = ref<any>()
const current = ref(1)

const onClickNext = (data: any) => {
  current.value = current.value + 1
  console.log(data)
  basicSetting.value = data
}
const onClickPrev = () => {
  current.value = current.value - 1
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
    &-title {
      text-align: center;
      background: #1696e7;
      color: white;
      padding: 10px;
    }
  }
}
.main-footer {
  margin-top: 20px;
  border-top: 1px solid #ccc;
  padding-top: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  &-button {
    width: 200px;
  }
}
</style>
