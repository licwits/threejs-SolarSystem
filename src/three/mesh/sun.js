import * as THREE from 'three'
import sunVertexShader from '@/shader/sun/vertex.glsl?raw'
import sunFragmentShader from '@/shader/sun/fragment.glsl?raw'
import haloVertexShader from '@/shader/halo/vertex.glsl?raw'
import haloFragmentShader from '@/shader/halo/fragment.glsl?raw'
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

      // 修改耀斑的创建方式
      // await this.addSunFlares()

      return this.mesh
    } catch (error) {
      console.error('加载太阳纹理失败:', error)
      return null
    }
  }

  animate() {
    if (this.mesh) {
      // 更新着色器时间
      this.time += 0.05 // 使用固定的流动速度
      this.mesh.material.uniforms.time.value = this.time

      // 太阳自转
      this.mesh.rotation.y += this.rotationSpeed

      // 更新光晕
      if (this.halo) {
        this.halo.material.uniforms.time.value = this.time
        this.halo.material.uniforms.intensity.value = 1.5
        this.halo.material.uniforms.power.value = 2.0
      }
    }
  }
}
