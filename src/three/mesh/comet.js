import * as THREE from 'three'
import { gui } from '../gui'

export class Comet {
  constructor() {
    this.mesh = null
    this.particles = null
    this.angle = Math.random() * Math.PI * 2
    this.orbitSpeed = 0.0005
    this.a = gui.params.orbits.scale * 8
    this.e = 0.8
    this.particleCount = 1000
    this.particleSystem = null
  }

  init() {
    // 创建不规则的彗星核心
    const geometry = new THREE.IcosahedronGeometry(0.3, 1)

    // 随机变形顶点位置制造不规则形状
    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3()
      vertex.fromBufferAttribute(positions, i)
      vertex.x += (Math.random() - 0.5) * 0.2
      vertex.y += (Math.random() - 0.5) * 0.2
      vertex.z += (Math.random() - 0.5) * 0.2
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z)
    }

    // 彗星核心材质
    const material = new THREE.MeshPhongMaterial({
      color: 0x88aaff,
      emissive: 0x4477ff,
      shininess: 50,
      transparent: true,
      opacity: 0.8
    })

    this.mesh = new THREE.Mesh(geometry, material)

    // 创建粒子系统
    this.initParticleSystem()

    // 创建彗星组
    const group = new THREE.Group()
    group.add(this.mesh)
    group.add(this.particleSystem)

    this.updatePosition()
    return group
  }

  initParticleSystem() {
    const particles = new Float32Array(this.particleCount * 3)
    const colors = new Float32Array(this.particleCount * 3)
    const sizes = new Float32Array(this.particleCount)
    const alphas = new Float32Array(this.particleCount)

    const color = new THREE.Color()

    // 使用正弦函数创建更平滑的分布
    for (let i = 0; i < this.particleCount; i++) {
      // 使用正弦分布使粒子分布更密集
      const t = i / this.particleCount
      const x = -Math.pow(t, 0.7) * 6 // 使用幂函数使分布更加平滑

      // 使用正弦函数创建螺旋状扩散
      const angle = t * 50 // 控制螺旋密度
      const radius = Math.abs(x / 3) // 扩散半径随距离增加
      const y = Math.sin(angle) * radius
      const z = Math.cos(angle) * radius

      particles[i * 3] = x
      particles[i * 3 + 1] = y
      particles[i * 3 + 2] = z

      // 平滑的颜色渐变
      const mixFactor = Math.pow(Math.abs(x / 6), 0.8) // 使用幂函数使颜色渐变更平滑
      color.setHSL(0.6, 0.3 * (1 - mixFactor), 1 - mixFactor * 0.3)

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      // 平滑的大小变化
      sizes[i] = (1 - Math.pow(Math.abs(x / 6), 1.2)) * 0.4

      // 平滑的透明度变化
      alphas[i] = (1 - Math.pow(Math.abs(x / 6), 1.5)) * 0.8
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, r) * vAlpha;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })

    this.particleSystem = new THREE.Points(geometry, material)
  }

  updatePosition() {
    const r = (this.a * (1 - this.e * this.e)) / (1 + this.e * Math.cos(this.angle))
    const x = r * Math.cos(this.angle) - this.a * this.e
    const z = r * Math.sin(this.angle)

    this.mesh.parent.position.set(x, 0, z)

    // 使彗星和尾巴朝向运动方向
    this.mesh.parent.rotation.y = -this.angle - Math.PI / 2
  }

  animate() {
    if (this.mesh) {
      // 更新位置
      this.angle += this.orbitSpeed
      this.updatePosition()

      // 更新粒子
      const positions = this.particleSystem.geometry.attributes.position.array
      const alphas = this.particleSystem.geometry.attributes.alpha.array
      const sizes = this.particleSystem.geometry.attributes.size.array

      for (let i = 0; i < this.particleCount; i++) {
        // 平滑移动粒子
        positions[i * 3] -= 0.02 + Math.random() * 0.01 // 添加随机速度变化

        // 如果粒子移动到尾巴末端，平滑重置到头部
        if (positions[i * 3] < -6) {
          // 渐变重置位置
          positions[i * 3] = -Math.random() * 0.1 // 在头部附近随机生成

          // 在核心周围螺旋状生成新粒子
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * 0.1
          positions[i * 3 + 1] = Math.sin(angle) * radius
          positions[i * 3 + 2] = Math.cos(angle) * radius

          // 平滑过渡透明度和大小
          alphas[i] = 0.8
          sizes[i] = 0.4
        } else {
          // 动态调整粒子大小和透明度
          const dist = Math.abs(positions[i * 3] / 6)
          sizes[i] = (1 - Math.pow(dist, 1.2)) * 0.4
          alphas[i] = (1 - Math.pow(dist, 1.5)) * 0.8
        }

        // 添加微小的横向运动
        positions[i * 3 + 1] += (Math.random() - 0.5) * 0.002
        positions[i * 3 + 2] += (Math.random() - 0.5) * 0.002
      }

      this.particleSystem.geometry.attributes.position.needsUpdate = true
      this.particleSystem.geometry.attributes.alpha.needsUpdate = true
      this.particleSystem.geometry.attributes.size.needsUpdate = true
    }
  }
}
