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
import { Neptune } from './mesh/neptune'
import { Earth } from './mesh/earth'
import { AsteroidBelt } from './mesh/asteroidBelt'
import { Comet } from './mesh/comet'

class Scene {
  constructor() {
    this.scene = new THREE.Scene()
    this.sun = new Sun()
    this.orbits = new Orbits()
    this.mercury = new Mercury()
    this.venus = new Venus()
    this.earth = new Earth()
    this.mars = new Mars()
    this.asteroidBelt = new AsteroidBelt()
    this.jupiter = new Jupiter()
    this.saturn = new Saturn()
    this.uranus = new Uranus()
    this.neptune = new Neptune()
    this.sunLight = null
    this.comet = new Comet()
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

    // 添加地球
    const earthMesh = await this.earth.init()
    this.scene.add(earthMesh)

    // 添加火星
    const marsMesh = await this.mars.init()
    this.scene.add(marsMesh)

    // 添加小行星带
    const asteroidBeltMesh = this.asteroidBelt.init()
    this.scene.add(asteroidBeltMesh)

    // 添加木星
    const jupiterMesh = await this.jupiter.init()
    this.scene.add(jupiterMesh)

    // 添加土星
    const saturnMesh = await this.saturn.init()
    this.scene.add(saturnMesh)

    // 添加天王星
    const uranusMesh = await this.uranus.init()
    this.scene.add(uranusMesh)

    // 添加海王星
    const neptuneMesh = await this.neptune.init()
    this.scene.add(neptuneMesh)

    // 添加彗星
    const cometMesh = this.comet.init()
    this.scene.add(cometMesh)

    return this.scene
  }

  animate() {
    // 更新太阳动画
    this.sun.animate()
    // 更新水星动画
    this.mercury.animate()
    // 更新金星动画
    this.venus.animate()
    // 更新地球动画
    this.earth.animate()
    // 更新火星动画
    this.mars.animate()
    // 更新小行星带
    this.asteroidBelt.animate()
    // 更新木星动画
    this.jupiter.animate()
    // 更新土星动画
    this.saturn.animate()
    // 更新天王星动画
    this.uranus.animate()
    // 更新海王星动画
    this.neptune.animate()
    this.comet.animate()
  }
}

export const scene = new Scene()
