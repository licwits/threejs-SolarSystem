import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 海王星
 */
export class Neptune {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.00007

  constructor() {
    /** 海王星网格对象 */
    this.mesh = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 海王星半径(地球半径的3.88倍) */
    this.radius = 1.94
    /** 自转速度 */
    this.rotationSpeed = Neptune.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Neptune.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在315度) */
    this.revolutionAngle = Math.PI * 1.75
    /** 轨道半径 */
    this.orbitRadius = 0
    /** 海王星轨道偏心率 */
    this.eccentricity = 0.009
    /** 轴倾角(28.32度) */
    this.axialTilt = Math.PI * 0.1551
  }

  /**
   * 初始化海王星对象
   * @returns {Promise<THREE.Mesh|null>} 海王星网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载海王星相关纹理贴图
      /** 海王星表面纹理贴图 */
      const neptuneTexture = await this.textureLoader.loadAsync('/textures/Neptune/Neptune.jpg')

      // 创建海王星网格
      /** 海王星球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 海王星材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: neptuneTexture,            // 颜色贴图
        shininess: 100,                 // 高光强度
        specular: new THREE.Color(0x616161) // 高光颜色
      })

      // 创建海王星网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true     // 投射阴影
      this.mesh.receiveShadow = true  // 接收阴影
      
      /** 设置海王星轴倾角(约28.32度) */
      this.mesh.rotation.z = Math.PI * 0.157 // 28.32度转弧度

      // 设置海王星在太阳系中的位置
      /** 海王星轨道半径 - 30.069天文单位(AU) */
      this.orbitRadius = gui.params.orbits.scale * 30.069
      /** 更新海王星在轨道上的位置 */
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载海王星纹理失败:', error)
      return null
    }
  }
  /**
   * 更新海王星的运动
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
   * 更新海王星在轨道上的位置
   * 根据公转角度和轨道参数计算位置
   */
  updateOrbitPosition() {
    if (this.mesh) {
      /** 海王星轨道倾角(度) */
      const inclination = 1.8
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

      /** 设置海王星的位置 */
      this.mesh.position.set(x, rotatedY, rotatedZ)
    }
  }

  /**
   * 更新海王星大小
   * @param {number} sunSize - 太阳大小参数
   */
  updateScale(sunSize) {
    if (this.mesh) {
      /** 根据太阳大小计算新的缩放比例 */
      const newScale = sunSize * this.radius
      /** 统一设置海王星的xyz缩放 */
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }

  /**
   * 更新海王星轨道
   * @param {number} orbitScale - 轨道缩放比例
   */
  updateOrbit(orbitScale) {
    if (this.mesh) {
      /** 海王星轨道半径 - 30.069天文单位(AU) */
      this.orbitRadius = orbitScale * 30.069
      /** 更新海王星在轨道上的位置 */
      this.updateOrbitPosition()
    }
  }
}
