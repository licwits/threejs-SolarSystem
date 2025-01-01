import * as THREE from 'three'
import { gui } from '../gui'

export class Mars {
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 0.266 // 火星半径是地球的0.532倍
    this.rotationSpeed = 0.001 // 自转速度
    this.revolutionSpeed = 0.0024 // 公转速度（火星公转周期约687天）
    this.revolutionAngle = Math.PI * 1.5 // 起始位置在270度
    this.orbitRadius = 0 // 存储轨道半径
    this.eccentricity = 0.093 // 火星轨道偏心率
  }

  async init() {
    try {
      // 加载纹理
      const marsTexture = await this.textureLoader.loadAsync('/textures/Mars/Mars.jpg')
      const normalTexture = await this.textureLoader.loadAsync('/textures/Mars/Mars_NormalMap.png')

      // 创建火星几何体和材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      const material = new THREE.MeshPhongMaterial({
        map: marsTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.1, 0.1),
        shininess: 100,
        specular: new THREE.Color(0x616161)
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true

      // 设置火星轨道位置
      this.orbitRadius = gui.params.orbits.scale * 1.524 // 火星轨道半径（AU）
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载火星纹理失败:', error)
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
      // 火星轨道倾角为1.9度
      const inclination = 1.9
      const inclinationRad = (inclination * Math.PI) / 180

      // 计算椭圆轨道参数
      const a = this.orbitRadius // 半长轴
      const c = a * this.eccentricity // 焦距
      const b = Math.sqrt(a * a - c * c) // 半短轴

      // 先计算在 x-z 平面上的位置
      const x = a * Math.cos(this.revolutionAngle) - c // 减去c使太阳位于焦点
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
      this.orbitRadius = orbitScale * 1.524
      this.updateOrbitPosition()
    }
  }
}
