import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
class Composer {
  constructor() {
    this.bloomComposer = null
  }

  init(scene, camera, renderer) {

    const renderScene = new RenderPass(scene, camera)

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
    bloomPass.threshold = 0
    bloomPass.strength = 5
    bloomPass.radius = 0.5
    const outputPass = new OutputPass()
    this.bloomComposer = new EffectComposer(renderer)
    this.bloomComposer.addPass(renderScene)
    this.bloomComposer.addPass(bloomPass)
    // this.bloomComposer.addPass(outputPass)
  }
}

export const composer = new Composer()
