import { renderer } from './renderer'
import { camera } from './camera'
import { scene } from './scene'
import { controls } from './controls'

export function animate() {
  requestAnimationFrame(animate)

  // 更新场景中的动画
  scene.animate()

  // 更新控制器
  controls.update()

  // 渲染场景
  renderer.renderer.render(scene.scene, camera.camera)
}
