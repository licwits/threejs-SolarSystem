import * as THREE from 'three'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
import gsap from 'gsap'

export class LabelSystem {
  constructor() {
    this.labels = new Map() // 存储所有标签对象
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.currentHighlight = null
    this.camera = null
    this.scene = null

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
    const planetNames = ['太阳', '水星', '金星', '地球', '火星', '木星', '土星', '天王星', '海王星']
    let current = object

    while (current) {
      if (current.userData && current.userData.planetName) {
        return current.userData.planetName
      }
      current = current.parent
    }
    return null
  }

  init(camera, scene) {
    this.camera = camera
    this.scene = scene

    window.addEventListener('mousemove', this.onMouseMove.bind(this))

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
        color: #ffffff;
        font-size: 24px;
        font-weight: bold;
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
      天王星: -1.1,
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
}
