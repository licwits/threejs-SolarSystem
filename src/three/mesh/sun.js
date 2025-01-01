import * as THREE from 'three'
import sunVertexShader from '@/shader/sun/vertex.glsl?raw'
import sunFragmentShader from '@/shader/sun/fragment.glsl?raw'
import haloVertexShader from '@/shader/halo/vertex.glsl?raw'
import haloFragmentShader from '@/shader/halo/fragment.glsl?raw'
import { gui } from '../gui'
import { camera } from '../camera'

export class Sun {
  static DEFAULT_ROTATION_SPEED = 0.001
  constructor() {
    this.mesh = null
    this.textureLoader = new THREE.TextureLoader()
    this.flares = []
    this.time = 0
    this.flareStates = [] // 存储每个耀斑的状态
    this.rotationSpeed = Sun.DEFAULT_ROTATION_SPEED
    this.halo = null
    // 耀斑参数
    this.flareParams = {
      frequency: 0.0002, // 出现频率
      duration: [2, 4], // 持续时间范围
      size: [1, 2], // 大小范围
      opacity: 0.4 // 最大透明度
    }
  }

  async init() {
    try {
      // 加载纹理
      const sunTexture = await this.textureLoader.loadAsync('/textures/th_sun/medres/th_sun.png')
      const coverTexture = await this.textureLoader.loadAsync('/textures/th_sun/medres/th_suncover.png')

      // 创建自定义着色器材质
      const geometry = new THREE.SphereGeometry(5, 128, 128)
      const material = new THREE.ShaderMaterial({
        uniforms: {
          sunTexture: { value: sunTexture },
          time: { value: 0 },
          flowSpeed: { value: 0.05 },
          disturbanceScale: { value: 0.1 },
          glowIntensity: { value: 0.8 },
          brightnessVariation: { value: 0 },
          emissiveIntensity: { value: 1.0 }
        },
        vertexShader: sunVertexShader,
        fragmentShader: sunFragmentShader,
        transparent: true,
        depthWrite: true,
        depthTest: true
      })

      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.visible = true

      // 添加发光效果
      const sunLight = new THREE.PointLight()
      sunLight.intensity = 2
      sunLight.distance = 100
      sunLight.castShadow = true // 启用阴影投射
      // 设置阴影参数
      sunLight.shadow.mapSize.width = 4096
      sunLight.shadow.mapSize.height = 4096
      sunLight.shadow.camera.near = 0.1
      sunLight.shadow.camera.far = 4000
      sunLight.shadow.bias = -0.001 // 减少阴影失真

      sunLight.color.setHex(0xffff00)
      this.mesh.add(sunLight)

      // 添加环境光
      const ambientLight = new THREE.AmbientLight()
      ambientLight.intensity = 0.1
      ambientLight.color.setHex(0xffffff)
      this.mesh.add(ambientLight)

      // 创建太阳光晕
      const haloGeometry = new THREE.SphereGeometry(5 * 1.2, 64, 64)
      const haloMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(0xffaa00) },
          intensity: { value: 1.5 },
          power: { value: 2.0 },
          time: { value: 0 },
          coverTexture: { value: coverTexture }
        },
        vertexShader: haloVertexShader,
        fragmentShader: haloFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: true
      })

      this.halo = new THREE.Mesh(haloGeometry, haloMaterial)
      this.mesh.add(this.halo)

      // 添加耀斑
      await this.addSunFlares()

      return this.mesh
    } catch (error) {
      console.error('加载太阳纹理失败:', error)
      return null
    }
  }

  async addSunFlares() {
    const flareTextures = await Promise.all([this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare1.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare2.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare3.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare4.png'), this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare5.png')])

    flareTextures.forEach((texture, index) => {
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0,
        depthWrite: false,
        depthTest: false
      })

      const flare = new THREE.Sprite(material)
      const scale = this.flareParams.size[0] + Math.random() * (this.flareParams.size[1] - this.flareParams.size[0])
      flare.scale.set(scale, scale, 1)

      // 初始位置设置在太阳表面
      const angle = (index / flareTextures.length) * Math.PI * 2
      const radius = 5 // 使用固定的太阳大小
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
      if (Math.random() < this.flareParams.frequency) {
        state.active = true
        state.duration = this.flareParams.duration[0] + Math.random() * (this.flareParams.duration[1] - this.flareParams.duration[0])
        state.fadeIn = true
        state.fadeOut = false
      }
    }

    if (state.active) {
      // 淡入淡出效果
      if (state.fadeIn) {
        flare.material.opacity += deltaTime
        if (flare.material.opacity >= this.flareParams.opacity) {
          flare.material.opacity = this.flareParams.opacity
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

  animate() {
    if (this.mesh) {
      // 更新着色器时间
      this.time += 0.05
      this.mesh.material.uniforms.time.value = this.time

      // 太阳自转
      this.mesh.rotation.y += this.rotationSpeed

      // 更新耀斑
      const deltaTime = 0.016
      this.flares.forEach((_, index) => {
        this.updateFlare(index, deltaTime)
      })

      // 更新光晕
      if (this.halo) {
        this.halo.material.uniforms.time.value = this.time
        this.halo.material.uniforms.intensity.value = 1.5
        this.halo.material.uniforms.power.value = 2.0
      }
    }
  }
}
