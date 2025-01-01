import * as THREE from 'three'
import { gui } from '../gui'

export class Moon {
  static DEFAULT_ROTATION_SPEED = 0.0001
  static DEFAULT_REVOLUTION_SPEED = 0.005

  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 0.136 // 月球半径是地球的0.272倍
    this.rotationSpeed = Moon.DEFAULT_ROTATION_SPEED
    this.revolutionSpeed = Moon.DEFAULT_REVOLUTION_SPEED
    this.revolutionAngle = 0 // 起始角度
    this.orbitRadius = 5.0 // 月球轨道半径（约30个地球半径，这里缩小以便观察）
    this.eccentricity = 0.0549 // 月球轨道偏心率
    this.inclination = 5.145 // 月球轨道倾角（相对于地球轨道）
  }

  async init() {
    try {
      // 加载月球纹理
      const moonTexture = await this.textureLoader.loadAsync('/textures/Moon/moon.png')
      const normalTexture = await this.textureLoader.loadAsync('/textures/Moon/moon_NormalMap.png')

      // 创建月球几何体和材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      const material = new THREE.MeshPhongMaterial({
        map: moonTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.1, 0.1),
        shininess: 10,
        specular: new THREE.Color(0x666666)
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true
      this.mesh.position.set(this.orbitRadius, 0, 0)

      return this.mesh
    } catch (error) {
      console.error('加载月球纹理失败:', error)
      return null
    }
  }

  animate(earth) {
    if (this.mesh && earth) {
      // 自转
      this.mesh.rotation.y += this.rotationSpeed

      // 计算月球轨道参数
      const a = this.orbitRadius // 半长轴
      const c = a * this.eccentricity // 焦距
      const b = Math.sqrt(a * a - c * c) // 半短轴

      // 更新公转角度
      this.revolutionAngle += this.revolutionSpeed

      // 计算月球相对于地球的位置
      const inclinationRad = (this.inclination * Math.PI) / 180
      const x = a * Math.cos(this.revolutionAngle) - c
      const z = b * Math.sin(this.revolutionAngle)

      // 应用轨道倾角
      const rotatedY = -z * Math.sin(inclinationRad)
      const rotatedZ = z * Math.cos(inclinationRad)

      // 获取地球的世界位置
      const earthPosition = new THREE.Vector3()
      earth.mesh.getWorldPosition(earthPosition)

      // 设置月球位置（相对于地球）
      this.mesh.position.set(earthPosition.x + x, earthPosition.y + rotatedY, earthPosition.z + rotatedZ)
    }
  }

  updateScale(sunSize) {
    if (this.mesh) {
      const newScale = sunSize * this.radius
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }
}
