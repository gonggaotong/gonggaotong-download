<template>
  <div class="sider-main">
    <el-row class="sider-main-row" :class="currentRow === 'Home' ? 'current' : ''">
      <el-col :span="24">
        <span @click="handleClick('Home')">首页</span>
      </el-col>
    </el-row>
    <el-row class="sider-main-row" :class="currentRow === 'USAnnualReport' ? 'current' : ''">
      <el-col :span="24">
        <span @click="handleClick('USAnnualReport')">美股公告下载</span>
      </el-col>
    </el-row>
    <el-row class="sider-main-row" :class="currentRow === 'AAnnualReport' ? 'current' : ''">
      <el-col :span="24">
        <span @click="handleClick('AAnnualReport')">A股公告下载</span>
      </el-col>
    </el-row>
    <el-row class="sider-main-row" :class="currentRow === 'ConvertPdf' ? 'current' : ''">
      <el-col :span="24">
        <span @click="handleClick('ConvertPdf')">PDF转换</span>
      </el-col>
    </el-row>
    <el-row class="sider-main-row" style="color: #ccc">——————————</el-row>
    <el-row class="sider-main-row" :class="currentRow === 'DownloadTask' ? 'current' : ''">
      <el-col :span="24">
        <span @click="handleClick('DownloadTask')">下载任务</span>
      </el-col>
    </el-row>
    <el-row class="sider-main-row" :class="currentRow === 'ConvertTask' ? 'current' : ''">
      <el-col :span="24">
        <span @click="handleClick('ConvertTask')">转换任务</span>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts">
export default {
  name: 'sider',
  components: {},
  data() {
    return {}
  },
  computed: {
    currentRow() {
      return this.$route.name
    },
  },
  created() {
    // this.$router.push({name: 'Index'})
  },
  methods: {
    handleClick(name: string) {
      this.$router.push({ name })
    },
  },
}
</script>
<style scope>
.sider-main {
  color: #232332;
  text-align: center;
  padding-top: 20px;
}
.sider-main-row {
  height: 40px;
  line-height: 40px;
  font-weight: 700;
  cursor: pointer;
}
.sider-main-row:hover {
  color: #409eff;
}
.sider-main .current {
  color: #409eff;
}
</style>
