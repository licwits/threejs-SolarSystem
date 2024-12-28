import * as THREE from 'three'
import vertexShader from '@/shader/sun/vertex.glsl?raw'
import fragmentShader from '@/shader/sun/fragment.glsl?raw'
import flareVertexShader from '@/shader/flare/vertex.glsl?raw'
import flareFragmentShader from '@/shader/flare/fragment.glsl?raw'
import { gui } from '../gui'

export class Sun {
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.flares = []
    this.time = 0
    this.flareStates = [] // 存储每个耀斑的状态
    this.rotationSpeed = gui.params.rotationSpeed // 使用 GUI 中的初始值
  }

  async init() {
    try {
      // 加载纹理
      const sunTexture = await this.textureLoader.loadAsync('/textures/th_sun/medres/th_sun.png')
      const coverTexture = await this.textureLoader.loadAsync('/textures/th_sun/medres/th_suncover.png')

      // 创建自定义着色器材质
      const geometry = new THREE.SphereGeometry(gui.params.sunSize, 128, 128)
      const material = new THREE.ShaderMaterial({
        uniforms: {
          sunTexture: { value: sunTexture },
          coverTexture: { value: coverTexture },
          time: { value: 0 },
          flowSpeed: { value: gui.params.shader.flowSpeed },
          disturbanceScale: { value: gui.params.shader.disturbanceScale },
          glowIntensity: { value: gui.params.shader.glowIntensity },
          brightnessVariation: { value: gui.params.shader.brightnessVariation },
          emissiveIntensity: { value: gui.params.emissiveIntensity }
        },
        vertexShader,
        fragmentShader,
        transparent: true
      })

      this.mesh = new THREE.Mesh(geometry, material)

      // 添加发光效果
      const sunLight = new THREE.PointLight(gui.params.sunLight.color, gui.params.sunLight.intensity, gui.params.sunLight.distance)
      this.mesh.add(sunLight)

      // 添加环境光
      const ambientLight = new THREE.AmbientLight(gui.params.ambientLight.color, gui.params.ambientLight.intensity)
      this.mesh.add(ambientLight)

      // 添加太阳耀斑
      await this.addSunFlares()

      return this.mesh
    } catch (error) {
      console.error('加载太阳纹理失败:', error)
    }
  }

  async addSunFlares() {
    const flareTextures = await Promise.all([this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare1.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare2.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare3.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare4.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare5.png')])

    flareTextures.forEach((texture, index) => {
      // 创建耀斑几何体 - 使用更细长的形状
      const geometry = new THREE.PlaneGeometry(0.2, 2)

      const material = new THREE.ShaderMaterial({
        uniforms: {
          flareTexture: { value: texture },
          time: { value: 0 },
          opacity: { value: 0 },
          progress: { value: 0 },
          arcHeight: { value: 0 },
          startAngle: { value: 0 },
          arcWidth: { value: 0 }
        },
        vertexShader: flareVertexShader,
        fragmentShader: flareFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })

      const flare = new THREE.Mesh(geometry, material)
      const scale = gui.params.flare.size[0] + Math.random() * (gui.params.flare.size[1] - gui.params.flare.size[0])
      flare.scale.set(scale, scale, 1)

      // 初始位置设置在太阳表面
      const angle = (index / flareTextures.length) * Math.PI * 2
      const radius = gui.params.sunSize
      flare.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)

      this.flares.push(flare)
      this.flareStates.push({
        active: false,
        duration: 0,
        fadeIn: false,
        fadeOut: false,
        startAngle: 0,
        arcHeight: 0,
        arcWidth: 0,
        baseAngle: angle // 记录基础角度
      })
      this.mesh.add(flare)
    })
  }

  updateFlare(index, deltaTime) {
    const flare = this.flares[index]
    const state = this.flareStates[index]

    // 仅在基础位置触发耀斑
    if (!state.active) {
      if (Math.random() < gui.params.flare.frequency) {
        state.active = true
        state.duration = gui.params.flare.duration[0] + Math.random() * (gui.params.flare.duration[1] - gui.params.flare.duration[0])
        state.fadeIn = true
        state.fadeOut = false
        state.startAngle = state.baseAngle // 从基础位置开始
        state.arcHeight = gui.params.flare.arcHeight[0] + Math.random() * (gui.params.flare.arcHeight[1] - gui.params.flare.arcHeight[0])
        state.arcWidth = Math.PI * 0.15 // 固定弧度范围，使运动更可控
      }
    }

    if (state.active) {
      const progress = 1 - state.duration / gui.params.flare.duration[1]

      // 更新着色器 uniforms
      flare.material.uniforms.time.value = this.time
      flare.material.uniforms.progress.value = progress
      flare.material.uniforms.opacity.value = flare.material.opacity
      flare.material.uniforms.arcHeight.value = state.arcHeight
      flare.material.uniforms.startAngle.value = state.startAngle
      flare.material.uniforms.arcWidth.value = state.arcWidth

      // 淡入淡出效果
      if (state.fadeIn) {
        flare.material.opacity += deltaTime
        if (flare.material.opacity >= gui.params.flare.opacity) {
          flare.material.opacity = gui.params.flare.opacity
          state.fadeIn = false
        }
      }

      // 更新持续时间和淡出状态
      state.duration -= deltaTime
      if (state.duration <= 0.8 && !state.fadeOut) {
        state.fadeOut = true
      }

      if (state.fadeOut) {
        flare.material.opacity -= deltaTime * 0.5
        if (flare.material.opacity <= 0) {
          flare.material.opacity = 0
          state.active = false
          state.fadeOut = false
          // 重置到基础位置
          const radius = gui.params.sunSize
          flare.position.set(Math.cos(state.baseAngle) * radius, Math.sin(state.baseAngle) * radius, 0)
        }
      }

      // 弧形喷射动画
      if (state.active) {
        const baseRadius = gui.params.sunSize
        const currentAngle = state.startAngle + state.arcWidth * progress
        const heightProgress = Math.sin(progress * Math.PI)
        const currentHeight = state.arcHeight * heightProgress

        // 计算位置
        const x = Math.cos(currentAngle) * (baseRadius + currentHeight)
        const y = Math.sin(currentAngle) * (baseRadius + currentHeight)
        flare.position.set(x, y, 0)

        // 动态缩放
        const baseScale = gui.params.flare.size[0] + Math.random() * (gui.params.flare.size[1] - gui.params.flare.size[0])
        const scaleMultiplier = 1 + heightProgress * 0.3
        const scale = baseScale * scaleMultiplier
        flare.scale.set(scale, scale * 1.5, 1) // 垂直方向拉长一些

        // 根据运动方向旋转耀斑
        const angle = Math.atan2(y, x)
        flare.rotation.z = angle + Math.PI / 2
      }
    }
  }

  animate() {
    if (this.mesh) {
      // 更新着色器时间
      this.time += gui.params.shader.flowSpeed
      this.mesh.material.uniforms.time.value = this.time
      this.mesh.material.uniforms.flowSpeed.value = gui.params.shader.flowSpeed
      this.mesh.material.uniforms.disturbanceScale.value = gui.params.shader.disturbanceScale
      this.mesh.material.uniforms.glowIntensity.value = gui.params.shader.glowIntensity
      this.mesh.material.uniforms.brightnessVariation.value = gui.params.shader.brightnessVariation
      this.mesh.material.uniforms.emissiveIntensity.value = gui.params.emissiveIntensity

      // 太阳自转
      this.mesh.rotation.y += this.rotationSpeed

      // 更新耀斑
      const deltaTime = 0.016
      this.flares.forEach((_, index) => {
        this.updateFlare(index, deltaTime)
      })
    }
  }
}
