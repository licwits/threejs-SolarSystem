import * as THREE from 'three'
import { gui } from '../gui'

/**
 * 小行星带
 */
export class AsteroidBelt {
  constructor() {
    /** 小行星带网格对象 */
    this.mesh = null
    /** 存储小行星对象的数组 */
    this.asteroids = []
    /** 小行星的总数量 */
    this.count = 20000 
    /** 小行星带的内圈半径(火星轨道外) */
    this.minRadius = 2.2
    /** 小行星带的外圈半径(木星轨道内) */
    this.maxRadius = 3.4
    /** 小行星的最小尺寸 */
    this.minSize = 0.05
    /** 小行星的最大尺寸 */
    this.maxSize = 0.2
    /** 小行星最小公转速度 */
    this.minOrbitSpeed = 0.00000001
    /** 小行星最大公转速度 */
    this.maxOrbitSpeed = 0.00000002
    /** 小行星最小自转速度 */
    this.minRotationSpeed = 0.0000001
    /** 小行星最大自转速度 */
    this.maxRotationSpeed = 0.0000005
  }
  /**
   * 初始化小行星带
   * @returns {THREE.Group} 包含所有小行星的网格组
   */
  init() {
    // 创建小行星带容器
    this.mesh = new THREE.Group()

    // 创建小行星几何体 - 使用二十面体作为基础形状,参数0表示不细分
    const geometry = new THREE.IcosahedronGeometry(1, 0)
    
    // 创建小行星材质 - 使用漫反射材质,灰色且无光泽
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080, // 灰色
      shininess: 0,    // 无光泽
      flatShading: true // 平面着色
    })

    // 生成随机分布的小行星
    for (let i = 0; i < this.count; i++) {
      // 随机角度(0-2π)和半径(在最小最大半径之间)
      const angle = Math.random() * Math.PI * 2
      const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius)

      // 随机大小(在最小最大尺寸之间)
      const size = this.minSize + Math.random() * (this.maxSize - this.minSize)

      // 创建小行星实例 - 克隆材质以便单独修改
      const asteroid = new THREE.Mesh(geometry, material.clone())

      // 设置位置 - 根据角度和半径计算x、z坐标,并应用轨道缩放
      asteroid.position.x = Math.cos(angle) * radius * gui.params.orbits.scale
      asteroid.position.z = Math.sin(angle) * radius * gui.params.orbits.scale

      // 随机旋转 - 绕三个轴随机旋转以增加视觉多样性
      asteroid.rotation.x = Math.random() * Math.PI
      asteroid.rotation.y = Math.random() * Math.PI
      asteroid.rotation.z = Math.random() * Math.PI

      // 随机缩放 - 统一缩放xyz以保持形状比例
      asteroid.scale.setScalar(size)

      // 将小行星添加到容器组中
      this.mesh.add(asteroid)

      // 存储小行星信息用于后续动画
      this.asteroids.push({
        mesh: asteroid,      // 小行星网格对象
        radius,             // 轨道半径
        angle,             // 初始角度
        rotationSpeed: this.minRotationSpeed + Math.random() * (this.maxRotationSpeed - this.minRotationSpeed), // 自转速度
        orbitSpeed: this.minOrbitSpeed + Math.random() * (this.maxOrbitSpeed - this.minOrbitSpeed) // 公转速度
      })
    }

    return this.mesh
  }

  /**
   * 更新小行星带中所有小行星的运动
   * 包括公转和自转运动的计算与更新
   */
  animate() {
    if (this.mesh) {
      this.asteroids.forEach((asteroid) => {
        // 设置轨道倾角(度)
        const inclination = 1.67
        // 将倾角转换为弧度
        const inclinationRad = (inclination * Math.PI) / 180
        // 生成随机偏心率使轨道更自然
        const eccentricity = 0.1 * Math.random()

        // 更新小行星的角度位置
        asteroid.angle += asteroid.orbitSpeed
        // 计算当前轨道半径
        const radius = asteroid.radius * gui.params.orbits.scale

        // 计算椭圆轨道参数
        const a = radius // 长半轴
        const c = a * eccentricity // 焦距
        const b = Math.sqrt(a * a - c * c) // 短半轴

        // 计算小行星在x-z平面上的椭圆轨道位置
        const x = a * Math.cos(asteroid.angle) - c
        const z = b * Math.sin(asteroid.angle)

        // 应用轨道倾角,计算最终的y和z坐标
        const rotatedY = -z * Math.sin(inclinationRad)
        const rotatedZ = z * Math.cos(inclinationRad)

        // 更新小行星位置和自转
        asteroid.mesh.position.set(x, rotatedY, rotatedZ)
        asteroid.mesh.rotation.y += asteroid.rotationSpeed
      })
    }
  }

  /**
   * 根据新的轨道缩放比例更新所有小行星的位置
   * @param {number} orbitScale - 新的轨道缩放比例
   */
  updateScale(orbitScale) {
    if (this.mesh) {
      this.asteroids.forEach((asteroid) => {
        // 设置轨道倾角
        const inclination = 1.67
        const inclinationRad = (inclination * Math.PI) / 180
        // 计算新的轨道半径
        const radius = asteroid.radius * orbitScale

        // 计算小行星在x-z平面上的圆形轨道位置
        const x = Math.cos(asteroid.angle) * radius
        const z = Math.sin(asteroid.angle) * radius

        // 应用轨道倾角,计算最终的y和z坐标
        const rotatedY = -z * Math.sin(inclinationRad)
        const rotatedZ = z * Math.cos(inclinationRad)

        // 更新小行星位置
        asteroid.mesh.position.set(x, rotatedY, rotatedZ)
      })
    }
  }
}
