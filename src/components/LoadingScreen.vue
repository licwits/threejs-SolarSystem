<template>
  <div
    class="loading-screen"
    :class="{ 'fade-out': !isLoading }"
  >
    <div class="loading-content">
      <div class="solar-system">
        <div class="sun"></div>
        <div class="earth-orbit">
          <div class="earth"></div>
        </div>
      </div>
      <div class="loading-text">
        <span>加载中</span>
        <span class="dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
      <div class="progress-bar">
        <div
          class="progress"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  isLoading: {
    type: Boolean,
    required: true
  },
  progress: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.5s ease;
}

.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loading-content {
  text-align: center;
  color: white;
}

.solar-system {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
}

.sun {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px;
  background: #ffaa00;
  border-radius: 50%;
  box-shadow: 0 0 20px #ffaa00;
  animation: glow 2s ease-in-out infinite alternate;
}

.earth-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150px;
  height: 150px;
  margin: -75px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: rotate 4s linear infinite;
}

.earth {
  position: absolute;
  top: -6px;
  left: 50%;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  background: #4169e1;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(65, 105, 225, 0.6);
}

.loading-text {
  font-size: 24px;
  margin: 20px 0;
  font-family: '山海汲古明刻';
}

.dots span {
  opacity: 0;
  animation: dots 1.4s infinite;
}

.dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin: 20px auto;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #ffaa00;
  transition: width 0.3s ease;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow {
  from {
    box-shadow: 0 0 20px #ffaa00;
  }
  to {
    box-shadow: 0 0 30px #ffaa00, 0 0 40px #ffaa00;
  }
}

@keyframes dots {
  0%,
  20% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
