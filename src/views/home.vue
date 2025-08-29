<template>
  <div class="modern-home">
    <div class="home-header">
      <div class="welcome-section">
        <h1 class="page-title">欢迎使用公告通</h1>
        <p class="page-subtitle">专业的财务报告下载与转换工具</p>
      </div>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🇺🇸</div>
        <h3 class="feature-title">美股公告下载</h3>
        <p class="feature-description">支持下载SEC美股上市公司年报、季报等各类财务公告</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🇨🇳</div>
        <h3 class="feature-title">A股公告下载</h3>
        <p class="feature-description">批量下载A股上市公司财务报告和公告文件</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📄</div>
        <h3 class="feature-title">PDF转换</h3>
        <p class="feature-description">高效的PDF文档转换功能，支持多种格式输出</p>
      </div>
    </div>

    <div class="info-sections">
      <section class="info-card">
        <div class="card-header">
          <h2 class="section-title">关于我们</h2>
        </div>
        <div class="card-body">
          <p class="section-content">
            我们是拥有10年+经验的程序员团队，致力于为不会编程、不会爬虫的用户提供便捷的数据收集和整理工具。
            让专业的人做专业的事，最大限度地提高工作质量和效率，为您节省宝贵的时间和精力。
          </p>
        </div>
      </section>

      <section class="info-card">
        <div class="card-header">
          <h2 class="section-title">软件声明</h2>
        </div>
        <div class="card-body">
          <ul class="feature-list">
            <li class="feature-item">
              <span class="feature-dot">✓</span>
              <span>软件完全开源</span>
            </li>
            <li class="feature-item">
              <span class="feature-dot">✓</span>
              <span>永久免费使用</span>
            </li>
            <li class="feature-item">
              <span class="feature-dot">✓</span>
              <span>如有侵权问题，请联系我们删除</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="info-card">
        <div class="card-header">
          <h2 class="section-title">联系我们</h2>
        </div>
        <div class="card-body">
          <div class="contact-grid">
            <div class="contact-item">
              <div class="contact-icon">📧</div>
              <div class="contact-info">
                <span class="contact-label">邮箱</span>
                <span class="contact-value">gonggaotong2024@163.com</span>
              </div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">💬</div>
              <div class="contact-info">
                <span class="contact-label">微信</span>
                <span class="contact-value">417990683</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
<script lang="ts" setup></script>
<style lang="less" scoped>
.modern-home {
  max-width: 1000px;
  margin: 0 auto;
}

.home-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.welcome-section {
  .page-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-4) 0;
    line-height: var(--line-height-tight);
  }

  .page-subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin: 0;
    font-weight: var(--font-weight-regular);
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-12);
}

.feature-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  transition: all var(--transition-base);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary-light);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: var(--space-4);
    display: block;
  }

  .feature-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
  }

  .feature-description {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.info-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  transition: box-shadow var(--transition-base);

  &:hover {
    box-shadow: var(--shadow-base);
  }

  .card-header {
    padding: var(--space-6);
    background: var(--color-bg-tertiary);
    border-bottom: 1px solid var(--color-border-light);

    .section-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }
  }

  .card-body {
    padding: var(--space-6);
  }
}

.section-content {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);

  .feature-dot {
    color: var(--color-success);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
  }
}

.contact-grid {
  display: grid;
  gap: var(--space-6);
}

.contact-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-base);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
  }
}

.contact-icon {
  font-size: var(--font-size-2xl);
  min-width: 40px;
  text-align: center;
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.contact-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-medium);
}

.contact-value {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.contact-link {
  font-size: var(--font-size-base);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-header {
    margin-bottom: var(--space-8);
  }

  .welcome-section .page-title {
    font-size: var(--font-size-3xl);
  }

  .welcome-section .page-subtitle {
    font-size: var(--font-size-md);
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
  }

  .feature-card {
    padding: var(--space-6);
  }

  .info-card .card-header,
  .info-card .card-body {
    padding: var(--space-4);
  }
}
</style>
