<template>
  <div class="app-layout">
    <header class="app-header">
      <Header></Header>
    </header>
    <div class="app-body">
      <aside class="app-sidebar">
        <Sider></Sider>
      </aside>
      <main class="app-main">
        <div class="app-content">
          <router-view></router-view>
        </div>
      </main>
    </div>
  </div>
</template>
<script lang="ts" setup>
import Header from '@/components/index/header.vue'
import Sider from '@/components/index/sider.vue'
</script>
<style lang="less">
.app-layout {
  min-height: 100vh;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
}

.app-header {
  height: 56px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: var(--color-text-white);
  box-shadow: var(--shadow-sm);
  z-index: var(--z-sticky);
  position: relative;
}

.app-body {
  flex: 1;
  display: flex;
  min-height: calc(100vh - 56px);
}

.app-sidebar {
  width: 240px;
  background: var(--color-bg-elevated);
  border-right: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
  overflow-y: auto;
}

.app-main {
  flex: 1;
  background: var(--color-bg-secondary);
  overflow-y: auto;
}

.app-content {
  padding: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-top: var(--space-6);
  margin-bottom: var(--space-6);
  min-height: calc(100vh - 56px - var(--space-12));
}

@media (max-width: 768px) {
  .app-sidebar {
    width: 200px;
  }
  
  .app-content {
    padding: var(--space-4);
    margin: var(--space-3);
  }
}
</style>
