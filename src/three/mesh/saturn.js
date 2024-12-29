import * as THREE from 'three'
import { gui } from '../gui'

export class Saturn {
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.radius = 9.449 // 土星相对地球半径比例
    this.rotationSpeed = 0.0001 // 自转速度
    this.revolutionSpeed = 0.000024 // 公转速度（土星公转周期约10759天）
    this.revolutionAngle = 0 // 公转角度
    this.orbitRadius = 0 // 存储轨道半径
    this.ring = null // 土星环
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
        normalScale: new THREE.Vector2(gui.params.saturn.normalScale, gui.params.saturn.normalScale),
        shininess: 100,
        specular: new THREE.Color(0x616161)
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true
      this.mesh.receiveShadow = true

      // 创建土星环
      const ringGeometry = new THREE.RingGeometry(gui.params.sunSize * this.radius * 1.2, gui.params.sunSize * this.radius * 2.0, 64)
      const ringMaterial = new THREE.MeshPhongMaterial({
        map: ringTexture,
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0,
        shininess: 50,
        alphaMap: ringTexture,
        depthWrite: false
      })

      // 修改 UV 以适应环状贴图
      const pos = ringGeometry.attributes.position
      const uv = ringGeometry.attributes.uv
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i)
        const v = uv.getY(i)
        // 将 UV 映射到环形
        const radius = Math.sqrt(pos.getX(i) ** 2 + pos.getZ(i) ** 2)
        const angle = Math.atan2(pos.getZ(i), pos.getX(i))
        uv.setXY(i, angle / (2 * Math.PI) + 0.5, radius)
      }

      this.ring = new THREE.Mesh(ringGeometry, ringMaterial)
      this.ring.rotation.x = Math.PI / 2.5 // 倾斜土星环
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
      // 更新土星位置
      this.mesh.position.x = Math.cos(this.revolutionAngle) * this.orbitRadius
      this.mesh.position.z = Math.sin(this.revolutionAngle) * this.orbitRadius
    }
  }

  updateScale(sunSize) {
    if (this.mesh) {
      const newScale = sunSize * this.radius
      this.mesh.scale.set(newScale, newScale, newScale)

      // 更新土星环大小
      if (this.ring) {
        this.ring.geometry.dispose()
        const ringGeometry = new THREE.RingGeometry(sunSize * this.radius * 1.2, sunSize * this.radius * 2.0, 64)

        // 更新 UV
        const pos = ringGeometry.attributes.position
        const uv = ringGeometry.attributes.uv
        for (let i = 0; i < uv.count; i++) {
          const u = uv.getX(i)
          const v = uv.getY(i)
          const radius = Math.sqrt(pos.getX(i) ** 2 + pos.getZ(i) ** 2)
          const angle = Math.atan2(pos.getZ(i), pos.getX(i))
          uv.setXY(i, angle / (2 * Math.PI) + 0.5, radius)
        }

        this.ring.geometry = ringGeometry
      }
    }
  }

  updateOrbit(orbitScale) {
    if (this.mesh) {
      this.orbitRadius = orbitScale * 9.537
      this.updateOrbitPosition()
    }
  }
}
