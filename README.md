# Three.js 太阳系模拟

这是一个使用 Three.js 实现的太阳系模拟项目。项目模拟了太阳系中的行星运动、小行星带、月球以及星链等天体，实现了公转自转效果、行星标签、视角切换等交互功能。

## 参考项目
- [NASA's Eyes on the Solar System](https://eyes.nasa.gov/apps/solar-system/#/home)

## 可用资源
- [Poly Haven](https://polyhaven.com/) - HDR环境贴图
- [Celestia Motherlode](http://celestiamotherlode.net/) - 行星表面贴图
- [Solar System Scope](https://www.solarsystemscope.com/textures/) - 行星表面贴图
- [爱给网](https://www.aigei.com/) - 3D模型、贴图素材

## 主要功能
- 太阳系八大行星的运动模拟
- 模拟行星公转和自转效果
- 小行星带和月球运动
- 星链装饰效果
- 行星标签系统
- 点击行星切换视角交互
- 可调节星球运动速度组件
- loading页面

## 实现步骤

### 1. 项目搭建
首先我们需要搭建基础的项目框架。这里选择使用 Vite + Vue3 的组合,它提供了快速的开发体验和优秀的性能:

```bash
# 创建项目
npm create vite@latest solar-system

# 安装依赖
npm install three @types/three gsap lil-gui
```

然后创建基础的 Three.js 场景结构:

```javascript
// renderer.js - 渲染器配置
class Renderer {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.shadowMap.enabled = true
  }
}

// camera.js - 相机配置
class Camera {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100000
    )
    this.camera.position.set(0, 0, 50)
  }
}
```

### 2. 添加环境贴图
为了让场景更加真实,我们需要添加宇宙环境贴图。这里使用了 HDR 格式的星空贴图,它能提供更高的动态范围:

```javascript
// scene.js
const rgbeLoader = new RGBELoader()
const envMap = await rgbeLoader.loadAsync('/textures/hdr/Starfield.hdr')
envMap.mapping = THREE.EquirectangularReflectionMapping
this.scene.environment = envMap
this.scene.background = envMap

// 调整环境贴图的强度
this.scene.backgroundIntensity = 0.5
this.scene.environmentIntensity = 0.5
```

### 3. 制作太阳
#### a. 添加球形几何体
太阳是场景中最重要的天体,我们需要精心制作它的视觉效果。首先创建基础的球体几何体:

```javascript
// sun.js
const geometry = new THREE.SphereGeometry(5, 128, 128)

// 为了获得更好的视觉效果,我们使用了较高的分段数(128x128)
// 这样可以保证在近距离观察时表面足够平滑
```

#### b. 添加自定义着色器材质
太阳的表面是不断流动的等离子体,我们使用自定义着色器来模拟这种效果:

```glsl
// sunVertex.glsl - 顶点着色器
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// sunFragment.glsl - 片元着色器
uniform sampler2D sunTexture;
uniform float time;
uniform float flowSpeed;
uniform float disturbanceScale;
uniform float glowIntensity;
uniform float brightnessVariation;

void main() {
  // 使用噪声和时间实现太阳表面的流动效果
  vec2 uv = vUv + flowSpeed * time * vec2(noise.x, noise.y);
  vec4 texColor = texture2D(sunTexture, uv);
  
  // 添加发光效果
  float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
  vec3 finalColor = mix(texColor.rgb, glowColor, glow * glowIntensity);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
```

#### c. 添加太阳耀斑
太阳耀斑是太阳表面突然释放的巨大能量,我们使用贴图来模拟这种效果:

```javascript
// sun.js
class Sun {
  createFlares() {
    const flareTextures = [
      '/textures/Sun/flare1.png',
      '/textures/Sun/flare2.png'
    ]
    
    flareTextures.forEach((texturePath, index) => {
      const material = new THREE.SpriteMaterial({
        map: this.textureLoader.load(texturePath),
        blending: THREE.AdditiveBlending,
        opacity: 0
      })
      
      const flare = new THREE.Sprite(material)
      const scale = this.flareParams.size[0] + 
        Math.random() * (this.flareParams.size[1] - this.flareParams.size[0])
      flare.scale.set(scale, scale, 1)
      
      this.flares.push(flare)
      this.mesh.add(flare)
    })
  }
}
```

#### d. 添加太阳光晕
太阳周围的光晕使用了特殊的着色器,可以根据观察角度动态改变强度:

```glsl
// haloFragment.glsl
uniform vec3 color;
uniform float intensity;
uniform float power;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  // 计算视线方向
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - dot(vNormal, viewDir), power);
  
  // 光晕颜色随角度和强度变化
  vec3 finalColor = color * fresnel * intensity;
  gl_FragColor = vec4(finalColor, fresnel);
}
```

### 4. 制作行星轨道
行星轨道采用椭圆方程计算,并考虑了轨道倾角:

```javascript
// orbits.js
export class Orbits {
  init() {
    /** 八大行星轨道数据 */
    this.orbitData = [
      { radius: 0.387, e: 0.206, name: 'Mercury', inclination: 7.0 },
      { radius: 0.723, e: 0.007, name: 'Venus', inclination: 3.4 },
      // ... 其他行星数据
    ]

    const points = []
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      const x = a * Math.cos(theta)
      const z = b * Math.sin(theta)
      points.push(new THREE.Vector3(x, 0, z))
    }
    
    // 创建轨道线
    const orbit = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: this.orbitColors[index],
        transparent: true,
        opacity: this.baseOpacity + index * this.opacityScale,
        blending: THREE.AdditiveBlending
      })
    )

    // 应用轨道倾角
    const orbitGroup = new THREE.Group()
    orbitGroup.add(orbit)
    const inclinationRad = (data.inclination * Math.PI) / 180
    orbitGroup.rotation.x = inclinationRad
  }
}
```

### 5. 制作行星和小行星带
行星的创建涉及多个方面,以地球为例:

```javascript
// earth.js
class Earth {
  async init() {
    // 加载纹理
    const earthTexture = await this.textureLoader.loadAsync('/textures/Earth/Earth.jpg')
    const normalTexture = await this.textureLoader.loadAsync('/textures/Earth/Earth_NormalMap.png')
    const cloudsTexture = await this.textureLoader.loadAsync('/textures/Earth/Earth_Clouds.png')

    // 创建地球本体
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64)
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.1, 0.1)
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.rotation.z = Math.PI * 0.1305 // 23.5度轴倾角

    // 添加云层
    const cloudsGeometry = new THREE.SphereGeometry(this.radius * 1.01, 64, 64)
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.4
    })
    this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
    this.mesh.add(this.clouds)
  }

  animate() {
    // 自转
    this.mesh.rotation.y += this.rotationSpeed
    // 公转
    this.revolutionAngle += this.revolutionSpeed
    this.updateOrbitPosition()
  }
}
```

小行星带使用粒子系统实现,每个小行星都是一个点精灵:

```javascript
// asteroidBelt.js
class AsteroidBelt {
  init() {
    const geometry = new THREE.BufferGeometry()
    const positions = []
    const colors = []
    
    for (let i = 0; i < this.count; i++) {
      const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius)
      const theta = Math.random() * Math.PI * 2
      
      positions.push(
        radius * Math.cos(theta),
        (Math.random() - 0.5) * 2,
        radius * Math.sin(theta)
      )
      
      colors.push(
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5
      )
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    
    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      map: this.textureLoader.load('/textures/particle.png'),
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    
    this.mesh = new THREE.Points(geometry, material)
  }
}
```

### 6. 制作星链
星链系统是一个复杂的动态效果,包含节点、连线和发光效果:

```glsl
// nodeVertex.glsl
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 8.0;
}

// starLinksFragment.glsl
void main() {
  float dist = length(gl_PointCoord - center);
  float alpha = 1.0 - smoothstep(0.3, 0.7, dist);
  float pulse = sin(time * 1.5) * 0.15 + 1.0;
  alpha *= pulse;
  
  vec3 finalColor = color * (2.0 + pulse + centerGlow * 4.0);
  gl_FragColor = vec4(finalColor, alpha);
}
```

```javascript
// starLinks.js
class StarLinks {
  createLink() {
    const pointCount = Math.floor(Math.random() * (this.maxPoints - this.minPoints + 1)) + this.minPoints
    const points = this.generateCurvePoints(pointCount)
    
    // 创建节点
    const nodesGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const nodes = new THREE.Points(nodesGeometry, this.nodeMaterial.clone())
    
    // 创建连线
    const lineGeometry = new LineGeometry()
    const positions = points.reduce((arr, point) => {
      arr.push(point.x, point.y, point.z)
      return arr
    }, [])
    lineGeometry.setPositions(positions)
    
    const line = new Line2(lineGeometry, this.lineMaterial.clone())
    
    return { nodes, line, points }
  }
}
```

### 7. 添加星球文字标签
使用 CSS2DRenderer 实现标签系统,可以在3D空间中添加HTML元素:

```javascript
// labelSystem.js
class LabelSystem {
  init() {
    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight)
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0'
    
    document.body.appendChild(this.labelRenderer.domElement)
  }

  addToScene(scene, object, name) {
    const label = document.createElement('div')
    label.className = 'planet-label'
    label.textContent = name
    
    const labelObject = new CSS2DObject(label)
    labelObject.position.set(0, object.geometry.parameters.radius + 2, 0)
    object.add(labelObject)
  }
}
```

### 8. 添加交互功能
实现了点击行星切换视角的功能,使用GSAP实现平滑的相机动画:

```javascript
// labelSystem.js
lockViewToPlanet(planetName) {
  const planet = this.findObjectByUserData(this.scene, 'planetName', planetName)
  if (!planet) return

  // 计算目标位置
  const box = new THREE.Box3().setFromObject(planet)
  const size = box.getSize(new THREE.Vector3())
  const distance = Math.max(size.x, size.y, size.z) * 3

  gsap.to(this.camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 2,
    ease: 'power2.inOut',
    onComplete: () => {
      this.controls.minDistance = distance * 0.8
      this.controls.maxDistance = distance * 5
    }
  })
}
```

### 9. 添加控制星球公转、自转速度的组件
创建了一个时间控制器组件,可以调节行星运动速度:

```vue
<!-- TimeController.vue -->
<template>
  <div class="time-controller">
    <button @click="togglePause">
      <img :src="playPauseIcon" />
    </button>
    <input
      type="range"
      v-model="speedMultiplier"
      min="-10"
      max="10"
      step="0.1"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { scene } from '@/three/scene'

const speedMultiplier = ref(1)
const isPaused = ref(false)

watch(speedMultiplier, (newSpeed) => {
  // 更新所有行星的运动速度
  scene.planets.forEach(planet => {
    planet.rotationSpeed = planet.DEFAULT_ROTATION_SPEED * newSpeed
    planet.revolutionSpeed = planet.DEFAULT_REVOLUTION_SPEED * newSpeed
  })
})
</script>
```

### 10. 添加 Loading 页面
创建了一个优雅的加载页面,包含进度显示和动画效果:

```vue
<!-- LoadingScreen.vue -->
<template>
  <div class="loading-screen" :class="{ 'fade-out': !isLoading }">
    <div class="solar-system">
      <div class="sun"></div>
      <div class="earth-orbit">
        <div class="earth"></div>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress" :style="{ width: `${progress}%` }"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isLoading: Boolean,
  progress: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 9999;
  transition: opacity 0.5s;
}

.solar-system {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.sun {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px;
  background: #ffaa00;
  border-radius: 50%;
  box-shadow: 0 0 20px #ffaa00;
  animation: glow 2s infinite alternate;
}
</style>
```