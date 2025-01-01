import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 水星
 */
export class Mercury {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.0047

  constructor() {
    /** 水星网格对象 */
    this.mesh = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 水星半径(地球半径的0.382倍) */
    this.radius = 0.191
    /** 自转速度 */
    this.rotationSpeed = Mercury.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Mercury.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在0度) */
    this.revolutionAngle = 0
    /** 轨道半径 */
    this.orbitRadius = 0
    /** 水星轨道偏心率 */
    this.eccentricity = 0.206
  }

  /**
   * 初始化水星对象
   * @returns {Promise<THREE.Mesh|null>} 水星网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载水星相关纹理贴图
      /** 水星表面纹理贴图 */
      const mercuryTexture = await this.textureLoader.loadAsync('/textures/Mercury/mercury.jpg')
      /** 水星法线贴图 - 用于增加表面细节 */
      const normalTexture = await this.textureLoader.loadAsync('/textures/Mercury/Mercury_NormalMap.png')

      // 创建水星网格
      /** 水星球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 水星材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: mercuryTexture,            // 颜色贴图
        normalMap: normalTexture,        // 法线贴图
        normalScale: new THREE.Vector2(0.1, 0.1), // 法线贴图强度
        shininess: 100,                  // 高光强度
        specular: new THREE.Color(0x616161) // 高光颜色
      })

      // 创建水星网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true     // 投射阴影
      this.mesh.receiveShadow = true  // 接收阴影

      // 设置水星在太阳系中的位置
      /** 水星轨道半径 - 0.387天文单位(AU) */
      this.orbitRadius = gui.params.orbits.scale * 0.387
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载水星纹理失败:', error)
      return null
    }
  }

  /**
   * 更新水星的运动
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
   * 更新水星在轨道上的位置
   * 根据公转角度和轨道参数计算位置
   */
  updateOrbitPosition() {
    if (this.mesh) {
      /** 水星轨道倾角(度) */
      const inclination = 7.0
      /** 将倾角转换为弧度 */
      const inclinationRad = (inclination * Math.PI) / 180

      // 计算椭圆轨道参数
      const a = this.orbitRadius // 半长轴
      const c = a * this.eccentricity // 焦距
      const b = Math.sqrt(a * a - c * c) // 半短轴

      // 先计算在 x-z 平面上的位置
      const x = a * Math.cos(this.revolutionAngle) - c
      const z = b * Math.sin(this.revolutionAngle)

      // 根据轨道倾角旋转位置
      const rotatedY = -z * Math.sin(inclinationRad)
      const rotatedZ = z * Math.cos(inclinationRad)

      this.mesh.position.set(x, rotatedY, rotatedZ)
    }
  }

  /**
   * 更新水星大小
   * @param {number} sunSize - 太阳大小参数
   */
  updateScale(sunSize) {
    if (this.mesh) {
      /** 根据太阳大小计算新的缩放比例 */
      const newScale = sunSize * this.radius
      /** 统一设置水星的xyz缩放 */
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }

  /**
   * 更新水星轨道
   * @param {number} orbitScale - 轨道缩放比例
   */
  updateOrbit(orbitScale) {
    if (this.mesh) {
      /** 水星轨道半径 - 0.387天文单位(AU) */
      this.orbitRadius = orbitScale * 0.387
      /** 更新水星在轨道上的位置 */
      this.updateOrbitPosition()
    }
  }
}
