<template>
  <div class="home">
    <div
      ref="container"
      class="three-container"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { init } from '@/three/init'

const container = ref(null)

onMounted(async () => {
  if (container.value) {
    await init(container.value)
  }
})
</script>

<style scoped>
.three-container {
  width: 100vw;
  height: 100vh;
}
</style>
