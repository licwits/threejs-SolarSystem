import * as THREE from 'three'
import { gui } from '../gui'

export class Mercury {
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 0.1915 // 原比例0.0383 * 5
    this.rotationSpeed = 0.001 // 加快10倍
    this.revolutionSpeed = 0.0047 // 加快10倍
    this.revolutionAngle = 0 // 起始位置
    this.orbitRadius = 0 // 存储轨道半径
    this.eccentricity = 0.206 // 水星轨道偏心率
  }

  async init() {
    try {
      // 加载纹理
      const mercuryTexture = await this.textureLoader.loadAsync('/textures/Mercury/mercury.jpg')
      const normalTexture = await this.textureLoader.loadAsync('/textures/Mercury/Mercury_NormalMap.png')

      // 创建水星几何体和材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      const material = new THREE.MeshPhongMaterial({
        map: mercuryTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(gui.params.mercury.normalScale, gui.params.mercury.normalScale),
        shininess: 100,
        specular: new THREE.Color(0x616161)
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true

      // 设置水星轨道位置
      this.orbitRadius = gui.params.orbits.scale * 0.387
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载水星纹理失败:', error)
      return null
    }
  }

  animate() {
    if (this.mesh) {
      // 自转
      this.mesh.rotation.y += this.rotationSpeed

      // 公转
      this.revolutionAngle += this.revolutionSpeed
      this.updateOrbitPosition()
    }
  }

  updateOrbitPosition() {
    if (this.mesh) {
      const inclination = 7.0
      const inclinationRad = (inclination * Math.PI) / 180

      // 计算椭圆轨道参数
      const a = this.orbitRadius // 半长轴
      const c = a * this.eccentricity // 焦距
      const b = Math.sqrt(a * a - c * c) // 半短轴

      // 先计算在 x-z 平面上的位置
      const x = a * Math.cos(this.revolutionAngle) - c
      const z = b * Math.sin(this.revolutionAngle)

      // 根据轨道倾角旋转位置
      const rotatedY = -z * Math.sin(inclinationRad)
      const rotatedZ = z * Math.cos(inclinationRad)

      this.mesh.position.set(x, rotatedY, rotatedZ)
    }
  }

  updateScale(sunSize) {
    if (this.mesh) {
      const newScale = sunSize * this.radius
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }

  updateOrbit(orbitScale) {
    if (this.mesh) {
      this.orbitRadius = orbitScale * 0.387
      this.updateOrbitPosition()
    }
  }
}
