import * as THREE from 'three'
import { gui } from '../gui'

export class Neptune {
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 1.94 // 海王星半径是地球的3.88倍
    this.rotationSpeed = 0.001
    this.revolutionSpeed = 0.000061
    this.revolutionAngle = Math.PI * 1.75 // 起始位置在315度
    this.orbitRadius = 0 // 存储轨道半径
    this.eccentricity = 0.009 // 海王星轨道偏心率
  }

  async init() {
    try {
      // 加载纹理
      const neptuneTexture = await this.textureLoader.loadAsync('/textures/Neptune/Neptune.jpg')

      // 创建海王星几何体和材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      const material = new THREE.MeshPhongMaterial({
        map: neptuneTexture,
        shininess: 100,
        specular: new THREE.Color(0x616161)
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true
      // 设置海王星轴倾角（约28.32度）
      this.mesh.rotation.z = Math.PI * 0.157 // 28.32度转弧度

      // 设置海王星轨道位置
      this.orbitRadius = gui.params.orbits.scale * 30.069 // 海王星轨道半径（AU）
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载海王星纹理失败:', error)
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
      const inclination = 1.8
      const inclinationRad = (inclination * Math.PI) / 180

      // 计算椭圆轨道参数
      const a = this.orbitRadius
      const c = a * this.eccentricity
      const b = Math.sqrt(a * a - c * c)

      // 先计算在 x-z 平面上的位置
      const x = a * Math.cos(this.revolutionAngle) - c
      const z = b * Math.sin(this.revolutionAngle)

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
      this.orbitRadius = orbitScale * 30.069
      this.updateOrbitPosition()
    }
  }
}
