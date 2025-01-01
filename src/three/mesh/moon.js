import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 月球
 */
export class Moon {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.0001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.005

  constructor() {
    /** 月球网格对象 */
    this.mesh = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 月球半径(地球半径的0.272倍) */
    this.radius = 0.136
    /** 自转速度 */
    this.rotationSpeed = Moon.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Moon.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在0度) */
    this.revolutionAngle = 0
    /** 轨道半径(约30个地球半径,这里缩小以便观察) */
    this.orbitRadius = 5.0
    /** 月球轨道偏心率 */
    this.eccentricity = 0.0549
    /** 月球轨道倾角(相对于地球轨道) */
    this.inclination = 5.145
  }
  /**
   * 初始化月球对象
   * @returns {Promise<THREE.Mesh|null>} 月球网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载月球相关纹理贴图
      /** 月球表面纹理贴图 */
      const moonTexture = await this.textureLoader.loadAsync('/textures/Moon/moon.png')
      /** 月球法线贴图 - 用于增加表面细节 */
      const normalTexture = await this.textureLoader.loadAsync('/textures/Moon/moon_NormalMap.png')

      // 创建月球网格
      /** 月球球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 月球材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: moonTexture, // 颜色贴图
        normalMap: normalTexture, // 法线贴图
        normalScale: new THREE.Vector2(0.1, 0.1), // 法线贴图强度
        shininess: 10, // 高光强度
        specular: new THREE.Color(0x666666) // 高光颜色
      })

      // 创建月球网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true // 投射阴影
      this.mesh.receiveShadow = true // 接收阴影
      /** 设置月球初始位置 */
      this.mesh.position.set(this.orbitRadius, 0, 0)

      return this.mesh
    } catch (error) {
      console.error('加载月球纹理失败:', error)
      return null
    }
  }
  /**
   * 更新月球的运动
   * 包括自转和绕地球公转
   * @param {Earth} earth - 地球对象
   */
  animate(earth) {
    if (this.mesh && earth) {
      // 自转
      this.mesh.rotation.y += this.rotationSpeed

      // 计算月球轨道参数
      /** 轨道长半轴 */
      const a = this.orbitRadius
      /** 轨道焦距 */
      const c = a * this.eccentricity
      /** 轨道短半轴 */
      const b = Math.sqrt(a * a - c * c)

      // 更新公转角度
      this.revolutionAngle += this.revolutionSpeed

      // 计算月球相对于地球的位置
      /** 将倾角转换为弧度 */
      const inclinationRad = (this.inclination * Math.PI) / 180
      /** x坐标 - 减去c使地球位于焦点 */
      const x = a * Math.cos(this.revolutionAngle) - c
      /** z坐标 */
      const z = b * Math.sin(this.revolutionAngle)

      // 应用轨道倾角
      /** 应用倾角后的y坐标 */
      const rotatedY = -z * Math.sin(inclinationRad)
      /** 应用倾角后的z坐标 */
      const rotatedZ = z * Math.cos(inclinationRad)

      // 获取地球的世界位置
      /** 存储地球世界坐标的向量 */
      const earthPosition = new THREE.Vector3()
      earth.mesh.getWorldPosition(earthPosition)

      // 设置月球位置（相对于地球）
      /** 将月球位置设置为地球位置加上相对位移 */
      this.mesh.position.set(earthPosition.x + x, earthPosition.y + rotatedY, earthPosition.z + rotatedZ)
    }
  }

  /**
   * 更新月球大小
   * @param {number} sunSize - 太阳大小参数
   */
  updateScale(sunSize) {
    if (this.mesh) {
      /** 根据太阳大小计算新的缩放比例 */
      const newScale = sunSize * this.radius
      /** 统一设置月球的xyz缩放 */
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }
}
