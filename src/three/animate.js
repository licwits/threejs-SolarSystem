import { renderer } from './renderer'
import { camera } from './camera'
import { scene } from './scene'
import { controls } from './controls'
import { composer } from './composer'

/**
 * 动画循环函数
 * 负责更新和渲染场景中的所有元素
 */
export function animate() {
  // 更新场景中的动画(行星自转、公转等)
  scene.animate()

  // 更新轨道控制器状态
  controls.update()

  // 设置渲染器不自动清除上一帧
  renderer.renderer.autoClear = false
  // 手动清除渲染缓冲区
  renderer.renderer.clear()
  // 设置相机渲染第1层(用于辉光效果)
  camera.camera.layers.set(1)
  // 渲染辉光效果
  composer.bloomComposer.render()
  // 清除深度缓冲
  renderer.renderer.clearDepth()
  // 设置相机渲染第0层(用于普通渲染)
  camera.camera.layers.set(0)

  // 渲染主场景
  renderer.renderer.render(scene.scene, camera.camera)
  // 更新CSS 3D标签系统(必须在WebGL渲染后进行)
  scene.labelSystem.update()

  // 请求下一帧动画
  requestAnimationFrame(animate)
}
