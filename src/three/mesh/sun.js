import * as THREE from 'three'
import sunVertexShader from '@/shader/sun/vertex.glsl?raw'
import sunFragmentShader from '@/shader/sun/fragment.glsl?raw'
import { gui } from '../gui'
import { camera } from '../camera'

export class Sun {
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.flares = []
    this.time = 0
    this.flareStates = [] // 存储每个耀斑的状态
    this.rotationSpeed = gui.params.rotationSpeed // 使用 GUI 中的初始值
    this.halo = null // 添加光晕对象
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
        vertexShader: sunVertexShader,
        fragmentShader: sunFragmentShader,
        transparent: true
      })

      this.mesh = new THREE.Mesh(geometry, material)

      // 添加发光效果
      const sunLight = new THREE.PointLight()
      sunLight.intensity = gui.params.sunLight.intensity
      sunLight.distance = gui.params.sunLight.distance
      if (typeof gui.params.sunLight.color === 'string') {
        sunLight.color.set(gui.params.sunLight.color)
      } else {
        sunLight.color.setHex(gui.params.sunLight.color)
      }
      this.mesh.add(sunLight)

      // 添加环境光
      const ambientLight = new THREE.AmbientLight()
      ambientLight.intensity = gui.params.ambientLight.intensity
      if (typeof gui.params.ambientLight.color === 'string') {
        ambientLight.color.set(gui.params.ambientLight.color)
      } else {
        ambientLight.color.setHex(gui.params.ambientLight.color)
      }
      this.mesh.add(ambientLight)

      // 添加太阳耀斑
      await this.addSunFlares()

      // 创建太阳光晕
      const haloTexture = await this.textureLoader.loadAsync('/textures/th_sun/solar_halo.png')
      const haloGeometry = new THREE.PlaneGeometry(1, 1) // 使用单位大小，通过缩放控制实际大小
      const haloMaterial = new THREE.MeshBasicMaterial({
        map: haloTexture,
        transparent: true,
        opacity: gui.params.halo.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })

      this.halo = new THREE.Mesh(haloGeometry, haloMaterial)
      this.halo.renderOrder = -1 // 确保光晕在太阳后面渲染
      this.updateHaloSize() // 初始化光晕大小
      this.mesh.add(this.halo)

      return this.mesh
    } catch (error) {
      console.error('加载太阳纹理失败:', error)
    }
  }

  async addSunFlares() {
    const flareTextures = await Promise.all([this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare1.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare2.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare3.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare4.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare5.png')])

    flareTextures.forEach((texture, index) => {
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0
      })

      const flare = new THREE.Sprite(material)
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
        baseAngle: angle
      })
      this.mesh.add(flare)
    })
  }

  updateFlare(index, deltaTime) {
    const flare = this.flares[index]
    const state = this.flareStates[index]

    if (!state.active) {
      if (Math.random() < gui.params.flare.frequency) {
        state.active = true
        state.duration = gui.params.flare.duration[0] + Math.random() * (gui.params.flare.duration[1] - gui.params.flare.duration[0])
        state.fadeIn = true
        state.fadeOut = false
      }
    }

    if (state.active) {
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
        }
      }
    }
  }

  updateHaloSize() {
    if (this.halo) {
      const size = gui.params.halo.size
      this.halo.scale.set(size, size, 1)
    }
  }

  updateHaloOpacity() {
    if (this.halo && this.halo.material) {
      this.halo.material.opacity = gui.params.halo.opacity
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

      // 更新光晕朝向和属性
      if (this.halo) {
        this.halo.lookAt(camera.camera.position)
        this.updateHaloSize()
        this.updateHaloOpacity()
      }
    }
  }
}
