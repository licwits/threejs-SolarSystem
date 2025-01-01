import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 木星
 */
export class Jupiter {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.00038

  constructor() {
    /** 木星网格对象 */
    this.mesh = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 木星半径(地球半径的11.18倍) */
    this.radius = 5.59
    /** 自转速度 */
    this.rotationSpeed = Jupiter.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Jupiter.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在45度) */
    this.revolutionAngle = Math.PI * 0.25
    /** 轨道半径 */
    this.orbitRadius = 0
    /** 木星轨道偏心率 */
    this.eccentricity = 0.048
  }

  /**
   * 初始化木星
   * @returns {THREE.Mesh} 木星网格对象
   */
  async init() {
    try {
      // 加载纹理
      /** 木星表面纹理贴图 */
      const jupiterTexture = await this.textureLoader.loadAsync('/textures/Jupiter/Jupiter.jpg')
      /** 木星法线贴图 - 用于增加表面细节 */
      const normalTexture = await this.textureLoader.loadAsync('/textures/Jupiter/Jupiter_NormalMap.png')

      /** 木星球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 木星材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: jupiterTexture,            // 颜色贴图
        normalMap: normalTexture,       // 法线贴图
        normalScale: new THREE.Vector2(0.1, 0.1), // 法线贴图强度
        shininess: 100,                 // 高光强度
        specular: new THREE.Color(0x616161) // 高光颜色
      })

      // 创建木星网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true     // 投射阴影
      this.mesh.receiveShadow = true  // 接收阴影

      /** 木星轨道半径 - 5.203天文单位(AU) */
      this.orbitRadius = gui.params.orbits.scale * 5.203
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载木星纹理失败:', error)
      return null
    }
  }

  /**
   * 更新木星的运动
   */
  animate () {
    if (this.mesh) {
      // 自转
      this.mesh.rotation.y += this.rotationSpeed

      // 公转
      this.revolutionAngle += this.revolutionSpeed
      this.updateOrbitPosition()
    }
  }

  /**
   * 更新木星的轨道位置
   */
  updateOrbitPosition() {
    if (this.mesh) {
      /** 轨道倾角(度) */
      const inclination = 1.3
      const inclinationRad = (inclination * Math.PI) / 180

      // 计算椭圆轨道参数
      const a = this.orbitRadius
      const c = a * this.eccentricity
      const b = Math.sqrt(a * a - c * c)

      // 先计算在 x-z 平面上的位置
      const x = a * Math.cos(this.revolutionAngle) - c
      const z = b * Math.sin(this.revolutionAngle)

      /** 计算绕 y 轴旋转后的位置 */
      const rotatedY = -z * Math.sin(inclinationRad)
      const rotatedZ = z * Math.cos(inclinationRad)

      /** 设置木星的位置 */
      this.mesh.position.set(x, rotatedY, rotatedZ)
    }
  }

  /**
   * 更新木星的缩放比例
   * @param {number} sunSize - 太阳尺寸
   */
  updateScale(sunSize) {
    if (this.mesh) {
      const newScale = sunSize * this.radius
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }

  /**
   * 更新木星的轨道位置
   * @param {number} orbitScale - 轨道缩放比例
   */
  updateOrbit(orbitScale) {
    if (this.mesh) {
      this.orbitRadius = orbitScale * 5.203
      this.updateOrbitPosition()
    }
  }
}
