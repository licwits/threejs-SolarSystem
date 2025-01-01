import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 金星类
 */
export class Venus {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.0035

  constructor() {
    /** 金星网格对象 */
    this.mesh = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 金星半径(地球半径的0.95倍) */
    this.radius = 0.475
    /** 自转速度 */
    this.rotationSpeed = Venus.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Venus.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在90度) */
    this.revolutionAngle = Math.PI * 0.5
    /** 轨道半径 */
    this.orbitRadius = 0
    /** 金星轨道偏心率 */
    this.eccentricity = 0.007
  }

  /**
   * 初始化金星对象
   * @returns {Promise<THREE.Mesh|null>} 金星网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载金星相关纹理贴图
      /** 金星表面纹理贴图 */
      const venusTexture = await this.textureLoader.loadAsync('/textures/Venus/Venus.jpg')
      /** 金星法线贴图 - 用于增加表面细节 */
      const normalTexture = await this.textureLoader.loadAsync('/textures/Venus/Venus_NormalMap.png')

      // 创建金星网格
      /** 金星球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 金星材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: venusTexture, // 颜色贴图
        normalMap: normalTexture, // 法线贴图
        normalScale: new THREE.Vector2(0.1, 0.1), // 法线贴图强度
        shininess: 100, // 高光强度
        specular: new THREE.Color(0x616161) // 高光颜色
      })

      // 创建金星网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true // 投射阴影
      this.mesh.receiveShadow = true // 接收阴影

      // 设置金星在太阳系中的位置
      /** 金星轨道半径 - 0.723天文单位(AU) */
      this.orbitRadius = gui.params.orbits.scale * 0.723
      /** 更新金星在轨道上的位置 */
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载金星纹理失败:', error)
      return null
    }
  }

  /**
   * 更新金星的运动
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
   * 更新金星在轨道上的位置
   * 根据公转角度和轨道参数计算位置
   */
  updateOrbitPosition() {
    if (this.mesh) {
      /** 金星轨道倾角(度) */
      const inclination = 3.4
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

      /** 设置金星的位置 */
      this.mesh.position.set(x, rotatedY, rotatedZ)
    }
  }

  /**
   * 更新金星大小
   * @param {number} sunSize - 太阳大小参数
   */
  updateScale(sunSize) {
    if (this.mesh) {
      /** 根据太阳大小计算新的缩放比例 */
      const newScale = sunSize * this.radius
      /** 统一设置金星的xyz缩放 */
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }

  /**
   * 更新金星轨道
   * @param {number} orbitScale - 轨道缩放比例
   */
  updateOrbit(orbitScale) {
    if (this.mesh) {
      /** 金星轨道半径 - 0.723天文单位(AU) */
      this.orbitRadius = orbitScale * 0.723
      /** 更新金星在轨道上的位置 */
      this.updateOrbitPosition()
    }
  }
}
