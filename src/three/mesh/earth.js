import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 地球
 */
export class Earth {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.0017


  constructor() {
    /** 地球网格对象 */
    this.mesh = null
    /** 云层网格对象 */
    this.clouds = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 地球半径(基准尺寸) */
    this.radius = 0.5
    /** 自转速度 */
    this.rotationSpeed = Earth.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Earth.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在180度) */
    this.revolutionAngle = Math.PI
    /** 轨道半径 */
    this.orbitRadius = 0
    /** 地球轨道偏心率 */
    this.eccentricity = 0.017
  }

  /**
   * 初始化地球对象
   * @returns {Promise<THREE.Mesh|null>} 地球网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载地球相关纹理贴图
      /** 地球表面纹理贴图 */
      const earthTexture = await this.textureLoader.loadAsync('/textures/Earth/earth_daymap.jpg')
      /** 地球法线贴图 - 用于增加表面细节 */
      const normalTexture = await this.textureLoader.loadAsync('/textures/Earth/earth_normal_map.jpg')
      /** 地球高光贴图 - 控制反射光的强度 */
      const specularTexture = await this.textureLoader.loadAsync('/textures/Earth/earth_specular_map.jpg')
      /** 云层纹理贴图 */
      const cloudsTexture = await this.textureLoader.loadAsync('/textures/Earth/earth_clouds.jpg')

      // 创建地球网格
      /** 地球球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 地球材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: earthTexture,            // 颜色贴图
        normalMap: normalTexture,     // 法线贴图
        normalScale: new THREE.Vector2(0.1, 0.1), // 法线贴图强度
        specularMap: specularTexture, // 高光贴图
        specular: new THREE.Color(0x333333), // 高光颜色
        shininess: 15                 // 高光强度
      })

      // 创建地球网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true     // 投射阴影
      this.mesh.receiveShadow = true  // 接收阴影
      // 设置地球轴倾角（23.5度）
      this.mesh.rotation.z = Math.PI * 0.1305 // 23.5度转弧度

      // 创建云层
      /** 云层几何体 - 略大于地球本体 */
      const cloudsGeometry = new THREE.SphereGeometry(
        gui.params.sunSize * this.radius * 1.01, // 略大于地球半径
        64,
        64
      )
      /** 云层材质 - 半透明效果 */
      const cloudsMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,     // 云层贴图
        transparent: true,      // 启用透明
        opacity: 0.4,          // 设置透明度
        depthWrite: false      // 禁用深度写入以避免渲染问题
      })

      // 创建云层网格并添加为地球的子对象
      this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
      this.mesh.add(this.clouds)

      // 设置地球在太阳系中的位置
      /** 地球轨道半径 - 1天文单位(AU) */
      this.orbitRadius = gui.params.orbits.scale * 1.0 
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载地球纹理失败:', error)
      return null
    }
  }

  /**
   * 更新地球的运动
   * 包括自转和公转
   */
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

  /**
   * 更新地球在轨道上的位置
   * 根据公转角度和轨道参数计算位置
   */
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

  /**
   * 更新地球大小
   * @param {number} sunSize - 太阳大小参数
   */
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

  /**
   * 更新地球轨道
   * @param {number} orbitScale - 轨道缩放比例
   */
  updateOrbit(orbitScale) {
    if (this.mesh) {
      this.orbitRadius = orbitScale * 1.0
      this.updateOrbitPosition()
    }
  }
}
