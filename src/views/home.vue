<template>
  <div class="home">
    <div class="home-title">首页</div>
    <div class="home-content">
      <div class="home-content-title">关于我们</div>
      <div class="home-content-text">
        <p>
          10年+程序员，为了让那些不会编程、不会爬虫的人可以方便的进行数据收集、整理的工作，让专业的人做专业的事，最大限度地提高质量和效率，从而节省时间和精力
        </p>
      </div>
      <div class="home-content-title">软件声明</div>
      <div class="home-content-text">
        <p>1. 软件完全开源</p>
        <p>2. 如有涉及侵权 可以联系我们删除</p>
      </div>
      <div class="home-content-title">联系我们</div>
      <div class="home-content-text">
        <p>邮件：gonggaotong2024@163.com</p>
        <p>微信：gonggaotong-kefu</p>
        <p>
          网站：
          <a href="###" @click="onClickWebsite('http://www.gonggaotong.net')">http://www.gonggaotong.net</a>
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import electron from 'electron'

const onClickWebsite = (url: string) => {
  electron.shell.openExternal(url)
}
</script>
<style lang="less">
.home {
  padding: 20px 50px;
  &-title {
    text-align: center;
    font-size: 24px;
  }
  &-content {
    &-title {
      font-weight: 700;
      font-size: 20px;
      margin-top: 10px;
    }
    &-text {
      font-size: 14px;
      p {
        margin: 0;
      }
    }
  }
}
</style>
