import { renderer } from './renderer'
import { camera } from './camera'
import { scene } from './scene'
import { controls } from './controls'
import { animate } from './animate'
import { axesHelper } from './axesHelper'
import { composer } from './composer'

/**
 * 初始化Three.js场景
 * @param {HTMLElement} container - 包含Three.js渲染器的DOM元素
 * @param {(progress: number) => void} onProgress - 加载进度回调函数
 * @returns {Promise<void>}
 */
export async function init(container, onProgress) {
  // 添加渲染器到容器
  container.appendChild(renderer.renderer.domElement)

  // 初始化控制器
  controls.init()

  // 初始化场景
  await scene.init((progress) => {
    if (onProgress) {
      onProgress(progress)
    }
  })

  // 初始化后处理
  composer.init(scene.scene, camera.camera, renderer.renderer)

  // 添加坐标轴辅助
  // axesHelper.init(scene.scene)

  // 添加窗口大小改变监听
  window.addEventListener('resize', () => {
    camera.resize()
    renderer.resize()
    scene.labelSystem.resize()
    // 更新所有星链的线条分辨率
    if (scene.starLinks) {
      scene.starLinks.links.forEach((link) => {
        if (link.line && link.line.material && link.line.material.uniforms) {
          link.line.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight)
        }
      })
    }
    composer.bloomComposer.setSize(window.innerWidth, window.innerHeight)
  })

  // 开始动画循环
  animate()
}
