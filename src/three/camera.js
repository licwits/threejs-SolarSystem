import * as THREE from 'three'

/**
 * 相机类
 * 负责创建和管理场景的透视相机
 */
class Camera {
  constructor() {
    /** 
     * Three.js透视相机实例
     * @type {THREE.PerspectiveCamera}
     * @param {number} 60 - 视场角(FOV)
     * @param {number} window.innerWidth / window.innerHeight - 宽高比
     * @param {number} 0.1 - 近裁剪面
     * @param {number} 100000 - 远裁剪面
     */
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000)
    // 设置相机初始位置
    this.camera.position.set(0, 0, 50)
  }

  /**
   * 调整相机宽高比
   * 在窗口大小改变时调用以更新相机投影矩阵
   */
  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
  }
}

export const camera = new Camera()
