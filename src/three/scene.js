import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { Sun } from './mesh/sun'
import { Orbits } from './mesh/orbits'

class Scene {
  constructor() {
    this.scene = new THREE.Scene()
    this.sun = new Sun()
    this.orbits = new Orbits()
  }

  async init() {
    // 加载 HDR 环境贴图
    const rgbeLoader = new RGBELoader()
    const envMap = await rgbeLoader.loadAsync('/textures/hdr/Starfield.hdr')

    // 设置环境贴图
    envMap.mapping = THREE.EquirectangularReflectionMapping
    this.scene.environment = envMap
    this.scene.background = envMap

    // 调整环境贴图的强度
    this.scene.backgroundIntensity = 0.5
    this.scene.environmentIntensity = 0.5

    // 初始化并添加太阳
    const sunMesh = await this.sun.init()
    this.scene.add(sunMesh)

    // 添加轨道
    const orbitGroup = this.orbits.init()
    this.scene.add(orbitGroup)

    return this.scene
  }

  animate() {
    // 更新太阳动画
    this.sun.animate()
  }
}

export const scene = new Scene()
