import * as THREE from 'three'
import { gui } from '../gui'

export class AsteroidBelt {
  constructor() {
    this.mesh = null
    this.asteroids = []
    this.count = 4000 // 小行星数量
    this.minRadius = 2.2 // 内圈半径（火星轨道外）
    this.maxRadius = 3.4 // 外圈半径（木星轨道内）
    this.minSize = 0.02
    this.maxSize = 0.1
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
        rotationSpeed: 0.001 + Math.random() * 0.002,
        orbitSpeed: 0.0001 + Math.random() * 0.0002
      })
    }

    return this.mesh
  }

  animate() {
    if (this.mesh) {
      // 更新每个小行星的位置和旋转
      this.asteroids.forEach((asteroid) => {
        // 更新公转
        asteroid.angle += asteroid.orbitSpeed
        asteroid.mesh.position.x = Math.cos(asteroid.angle) * asteroid.radius * gui.params.orbits.scale
        asteroid.mesh.position.z = Math.sin(asteroid.angle) * asteroid.radius * gui.params.orbits.scale

        // 更新自转
        asteroid.mesh.rotation.y += asteroid.rotationSpeed
      })
    }
  }

  updateScale(orbitScale) {
    if (this.mesh) {
      this.asteroids.forEach((asteroid) => {
        asteroid.mesh.position.x = Math.cos(asteroid.angle) * asteroid.radius * orbitScale
        asteroid.mesh.position.z = Math.sin(asteroid.angle) * asteroid.radius * orbitScale
      })
    }
  }
}
