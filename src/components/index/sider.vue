<template>
  <nav class="modern-sidebar">
    <div class="sidebar-section">
      <div class="section-title">主要功能</div>
      <ul class="nav-list">
        <li class="nav-item" :class="{ active: currentRow === 'Home' }">
          <button class="nav-link" @click="handleClick('Home')">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">首页</span>
          </button>
        </li>
        <li class="nav-item" :class="{ active: currentRow === 'USAnnualReport' }">
          <button class="nav-link" @click="handleClick('USAnnualReport')">
            <span class="nav-icon">🇺🇸</span>
            <span class="nav-text">美股公告下载</span>
          </button>
        </li>
        <li class="nav-item" :class="{ active: currentRow === 'AAnnualReport' }">
          <button class="nav-link" @click="handleClick('AAnnualReport')">
            <span class="nav-icon">🇨🇳</span>
            <span class="nav-text">A股公告下载</span>
          </button>
        </li>
        <li class="nav-item" :class="{ active: currentRow === 'ConvertPdf' }">
          <button class="nav-link" @click="handleClick('ConvertPdf')">
            <span class="nav-icon">📄</span>
            <span class="nav-text">PDF转换</span>
          </button>
        </li>
      </ul>
    </div>
    
    <div class="sidebar-section">
      <div class="section-title">任务管理</div>
      <ul class="nav-list">
        <li class="nav-item" :class="{ active: currentRow === 'DownloadTask' }">
          <button class="nav-link" @click="handleClick('DownloadTask')">
            <span class="nav-icon">⬇️</span>
            <span class="nav-text">下载任务</span>
          </button>
        </li>
        <li class="nav-item" :class="{ active: currentRow === 'ConvertTask' }">
          <button class="nav-link" @click="handleClick('ConvertTask')">
            <span class="nav-icon">🔄</span>
            <span class="nav-text">转换任务</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
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
<style lang="less" scoped>
.modern-sidebar {
  padding: var(--space-6) 0;
  height: 100%;
  background: var(--color-bg-elevated);
}

.sidebar-section {
  margin-bottom: var(--space-8);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-quaternary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 var(--space-4);
  margin-bottom: var(--space-4);
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: var(--space-1);
  padding: 0 var(--space-3);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  border-radius: var(--radius-base);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  
  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    transform: translateX(4px);
  }
  
  &:active {
    transform: translateX(2px);
  }
}

.nav-item.active .nav-link {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  
  .nav-icon {
    transform: scale(1.1);
  }
  
  &:hover {
    background: var(--color-primary-light);
    color: var(--color-primary-hover);
  }
}

.nav-icon {
  font-size: var(--font-size-md);
  transition: transform var(--transition-fast);
  min-width: 20px;
  text-align: center;
}

.nav-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-text {
    font-size: var(--font-size-sm);
  }
}
</style>
