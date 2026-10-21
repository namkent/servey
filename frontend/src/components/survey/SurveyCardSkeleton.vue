<template>
  <div class="skeleton-card">
    <div class="sk-status-bar" />
    <div class="sk-body">
      <div class="sk-row">
        <div class="sk-block sk-title" />
        <div class="sk-block sk-badge" />
      </div>
      <div class="sk-block sk-desc" />
      <div class="sk-block sk-desc sk-desc--short" />
      <div class="sk-row sk-meta">
        <div class="sk-block sk-meta-item" />
        <div class="sk-block sk-meta-item" />
      </div>
    </div>
    <div class="sk-footer">
      <div class="sk-block sk-action" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-border);
  overflow: hidden;
  position: relative;
}

.sk-status-bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--color-surface-2);
}

.sk-body {
  flex: 1;
  padding: 16px 16px 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sk-footer {
  padding: 10px 16px 12px 20px;
  border-top: 1px solid var(--color-border);
}

.sk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sk-meta { gap: 12px; justify-content: flex-start; }

.sk-block {
  background: var(--color-surface-2);
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s ease-in-out infinite;
}

.sk-title { height: 18px; width: 70%; border-radius: var(--radius-sm); }
.sk-badge { height: 20px; width: 70px; border-radius: 99px; }
.sk-desc { height: 13px; width: 100%; }
.sk-desc--short { width: 65%; }
.sk-meta-item { height: 12px; width: 80px; }
.sk-action { height: 14px; width: 90px; }

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .sk-block { animation: none; opacity: 0.6; }
}
</style>
