import * as THREE from 'three'
import { gui } from '../gui'
import ringVertexShader from '@/shader/saturnRing/vertex.glsl?raw'
import ringFragmentShader from '@/shader/saturnRing/fragment.glsl?raw'

export class Saturn {
  static DEFAULT_ROTATION_SPEED = 0.001
  static DEFAULT_REVOLUTION_SPEED = 0.00028

  constructor() {
    this.mesh = null
    this.ring = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 4.73 // 土星半径是地球的9.46倍
    this.rotationSpeed = Saturn.DEFAULT_ROTATION_SPEED
    this.revolutionSpeed = Saturn.DEFAULT_REVOLUTION_SPEED
    this.revolutionAngle = Math.PI * 0.75 // 起始位置在135度
    this.orbitRadius = 0 // 存储轨道半径
    this.eccentricity = 0.054 // 土星轨道偏心率
    this.axialTilt = Math.PI * 0.1485 // 26.73度转弧度
  }

  async init() {
    try {
      // 加载纹理
      const saturnTexture = await this.textureLoader.loadAsync('/textures/Saturn/Saturn.jpg')
      const normalTexture = await this.textureLoader.loadAsync('/textures/Saturn/Saturn_NormalMap.png')
      const ringTexture = await this.textureLoader.loadAsync('/textures/Saturn/saturn_ring_alpha.png')

      // 创建土星几何体和材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      const material = new THREE.MeshPhongMaterial({
        map: saturnTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.1, 0.1),
        shininess: 100,
        specular: new THREE.Color(0x616161)
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true
      // 设置土星轴倾角
      this.mesh.rotation.z = this.axialTilt

      // 创建土星环
      const ringGeometry = new THREE.RingGeometry(gui.params.sunSize * this.radius * 1.2, gui.params.sunSize * this.radius * 2.5, 256, 8)

      // 使用自定义着色器材质
      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          ringTexture: { value: ringTexture },
          innerRadius: { value: gui.params.sunSize * this.radius * 1.2 },
          outerRadius: { value: gui.params.sunSize * this.radius * 2.5 }
        },
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false
      })

      this.ring = new THREE.Mesh(ringGeometry, ringMaterial)
      this.ring.rotation.x = Math.PI / 2
      this.mesh.add(this.ring)

      // 设置土星轨道位置
      this.orbitRadius = gui.params.orbits.scale * 9.537 // 土星轨道半径（AU）
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载土星纹理失败:', error)
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
      const inclination = 2.5
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

      // // 更新土星环大小
      // if (this.ring) {
      //   this.ring.geometry.dispose()
      //   const ringGeometry = new THREE.RingGeometry(sunSize * this.radius * 1.2, sunSize * this.radius * 2.5, 256, 8)

      //   // 更新 UV
      //   const pos = ringGeometry.attributes.position
      //   const uv = ringGeometry.attributes.uv

      //   for (let i = 0; i < uv.count; i++) {
      //     const vertex = new THREE.Vector3()
      //     vertex.fromBufferAttribute(pos, i)

      //     const angle = (Math.atan2(vertex.z, vertex.x) + Math.PI) / (Math.PI * 2)
      //     const radius = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z)
      //     const normalizedRadius = (radius - sunSize * this.radius * 1.2) / (sunSize * this.radius * 1.3)

      //     // 交换 UV 坐标
      //     uv.setXY(i, normalizedRadius, angle)
      //   }

      //   this.ring.geometry = ringGeometry
      // }
    }
  }

  updateOrbit(orbitScale) {
    if (this.mesh) {
      this.orbitRadius = orbitScale * 9.537
      this.updateOrbitPosition()
    }
  }
}
