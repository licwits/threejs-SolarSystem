import * as THREE from 'three'
import { gui } from '../gui'

export class Jupiter {
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 0.6045 // 原比例0.1209 * 5
    this.rotationSpeed = 0.001 // 自转速度
    this.revolutionSpeed = 0.00038 // 公转速度（木星公转周期约4333天）
    this.revolutionAngle = Math.PI * 0.25 // 起始位置在45度
    this.orbitRadius = 0 // 存储轨道半径
  }

  async init() {
    try {
      // 加载纹理
      const jupiterTexture = await this.textureLoader.loadAsync('/textures/Jupiter/Jupiter.jpg')
      const normalTexture = await this.textureLoader.loadAsync('/textures/Jupiter/Jupiter_NormalMap.png')

      // 创建木星几何体和材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      const material = new THREE.MeshPhongMaterial({
        map: jupiterTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(gui.params.jupiter.normalScale, gui.params.jupiter.normalScale),
        shininess: 100,
        specular: new THREE.Color(0x616161)
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true

      // 设置木星轨道位置
      this.orbitRadius = gui.params.orbits.scale * 5.203 // 木星轨道半径（AU）
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载木星纹理失败:', error)
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
      // 更新木星位置
      this.mesh.position.x = Math.cos(this.revolutionAngle) * this.orbitRadius
      this.mesh.position.z = Math.sin(this.revolutionAngle) * this.orbitRadius
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
      this.orbitRadius = orbitScale * 5.203
      this.updateOrbitPosition()
    }
  }
}
