import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 天王星类
 */
export class Uranus {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001
  /** 默认公转速度 */
  static DEFAULT_REVOLUTION_SPEED = 0.00014

  constructor() {
    /** 天王星网格对象 */
    this.mesh = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 天王星半径(地球半径的4.04倍) */
    this.radius = 2.02
    /** 自转速度 */
    this.rotationSpeed = Uranus.DEFAULT_ROTATION_SPEED
    /** 公转速度 */
    this.revolutionSpeed = Uranus.DEFAULT_REVOLUTION_SPEED
    /** 公转角度(起始位置在225度) */
    this.revolutionAngle = Math.PI * 1.25
    /** 轨道半径 */
    this.orbitRadius = 0
    /** 天王星环网格对象 */
    this.ring = null
    /** 天王星轨道偏心率 */
    this.eccentricity = 0.047
    /** 轴倾角(97.47度) */
    this.axialTilt = Math.PI * 0.5415
  }

  /**
   * 初始化天王星对象
   * @returns {Promise<THREE.Mesh|null>} 天王星网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载天王星相关纹理贴图
      /** 天王星表面纹理贴图 */
      const uranusTexture = await this.textureLoader.loadAsync('/textures/Uranus/Uranus.jpg')

      // 创建天王星网格
      /** 天王星球体几何体 - 使用64x64的网格细分 */
      const geometry = new THREE.SphereGeometry(gui.params.sunSize * this.radius, 64, 64)
      /** 天王星材质 - 使用Phong材质实现基础光照效果 */
      const material = new THREE.MeshPhongMaterial({
        map: uranusTexture, // 颜色贴图
        shininess: 100, // 高光强度
        specular: new THREE.Color(0x616161) // 高光颜色
      })

      // 创建天王星网格对象并设置阴影
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = true // 投射阴影
      this.mesh.receiveShadow = true // 接收阴影
      /** 设置天王星轴倾角(约98度) */
      this.mesh.rotation.z = Math.PI / 2 + Math.PI * 0.0874

      // 创建天王星环
      /** 天王星环几何体 - 内径为天王星半径的1.4倍,外径为1.8倍 */
      const ringGeometry = new THREE.RingGeometry(gui.params.sunSize * this.radius * 1.4, gui.params.sunSize * this.radius * 1.8, 64)
      /** 天王星环材质 - 使用半透明的Phong材质 */
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x89a0b8, // 环的颜色
        side: THREE.DoubleSide, // 双面渲染
        transparent: true, // 启用透明
        opacity: 0.3, // 透明度
        shininess: 50, // 高光强度
        depthWrite: false // 禁用深度写入以避免透明度问题
      })

      /** 创建天王星环网格对象并添加到天王星主体 */
      this.ring = new THREE.Mesh(ringGeometry, ringMaterial)
      this.mesh.add(this.ring)

      /** 天王星轨道半径 - 19.191天文单位(AU) */
      this.orbitRadius = gui.params.orbits.scale * 19.191
      /** 更新天王星在轨道上的位置 */
      this.updateOrbitPosition()

      return this.mesh
    } catch (error) {
      console.error('加载天王星纹理失败:', error)
      return null
    }
  }

  /**
   * 更新天王星的运动
   * 包括自转和公转
   */
  animate() {
    if (this.mesh) {
      // 自转(绕z轴旋转,因为天王星被旋转了)
      this.mesh.rotation.z += this.rotationSpeed

      // 公转
      this.revolutionAngle += this.revolutionSpeed
      this.updateOrbitPosition()
    }
  }

  /**
   * 更新天王星在轨道上的位置
   * 根据公转角度和轨道参数计算位置
   */
  updateOrbitPosition() {
    if (this.mesh) {
      /** 天王星轨道倾角(度) */
      const inclination = 0.8
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

      /** 设置天王星的位置 */
      this.mesh.position.set(x, rotatedY, rotatedZ)
    }
  }

  /**
   * 更新天王星大小
   * @param {number} sunSize - 太阳大小参数
   */
  updateScale(sunSize) {
    if (this.mesh) {
      /** 根据太阳大小计算新的缩放比例 */
      const newScale = sunSize * this.radius
      /** 统一设置天王星的xyz缩放 */
      this.mesh.scale.set(newScale, newScale, newScale)

      // 更新天王星环大小
      if (this.ring) {
        /** 释放旧的环几何体 */
        this.ring.geometry.dispose()
        /** 创建新的环几何体 */
        this.ring.geometry = new THREE.RingGeometry(sunSize * this.radius * 1.4, sunSize * this.radius * 1.8, 64)
      }
    }
  }

  /**
   * 更新天王星轨道
   * @param {number} orbitScale - 轨道缩放比例
   */
  updateOrbit(orbitScale) {
    if (this.mesh) {
      /** 天王星轨道半径 - 19.191天文单位(AU) */
      this.orbitRadius = orbitScale * 19.191
      /** 更新天王星在轨道上的位置 */
      this.updateOrbitPosition()
    }
  }
}
