import * as THREE from 'three'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
import gsap from 'gsap'
import '@/assets/font/山海汲古明刻_mianfeiziti.com.ttf'

export class LabelSystem {
  constructor() {
    this.labels = new Map() // 存储所有标签对象
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.currentHighlight = null
    this.camera = null
    this.scene = null
    this.controls = null
    this.isLocked = false
    this.targetPlanet = null
    this.isTransitioning = false // 添加过渡状态标记

    // 创建提示框
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

    // 创建CSS2D渲染器
    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight)
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0'
    this.labelRenderer.domElement.style.left = '0'
    this.labelRenderer.domElement.style.pointerEvents = 'none'
    document.body.appendChild(this.labelRenderer.domElement)
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    // 更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // 检测相交的对象
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    if (intersects.length > 0) {
      // 查找第一个行星对象
      const planetObject = intersects.find((intersect) => {
        const name = this.getPlanetName(intersect.object)
        return name !== null
      })

      if (planetObject) {
        const name = this.getPlanetName(planetObject.object)
        this.highlightPlanet(name, planetObject.object)
      } else {
        this.clearHighlight()
      }
    } else {
      this.clearHighlight()
    }
  }

  getPlanetName(object) {
    // 根据对象或其父对象找到行星名称
    const planetNames = ['太阳', '水星', '金星', '地球', '火星', '木星', '土星', '天王星', '海王星', '月球']
    let current = object

    while (current) {
      if (current.userData && current.userData.planetName) {
        // 排除星链
        if (current.userData.planetName === '星链' || current.userData.planetName === '小行星带') {
          return null
        }
        return current.userData.planetName
      }
      current = current.parent
    }
    return null
  }

  init(camera, scene, controls) {
    this.camera = camera
    this.scene = scene
    this.controls = controls

    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('click', this.onClick.bind(this))
    window.addEventListener('keydown', this.onKeyDown.bind(this))

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

    labelData.forEach((data) => {
      // 创建HTML元素
      const element = document.createElement('div')
      element.className = 'planet-label'
      element.textContent = data.name
      element.style.cssText = `
        font-family: '山海汲古明刻';
        color: #ffffff;
        font-size: 24px;
        font-weight: 600;
        text-shadow: 0 0 10px rgba(0,0,0,0.8);
        transition: opacity 0.3s ease, text-shadow 0.3s ease;
        opacity: 0.8;
        white-space: nowrap;
        cursor: pointer;
        text-align: center;
        pointer-events: auto;
      `

      // 添加鼠标事件监听器
      element.addEventListener('mouseenter', () => {
        this.highlightPlanet(data.name)
        document.body.style.cursor = 'pointer'
      })
      element.addEventListener('mouseleave', () => {
        this.clearHighlight()
        document.body.style.cursor = 'auto'
      })

      // 创建CSS2D对象
      const label = new CSS2DObject(element)
      label.center.set(0.5, 0.5)
      this.labels.set(data.name, label)
    })
  }

  addToScene(scene, planetMesh, name) {
    // 计算行星大小
    const box = new THREE.Box3().setFromObject(planetMesh)
    const size = box.getSize(new THREE.Vector3())

    // 为不同星球设置不同的偏移系数
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

    // 添加标签到行星
    const label = this.labels.get(name)
    if (label) {
      planetMesh.add(label)
      // 设置标签位置在行星上方
      const offsetFactor = offsetFactors[name] || 1.1
      label.position.set(0, size.y * offsetFactor, 0)
    }
  }

  highlightPlanet(name, planetMesh) {
    if (this.currentHighlight !== name) {
      this.clearHighlight()

      // 高亮标签
      const label = this.labels.get(name)
      if (label) {
        label.element.style.opacity = '1'
        label.element.style.transform = 'scale(1.2)'
        label.element.style.textShadow = '0 0 20px rgba(255,255,255,0.5)'
        label.element.style.cursor = 'pointer'
        document.body.style.cursor = 'pointer'
      }

      // 设置星球的鼠标样式
      if (planetMesh) {
        planetMesh.style = planetMesh.style || {}
        planetMesh.style.cursor = 'pointer'
        document.body.style.cursor = 'pointer'
      }

      this.currentHighlight = name
    }
  }

  clearHighlight() {
    if (this.currentHighlight) {
      const label = this.labels.get(this.currentHighlight)
      if (label) {
        label.element.style.opacity = '0.8'
        label.element.style.transform = 'scale(1)'
        label.element.style.textShadow = '0 0 10px rgba(0,0,0,0.8)'
      }

      // 恢复默认鼠标样式
      document.body.style.cursor = 'auto'

      this.currentHighlight = null
    }
  }

  update() {
    if (!this.camera) return

    // 如果视角被锁定，更新相机位置以跟随行星
    if (this.isLocked && this.targetPlanet && !this.isTransitioning) {
      const planetPosition = new THREE.Vector3()
      this.targetPlanet.getWorldPosition(planetPosition)

      // 保持相机相对于行星的相对位置
      const cameraOffset = new THREE.Vector3()
      cameraOffset.subVectors(this.camera.position, this.controls.target)

      // 更新控制器目标点到行星位置
      this.controls.target.copy(planetPosition)

      // 更新相机位置，保持相对位置不变
      this.camera.position.copy(planetPosition).add(cameraOffset)

      // 获取当前相机到目标的方向
      const directionToTarget = new THREE.Vector3()
      directionToTarget.subVectors(this.camera.position, planetPosition).normalize()

      // 计算相机应该在的位置
      const box = new THREE.Box3().setFromObject(this.targetPlanet)
      const size = box.getSize(new THREE.Vector3())
      const minDistance = Math.max(size.x, size.y, size.z) * 2

      // 确保相机不会太靠近行星
      const currentDistance = this.camera.position.distanceTo(planetPosition)
      if (currentDistance < minDistance) {
        const newPosition = planetPosition.clone().add(directionToTarget.multiplyScalar(minDistance))
        this.camera.position.copy(newPosition)
      }
    }

    this.labelRenderer.render(this.scene, this.camera)
  }

  resize() {
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight)
  }

  findObjectByUserData(scene, key, value) {
    let result = null
    scene.traverse((object) => {
      if (object.userData && object.userData[key] === value) {
        result = object
      }
    })
    return result
  }

  onClick(event) {
    // 检查是否点击了星球或标签
    const target = event.target
    let planetName = null

    // 检查是否点击了标签
    if (target.classList && target.classList.contains('planet-label')) {
      planetName = target.textContent
    } else {
      // 检查是否点击了星球
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.raycaster.intersectObjects(this.scene.children, true)

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

    // 检查是否点击了当前已锁定的星球
    if (planetName && (!this.isLocked || planetName !== this.targetPlanet?.userData?.planetName)) {
      this.lockViewToPlanet(planetName)
    }
  }

  onKeyDown(event) {
    if (event.key === 'Escape' && this.isLocked) {
      this.unlockView()
    }
  }

  lockViewToPlanet(planetName) {
    const planet = this.findObjectByUserData(this.scene, 'planetName', planetName)
    if (!planet) return

    this.isLocked = true
    this.targetPlanet = planet
    this.isTransitioning = true // 开始过渡动画
    this.escapeHint.style.display = 'block'

    // 获取目标位置
    const planetPosition = new THREE.Vector3()
    planet.getWorldPosition(planetPosition)

    // 计算相机目标位置（根据行星大小调整距离）
    const box = new THREE.Box3().setFromObject(planet)
    const size = box.getSize(new THREE.Vector3())
    const distance = Math.max(size.x, size.y, size.z) * 3

    // 计算当前相机到行星的方向
    const directionToTarget = new THREE.Vector3()
    directionToTarget.subVectors(this.camera.position, planetPosition).normalize()

    // 根据当前相机方向计算目标位置
    const targetPosition = planetPosition.clone().add(directionToTarget.multiplyScalar(distance))

    // 使用GSAP执行相机动画
    gsap.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 2,
      ease: 'power2.inOut'
    })

    gsap.to(this.controls.target, {
      x: planetPosition.x,
      y: planetPosition.y,
      z: planetPosition.z,
      duration: 2,
      ease: 'power2.inOut',
      onComplete: () => {
        // 设置控制器的最小和最大距离，限制缩放范围
        this.controls.minDistance = distance * 0.8
        this.controls.maxDistance = distance * 5
        this.isTransitioning = false // 过渡动画结束
      }
    })
  }

  unlockView() {
    this.isLocked = false
    this.targetPlanet = null
    this.isTransitioning = false
    this.escapeHint.style.display = 'none'
    // 重置控制器的距离限制
    this.controls.minDistance = 0.1
    this.controls.maxDistance = 1000
  }
}
