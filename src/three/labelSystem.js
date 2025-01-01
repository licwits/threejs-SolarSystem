import * as THREE from 'three'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
import gsap from 'gsap'
import '@/assets/font/山海汲古明刻_mianfeiziti.com.ttf'

/**
 * 标签系统类
 * 负责管理场景中的3D标签、鼠标交互和相机控制
 */
export class LabelSystem {
  /**
   * 初始化标签系统
   */
  constructor() {
    /** @type {Map} 存储所有标签对象的Map集合 */
    this.labels = new Map()
    /** @type {THREE.Raycaster} 射线投射器,用于鼠标拾取 */
    this.raycaster = new THREE.Raycaster()
    /** @type {THREE.Vector2} 鼠标位置向量 */
    this.mouse = new THREE.Vector2()
    /** @type {Object|null} 当前高亮的行星对象 */
    this.currentHighlight = null
    /** @type {THREE.Camera|null} Three.js相机实例 */
    this.camera = null
    /** @type {THREE.Scene|null} Three.js场景实例 */
    this.scene = null
    /** @type {OrbitControls|null} 轨道控制器实例 */
    this.controls = null
    /** @type {boolean} 相机是否锁定状态 */
    this.isLocked = false
    /** @type {Object|null} 目标行星对象 */
    this.targetPlanet = null
    /** @type {boolean} 是否处于过渡动画状态 */
    this.isTransitioning = false

    // 创建ESC提示框
    /** @type {HTMLElement} ESC提示框DOM元素 */
    this.escapeHint = document.createElement('div')
    this.escapeHint.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      font-size: 16px;
      display: none;
      z-index: 1000;
    `
    this.escapeHint.textContent = '按ESC键退出锁定视角'
    document.body.appendChild(this.escapeHint)

    // 初始化CSS2D渲染器
    /** @type {CSS2DRenderer} CSS 2D渲染器实例 */
    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight)
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0'
    this.labelRenderer.domElement.style.left = '0'
    this.labelRenderer.domElement.style.pointerEvents = 'none'
    document.body.appendChild(this.labelRenderer.domElement)
  }

  /**
   * 鼠标移动事件处理
   * @param {MouseEvent} event - 鼠标移动事件对象
   */ 
  onMouseMove(event) {
    // 将鼠标坐标归一化到 -1 到 1 的范围
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    // 根据鼠标位置和相机设置射线
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // 检测射线与场景中物体的相交
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    if (intersects.length > 0) {
      // 在相交的物体中查找第一个行星对象
      const planetObject = intersects.find((intersect) => {
        const name = this.getPlanetName(intersect.object)
        return name !== null
      })

      // 如果找到行星对象,高亮显示该行星
      if (planetObject) {
        const name = this.getPlanetName(planetObject.object)
        this.highlightPlanet(name, planetObject.object)
      } else {
        // 如果没有找到行星对象,清除当前高亮
        this.clearHighlight()
      }
    } else {
      // 如果射线没有相交的物体,清除当前高亮
      this.clearHighlight()
    }
  }

  /**
   * 获取行星名称
   * @param {THREE.Object3D} object - 目标对象
   * @returns {string|null} 行星名称或null
   */
  getPlanetName(object) {
    // 定义所有可能的行星名称
    const planetNames = ['太阳', '水星', '金星', '地球', '火星', '木星', '土星', '天王星', '海王星', '月球']
    let current = object

    // 向上遍历对象层级,查找包含行星名称的对象
    while (current) {
      if (current.userData && current.userData.planetName) {
        // 排除星链和小行星带
        if (current.userData.planetName === '星链' || current.userData.planetName === '小行星带') {
          return null
        }
        return current.userData.planetName
      }
      current = current.parent
    }
    return null
  }

  /**
   * 初始化标签系统
   * @param {THREE.Camera} camera - Three.js相机实例
   * @param {THREE.Scene} scene - Three.js场景实例
   * @param {OrbitControls} controls - 轨道控制器实例
   */
  init(camera, scene, controls) {
    // 保存相机、场景和控制器引用
    this.camera = camera
    this.scene = scene
    this.controls = controls

    // 添加事件监听器
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('click', this.onClick.bind(this))
    window.addEventListener('keydown', this.onKeyDown.bind(this))

    // 定义行星标签数据
    const labelData = [
      { name: '太阳', color: '#ffaa00' },
      { name: '水星', color: '#cccccc' },
      { name: '金星', color: '#ffb6c1' },
      { name: '地球', color: '#4169e1' },
      { name: '火星', color: '#ff4500' },
      { name: '木星', color: '#ff9966' },
      { name: '土星', color: '#ffcc66' },
      { name: '天王星', color: '#66ffff' },
      { name: '海王星', color: '#6699ff' }
    ]

    // 为每个行星创建标签
    labelData.forEach((data) => {
      // 创建标签的HTML元素
      const element = document.createElement('div')
      element.className = 'planet-label'
      element.textContent = data.name
      // 设置标签样式
      element.style.cssText = `
        font-family: '山海汲古明刻';
        color: #ffffff;
        font-size: 24px;
        text-shadow: 0 0 10px rgba(0,0,0,0.8);
        transition: opacity 0.3s ease, text-shadow 0.3s ease;
        opacity: 0.8;
        white-space: nowrap;
        cursor: pointer;
        text-align: center;
        pointer-events: auto;
      `

      // 添加鼠标悬停事件
      element.addEventListener('mouseenter', () => {
        this.highlightPlanet(data.name)
        document.body.style.cursor = 'pointer'
      })
      element.addEventListener('mouseleave', () => {
        this.clearHighlight()
        document.body.style.cursor = 'auto'
      })

      // 创建CSS2D标签对象并设置中心点
      const label = new CSS2DObject(element)
      label.center.set(0.5, 0.5)
      this.labels.set(data.name, label)
    })
  }

  /**
   * 将标签添加到场景中
   * @param {THREE.Scene} scene - Three.js场景实例
   * @param {THREE.Mesh} planetMesh - 行星对象
   * @param {string} name - 行星名称
   */
  addToScene(scene, planetMesh, name) {
    // 计算行星包围盒大小
    const box = new THREE.Box3().setFromObject(planetMesh)
    const size = box.getSize(new THREE.Vector3())

    // 为不同行星设置标签位置的偏移系数
    const offsetFactors = {
      太阳: 0.6,
      水星: 1.2,
      金星: 0.7,
      地球: 0.6,
      火星: 1.1,
      木星: 0.6,
      土星: 0.6,
      天王星: -0.5,
      海王星: 1.1
    }

    // 将标签添加到行星对象上
    const label = this.labels.get(name)
    if (label) {
      planetMesh.add(label)
      // 根据偏移系数设置标签位置
      const offsetFactor = offsetFactors[name] || 1.1
      label.position.set(0, size.y * offsetFactor, 0)
    }
  }

  /**
   * 高亮行星
   * @param {string} name - 行星名称
   * @param {THREE.Mesh} planetMesh - 行星对象
   */
  highlightPlanet(name, planetMesh) {
    // 检查是否需要更新高亮状态
    if (this.currentHighlight !== name) {
      this.clearHighlight()

      // 高亮标签
      const label = this.labels.get(name)
      if (label) {
        // 设置高亮样式
        label.element.style.opacity = '1'
        label.element.style.transform = 'scale(1.2)'
        label.element.style.textShadow = '0 0 20px rgba(255,255,255,0.5)'
        label.element.style.cursor = 'pointer'
        document.body.style.cursor = 'pointer'
      }

      // 设置行星的鼠标样式
      if (planetMesh) {
        planetMesh.style = planetMesh.style || {}
        planetMesh.style.cursor = 'pointer'
        document.body.style.cursor = 'pointer'
      }

      // 更新当前高亮的行星名称
      this.currentHighlight = name
    }
  }

  /**
   * 清除高亮状态
   */
  clearHighlight() {
    if (this.currentHighlight) {
      // 获取当前高亮的标签
      const label = this.labels.get(this.currentHighlight)
      if (label) {
        // 恢复标签的默认样式
        label.element.style.opacity = '0.8'
        label.element.style.transform = 'scale(1)'
        label.element.style.textShadow = '0 0 10px rgba(0,0,0,0.8)'
      }

      // 恢复默认鼠标样式
      document.body.style.cursor = 'auto'

      // 清除当前高亮记录
      this.currentHighlight = null
    }
  }

  /**
   * 更新标签系统
   */
  update() {
    if (!this.camera) return

    // 处理锁定视角时的相机更新
    if (this.isLocked && this.targetPlanet && !this.isTransitioning) {
      // 获取行星的世界坐标
      const planetPosition = new THREE.Vector3()
      this.targetPlanet.getWorldPosition(planetPosition)

      // 计算相机相对于行星的偏移量
      const cameraOffset = new THREE.Vector3()
      cameraOffset.subVectors(this.camera.position, this.controls.target)

      // 更新控制器的目标点
      this.controls.target.copy(planetPosition)

      // 更新相机位置
      this.camera.position.copy(planetPosition).add(cameraOffset)

      // 计算相机到目标的方向
      const directionToTarget = new THREE.Vector3()
      directionToTarget.subVectors(this.camera.position, planetPosition).normalize()

      // 计算行星的包围盒和最小距离
      const box = new THREE.Box3().setFromObject(this.targetPlanet)
      const size = box.getSize(new THREE.Vector3())
      const minDistance = Math.max(size.x, size.y, size.z) * 2

      // 确保相机与行星保持最小距离
      const currentDistance = this.camera.position.distanceTo(planetPosition)
      if (currentDistance < minDistance) {
        const newPosition = planetPosition.clone().add(directionToTarget.multiplyScalar(minDistance))
        this.camera.position.copy(newPosition)
      }
    }

    // 渲染标签
    this.labelRenderer.render(this.scene, this.camera)
  }

  /**
   * 调整标签渲染器大小
   */
  resize() {
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight)
  }

  /**
   * 查找场景中具有特定用户数据的对象
   * @param {THREE.Scene} scene - Three.js场景实例
   * @param {string} key - 用户数据键
   * @param {any} value - 用户数据值
   * @returns {THREE.Object3D|null} 找到的对象或null
   */
  findObjectByUserData(scene, key, value) {
    let result = null
    // 遍历场景中的所有对象
    scene.traverse((object) => {
      if (object.userData && object.userData[key] === value) {
        result = object
      }
    })
    return result
  }

  /**
   * 鼠标点击事件处理
   * @param {MouseEvent} event - 鼠标点击事件对象
   */
  onClick(event) {
    // 初始化行星名称变量
    let planetName = null

    // 检查是否点击了标签
    if (event.target.classList && event.target.classList.contains('planet-label')) {
      planetName = event.target.textContent
    } else {
      // 检查是否点击了行星
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.raycaster.intersectObjects(this.scene.children, true)

      // 查找点击的行星对象
      if (intersects.length > 0) {
        const planetObject = intersects.find((intersect) => {
          const name = this.getPlanetName(intersect.object)
          return name !== null
        })

        if (planetObject) {
          planetName = this.getPlanetName(planetObject.object)
        }
      }
    }

    // 如果点击了行星且不是当前锁定的行星,则锁定视角
    if (planetName && (!this.isLocked || planetName !== this.targetPlanet?.userData?.planetName)) {
      this.lockViewToPlanet(planetName)
    }
  }

  /**
   * 键盘按下事件处理
   * @param {KeyboardEvent} event - 键盘按下事件对象
   */
  onKeyDown(event) {
    // 按ESC键解除视角锁定
    if (event.key === 'Escape' && this.isLocked) {
      this.unlockView()
    }
  }

  /**
   * 锁定视角到行星
   * @param {string} planetName - 行星名称
   */
  lockViewToPlanet(planetName) {
    // 查找目标行星
    const planet = this.findObjectByUserData(this.scene, 'planetName', planetName)
    if (!planet) return

    // 设置锁定状态
    this.isLocked = true
    this.targetPlanet = planet
    this.isTransitioning = true
    this.escapeHint.style.display = 'block'

    // 获取行星位置
    const planetPosition = new THREE.Vector3()
    planet.getWorldPosition(planetPosition)

    // 计算相机目标位置
    const box = new THREE.Box3().setFromObject(planet)
    const size = box.getSize(new THREE.Vector3())
    const distance = Math.max(size.x, size.y, size.z) * 3

    // 计算相机到行星的方向
    const directionToTarget = new THREE.Vector3()
    directionToTarget.subVectors(this.camera.position, planetPosition).normalize()

    // 计算目标位置
    const targetPosition = planetPosition.clone().add(directionToTarget.multiplyScalar(distance))

    // 使用GSAP执行相机移动动画
    gsap.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 2,
      ease: 'power2.inOut'
    })

    // 使用GSAP执行控制器目标点移动动画
    gsap.to(this.controls.target, {
      x: planetPosition.x,
      y: planetPosition.y,
      z: planetPosition.z,
      duration: 2,
      ease: 'power2.inOut',
      onComplete: () => {
        // 设置控制器的距离限制
        this.controls.minDistance = distance * 0.8
        this.controls.maxDistance = distance * 5
        this.isTransitioning = false
      }
    })
  }

  /**
   * 解锁视角
   */
  unlockView() {
    // 重置所有锁定相关的状态
    this.isLocked = false
    this.targetPlanet = null
    this.isTransitioning = false
    this.escapeHint.style.display = 'none'
    // 重置控制器的距离限制
    this.controls.minDistance = 0.1
    this.controls.maxDistance = 1000
  }
}
