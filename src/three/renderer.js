import * as THREE from 'three'

/**
 * 渲染器
 */
class Renderer {
  constructor() {
    // 检查 WebGL 支持
    if (!this.checkWebGLSupport()) {
      alert('您的浏览器不支持 WebGL，请更换浏览器或启用硬件加速')
      return
    }

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      // alpha: true,
      // powerPreference: 'high-performance' // 优先使用高性能GPU
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.outputEncoding = THREE.sRGBEncoding
  }

  /**
   * 检查WebGL支持
   * @returns {boolean}
   */
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    } catch (e) {
      return false
    }
  }

  /**
   * 调整渲染器大小
   */
  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

export const renderer = new Renderer()
