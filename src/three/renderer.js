import * as THREE from 'three'

class Renderer {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.outputEncoding = THREE.sRGBEncoding
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

export const renderer = new Renderer()
