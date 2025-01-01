import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { camera } from './camera'
import { renderer } from './renderer'

/**
 * 轨道控制器类
 * 用于实现相机轨道控制,支持旋转、缩放和平移操作
 */
class Controls {
  constructor() {
    /** 
     * 轨道控制器实例
     * @type {OrbitControls}
     */
    this.controls = null
  }

  /**
   * 初始化轨道控制器
   * 配置控制器参数,启用阻尼效果
   */
  init() {
    this.controls = new OrbitControls(camera.camera, renderer.renderer.domElement)
    // 启用阻尼效果使控制更平滑
    this.controls.enableDamping = true
    // 设置阻尼系数
    this.controls.dampingFactor = 0.05
  }

  /**
   * 更新控制器状态
   * 在动画循环中调用以更新阻尼效果
   */
  update() {
    if (this.controls) {
      this.controls.update()
    }
  }
}

export const controls = new Controls()
