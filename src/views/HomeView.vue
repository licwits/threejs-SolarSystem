<template>
  <div class="home">
    <LoadingScreen
      :is-loading="isLoading"
      :progress="loadingProgress"
    />
    <div
      ref="container"
      class="three-container"
    ></div>
    <TimeController />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { init } from '@/three/init'
import TimeController from '@/components/TimeController.vue'
import LoadingScreen from '@/components/LoadingScreen.vue'

const container = ref(null)
const isLoading = ref(true)
const loadingProgress = ref(0)

onMounted(async () => {
  if (container.value) {
    try {
      await init(container.value, (progress) => {
        loadingProgress.value = Math.round(progress * 100)
      })
      isLoading.value = false
    } catch (error) {
      console.error('初始化失败:', error)
    }
  }
})
</script>

<style scoped>
.three-container {
  width: 100vw;
  height: 100vh;
}
</style>
