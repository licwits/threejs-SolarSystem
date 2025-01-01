import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import glowVertexShader from '@/shader/starLinks/glow/vertex.glsl?raw'
import glowFragmentShader from '@/shader/starLinks/glow/fragment.glsl?raw'
import nodeVertexShader from '@/shader/starLinks/node/vertex.glsl?raw'
import nodeFragmentShader from '@/shader/starLinks/node/fragment.glsl?raw'

/**
 * 星链效果类
 * 用于创建和管理动态的星链效果,包括节点、连线和发光效果
 */
export class StarLinks {
  constructor() {
    /** 星链组对象,用于管理所有星链相关的网格 */
    this.mesh = new THREE.Group()
    /** 存储所有活动的星链对象 */
    this.links = []
    /** 同时显示的最大星链数量 */
    this.maxLinks = 2000 
    /** 每条星链的最少节点数 */
    this.minPoints = 4 
    /** 每条星链的最多节点数 */
    this.maxPoints = 7 
    /** 星链生成的水平范围(单位:像素) */
    this.spawnRadius = 4000 
    /** 星链生成的垂直范围(单位:像素) */
    this.spawnHeight = 200 
    /** 每条星链的生命周期(单位:秒) */
    this.linkLifeTime = 10 
    /** 节点移动的速度系数 */
    this.nodeMovementSpeed = 0.5 
    /** 节点移动的范围系数 */
    this.nodeMovementRange = 0.3 
    /** 用于动画的时间累加器 */
    this.time = 0
    /** 存储所有发光效果网格的数组 */
    this.glowMeshes = [] 
  }

