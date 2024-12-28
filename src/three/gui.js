import GUI from 'lil-gui'
import * as THREE from 'three'
import { scene } from './scene'

class SunGUI {
  constructor() {
    this.gui = new GUI()
    this.params = {
      // 太阳基础参数
      sunSize: 5,
      rotationSpeed: 0.001,
      emissiveIntensity: 1.0,

      // 光照参数
      sunLight: {
        intensity: 2,
        distance: 100,
        color: 0xffff00
      },
      ambientLight: {
        intensity: 0.5,
        color: 0xffff00
      },

      // 耀斑参数
      flare: {
        frequency: 0.0002,
        duration: [2, 4],
        size: [1, 2],
        opacity: 0.4,
        arcHeight: [0.5, 1.5]
      },

      // 着色器参数
      shader: {
        flowSpeed: 0.05,
        disturbanceScale: 0.1,
        glowIntensity: 0.8,
        glowColor: '#ff6619',
        brightnessVariation: 0,
        normalScale: 1.0
      },

      // 光晕参数
      halo: {
        size: 50, // 默认太阳大小的10倍
        opacity: 0.6
      },

      // 环境参数
      environment: {
        backgroundIntensity: 0.5,
        environmentIntensity: 0.5
      }
    }
  }

  init() {
    // 基础参数控制
    const sunFolder = this.gui.addFolder('太阳基础设置')
    sunFolder.add(this.params, 'sunSize', 1, 10, 0.1).onChange(this.updateSunSize.bind(this))
    sunFolder.add(this.params, 'rotationSpeed', 0, 0.01, 0.0001).onChange(this.updateRotationSpeed.bind(this))
    sunFolder.add(this.params, 'emissiveIntensity', 0, 2, 0.1).onChange(this.updateEmissive.bind(this))

    // 光照控制
    const lightFolder = this.gui.addFolder('光照设置')
    const sunLightFolder = lightFolder.addFolder('太阳光')
    sunLightFolder.add(this.params.sunLight, 'intensity', 0, 5, 0.1).onChange(this.updateLights.bind(this))
    sunLightFolder.add(this.params.sunLight, 'distance', 10, 200, 1).onChange(this.updateLights.bind(this))
    sunLightFolder.addColor(this.params.sunLight, 'color').onChange(this.updateLights.bind(this))

    const ambientFolder = lightFolder.addFolder('环境光')
    ambientFolder.add(this.params.ambientLight, 'intensity', 0, 2, 0.1).onChange(this.updateLights.bind(this))
    ambientFolder.addColor(this.params.ambientLight, 'color').onChange(this.updateLights.bind(this))

    // 耀斑控制
    const flareFolder = this.gui.addFolder('耀斑设置')
    flareFolder.add(this.params.flare, 'frequency', 0, 0.01, 0.0001).name('出频率')
    flareFolder.add(this.params.flare, 'opacity', 0, 1, 0.05).name('不透明度')

    const flareDuration = flareFolder.addFolder('持续时间')
    flareDuration.add(this.params.flare.duration, '0', 0.1, 5, 0.1).name('最小值')
    flareDuration.add(this.params.flare.duration, '1', 0.1, 5, 0.1).name('最大值')

    const flareSize = flareFolder.addFolder('大小范围')
    flareSize.add(this.params.flare.size, '0', 0.5, 5, 0.1).name('最小值')
    flareSize.add(this.params.flare.size, '1', 0.5, 5, 0.1).name('最大值')

    const flareArc = flareFolder.addFolder('弧度范围')
    flareArc.add(this.params.flare.arcHeight, '0', 0.5, 5, 0.1).name('最小高度')
    flareArc.add(this.params.flare.arcHeight, '1', 0.5, 5, 0.1).name('最大高度')

    // 着色器控制
    const shaderFolder = this.gui.addFolder('视觉效果')
    shaderFolder.add(this.params.shader, 'flowSpeed', 0, 0.2, 0.01).name('流动速度')
    shaderFolder.add(this.params.shader, 'disturbanceScale', 0, 0.5, 0.01).name('扰动强度')
    shaderFolder.add(this.params.shader, 'glowIntensity', 0, 2, 0.1).name('发光强度')
    shaderFolder.addColor(this.params.shader, 'glowColor').name('发光颜色')
    shaderFolder.add(this.params.shader, 'brightnessVariation', 0, 0.5, 0.01).name('亮度变化')

    // 添加光晕控制
    const haloFolder = this.gui.addFolder('光晕设置')
    haloFolder
      .add(this.params.halo, 'size', 20, 100, 0.1)
      .name('大小')
      .onChange(() => {
        if (scene.sun && scene.sun.updateHaloSize) {
          scene.sun.updateHaloSize()
        }
      })

    haloFolder
      .add(this.params.halo, 'opacity', 0, 1, 0.01)
      .name('不透明度')
      .onChange(() => {
        if (scene.sun && scene.sun.updateHaloOpacity) {
          scene.sun.updateHaloOpacity()
        }
      })

    // 添加环境控制
    const envFolder = this.gui.addFolder('环境设置')
    envFolder
      .add(this.params.environment, 'backgroundIntensity', 0, 2, 0.1)
      .name('背景强度')
      .onChange(() => {
        if (scene.scene) {
          scene.scene.backgroundIntensity = this.params.environment.backgroundIntensity
        }
      })

    envFolder
      .add(this.params.environment, 'environmentIntensity', 0, 2, 0.1)
      .name('环境光强度')
      .onChange(() => {
        if (scene.scene) {
          scene.scene.environmentIntensity = this.params.environment.environmentIntensity
        }
      })
  }

  updateSunSize(value) {
    if (scene.sun.mesh) {
      scene.sun.mesh.scale.set(value / 5, value / 5, value / 5)
    }
  }

  updateRotationSpeed(value) {
    scene.sun.rotationSpeed = value
  }

  updateEmissive(value) {
    if (scene.sun.mesh) {
      scene.sun.mesh.material.uniforms.emissiveIntensity = { value }
    }
  }

  updateLights() {
    if (scene.sun.mesh) {
      // 更新点光源
      const sunLight = scene.sun.mesh.children.find((child) => child instanceof THREE.PointLight)
      if (sunLight) {
        sunLight.intensity = this.params.sunLight.intensity
        sunLight.distance = this.params.sunLight.distance
        // 修改颜色处理方式
        if (typeof this.params.sunLight.color === 'string') {
          sunLight.color.set(this.params.sunLight.color)
        } else {
          sunLight.color.setHex(this.params.sunLight.color)
        }
      }

      // 更新环境光
      const ambientLight = scene.sun.mesh.children.find((child) => child instanceof THREE.AmbientLight)
      if (ambientLight) {
        ambientLight.intensity = this.params.ambientLight.intensity
        // 修改颜色处理方式
        if (typeof this.params.ambientLight.color === 'string') {
          ambientLight.color.set(this.params.ambientLight.color)
        } else {
          ambientLight.color.setHex(this.params.ambientLight.color)
        }
      }
    }
  }
}

export const gui = new SunGUI()
