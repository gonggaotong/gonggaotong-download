<template>
  <div class="modern-header">
    <div class="header-brand">
      <div class="brand-icon">📊</div>
      <div class="brand-info">
        <h1 class="brand-title">公告通</h1>
        <span class="brand-subtitle">财报下载助手</span>
      </div>
    </div>
    <div class="header-actions">
      <div class="free-badge">
        <span class="badge-icon">✨</span>
        <span class="badge-text">永久免费</span>
      </div>
      <button class="about-btn" @click="onClickAbout">
        <span>关于我们</span>
      </button>
    </div>
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
.modern-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 var(--space-6);
  background: transparent;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  
  .brand-icon {
    font-size: var(--font-size-2xl);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
  
  .brand-info {
    display: flex;
    flex-direction: column;
    
    .brand-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-white);
      margin: 0;
      line-height: 1.2;
    }
    
    .brand-subtitle {
      font-size: var(--font-size-xs);
      color: rgba(255, 255, 255, 0.8);
      font-weight: var(--font-weight-regular);
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.free-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  .badge-icon {
    font-size: var(--font-size-sm);
  }
  
  .badge-text {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-white);
  }
}

.about-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--color-text-white);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}
</style>
