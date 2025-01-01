import * as THREE from 'three'

/**
 * 行星轨道
 */
export class Orbits {
  constructor() {
    this.mesh = null // 存储主网格组
    this.orbitMeshes = [] // 存储单个轨道网格
    this.minWidth = 0.03 // 最小轨道宽度
    this.maxWidth = 0.3 // 最大轨道宽度
    this.minOpacity = 0.6 // 最小透明度
    this.maxOpacity = 0.9 // 最大透明度

    // 创建一个包含 set 方法的 scale 对象
    this.scale = {
      set: (x, y, z) => {
        // 更新所有轨道的缩放
        this.updateScale(x)
      }
    }

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

    this._scaleValue = 70 // 轨道缩放系数
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

  /**
   * 初始化轨道系统
   * @returns {THREE.Group} 包含所有行星轨道的组对象
   */
  init() {
    /** 创建一个组来存放所有轨道 */
    const group = new THREE.Group()
    this.mesh = group

    // 创建行星轨道
    this.orbitData.forEach((data, index) => {
      // 计算椭圆轨道的参数
      /** 轨道长半轴 */
      const a = data.radius * this._scaleValue
      /** 轨道焦距 */
      const c = a * data.e
      /** 轨道短半轴 */
      const b = Math.sqrt(a * a - c * c)

      // 创建更多点以形成椭圆
      /** 存储轨道上的点 */
      const points = []
      /** 轨道分段数 */
      const segments = 256
      for (let i = 0; i <= segments; i++) {
        /** 当前点的角度 */
        const theta = (i / segments) * Math.PI * 2
        /** 点的x坐标 */
        const x = a * Math.cos(theta)
        /** 点的z坐标 */
        const z = b * Math.sin(theta)
        points.push(new THREE.Vector3(x, 0, z))
      }

      /** 计算轨道线宽度 */
      const width = this.baseWidth + index * this.widthScale
      /** 创建轨道几何体 */
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points)
      /** 创建轨道材质 */
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: this.orbitColors[index],
        transparent: true,
        opacity: this.baseOpacity + index * this.opacityScale,
        blending: THREE.AdditiveBlending,
        linewidth: width
      })

      /** 创建轨道线对象 */
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial)
      /** 移动轨道使太阳位于焦点 */
      orbit.position.x = -c

      /** 创建轨道组以便应用倾角 */
      const orbitGroup = new THREE.Group()
      orbitGroup.add(orbit)

      /** 将轨道倾角转换为弧度并应用 */
      const inclinationRad = (data.inclination * Math.PI) / 180
      orbitGroup.rotation.x = inclinationRad

      /** 将轨道组添加到轨道数组和主组中 */
      this.orbitMeshes.push(orbitGroup)
      group.add(orbitGroup)
    })

    return this.mesh
  }

  /**
   * 更新轨道缩放比例
   * @param {number} scale - 新的缩放比例
   */
  updateScale(scale) {
    /** 保存新的缩放比例 */
    this._scaleValue = scale
    // 使用 updateWithCamera 来更新轨道
    if (this.camera) {
      this.updateWithCamera(this.camera)
    }
  }

  /**
   * 更新轨道可见性
   * @param {boolean} visible - 是否显示轨道
   */
  updateVisibility(visible) {
    /** 遍历所有轨道组并设置可见性 */
    this.orbitMeshes.forEach((orbitGroup) => {
      orbitGroup.visible = visible
    })
  }

  /**
   * 更新轨道透明度
   * @param {number} opacity - 基础透明度值
   */
  updateOpacity(opacity) {
    /** 遍历所有轨道组并更新透明度 */
    this.orbitMeshes.forEach((orbitGroup, index) => {
      /** 获取轨道线对象 */
      const orbit = orbitGroup.children[0]
      /** 计算最终透明度，保持远轨道更亮的特性，但限制最大值为0.8 */
      const finalOpacity = Math.min(opacity + index * this.opacityScale, 0.8)
      /** 设置轨道材质的透明度 */
      orbit.material.opacity = finalOpacity
    })
  }

  /**
   * 根据相机位置更新轨道显示效果
   * @param {THREE.Camera} camera - 场景相机
   */
  updateWithCamera(camera) {
    /** 计算相机到原点的距离 */
    const distance = camera.position.length()

    /** 根据距离动态计算轨道宽度和透明度的缩放因子 */
    const widthScale = THREE.MathUtils.clamp(distance / 100, 1, 10)
    const opacityScale = THREE.MathUtils.clamp(distance / 200, 1, 1.5)

    /** 遍历并更新所有轨道 */
    this.orbitMeshes.forEach((orbitGroup, index) => {
      /** 获取当前轨道的数据 */
      const data = this.orbitData[index]
      /** 计算椭圆轨道参数 */
      const a = data.radius * this._scaleValue // 长半轴
      const c = a * data.e // 焦距
      const b = Math.sqrt(a * a - c * c) // 短半轴

      /** 获取轨道线对象 */
      const orbit = orbitGroup.children[0]
      /** 释放旧的几何体 */
      orbit.geometry.dispose()

      /** 重新生成轨道点 */
      const points = []
      /** 轨道分段数 */
      const segments = 256
      for (let i = 0; i <= segments; i++) {
        /** 当前点的角度 */
        const theta = (i / segments) * Math.PI * 2
        /** 计算点的坐标 */
        const x = a * Math.cos(theta)
        const z = b * Math.sin(theta)
        points.push(new THREE.Vector3(x, 0, z))
      }
      /** 创建新的几何体 */
      orbit.geometry = new THREE.BufferGeometry().setFromPoints(points)
      /** 移动轨道使太阳位于焦点 */
      orbit.position.x = -c

      /** 计算基础透明度 */
      const baseOpacity = THREE.MathUtils.lerp(this.minOpacity, this.maxOpacity, (opacityScale - 1) / 0.5)
      /** 设置轨道材质的透明度 */
      orbit.material.opacity = baseOpacity + index * this.opacityScale
    })
  }
}
