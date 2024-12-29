import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { Sun } from './mesh/sun'
import { Orbits } from './mesh/orbits'
import { Mercury } from './mesh/mercury'
import { Venus } from './mesh/venus'
import { Mars } from './mesh/mars'
import { Jupiter } from './mesh/jupiter'
import { Saturn } from './mesh/saturn'
import { Uranus } from './mesh/uranus'

class Scene {
  constructor() {
    this.scene = new THREE.Scene()
    this.sun = new Sun()
    this.orbits = new Orbits()
    this.mercury = new Mercury()
    this.venus = new Venus()
    this.mars = new Mars()
    this.jupiter = new Jupiter()
    this.saturn = new Saturn()
    this.uranus = new Uranus()
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

    // 添加金星
    const venusMesh = await this.venus.init()
    this.scene.add(venusMesh)

    // 添加火星
    const marsMesh = await this.mars.init()
    this.scene.add(marsMesh)

    // 添加木星
    const jupiterMesh = await this.jupiter.init()
    this.scene.add(jupiterMesh)

    // 添加土星
    const saturnMesh = await this.saturn.init()
    this.scene.add(saturnMesh)

    // 添加天王星
    const uranusMesh = await this.uranus.init()
    this.scene.add(uranusMesh)

    return this.scene
  }

  animate() {
    // 更新太阳动画
    this.sun.animate()
    // 更新水星动画
    this.mercury.animate()
    // 更新金星动画
    this.venus.animate()
    // 更新火星动画
    this.mars.animate()
    // 更新木星动画
    this.jupiter.animate()
    // 更新土星动画
    this.saturn.animate()
    // 更新天王星动画
    this.uranus.animate()
  }
}

export const scene = new Scene()
