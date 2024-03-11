<template>
  <div class="topbar">
    <div class="left">软件永久免费，请放心使用</div>
    <div class="right" @click="onClickAbout">关于我们</div>
  </div>
</template>
<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const onClickAbout = () => {
  router.push({ name: 'Home' })
}
</script>
<style lang="less">
.topbar {
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  .right {
    cursor: pointer;
  }
}
</style>
