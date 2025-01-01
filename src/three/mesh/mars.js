import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 火星
 */
export class Mars {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.0024

  constructor() {
    /** 火星网格对象 */
    this.mesh = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 火星半径(地球半径的0.532倍) */
    this.radius = 0.266
    /** 自转速度 */
    this.rotationSpeed = Mars.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Mars.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在270度) */
    this.revolutionAngle = Math.PI * 1.5
    /** 轨道半径 */
    this.orbitRadius = 0
    /** 火星轨道偏心率 */
    this.eccentricity = 0.093
  }

  /**
   * 初始化火星对象
   * @returns {Promise<THREE.Mesh|null>} 火星网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载火星相关纹理贴图
      /** 火星表面纹理贴图 */
      const marsTexture = await this.textureLoader.loadAsync('/textures/Mars/Mars.jpg')
      /** 火星法线贴图 - 用于增加表面细节 */
      const normalTexture = await this.textureLoader.loadAsync('/textures/Mars/Mars_NormalMap.png')

      // 创建火星网格
      /** 火星球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 火星材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: marsTexture,            // 颜色贴图
        normalMap: normalTexture,     // 法线贴图
        normalScale: new THREE.Vector2(0.1, 0.1), // 法线贴图强度
        shininess: 100,               // 高光强度
        specular: new THREE.Color(0x616161) // 高光颜色
      })

      // 创建火星网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true     // 投射阴影
      this.mesh.receiveShadow = true  // 接收阴影

      // 设置火星在太阳系中的位置
      /** 火星轨道半径 - 1.524天文单位(AU) */
      this.orbitRadius = gui.params.orbits.scale * 1.524
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载火星纹理失败:', error)
      return null
    }
  }

  /**
   * 更新火星的运动
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
   * 更新火星在轨道上的位置
   * 根据公转角度和轨道参数计算位置
   */
  updateOrbitPosition() {
    if (this.mesh) {
      /** 火星轨道倾角(度) */
      const inclination = 1.9
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

      // 根据轨道倾角旋转位置
      /** 应用倾角后的y坐标 */
      const rotatedY = -z * Math.sin(inclinationRad)
      /** 应用倾角后的z坐标 */
      const rotatedZ = z * Math.cos(inclinationRad)

      /** 设置火星的位置 */
      this.mesh.position.set(x, rotatedY, rotatedZ)
    }
  }

  /**
   * 更新火星大小
   * @param {number} sunSize - 太阳大小参数
   */
  updateScale(sunSize) {
    if (this.mesh) {
      /** 新的缩放比例 */
      const newScale = sunSize * this.radius
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }

  /**
   * 更新火星轨道
   * @param {number} orbitScale - 轨道缩放比例
   */
  updateOrbit(orbitScale) {
    if (this.mesh) {
      /** 火星轨道半径 - 1.524天文单位(AU) */
      this.orbitRadius = orbitScale * 1.524
      this.updateOrbitPosition()
    }
  }
}
