<template>
  <el-container>
    <el-header class="main-header" height="32px">
      <Header></Header>
    </el-header>
    <el-container>
      <el-aside width="120px" class="main-sider">
        <Sider></Sider>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import Header from '@/components/index/header.vue'
import Sider from '@/components/index/sider.vue'
</script>
<style lang="less">
.main-header {
  background: #1696e7;
  color: #fff;
  margin: 0;
  padding: 0;
}
.main-sider {
  border-right: 1px solid #f2f2f2;
  min-height: calc(100vh - 52px);
}
.main-link-input {
  width: 200px;
}
</style>
