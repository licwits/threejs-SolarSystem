import * as THREE from 'three'

/**
 * 坐标轴辅助类
 * 用于在场景中显示XYZ三个坐标轴,帮助开发调试
 */
class AxesHelper {
  constructor() {
    /** 坐标轴辅助对象,长度为20个单位 */
    this.axesHelper = new THREE.AxesHelper(20)
  }

  /**
   * 初始化坐标轴辅助对象
   * @param {THREE.Scene} scene - Three.js场景对象
   */
  init(scene) {
    scene.add(this.axesHelper)
  }
}

export const axesHelper = new AxesHelper()
