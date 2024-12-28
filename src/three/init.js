import { renderer } from './renderer'
import { camera } from './camera'
import { scene } from './scene'
import { controls } from './controls'
import { animate } from './animate'
import { axesHelper } from './axesHelper'
import { gui } from './gui'

export async function init(container) {
  // 添加渲染器到容器
  container.appendChild(renderer.renderer.domElement)

  // 初始化控制器
  controls.init()

  // 初始化场景
  await scene.init()

  // 添加坐标轴辅助
  axesHelper.init(scene.scene)

  // 添加窗口大小改变监听
  window.addEventListener('resize', () => {
    camera.resize()
    renderer.resize()
  })

  // 开始动画循环
  animate()

  // 初始化 GUI
  gui.init()
}
