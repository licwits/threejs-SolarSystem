import * as THREE from 'three'
import { Sun } from './mesh/sun'

class Scene {
  constructor() {
    this.scene = new THREE.Scene()
    this.sun = new Sun()
  }

  async init() {
    // 设置场景背景为深色
    this.scene.background = new THREE.Color(0x000000)

    // 初始化并添加太阳
    const sunMesh = await this.sun.init()
    this.scene.add(sunMesh)

    return this.scene
  }

  animate() {
    // 更新太阳动画
    this.sun.animate()
  }
}

export const scene = new Scene()
