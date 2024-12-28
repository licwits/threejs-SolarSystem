import * as THREE from 'three'

export class Orbits {
  constructor() {
    this.orbits = []
    // 八大行星轨道半径（单位：AU，后面会进行缩放）
    this.orbitRadii = [
      0.387, // 水星
      0.723, // 金星
      1.0, // 地球
      1.524, // 火星
      5.203, // 木星
      9.537, // 土星
      19.191, // 天王星
      30.069 // 海王星
    ]
    this.scale = 20 // 轨道缩放系数
    // 定义每个轨道的颜色
    this.orbitColors = [
      0x9999ff, // 水星 - 浅蓝色
      0xffff99, // 金星 - 浅黄色
      0x99ff99, // 地球 - 浅绿色
      0xff9999, // 火星 - 浅红色
      0xffcc99, // 木星 - 橙色
      0xcc99ff, // 土星 - 紫色
      0x99ffff, // 天王星 - 青色
      0x9999cc // 海王星 - 深蓝色
    ]
    // 定义轨道宽度的基础值和增长系数
    this.baseWidth = 0.1
    this.widthScale = 0.05 // 每个轨道宽度增加的系数

    // 定义轨道亮度的基础值和增长系数
    this.baseOpacity = 0.4
    this.opacityScale = 0.03 // 每个轨道亮度增加的系数
  }

  init() {
    // 创建轨道
    this.orbitRadii.forEach((radius, index) => {
      // 根据轨道序号计算宽度和亮度
      const width = this.baseWidth + index * this.widthScale
      const opacity = Math.min(this.baseOpacity + index * this.opacityScale, 0.8)

      const geometry = new THREE.RingGeometry(radius * this.scale, radius * this.scale + width, 128)
      const material = new THREE.MeshBasicMaterial({
        color: this.orbitColors[index],
        transparent: true,
        opacity: opacity,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      })
      const orbit = new THREE.Mesh(geometry, material)

      // 使轨道平躺
      orbit.rotation.x = Math.PI / 2

      this.orbits.push(orbit)
    })

    // 创建轨道组
    const orbitGroup = new THREE.Group()
    this.orbits.forEach((orbit) => {
      orbitGroup.add(orbit)
    })

    return orbitGroup
  }

  // 更新轨道大小
  updateScale(scale) {
    this.scale = scale
    this.orbits.forEach((orbit, index) => {
      const radius = this.orbitRadii[index] * scale
      const width = this.baseWidth + index * this.widthScale
      orbit.geometry.dispose()
      orbit.geometry = new THREE.RingGeometry(radius, radius + width, 128)
    })
  }

  // 更新轨道可见性
  updateVisibility(visible) {
    this.orbits.forEach((orbit) => {
      orbit.visible = visible
    })
  }

  // 更新轨道透明度
  updateOpacity(opacity) {
    this.orbits.forEach((orbit, index) => {
      // 保持远轨道更亮的特性，但整体透明度可调
      const finalOpacity = Math.min(opacity + index * this.opacityScale, 0.8)
      orbit.material.opacity = finalOpacity
    })
  }
}
