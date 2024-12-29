import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { Sun } from './mesh/sun'
import { Orbits } from './mesh/orbits'
import { Mercury } from './mesh/mercury'

class Scene {
  constructor() {
    this.scene = new THREE.Scene()
    this.sun = new Sun()
    this.orbits = new Orbits()
    this.mercury = new Mercury()
    this.sunLight = null
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

    // 创建太阳点光源
    this.sunLight = new THREE.PointLight(0xffffff, 5, 0, 0)
    this.sunLight.castShadow = true
    this.sunLight.position.set(0, 0, 0)
    this.scene.add(this.sunLight)

    // 添加轨道
    const orbitGroup = this.orbits.init()
    this.scene.add(orbitGroup)

    // 添加水星
    const mercuryMesh = await this.mercury.init()
    this.scene.add(mercuryMesh)

    return this.scene
  }

  animate() {
    // 更新太阳动画
    this.sun.animate()
    // 更新水星动画
    this.mercury.animate()
  }
}

export const scene = new Scene()
