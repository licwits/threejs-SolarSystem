import * as THREE from 'three'

class AxesHelper {
  constructor() {
    this.axesHelper = new THREE.AxesHelper(20)
  }

  init(scene) {
    scene.add(this.axesHelper)
  }
}

export const axesHelper = new AxesHelper()
