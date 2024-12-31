import { renderer } from './renderer'
import { camera } from './camera'
import { scene } from './scene'
import { controls } from './controls'
import { composer } from './composer'

export function animate() {
  
  // 更新场景中的动画
  scene.animate()
  
  // 更新控制器
  controls.update()

  renderer.renderer.autoClear = false
  renderer.renderer.clear()
  camera.camera.layers.set(1)
  composer.bloomComposer.render()
  renderer.renderer.clearDepth()
  camera.camera.layers.set(0)
  
  // 渲染场景
  renderer.renderer.render(scene.scene, camera.camera)
  requestAnimationFrame(animate)
}
