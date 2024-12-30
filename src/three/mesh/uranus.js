import * as THREE from 'three'
import { gui } from '../gui'

export class Uranus {
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 0.20035 // 原比例0.04007 * 5
    this.rotationSpeed = 0.001
    this.revolutionSpeed = 0.00012
    this.revolutionAngle = Math.PI * 1.25 // 起始位置在225度
    this.orbitRadius = 0 // 存储轨道半径
    this.ring = null // 天王星环
    this.eccentricity = 0.047 // 天王星轨道偏心率
  }

  async init() {
    try {
      // 加载纹理
      const uranusTexture = await this.textureLoader.loadAsync('/textures/Uranus/Uranus.jpg')

      // 创建天王星几何体和材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      const material = new THREE.MeshPhongMaterial({
        map: uranusTexture,
        shininess: 100,
        specular: new THREE.Color(0x616161)
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true
      // 将天王星整体旋转约98度（天王星的轴倾角为97.77度）
      this.mesh.rotation.z = Math.PI / 2 + Math.PI * 0.0874 // 98度转弧度

      // 创建天王星环（比较细且暗淡）
      const ringGeometry = new THREE.RingGeometry(gui.params.sunSize * this.radius * 1.4, gui.params.sunSize * this.radius * 1.8, 64)
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x89a0b8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
        shininess: 50,
        depthWrite: false
      })

      this.ring = new THREE.Mesh(ringGeometry, ringMaterial)
      // 不需要再单独旋转环，因为整个天王星系统都已经旋转了
      this.mesh.add(this.ring)

      // 设置天王星轨道位置
      this.orbitRadius = gui.params.orbits.scale * 19.191 // 天王星轨道半径（AU）
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载天王星纹理失败:', error)
      return null
    }
  }

  animate() {
    if (this.mesh) {
      // 自转（现在是绕z轴旋转，因为天王星被旋转了）
      this.mesh.rotation.z += this.rotationSpeed

      // 公转
      this.revolutionAngle += this.revolutionSpeed
      this.updateOrbitPosition()
    }
  }

  updateOrbitPosition() {
    if (this.mesh) {
      const inclination = 0.8
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

      // 更新天王星环大小
      if (this.ring) {
        this.ring.geometry.dispose()
        this.ring.geometry = new THREE.RingGeometry(sunSize * this.radius * 1.4, sunSize * this.radius * 1.8, 64)
      }
    }
  }

  updateOrbit(orbitScale) {
    if (this.mesh) {
      this.orbitRadius = orbitScale * 19.191
      this.updateOrbitPosition()
    }
  }
}
