import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { camera } from './camera'
import { renderer } from './renderer'

class Controls {
  constructor() {
    this.controls = null
  }

  init() {
    this.controls = new OrbitControls(camera.camera, renderer.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 20
    this.controls.maxDistance = 100
  }

  update() {
    if (this.controls) {
      this.controls.update()
    }
  }
}

export const controls = new Controls()