  /**
   * 初始化星链系统
   * @returns {THREE.Group} 星链组对象
   */
  init() {
    // 创建星链节点的材质
    /** 节点着色器材质 */
    this.nodeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        opacity: { value: 0.0 },
        time: { value: 0.0 }
      },
      vertexShader: nodeVertexShader,
      fragmentShader: nodeFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    })

    // 创建星链线条的材质
    /** 线条材质 */
    this.lineMaterial = new LineMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 3,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      dashed: false,
      alphaToCoverage: false,
      vertexColors: true,
      depthWrite: false,
      depthTest: true
    })

    // 创建发光效果的材质
    /** 发光效果着色器材质 */
    this.glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x66ccff) },
        opacity: { value: 0.0 },
        glowIntensity: { value: 1.5 },
        time: { value: 0.0 }
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    return this.mesh
  }

  /**
   * 创建一条新的星链
   * 包括节点、连线和发光效果
   */
  createLink() {
    // 生成随机点
    /** 随机生成的节点数量 */
    const pointCount = Math.floor(Math.random() * (this.maxPoints - this.minPoints + 1)) + this.minPoints
    /** 存储节点位置的数组 */
    const points = []

    // 随机选择一个起始位置
    /** 中心点X坐标 */
    const centerX = (Math.random() - 0.5) * this.spawnRadius
    /** 中心点Z坐标 */
    const centerZ = (Math.random() - 0.5) * this.spawnRadius
    /** 中心点Y坐标 */
    const centerY = (Math.random() - 0.5) * this.spawnHeight

    // 生成一条曲线上的点
    for (let i = 0; i < pointCount; i++) {
      /** 当前点在曲线上的比例(0-1) */
      const t = i / (pointCount - 1)
      /** X坐标(添加随机偏移) */
      const x = centerX + (Math.random() - 0.5) * 20
      /** Y坐标(正弦曲线加随机偏移) */
      const y = centerY + Math.sin(t * Math.PI) * 15 + (Math.random() - 0.5) * 8
      /** Z坐标(添加随机偏移) */
      const z = centerZ + (Math.random() - 0.5) * 20
      points.push(new THREE.Vector3(x, y, z))
    }

    // 创建节点
    /** 节点几何体 */
    const nodesGeometry = new THREE.BufferGeometry().setFromPoints(points)
    /** 节点网格对象 */
    const nodes = new THREE.Points(nodesGeometry, this.nodeMaterial.clone())

    // 创建连线
    /** 线条几何体 */
    const lineGeometry = new LineGeometry()
    /** 线条顶点位置数组 */
    const positions = points.reduce((arr, point) => {
      arr.push(point.x, point.y, point.z)
      return arr
    }, [])
    lineGeometry.setPositions(positions)

    // 添加颜色属性以创建渐变效果
    /** 存储顶点颜色的数组 */
    const colors = []
    for (let i = 0; i < points.length; i++) {
      /** 当前点在线条上的比例(0-1) */
      const t = i / (points.length - 1)
      /** 颜色强度,使用幂函数使渐变更明显 */
      const intensity = Math.pow(Math.sin(t * Math.PI), 0.5)
      // 从亮蓝色渐变到暗蓝色
      colors.push(
        0.4 + intensity * 0.6, // R
        0.7 + intensity * 0.3, // G
        1.0 // B
      )
    }
    lineGeometry.setColors(colors)

    /** 线条材质实例 */
    const material = this.lineMaterial.clone()
    /** 线条网格对象 */
    const line = new Line2(lineGeometry, material)
    line.computeLineDistances()

    // 存储原始位置用于动画
    /** 存储节点原始位置的数组 */
    const originalPositions = points.map((p) => p.clone())
    /** 存储节点移动偏移量的数组 */
    const movementOffsets = points.map(() => ({
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2
    }))

    // 为每个点创建发光效果
    /** 发光效果平面几何体 */
    const glowGeometry = new THREE.PlaneGeometry(30, 30)
    /** 发光效果网格数组 */
    const glowMeshes = points.map((point) => {
      const glowMaterial = this.glowMaterial.clone()
      glowMaterial.uniforms = {
        color: { value: new THREE.Color(0x66ccff) },
        opacity: { value: 0.0 },
        glowIntensity: { value: 1.5 },
        time: { value: 0.0 }
      }
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
      glowMesh.position.copy(point)
      this.mesh.add(glowMesh)
      return glowMesh
    })

    // 创建星链对象
    /** 完整的星链对象 */
    const link = {
      nodes,
      line,
      points,
      originalPositions,
      movementOffsets,
      glowMeshes,
      life: this.linkLifeTime,
      fadeIn: true,
      fadeOut: false
    }

    this.links.push(link)
    this.mesh.add(nodes)
    this.mesh.add(line)
  }

  /**
   * 更新星链动画
   * @param {number} deltaTime - 帧间隔时间(秒)
   */
  animate(deltaTime) {
    this.time += deltaTime

    // 检查是否需要创建新的星链
    if (this.links.length < this.maxLinks && Math.random() < 0.5) {
      this.createLink()
    }

    // 更新现有星链
    for (let i = this.links.length - 1; i >= 0; i--) {
      /** 当前处理的星链对象 */
      const link = this.links[i]

      // 更新生命周期
      link.life -= deltaTime

      // 检查是否需要移除星链
      if (link.life <= 0) {
        // 移除网格并释放资源
        this.mesh.remove(link.nodes)
        this.mesh.remove(link.line)
        link.nodes.geometry.dispose()
        link.line.geometry.dispose()
        link.nodes.material.dispose()
        link.line.material.dispose()
        // 清理发光效果
        link.glowMeshes.forEach((glowMesh) => {
          this.mesh.remove(glowMesh)
          glowMesh.geometry.dispose()
          glowMesh.material.dispose()
        })
        this.links.splice(i, 1)
        continue
      }

      // 淡入效果
      if (link.fadeIn) {
        link.nodes.material.uniforms.opacity.value += deltaTime * 0.5
        link.nodes.material.uniforms.time.value = this.time
        link.line.material.opacity += deltaTime * 0.4
        if (link.nodes.material.uniforms.opacity.value >= 0.8) {
          link.fadeIn = false
          link.line.material.opacity = 0.6
        }
      }

      // 淡出效果
      if (link.life < 2) {
        link.nodes.material.uniforms.opacity.value -= deltaTime * 0.4
        link.nodes.material.uniforms.time.value = this.time
        link.line.material.opacity -= deltaTime * 0.3
        link.fadeOut = true
      }

      // 更新节点位置
      /** 存储更新后的节点位置 */
      const positions = []
      /** 存储更新后的线条顶点位置 */
      const linePositions = []

      for (let j = 0; j < link.points.length; j++) {
        /** 当前节点的移动偏移量 */
        const offset = link.movementOffsets[j]
        /** 当前节点的原始位置 */
        const orig = link.originalPositions[j]

        // 使用正弦函数计算新位置
        const x = orig.x + Math.sin(offset.x + performance.now() * 0.001 * this.nodeMovementSpeed) * this.nodeMovementRange
        const y = orig.y + Math.sin(offset.y + performance.now() * 0.001 * this.nodeMovementSpeed) * this.nodeMovementRange
        const z = orig.z + Math.sin(offset.z + performance.now() * 0.001 * this.nodeMovementSpeed) * this.nodeMovementRange

        positions.push(new THREE.Vector3(x, y, z))
        linePositions.push(x, y, z)
      }

      // 更新几何体
      link.nodes.geometry.setFromPoints(positions)
      link.line.geometry.setPositions(linePositions)
      link.line.computeLineDistances()

      // 更新发光效果
      link.glowMeshes.forEach((glowMesh, index) => {
        /** 当前发光效果对应的节点位置 */
        const pos = positions[index]
        glowMesh.position.copy(pos)
        glowMesh.material.uniforms.time.value = this.time

        // 同步透明度
        if (link.fadeIn) {
          glowMesh.material.uniforms.opacity.value = link.nodes.material.uniforms.opacity.value * 0.6
        }
        if (link.fadeOut) {
          glowMesh.material.uniforms.opacity.value = link.nodes.material.uniforms.opacity.value * 0.6
        }
      })
    }
  }
}
