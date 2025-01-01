import * as THREE from 'three'
import { gui } from '../gui'
import ringVertexShader from '@/shader/saturnRing/vertex.glsl?raw'
import ringFragmentShader from '@/shader/saturnRing/fragment.glsl?raw'

/**
 * 土星
 */
export class Saturn {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.00028

  constructor() {
    /** 土星网格对象 */
    this.mesh = null
    /** 土星环网格对象 */
    this.ring = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 土星半径(地球半径的9.46倍) */
    this.radius = 4.73
    /** 自转速度 */
    this.rotationSpeed = Saturn.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Saturn.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在135度) */
    this.revolutionAngle = Math.PI * 0.75
    /** 轨道半径 */
    this.orbitRadius = 0
    /** 土星轨道偏心率 */
    this.eccentricity = 0.054
    /** 轴倾角(26.73度) */
    this.axialTilt = Math.PI * 0.1485
  }

  /**
   * 初始化土星对象
   * @returns {Promise<THREE.Mesh|null>} 土星网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载土星相关纹理贴图
      /** 土星表面纹理贴图 */
      const saturnTexture = await this.textureLoader.loadAsync('/textures/Saturn/Saturn.jpg')
      /** 土星法线贴图 - 用于增加表面细节 */
      const normalTexture = await this.textureLoader.loadAsync('/textures/Saturn/Saturn_NormalMap.png')
      /** 土星环纹理贴图 */
      const ringTexture = await this.textureLoader.loadAsync('/textures/Saturn/saturn_ring_alpha.png')

      // 创建土星网格
      /** 土星球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 土星材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: saturnTexture, // 颜色贴图
        normalMap: normalTexture, // 法线贴图
        normalScale: new THREE.Vector2(0.1, 0.1), // 法线贴图强度
        shininess: 100, // 高光强度
        specular: new THREE.Color(0x616161) // 高光颜色
      })

      // 创建土星网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true // 投射阴影
      this.mesh.receiveShadow = true // 接收阴影
      /** 设置土星轴倾角(约26.73度) */
      this.mesh.rotation.z = this.axialTilt

      // 创建土星环
      /** 土星环几何体 - 内径为土星半径的1.2倍,外径为2.5倍 */
      const ringGeometry = new THREE.RingGeometry(gui.params.sunSize * this.radius * 1.2, gui.params.sunSize * this.radius * 2.5, 256, 8)

      /** 土星环材质 - 使用自定义着色器实现透明效果 */
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

      /** 创建土星环网格对象并设置旋转 */
      this.ring = new THREE.Mesh(ringGeometry, ringMaterial)
      this.ring.rotation.x = Math.PI / 2 // 旋转90度使环与赤道面平行
      this.mesh.add(this.ring)

      // 设置土星在太阳系中的位置
      /** 土星轨道半径 - 9.537天文单位(AU) */
      this.orbitRadius = gui.params.orbits.scale * 9.537
      /** 更新土星在轨道上的位置 */
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载土星纹理失败:', error)
      return null
    }
  }

  /**
   * 更新土星的运动
   * 包括自转和公转
   */
  animate() {
    if (this.mesh) {
      // 自转
      this.mesh.rotation.y += this.rotationSpeed

      // 公转
      this.revolutionAngle += this.revolutionSpeed
      this.updateOrbitPosition()
    }
  }

  /**
   * 更新土星在轨道上的位置
   * 根据公转角度和轨道参数计算位置
   */
  updateOrbitPosition() {
    if (this.mesh) {
      /** 土星轨道倾角(度) */
      const inclination = 2.5
      /** 将倾角转换为弧度 */
      const inclinationRad = (inclination * Math.PI) / 180

      // 计算椭圆轨道参数
      /** 轨道长半轴 */
      const a = this.orbitRadius
      /** 轨道焦距 */
      const c = a * this.eccentricity
      /** 轨道短半轴 */
      const b = Math.sqrt(a * a - c * c)

      // 先计算在 x-z 平面上的位置
      /** x坐标 - 减去c使太阳位于焦点 */
      const x = a * Math.cos(this.revolutionAngle) - c
      /** z坐标 */
      const z = b * Math.sin(this.revolutionAngle)

      /** 应用倾角后的y坐标 */
      const rotatedY = -z * Math.sin(inclinationRad)
      /** 应用倾角后的z坐标 */
      const rotatedZ = z * Math.cos(inclinationRad)

      /** 设置土星的位置 */
      this.mesh.position.set(x, rotatedY, rotatedZ)
    }
  }

  /**
   * 更新土星大小
   * @param {number} sunSize - 太阳大小参数
   */
  updateScale(sunSize) {
    if (this.mesh) {
      /** 根据太阳大小计算新的缩放比例 */
      const newScale = sunSize * this.radius
      /** 统一设置土星的xyz缩放 */
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }

  /**
   * 更新土星轨道
   * @param {number} orbitScale - 轨道缩放比例
   */
  updateOrbit(orbitScale) {
    if (this.mesh) {
      /** 土星轨道半径 - 9.537天文单位(AU) */
      this.orbitRadius = orbitScale * 9.537
      /** 更新土星在轨道上的位置 */
      this.updateOrbitPosition()
    }
  }
}
