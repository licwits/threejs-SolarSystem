import * as THREE from 'three'
import { gui } from '../gui'

export class Earth {
  constructor() {
    this.mesh = null
    this.clouds = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 0.5 // 基准尺寸
    this.rotationSpeed = 0.001 // 自转速度
    this.revolutionSpeed = 0.0017 // 公转速度（地球公转周期365天）
    this.revolutionAngle = Math.PI // 起始位置在180度
    this.orbitRadius = 0 // 存储轨道半径
    this.eccentricity = 0.017 // 地球轨道偏心率
  }

  async init() {
    try {
      // 加载纹理
      const earthTexture = await this.textureLoader.loadAsync('/textures/Earth/earth_daymap.jpg')
      const normalTexture = await this.textureLoader.loadAsync('/textures/Earth/earth_normal_map.jpg')
      const specularTexture = await this.textureLoader.loadAsync('/textures/Earth/earth_specular_map.jpg')
      const cloudsTexture = await this.textureLoader.loadAsync('/textures/Earth/earth_clouds.jpg')

      // 创建地球几何体和材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(gui.params.earth.normalScale, gui.params.earth.normalScale),
        specularMap: specularTexture,
        specular: new THREE.Color(0x333333),
        shininess: 15
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true
      // 设置地球轴倾角（23.5度）
      this.mesh.rotation.z = Math.PI * 0.1305 // 23.5度转弧度

      // 创建云层
      const cloudsGeometry = new THREE.SphereGeometry(
        gui.params.sunSize * this.radius * 1.01, // 略大于地球半径
        64,
        64
      )
      const cloudsMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      })

      this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
      this.mesh.add(this.clouds)

      // 设置地球轨道位置
      this.orbitRadius = gui.params.orbits.scale * 1.0 // 地球轨道半径（1 AU）
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载地球纹理失败:', error)
      return null
    }
  }

  animate() {
    if (this.mesh) {
      // 自转
      this.mesh.rotation.y += this.rotationSpeed
      // 云层自转（略快于地球）
      if (this.clouds) {
        this.clouds.rotation.y += this.rotationSpeed * 1.1
      }

      // 公转
      this.revolutionAngle += this.revolutionSpeed
      this.updateOrbitPosition()
    }
  }

  updateOrbitPosition() {
    if (this.mesh) {
      const inclination = 0.0
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

      // 更新云层大小
      if (this.clouds) {
        this.clouds.geometry.dispose()
        this.clouds.geometry = new THREE.SphereGeometry(sunSize * this.radius * 1.01, 64, 64)
      }
    }
  }

  updateOrbit(orbitScale) {
    if (this.mesh) {
      this.orbitRadius = orbitScale * 1.0
      this.updateOrbitPosition()
    }
  }
}
