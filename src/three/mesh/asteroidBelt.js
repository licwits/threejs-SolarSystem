import * as THREE from 'three'
import { gui } from '../gui'

export class AsteroidBelt {
  constructor() {
    this.mesh = null
    this.asteroids = []
    this.count = 20000 // 小行星数量
    this.minRadius = 2.2 // 内圈半径（火星轨道外）
    this.maxRadius = 3.4 // 外圈半径（木星轨道内）
    this.minSize = 0.05
    this.maxSize = 0.2
    this.minOrbitSpeed = 0.00000001 // 降低最小公转速度
    this.maxOrbitSpeed = 0.00000002 // 降低最大公转速度
    this.minRotationSpeed = 0.0000001 // 降低最小自转速度
    this.maxRotationSpeed = 0.0000005 // 降低最大自转速度
  }

  init() {
    // 创建小行星带容器
    this.mesh = new THREE.Group()

    // 创建小行星几何体
    const geometry = new THREE.IcosahedronGeometry(1, 0) // 使用二十面体作为基础形状
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      shininess: 0,
      flatShading: true
    })

    // 生成随机分布的小行星
    for (let i = 0; i < this.count; i++) {
      // 随机角度和半径
      const angle = Math.random() * Math.PI * 2
      const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius)

      // 随机大小
      const size = this.minSize + Math.random() * (this.maxSize - this.minSize)

      // 创建小行星实例
      const asteroid = new THREE.Mesh(geometry, material.clone())

      // 设置位置
      asteroid.position.x = Math.cos(angle) * radius * gui.params.orbits.scale
      asteroid.position.z = Math.sin(angle) * radius * gui.params.orbits.scale

      // 随机旋转
      asteroid.rotation.x = Math.random() * Math.PI
      asteroid.rotation.y = Math.random() * Math.PI
      asteroid.rotation.z = Math.random() * Math.PI

      // 随机缩放
      asteroid.scale.setScalar(size)

      // 添加到容器中
      this.mesh.add(asteroid)

      // 存储初始状态用于动画
      this.asteroids.push({
        mesh: asteroid,
        radius,
        angle,
        rotationSpeed: this.minRotationSpeed + Math.random() * (this.maxRotationSpeed - this.minRotationSpeed),
        orbitSpeed: this.minOrbitSpeed + Math.random() * (this.maxOrbitSpeed - this.minOrbitSpeed)
      })
    }

    return this.mesh
  }

  animate() {
    if (this.mesh) {
      this.asteroids.forEach((asteroid) => {
        const inclination = 1.67
        const inclinationRad = (inclination * Math.PI) / 180
        const eccentricity = 0.1 * Math.random() // 随机偏心率，使小行星轨道更自然

        asteroid.angle += asteroid.orbitSpeed
        const radius = asteroid.radius * gui.params.orbits.scale

        // 计算椭圆轨道参数
        const a = radius
        const c = a * eccentricity
        const b = Math.sqrt(a * a - c * c)

        // 先计算在 x-z 平面上的位置
        const x = a * Math.cos(asteroid.angle) - c
        const z = b * Math.sin(asteroid.angle)

        const rotatedY = -z * Math.sin(inclinationRad)
        const rotatedZ = z * Math.cos(inclinationRad)

        asteroid.mesh.position.set(x, rotatedY, rotatedZ)
        asteroid.mesh.rotation.y += asteroid.rotationSpeed
      })
    }
  }

  updateScale(orbitScale) {
    if (this.mesh) {
      this.asteroids.forEach((asteroid) => {
        const inclination = 1.67
        const inclinationRad = (inclination * Math.PI) / 180
        const radius = asteroid.radius * orbitScale

        const x = Math.cos(asteroid.angle) * radius
        const z = Math.sin(asteroid.angle) * radius

        const rotatedY = -z * Math.sin(inclinationRad)
        const rotatedZ = z * Math.cos(inclinationRad)

        asteroid.mesh.position.set(x, rotatedY, rotatedZ)
      })
    }
  }
}
