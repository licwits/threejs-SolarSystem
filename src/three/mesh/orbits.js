import * as THREE from 'three'

export class Orbits {
  constructor() {
    this.orbits = []
    this.minWidth = 0.03 // 最小轨道宽度
    this.maxWidth = 0.3 // 最大轨道宽度
    this.minOpacity = 0.6 // 最小透明度
    this.maxOpacity = 0.9 // 最大透明度

    // 八大行星轨道半径和偏心率
    this.orbitData = [
      {
        radius: 0.387,
        e: 0.206, // 水星
        name: 'Mercury',
        inclination: 7.0
      },
      {
        radius: 0.723,
        e: 0.007, // 金星
        name: 'Venus',
        inclination: 3.4
      },
      {
        radius: 1.0,
        e: 0.017, // 地球
        name: 'Earth',
        inclination: 0.0
      },
      {
        radius: 1.524,
        e: 0.093, // 火星
        name: 'Mars',
        inclination: 1.9
      },
      {
        radius: 5.203,
        e: 0.048, // 木星
        name: 'Jupiter',
        inclination: 1.3
      },
      {
        radius: 9.537,
        e: 0.054, // 土星
        name: 'Saturn',
        inclination: 2.5
      },
      {
        radius: 19.191,
        e: 0.047, // 天王星
        name: 'Uranus',
        inclination: 0.8
      },
      {
        radius: 30.069,
        e: 0.009, // 海王星
        name: 'Neptune',
        inclination: 1.8
      }
    ]

    this.scale = 20 // 轨道缩放系数
    // 定义每个轨道的颜色
    this.orbitColors = [
      0xcccccc, // 水星 - 银灰色
      0xffb6c1, // 金星 - 粉红色
      0x4169e1, // 地球 - 皇家蓝
      0xff4500, // 火星 - 红橙色
      0xff9966, // 木星 - 橙色
      0xffcc66, // 土星 - 黄色
      0x66ffff, // 天王星 - 青色
      0x6699ff // 海王星 - 蓝色
    ]
    // 定义轨道宽度的基础值和增长系数
    this.baseWidth = 0.03
    this.widthScale = 0.01 // 每个轨道宽度增加的系数

    // 定义轨道亮度的基础值和增长系数
    this.baseOpacity = 0.6
    this.opacityScale = 0.08 // 每个轨道亮度增加的系数
  }

  init() {
    this.mesh = new THREE.Group()

    // 创建行星轨道
    this.orbitData.forEach((data, index) => {
      // 计算椭圆轨道的参数
      const a = data.radius * this.scale // 半长轴
      const c = a * data.e // 焦距
      const b = Math.sqrt(a * a - c * c) // 半短轴

      // 创建更多点以形成椭圆
      const points = []
      const segments = 256
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        const x = a * Math.cos(theta)
        const z = b * Math.sin(theta)
        points.push(new THREE.Vector3(x, 0, z))
      }

      const width = this.baseWidth + index * this.widthScale
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: this.orbitColors[index],
        transparent: true,
        opacity: this.baseOpacity + index * this.opacityScale,
        blending: THREE.AdditiveBlending,
        linewidth: width
      })

      const orbit = new THREE.Line(orbitGeometry, orbitMaterial)
      orbit.position.x = -c // 移动轨道使太阳位于焦点

      // 创建轨道组以便应用倾角
      const orbitGroup = new THREE.Group()
      orbitGroup.add(orbit)

      // 应用轨道倾角
      const inclinationRad = (data.inclination * Math.PI) / 180
      orbitGroup.rotation.x = inclinationRad

      this.orbits.push(orbitGroup)
      this.mesh.add(orbitGroup)
    })

    return this.mesh
  }

  // 更新轨道大小
  updateScale(scale) {
    this.scale = scale
    // 使用 updateWithCamera 来更新轨道
    if (this.camera) {
      this.updateWithCamera(this.camera)
    }
  }

  // 更新轨道可见性
  updateVisibility(visible) {
    this.orbits.forEach((orbitGroup) => {
      orbitGroup.visible = visible
    })
  }

  // 更新轨道透明度
  updateOpacity(opacity) {
    this.orbits.forEach((orbitGroup, index) => {
      const orbit = orbitGroup.children[0]
      // 保持远轨道更亮的特性，但整体透明度可调
      const finalOpacity = Math.min(opacity + index * this.opacityScale, 0.8)
      orbit.material.opacity = finalOpacity
    })
  }

  updateWithCamera(camera) {
    // 获取相机到原点的距离
    const distance = camera.position.length()

    // 根据距离动态计算轨道宽度和透明度
    const widthScale = THREE.MathUtils.clamp(distance / 100, 1, 10)
    const opacityScale = THREE.MathUtils.clamp(distance / 200, 1, 1.5)

    this.orbits.forEach((orbitGroup, index) => {
      const data = this.orbitData[index]
      const a = data.radius * this.scale
      const c = a * data.e
      const b = Math.sqrt(a * a - c * c)

      const orbit = orbitGroup.children[0]
      orbit.geometry.dispose()
      const points = []
      const segments = 256
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        const x = a * Math.cos(theta)
        const z = b * Math.sin(theta)
        points.push(new THREE.Vector3(x, 0, z))
      }
      orbit.geometry = new THREE.BufferGeometry().setFromPoints(points)
      orbit.position.x = -c

      // 更新透明度
      const baseOpacity = THREE.MathUtils.lerp(this.minOpacity, this.maxOpacity, (opacityScale - 1) / 0.5)
      orbit.material.opacity = baseOpacity + index * this.opacityScale
    })
  }
}
