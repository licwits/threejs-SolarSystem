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

      // 轨道参数
      orbits: {
        visible: true,
        scale: 70,
        opacity: 0.5
      },

      // 添加水星参数
      mercury: {
        rotationSpeed: 0.0001
      },

      // 添加金星参数
      venus: {
        rotationSpeed: 0.0001
      },

      // 添加火星参数
      mars: {
        rotationSpeed: 0.0001
      },

      // 添加木星参数
      jupiter: {
        rotationSpeed: 0.0001
      },

      // 添加土星参数
      saturn: {
        rotationSpeed: 0.0001
      },

      // 添加天王星参数
      uranus: {
        rotationSpeed: 0.0001
      },

      // 添加海王星参数
      neptune: {
        rotationSpeed: 0.0001
      },

      // 添加地球参数
      earth: {
        rotationSpeed: 0.0001
      },

      // 添加月球参数
      moon: {
        rotationSpeed: 0.0001,
        orbitRadius: 1.0
      }
    }

    // 创建文件夹
    const sunFolder = this.gui.addFolder('太阳设置')
    sunFolder
      .add(this.params, 'sunSize', 1, 10, 0.1)
      .name('大小')
      .onChange(() => this.updateSunSize(this.params.sunSize))
    sunFolder
      .add(this.params, 'rotationSpeed', 0, 0.01, 0.0001)
      .name('自转速度')
      .onChange(() => this.updateRotationSpeed(this.params.rotationSpeed))
    sunFolder
      .add(this.params, 'visible')
      .name('可见性')
      .onChange(() => {
        if (scene.sun.mesh) {
          scene.sun.mesh.visible = this.params.visible
        }
      })

    // 轨道控制
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
      .add(this.params.orbits, 'scale', 10, 100, 1)
      .name('轨道缩放')
      .onChange(() => {
        if (scene.orbits) {
          scene.orbits.updateScale(this.params.orbits.scale)
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

    // 行星控制（只保留自转速度控制）
    const mercuryFolder = this.gui.addFolder('水星设置')
    mercuryFolder
      .add(this.params.mercury, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.mercury) {
          scene.mercury.rotationSpeed = this.params.mercury.rotationSpeed
        }
      })

    const venusFolder = this.gui.addFolder('金星设置')
    venusFolder
      .add(this.params.venus, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.venus) {
          scene.venus.rotationSpeed = this.params.venus.rotationSpeed
        }
      })

    const earthFolder = this.gui.addFolder('地球设置')
    earthFolder
      .add(this.params.earth, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.earth) {
          scene.earth.rotationSpeed = this.params.earth.rotationSpeed
        }
      })

    const marsFolder = this.gui.addFolder('火星设置')
    marsFolder
      .add(this.params.mars, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.mars) {
          scene.mars.rotationSpeed = this.params.mars.rotationSpeed
        }
      })

    const jupiterFolder = this.gui.addFolder('木星设置')
    jupiterFolder
      .add(this.params.jupiter, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.jupiter) {
          scene.jupiter.rotationSpeed = this.params.jupiter.rotationSpeed
        }
      })

    const saturnFolder = this.gui.addFolder('土星设置')
    saturnFolder
      .add(this.params.saturn, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.saturn) {
          scene.saturn.rotationSpeed = this.params.saturn.rotationSpeed
        }
      })

    const uranusFolder = this.gui.addFolder('天王星设置')
    uranusFolder
      .add(this.params.uranus, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.uranus) {
          scene.uranus.rotationSpeed = this.params.uranus.rotationSpeed
        }
      })

    const neptuneFolder = this.gui.addFolder('海王星设置')
    neptuneFolder
      .add(this.params.neptune, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.neptune) {
          scene.neptune.rotationSpeed = this.params.neptune.rotationSpeed
        }
      })

    const moonFolder = this.gui.addFolder('月球设置')
    moonFolder
      .add(this.params.moon, 'rotationSpeed', 0, 0.001, 0.0001)
      .name('自转速度')
      .onChange(() => {
        if (scene.moon) {
          scene.moon.rotationSpeed = this.params.moon.rotationSpeed
        }
      })
    moonFolder
      .add(this.params.moon, 'orbitRadius', 0.5, 2, 0.1)
      .name('轨道半径')
      .onChange(() => {
        if (scene.moon) {
          scene.moon.orbitRadius = this.params.moon.orbitRadius
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
}

export const gui = new SunGUI()
