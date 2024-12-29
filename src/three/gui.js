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
      visible: true,

      // 光照参数
      sunLight: {
        intensity: 2,
        distance: 100,
        color: 0xffff00,
        shadowBias: -0.001,
        shadowRadius: 1
      },
      ambientLight: {
        intensity: 0.1,
        color: 0xffffff
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
        intensity: 1.5,
        power: 2.0,
        color: '#ffaa00'
      },

      // 环境参数
      environment: {
        backgroundIntensity: 0.5,
        environmentIntensity: 0.5
      },

      // 轨道参数
      orbits: {
        visible: true,
        scale: 20,
        opacity: 0.5
      },

      // 添加水星参数
      mercury: {
        rotationSpeed: 0.0001,
        normalScale: 0.1
      },

      // 移除光源辅助参数
      lightHelper: {
        sunHelper: false,
        mercuryHelper: false
      },

      // 添加金星参数
      venus: {
        rotationSpeed: 0.0001,
        normalScale: 0.1
      }
    }
  }

  init() {
    // 基础参数控制
    const sunFolder = this.gui.addFolder('太阳基础设置')
    sunFolder
      .add(this.params, 'visible')
      .name('显示太阳')
      .onChange(() => {
        if (scene.sun && scene.sun.mesh) {
          scene.sun.mesh.visible = this.params.visible
        }
      })

    sunFolder.add(this.params, 'sunSize', 1, 10, 0.1).onChange(this.updateSunSize.bind(this))
    sunFolder.add(this.params, 'rotationSpeed', 0, 0.01, 0.0001).onChange(this.updateRotationSpeed.bind(this))
    sunFolder.add(this.params, 'emissiveIntensity', 0, 2, 0.1).onChange(this.updateEmissive.bind(this))

    // 光照控制
    const lightFolder = this.gui.addFolder('光照设置')
    const sunLightFolder = lightFolder.addFolder('太阳光')
    sunLightFolder.add(this.params.sunLight, 'intensity', 0, 100, 0.1).onChange(this.updateLights.bind(this))
    sunLightFolder.add(this.params.sunLight, 'distance', 10, 500, 1).onChange(this.updateLights.bind(this))
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

    // 修改光晕控制
    const haloFolder = this.gui.addFolder('光晕设置')
    haloFolder
      .add(this.params.halo, 'intensity', 0, 3, 0.1)
      .name('强度')
      .onChange(() => {
        if (scene.sun && scene.sun.halo) {
          scene.sun.halo.material.uniforms.intensity.value = this.params.halo.intensity
        }
      })

    haloFolder
      .add(this.params.halo, 'power', 0, 5, 0.1)
      .name('衰减')
      .onChange(() => {
        if (scene.sun && scene.sun.halo) {
          scene.sun.halo.material.uniforms.power.value = this.params.halo.power
        }
      })

    haloFolder
      .addColor(this.params.halo, 'color')
      .name('颜色')
      .onChange(() => {
        if (scene.sun && scene.sun.halo) {
          scene.sun.halo.material.uniforms.glowColor.value.set(this.params.halo.color)
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

    // 添加轨道控制
    const orbitFolder = this.gui.addFolder('轨道设置')
    orbitFolder
      .add(this.params.orbits, 'visible')
      .name('显示轨道')
      .onChange(() => {
        if (scene.orbits) {
          scene.orbits.updateVisibility(this.params.orbits.visible)
        }
      })

    orbitFolder
      .add(this.params.orbits, 'scale', 10, 50, 1)
      .name('轨道缩放')
      .onChange(() => {
        if (scene.orbits) {
          scene.orbits.updateScale(this.params.orbits.scale)
        }
        if (scene.mercury) {
          scene.mercury.updateOrbit(this.params.orbits.scale)
        }
        if (scene.venus) {
          scene.venus.updateOrbit(this.params.orbits.scale)
        }
      })

    orbitFolder
      .add(this.params.orbits, 'opacity', 0, 1, 0.1)
      .name('轨道透明度')
      .onChange(() => {
        if (scene.orbits) {
          scene.orbits.updateOpacity(this.params.orbits.opacity)
        }
      })

    // 添加水星控制
    const mercuryFolder = this.gui.addFolder('水星设置')
    mercuryFolder
      .add(this.params.mercury, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.mercury) {
          scene.mercury.rotationSpeed = this.params.mercury.rotationSpeed
        }
      })

    mercuryFolder
      .add(this.params.mercury, 'normalScale', 0, 2, 0.1)
      .name('法线强度')
      .onChange(() => {
        if (scene.mercury && scene.mercury.mesh) {
          scene.mercury.mesh.material.normalScale.set(this.params.mercury.normalScale, this.params.mercury.normalScale)
        }
      })

    // 在太阳光控制中添加阴影参数
    sunLightFolder
      .add(this.params.sunLight, 'shadowBias', -0.01, 0.01, 0.001)
      .name('阴影偏移')
      .onChange(() => {
        if (scene.sun && scene.sun.mesh) {
          const sunLight = scene.sun.mesh.children.find((child) => child instanceof THREE.PointLight)
          if (sunLight) {
            sunLight.shadow.bias = this.params.sunLight.shadowBias
          }
        }
      })

    sunLightFolder
      .add(this.params.sunLight, 'shadowRadius', 0, 5, 0.1)
      .name('阴影模糊')
      .onChange(() => {
        if (scene.sun && scene.sun.mesh) {
          const sunLight = scene.sun.mesh.children.find((child) => child instanceof THREE.PointLight)
          if (sunLight) {
            sunLight.shadow.radius = this.params.sunLight.shadowRadius
          }
        }
      })

    // 添加金星控制
    const venusFolder = this.gui.addFolder('金星设置')
    venusFolder
      .add(this.params.venus, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.venus) {
          scene.venus.rotationSpeed = this.params.venus.rotationSpeed
        }
      })

    venusFolder
      .add(this.params.venus, 'normalScale', 0, 2, 0.1)
      .name('法线强度')
      .onChange(() => {
        if (scene.venus && scene.venus.mesh) {
          scene.venus.mesh.material.normalScale.set(this.params.venus.normalScale, this.params.venus.normalScale)
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
