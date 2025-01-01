import GUI from 'lil-gui'
import * as THREE from 'three'
import { scene } from './scene'

class SunGUI {
  constructor() {
    this.gui = new GUI()
    this.gui.hide()
    this.params = {
      sunSize: 5,
      orbits: {
        scale: 70
      }
    }
  }
}

export const gui = new SunGUI()
