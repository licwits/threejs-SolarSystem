import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
/**
 * 后期处理合成器类
 * 用于实现辉光等后期处理效果
 */
class Composer {
  constructor() {
    /** 辉光效果合成器 */
    this.bloomComposer = null
  }

  /**
   * 初始化后期处理效果
   * @param {THREE.Scene} scene - Three.js场景对象
   * @param {THREE.Camera} camera - Three.js相机对象
   * @param {THREE.WebGLRenderer} renderer - Three.js渲染器对象
   */
  init(scene, camera, renderer) {
    /** 渲染通道 - 用于渲染基础场景 */
    const renderScene = new RenderPass(scene, camera)

    /** 辉光通道 - 用于实现辉光效果 */
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), // 分辨率
      1.5, // 辉光强度
      0.4, // 辉光半径
      0.85 // 辉光阈值
    )
    bloomPass.threshold = 0 // 辉光阈值
    bloomPass.strength = 5 // 辉光强度
    bloomPass.radius = 0.5 // 辉光半径

    /** 输出通道 - 用于最终输出 */
    const outputPass = new OutputPass()

    // 创建并配置辉光合成器
    this.bloomComposer = new EffectComposer(renderer)
    this.bloomComposer.addPass(renderScene)
    this.bloomComposer.addPass(bloomPass)
    // this.bloomComposer.addPass(outputPass)
  }
}

export const composer = new Composer()
