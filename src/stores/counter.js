import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const bloomLayer = ref(1)
  return { bloomLayer }
})
