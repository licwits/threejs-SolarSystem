import * as THREE from 'three'
import sunVertexShader from '@/shader/sun/vertex.glsl?raw'
import sunFragmentShader from '@/shader/sun/fragment.glsl?raw'
import haloVertexShader from '@/shader/halo/vertex.glsl?raw'
import haloFragmentShader from '@/shader/halo/fragment.glsl?raw'
import { gui } from '../gui'

/**
 * 太阳类
 * 用于创建和管理太阳的3D模型,包括表面纹理、光照效果、光晕和耀斑等
 */
export class Sun {
  /** 默认自转速度 */
  static DEFAULT_ROTATION_SPEED = 0.001

  constructor() {
    /** 太阳主网格对象 */
    this.mesh = null
    /** 纹理加载器 */
    this.textureLoader = new THREE.TextureLoader()
    /** 存储所有耀斑精灵对象 */
    this.flares = []
    /** 用于动画的时间累加器 */
    this.time = 0
    /** 存储每个耀斑的状态信息 */
    this.flareStates = []
    /** 自转速度 */
    this.rotationSpeed = Sun.DEFAULT_ROTATION_SPEED
    /** 光晕网格对象 */
    this.halo = null

    /** 耀斑效果的参数配置 */
    this.flareParams = {
      frequency: 0.0002, // 耀斑出现的频率
      duration: [2, 4], // 耀斑持续时间范围[最小值,最大值]
      size: [1, 2], // 耀斑大小范围[最小值,最大值]
      opacity: 0.4 // 耀斑最大不透明度
    }
  }

  /**
   * 更新太阳大小
   * @param {number} sunSize - 太阳大小参数
   */
  updateScale(sunSize) {
    if (this.mesh) {
      /** 新的缩放值 */
      const newScale = sunSize
      /** 统一设置xyz轴的缩放 */
      this.mesh.scale.set(newScale, newScale, newScale)
    }
  }

  /**
   * 初始化太阳对象
   * @returns {Promise<THREE.Mesh|null>} 太阳网格对象或null(加载失败时)
   */
  async init() {
    try {
      // 加载太阳相关纹理
      /** 太阳表面纹理 */
      const sunTexture = await this.textureLoader.loadAsync('/textures/th_sun/medres/th_sun.png')
      /** 太阳覆盖层纹理 */
      const coverTexture = await this.textureLoader.loadAsync('/textures/th_sun/medres/th_suncover.png')

      // 创建太阳网格
      /** 太阳球体几何体 */
      const geometry = new THREE.SphereGeometry(5, 128, 128)
      /** 太阳自定义着色器材质 */
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

      /** 创建太阳网格对象 */
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.visible = true

      // 添加点光源
      /** 太阳点光源 */
      const sunLight = new THREE.PointLight()
      sunLight.intensity = 2
      sunLight.distance = 100
      sunLight.castShadow = true
      // 设置阴影参数
      sunLight.shadow.mapSize.width = 4096
      sunLight.shadow.mapSize.height = 4096
      sunLight.shadow.camera.near = 0.1
      sunLight.shadow.camera.far = 4000
      sunLight.shadow.bias = -0.001 // 减少阴影失真
      sunLight.color.setHex(0xffff00)
      this.mesh.add(sunLight)

      // 添加环境光
      /** 环境光 */
      const ambientLight = new THREE.AmbientLight()
      ambientLight.intensity = 0.1
      ambientLight.color.setHex(0xffffff)
      this.mesh.add(ambientLight)

      // 创建太阳光晕
      /** 光晕几何体 */
      const haloGeometry = new THREE.SphereGeometry(5 * 1.2, 64, 64)
      /** 光晕自定义着色器材质 */
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

      /** 创建光晕网格对象 */
      this.halo = new THREE.Mesh(haloGeometry, haloMaterial)
      this.mesh.add(this.halo)

      // 添加耀斑效果
      await this.addSunFlares()

      return this.mesh
    } catch (error) {
      console.error('加载太阳纹理失败:', error)
      return null
    }
  }

  /**
   * 添加太阳耀斑效果
   */
  async addSunFlares() {
    /** 加载耀斑纹理 */
    const flareTextures = await Promise.all([
      this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare1.png'),
      this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare2.png'),
      this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare3.png'),
      this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare4.png'),
      this.textureLoader.loadAsync('/textures/th_sun/medres/th_sunflare5.png')
    ])

    // 为每个纹理创建耀斑精灵
    flareTextures.forEach((texture, index) => {
      /** 耀斑材质 */
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0,
        depthWrite: false,
        depthTest: false
      })

      /** 创建耀斑精灵 */
      const flare = new THREE.Sprite(material)
      /** 随机缩放值 */
      const scale = this.flareParams.size[0] + Math.random() * (this.flareParams.size[1] - this.flareParams.size[0])
      flare.scale.set(scale, scale, 1)

      // 设置耀斑初始位置
      /** 计算角度位置 */
      const angle = (index / flareTextures.length) * Math.PI * 2
      /** 太阳表面半径 */
      const radius = 5
      flare.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)

      // 存储耀斑和状态信息
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

  /**
   * 更新单个耀斑的状态
   * @param {number} index - 耀斑索引
   * @param {number} deltaTime - 帧间隔时间
   */
  updateFlare(index, deltaTime) {
    /** 当前耀斑对象 */
    const flare = this.flares[index]
    /** 当前耀斑状态 */
    const state = this.flareStates[index]

    // 检查是否需要激活耀斑
    if (!state.active) {
      if (Math.random() < this.flareParams.frequency) {
        state.active = true
        state.duration = this.flareParams.duration[0] + Math.random() * (this.flareParams.duration[1] - this.flareParams.duration[0])
        state.fadeIn = true
        state.fadeOut = false
      }
    }

    if (state.active) {
      // 处理淡入效果
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

      // 处理淡出效果
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

  /**
   * 更新太阳动画
   * 包括自转、耀斑和光晕效果
   */
  animate() {
    if (this.mesh) {
      // 更新时间和自转
      this.time += 0.05
      this.mesh.material.uniforms.time.value = this.time
      this.mesh.rotation.y += this.rotationSpeed

      // 更新所有耀斑
      /** 固定的帧间隔时间 */
      const deltaTime = 0.016
      this.flares.forEach((_, index) => {
        this.updateFlare(index, deltaTime)
      })

      // 更新光晕效果
      if (this.halo) {
        this.halo.material.uniforms.time.value = this.time
        this.halo.material.uniforms.intensity.value = 1.5
        this.halo.material.uniforms.power.value = 2.0
      }
    }
  }
}
