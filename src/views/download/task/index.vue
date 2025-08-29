<template>
  <div class="download-tasks-page">
    <div class="page-header">
      <h1 class="page-title">下载任务管理</h1>
      <p class="page-subtitle">管理和监控所有文件下载任务</p>
    </div>

    <div class="tasks-container">
      <div class="tasks-content">
        <downloading />
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
<style lang="less" scoped>
.download-tasks-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-8);

  .page-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    
    &::before {
      content: '⬇️';
      font-size: var(--font-size-2xl);
    }
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.tasks-container {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.tasks-content {
  padding: var(--space-6);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header .page-title {
    font-size: var(--font-size-2xl);
  }

  .tasks-content {
    padding: var(--space-4);
  }
}
</style>
