import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import glowVertexShader from '@/shader/starLinks/glow/vertex.glsl?raw'
import glowFragmentShader from '@/shader/starLinks/glow/fragment.glsl?raw'
import nodeVertexShader from '@/shader/starLinks/node/vertex.glsl?raw'
import nodeFragmentShader from '@/shader/starLinks/node/fragment.glsl?raw'

export class StarLinks {
  constructor() {
    this.mesh = new THREE.Group()
    this.links = []
    this.maxLinks = 2000 // 增加同时显示的星链数
    this.minPoints = 4 // 每条星链最少的点数
    this.maxPoints = 7 // 每条星链最多的点数
    this.spawnRadius = 4000 // 增大水平生成范围
    this.spawnHeight = 200 // 增大垂直生成范围
    this.linkLifeTime = 10 // 星链存在时间(秒)
    this.nodeMovementSpeed = 0.5 // 增加节点移动速度
    this.nodeMovementRange = 0.3 // 调整节点移动范围
    this.time = 0
    this.glowMeshes = [] // 存储发光效果的网格
    this.bloomLayer = null
  }

  init(bloomLayer) {
    this.bloomLayer = bloomLayer
    // 创建星链节点的材质
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
    this.lineMaterial = new LineMaterial({
      color: 0x66ccff, // 调整为更亮的蓝色
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 3, // 减小线条宽度
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      dashed: false,
      alphaToCoverage: false,
      vertexColors: true, // 启用顶点颜色以实现渐变效果
      depthWrite: false,
      depthTest: true
    })

    // 创建发光效果的材质
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

  createLink() {
    // 生成随机点
    const pointCount = Math.floor(Math.random() * (this.maxPoints - this.minPoints + 1)) + this.minPoints
    const points = []

    // 随机选择一个起始位置
    const centerX = (Math.random() - 0.5) * this.spawnRadius
    const centerZ = (Math.random() - 0.5) * this.spawnRadius
    const centerY = (Math.random() - 0.5) * this.spawnHeight

    // 生成一条曲线上的点
    for (let i = 0; i < pointCount; i++) {
      const t = i / (pointCount - 1)
      const x = centerX + (Math.random() - 0.5) * 20
      const y = centerY + Math.sin(t * Math.PI) * 15 + (Math.random() - 0.5) * 8
      const z = centerZ + (Math.random() - 0.5) * 20
      points.push(new THREE.Vector3(x, y, z))
    }

    // 创建节点
    const nodesGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const nodes = new THREE.Points(nodesGeometry, this.nodeMaterial.clone())

    // 创建连线
    const lineGeometry = new LineGeometry()
    const positions = points.reduce((arr, point) => {
      arr.push(point.x, point.y, point.z)
      return arr
    }, [])
    lineGeometry.setPositions(positions)

    // 添加颜色属性以创建渐变效果
    const colors = []
    for (let i = 0; i < points.length; i++) {
      // 创建更强烈的渐变效果
      const t = i / (points.length - 1)
      const intensity = Math.pow(Math.sin(t * Math.PI), 0.5) // 使用幂函数使渐变更明显
      // 从亮蓝色渐变到暗蓝色
      colors.push(
        0.4 + intensity * 0.6, // R
        0.7 + intensity * 0.3, // G
        1.0 // B
      )
    }
    lineGeometry.setColors(colors)

    const material = this.lineMaterial.clone()
    const line = new Line2(lineGeometry, material)
    line.computeLineDistances()

    // 存储原始位置用于动画
    const originalPositions = points.map((p) => p.clone())
    const movementOffsets = points.map(() => ({
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2
    }))

    // 为每个点创建发光效果
    const glowGeometry = new THREE.PlaneGeometry(30, 30)
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
    const link = {
      nodes,
      line,
      points,
      originalPositions,
      movementOffsets,
      glowMeshes, // 添加发光网格数组
      life: this.linkLifeTime,
      fadeIn: true,
      fadeOut: false
    }

    this.links.push(link)
    this.mesh.add(nodes)
    this.mesh.add(line)
  }

  animate(deltaTime) {
    this.time += deltaTime

    // 检查是否需要创建新的星链
    if (this.links.length < this.maxLinks && Math.random() < 0.5) {
      this.createLink()
    }

    // 更新现有星链
    for (let i = this.links.length - 1; i >= 0; i--) {
      const link = this.links[i]

      // 更新生命周期
      link.life -= deltaTime

      // 检查是否需要移除星链
      if (link.life <= 0) {
        // 移除网格
        this.mesh.remove(link.nodes)
        this.mesh.remove(link.line)
        // 释放几何体和材质
        link.nodes.geometry.dispose()
        link.line.geometry.dispose()
        link.nodes.material.dispose()
        link.line.material.dispose()
        // 在移除星链时也要清理发光效果
        link.glowMeshes.forEach((glowMesh) => {
          this.mesh.remove(glowMesh)
          glowMesh.geometry.dispose()
          glowMesh.material.dispose()
        })
        // 从数组中移除
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
      const positions = []
      const linePositions = []

      for (let j = 0; j < link.points.length; j++) {
        const offset = link.movementOffsets[j]
        const orig = link.originalPositions[j]

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
