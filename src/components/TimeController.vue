<script setup>
import { ref, computed } from 'vue'
import { scene } from '@/three/scene'
import startIcon from '@/assets/icons/start.svg'
import pauseIcon from '@/assets/icons/pause.svg'

/**
 * @description 控制时间流逝状态和速度的响应式变量
 */
const isPaused = ref(false) // 是否暂停
const speedMultiplier = ref(1) // 速度倍率
const previousSpeed = ref(1) // 暂停前的速度值,用于恢复
const speedChangeInterval = ref(null) // 长按改变速度的定时器
const clickTimeout = ref(null) // 区分单击和长按的定时器

/**
 * @description 计算属性 - 根据暂停状态返回对应的图标
 */
const playPauseIcon = computed(() => (isPaused.value ? startIcon : pauseIcon))

/**
 * @description 计算属性 - 根据当前速度生成显示文本
 * @returns {string} 显示的速度文本,包含方向和倍率
 */
const speedText = computed(() => {
  if (isPaused.value) return 'PAUSED'
  const speed = Math.abs(speedMultiplier.value)
  const direction = speedMultiplier.value < 0 ? '-' : ''
  return `${direction}${speed.toFixed(1)}× RATE`
})

/**
 * @description 限制速度在合理范围内
 * @param {number} speed - 需要限制的速度值
 * @returns {number} 限制后的速度值
 */
const clampSpeed = (speed) => {
  return Math.max(-10, Math.min(10, speed))
}

const SPEED_STEP = 0.1 // 每次改变速度的步长

/**
 * @description 改变系统运行速度
 * @param {string} direction - 改变方向,'forward'或'backward'
 */
const changeSpeed = (direction) => {
  if (isPaused.value) {
    isPaused.value = false
  }
  const newSpeed = speedMultiplier.value + (direction === 'backward' ? -SPEED_STEP : SPEED_STEP)
  speedMultiplier.value = clampSpeed(newSpeed)
  updateSpeed()
}

/**
 * @description 开始持续改变速度(用于长按)
 * @param {string} direction - 改变方向,'forward'或'backward'
 */
const startSpeedChange = (direction) => {
  if (clickTimeout.value) {
    clearTimeout(clickTimeout.value)
    clickTimeout.value = null
  }

  clearInterval(speedChangeInterval.value)

  clickTimeout.value = setTimeout(() => {
    clickTimeout.value = null
    speedChangeInterval.value = setInterval(() => {
      changeSpeed(direction)
    }, 100)
  }, 300)

  changeSpeed(direction)
}

/**
 * @description 停止持续改变速度
 */
const stopSpeedChange = () => {
  if (clickTimeout.value) {
    clearTimeout(clickTimeout.value)
    clickTimeout.value = null
  }

  clearInterval(speedChangeInterval.value)
  speedChangeInterval.value = null
}

/**
 * @description 更新所有行星的运动速度
 * @param {number} multiplier - 速度倍率
 */
const updateAllPlanets = (multiplier) => {
  const planets = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'moon']
  planets.forEach((planetName) => {
    const planet = scene[planetName]
    if (planet) {
      // 更新自转速度
      planet.rotationSpeed = planet.constructor.DEFAULT_ROTATION_SPEED * multiplier
      // 更新公转速度（如果有的话）
      if ('revolutionSpeed' in planet) {
        planet.revolutionSpeed = planet.constructor.DEFAULT_REVOLUTION_SPEED * multiplier
      }
    }
  })
}

/**
 * @description 更新系统运行速度
 */
const updateSpeed = () => {
  if (!isPaused.value) {
    updateAllPlanets(speedMultiplier.value)
  }
}

/**
 * @description 切换暂停/运行状态
 */
const togglePause = () => {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    previousSpeed.value = speedMultiplier.value
    speedMultiplier.value = 0
  } else {
    speedMultiplier.value = previousSpeed.value
  }
  updateAllPlanets(speedMultiplier.value)
}
</script>

<template>
  <div class="time-controller">
    <div class="speed-display">{{ speedText }}</div>
    <div class="controls">
      <button
        class="control-btn"
        @mousedown="startSpeedChange('backward')"
        @mouseup="stopSpeedChange"
        @mouseleave="stopSpeedChange"
      >
        <img
          src="@/assets/icons/back_forward.svg"
          alt="backward"
        />
      </button>
      <button
        class="control-btn"
        @click="togglePause"
      >
        <img
          :src="playPauseIcon"
          alt="play/pause"
        />
      </button>
      <button
        class="control-btn"
        @mousedown="startSpeedChange('forward')"
        @mouseup="stopSpeedChange"
        @mouseleave="stopSpeedChange"
      >
        <img
          src="@/assets/icons/back_forward.svg"
          alt="forward"
          class="flip-horizontal"
        />
      </button>
    </div>
    <input
      type="range"
      class="speed-slider"
      min="-10"
      max="10"
      step="0.1"
      v-model="speedMultiplier"
      @input="updateSpeed"
    />
  </div>
</template>

<style scoped>
.time-controller {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  background: rgba(0, 0, 0, 0.5);
  padding: 20px;
  border-radius: 10px;
  backdrop-filter: blur(5px);
  font-family: Metropolis, sans-serif;
}

.speed-display {
  color: white;
  font-size: 18px;
  font-family: Metropolis, sans-serif;
  text-align: center;
}

.controls {
  display: flex;
  gap: 30px;
  align-items: center;
}

.control-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.control-btn:hover {
  opacity: 1;
}

.control-btn img {
  width: 32px;
  height: 32px;
  filter: invert(1);
}

.flip-horizontal {
  transform: scaleX(-1);
}

.speed-slider {
  width: 280px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  height: 6px;
  border-radius: 2px;
  outline: none;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

.speed-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
