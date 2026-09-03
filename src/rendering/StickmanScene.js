import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { BoneController } from "@/utils/BoneController"
import { COCO_ORDER } from "@/constants/cocoKpts"
import { horizontalDistanceFromOriginXZ, kptJointToSceneXZ } from "@/utils/radarPersonMetrics"

// 低多边形数字人的基础尺寸（米）。人体比例仍由雷达的 COCO 17 关键点实时决定。
const HUMANOID_MIN_LIMB_LENGTH = 1e-4
const _UP = new THREE.Vector3(0, 1, 0)
const _limbDir = new THREE.Vector3()
const _bodyRight = new THREE.Vector3()
const _bodyUp = new THREE.Vector3()
const _bodyForward = new THREE.Vector3()
const _bodyMatrix = new THREE.Matrix4()

export class StickmanScene {
  constructor(canvas, config = {}) {
    this.canvas = canvas
    const performanceMode = !!config.performanceMode
    this.config = {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      roomWidth: 5,
      roomDepth: 5,
      roomHeight: 3,
      renderMode: "stickman",
      performanceMode,
      antialias: !performanceMode,
      pixelRatio: performanceMode ? 1 : Math.min(window.devicePixelRatio, 2),
      enableShadows: !performanceMode,
      pointCloudQueueSize: performanceMode ? 3 : 10,
      pointCloudDisplayRatio: performanceMode ? 0.6 : 1 / 2,
      pointCloudMaxPoints: performanceMode ? 30000 : 100000,
      pointCloudSphereSegments: performanceMode ? 6 : 10,
      pointCloudRenderMode: performanceMode ? "points" : "mesh",
      pointCloudPointSize: performanceMode ? 0.06 : 0.04,
      fixedViewAspect: null,
      ...config,
    }
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.room = null
    this.radarGroup = null
    this.pointCloudPoints = null
    this.pointCloudQueue = []
    this.stickmanTemplateModel = null
    this.stickmanMap = new Map()
    this.labelRenderer = null
    this.skeletonVisible = true
    this.pointCloudVisible = true
    this.floorForwardDeg = 180
    this.floorOrigin = new THREE.Vector3(0, 0, 0)
    this.sectorFloorVisible = true
    this.sectorFloorIdle = false
    this.radarModelReady = false
    this.init()
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.config.antialias,
      alpha: true,
    })
    this.renderer.setSize(this.config.width, this.config.height)
    this.renderer.setPixelRatio(this.config.pixelRatio)
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = this.config.enableShadows
    if (this.config.enableShadows) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, this.config.width / this.config.height, 0.1, 100)
    this.camera.position.set(6, 5, 6)
    this.camera.lookAt(0, 1, 0)

    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enabled = this.config.enableControls !== false
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.25
    this.controls.target.set(0, 1, 0)
    // 通过相机轨道方式整体旋转视角，效果等同鼠标拖拽
    this.rotateViewLikeDrag(45)

    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(this.config.width, this.config.height)
    const lrEl = this.labelRenderer.domElement
    lrEl.style.position = "absolute"
    lrEl.style.left = "0"
    lrEl.style.top = "0"
    lrEl.style.pointerEvents = "none"
    lrEl.style.overflow = "hidden"
    const canvasParent = this.canvas.parentElement
    if (canvasParent) {
      if (!canvasParent.style.position) canvasParent.style.position = "relative"
      canvasParent.appendChild(lrEl)
    }

    this.applyViewport(this.config.width, this.config.height)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4)
    dirLight.position.set(5, 10, 6)
    dirLight.castShadow = this.config.enableShadows
    if (this.config.enableShadows) {
      dirLight.shadow.mapSize.width = 2048
      dirLight.shadow.mapSize.height = 2048
      dirLight.shadow.camera.near = 0.5
      dirLight.shadow.camera.far = 50
      dirLight.shadow.camera.left = -15
      dirLight.shadow.camera.right = 15
      dirLight.shadow.camera.top = 15
      dirLight.shadow.camera.bottom = -15
      dirLight.shadow.bias = -0.0001
      dirLight.shadow.normalBias = 0.02
    }
    this.scene.add(dirLight)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5)
    fillLight.position.set(-4, 5, -4)
    this.scene.add(fillLight)
    const backLight = new THREE.DirectionalLight(0xffffff, 0.25)
    backLight.position.set(0, 3, -8)
    this.scene.add(backLight)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45))

    this.updateRoom(this.config.roomWidth, this.config.roomDepth)
    this.createPointCloud()
    if (this.config.renderMode === "model") this.loadStickmanModel()
  }

  loadStickmanModel() {
    const loader = new GLTFLoader()
    let glbUrl = "/stickman.glb"
    if (typeof location !== "undefined") {
      const params = location.search ? new URLSearchParams(location.search) : null
      const base = params && params.get("assetBase")
      if (base) {
        glbUrl = (base.endsWith("/") ? base : `${base}/`) + "stickman.glb"
      }
    }
    loader.load(
      glbUrl,
      (gltf) => {
        this.stickmanTemplateModel = gltf.scene
      },
      undefined,
      (err) => console.error("Stickman GLB load failed:", err)
    )
  }

  enableModelShadows(model) {
    if (!this.config.enableShadows) return
    model.traverse((obj) => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
  }

  rebindSkeletonToClone(clonedModel) {
    clonedModel.traverse((obj) => {
      if (!obj.isSkinnedMesh || !obj.skeleton) return
      const templateBones = obj.skeleton.bones
      const clonedBones = templateBones.map((bone) => clonedModel.getObjectByName(bone.name)).filter(Boolean)
      if (clonedBones.length !== templateBones.length) return
      const newSkeleton = new THREE.Skeleton(clonedBones)
      obj.bind(newSkeleton, obj.bindMatrix)
    })
  }

  createPointCloud() {
    if (this.pointCloudPoints) {
      this.pointCloudPoints.geometry.dispose()
      this.pointCloudPoints.material.dispose()
      this.scene.remove(this.pointCloudPoints)
      this.pointCloudPoints = null
    }
    const maxPoints = this.config.pointCloudMaxPoints
    if (this.config.pointCloudRenderMode === "points") {
      const geom = new THREE.BufferGeometry()
      geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3))
      geom.setDrawRange(0, 0)
      const mat = new THREE.PointsMaterial({
        color: 0x22d3ee,
        size: this.config.pointCloudPointSize,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      })
      this.pointCloudPoints = new THREE.Points(geom, mat)
      this.pointCloudPoints.userData.renderCount = 0
      this.pointCloudPoints.frustumCulled = false
      this.pointCloudPoints.visible = false
      this.scene.add(this.pointCloudPoints)
      return
    }

    if (!this._pointCloudDummy) this._pointCloudDummy = new THREE.Object3D()
    const sphereRadius = 0.018
    const sphereSegments = this.config.pointCloudSphereSegments
    const geom = new THREE.SphereGeometry(sphereRadius, sphereSegments, sphereSegments)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
    this.pointCloudPoints = new THREE.InstancedMesh(geom, mat, maxPoints)
    this.pointCloudPoints.count = 0
    this.pointCloudPoints.userData.renderCount = 0
    this.pointCloudPoints.visible = false
    this.scene.add(this.pointCloudPoints)
  }

  updatePointCloud(xyz = []) {
    if (!this.pointCloudPoints) return
    if (!xyz || xyz.length === 0) {
      this.pointCloudQueue = []
      if (this.pointCloudPoints.isPoints) {
        this.pointCloudPoints.geometry.setDrawRange(0, 0)
      } else {
        this.pointCloudPoints.count = 0
      }
      this.pointCloudPoints.userData.renderCount = 0
      this.pointCloudPoints.visible = false
      return
    }
    const queueSize = this.config.pointCloudQueueSize
    const displayRatio = this.config.pointCloudDisplayRatio

    this.pointCloudQueue.push(xyz)
    if (this.pointCloudQueue.length > queueSize) this.pointCloudQueue.shift()

    const allPoints = this.pointCloudQueue.length === 1 ? this.pointCloudQueue[0] : this.pointCloudQueue.flat()
    const n = allPoints.length
    const toShow = Math.min(this.config.pointCloudMaxPoints, Math.floor(n * displayRatio))
    if (toShow <= 0) {
      if (this.pointCloudPoints.isPoints) {
        this.pointCloudPoints.geometry.setDrawRange(0, 0)
      } else {
        this.pointCloudPoints.count = 0
      }
      this.pointCloudPoints.userData.renderCount = 0
      this.pointCloudPoints.visible = false
      return
    }
    const roomDepth = this.config.roomDepth
    const step = n / toShow
    if (this.pointCloudPoints.isPoints) {
      const positions = this.pointCloudPoints.geometry.attributes.position.array
      for (let i = 0; i < toShow; i++) {
        const p = allPoints[Math.min(n - 1, Math.floor(i * step))]
        const offset = i * 3
        positions[offset] = (Number(p[0]) || 0) - roomDepth / 2
        positions[offset + 1] = (Number(p[2]) || 0) + 1
        positions[offset + 2] = -(Number(p[1]) || 0)
      }
      this.pointCloudPoints.geometry.setDrawRange(0, toShow)
      this.pointCloudPoints.geometry.attributes.position.needsUpdate = true
    } else {
      const dummy = this._pointCloudDummy
      for (let i = 0; i < toShow; i++) {
        const p = allPoints[Math.min(n - 1, Math.floor(i * step))]
        dummy.position.set((Number(p[0]) || 0) - roomDepth / 2, (Number(p[2]) || 0) + 1, -(Number(p[1]) || 0))
        dummy.updateMatrix()
        this.pointCloudPoints.setMatrixAt(i, dummy.matrix)
      }
      this.pointCloudPoints.count = toShow
      this.pointCloudPoints.instanceMatrix.needsUpdate = true
    }
    this.pointCloudPoints.userData.renderCount = toShow
    this.pointCloudPoints.visible = this.pointCloudVisible
  }

  setSkeletonVisible(visible) {
    this.skeletonVisible = !!visible
    this.stickmanMap.forEach((data) => {
      const obj = data.model ?? data.stickmanLines
      if (obj) obj.visible = this.skeletonVisible
      if (data.distanceLabel) {
        if (!this.skeletonVisible) {
          data.distanceLabel.visible = false
        } else if (data._lastPersonData) {
          this._syncStickmanDistanceLabel(data, data._lastPersonData)
        }
      }
    })
  }

  setPointCloudVisible(visible) {
    this.pointCloudVisible = !!visible
    if (this.pointCloudPoints) {
      this.pointCloudPoints.visible = this.pointCloudVisible && (this.pointCloudPoints.userData.renderCount || 0) > 0
    }
  }

  createRadarIndicator() {
    if (this.radarGroup) {
      this.radarGroup.traverse((obj) => this._disposeObject(obj))
      this.scene.remove(this.radarGroup)
    }
    this.radarGroup = new THREE.Group()
    const bodyGeom = new THREE.CylinderGeometry(0.08, 0.12, 0.15, 8)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.95 })
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.rotation.x = Math.PI / 2
    body.castShadow = true
    body.receiveShadow = true
    this.radarGroup.add(body)
    const coneGeom = new THREE.ConeGeometry(0.06, 0.35, 8)
    const coneMat = new THREE.MeshLambertMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.9 })
    const cone = new THREE.Mesh(coneGeom, coneMat)
    cone.rotation.x = Math.PI / 2
    cone.position.z = -0.25
    cone.castShadow = true
    cone.receiveShadow = true
    this.radarGroup.add(cone)
    this.radarGroup.visible = false
    this.scene.add(this.radarGroup)
  }

  updateRadarModel(params = {}) {
    if (!this.radarGroup) this.createRadarIndicator()
    if (!this.radarGroup) return
    const radarX = parseFloat(params.radarX_room ?? params.radarXroom) || 0
    const radarY = parseFloat(params.radarY_room ?? params.radarYroom) || 0
    const radarHeight = parseFloat(params.radarHeight) || 0.05
    const rawAzimuth = Number.parseFloat(params.radarAzimuth_room ?? params.radarAzimuthroom ?? params.azimuth_room)
    const azimuth = Number.isFinite(rawAzimuth) ? rawAzimuth : 0
    const rawElevation = Number.parseFloat(params.downtAngle)
    const elevation = Number.isFinite(rawElevation) ? rawElevation : 0
    const finalX = radarY - this.config.roomDepth / 2
    const finalZ = -radarX
    const finalY = radarHeight
    this.radarGroup.position.set(finalX, finalY, finalZ)
    this.floorOrigin.set(finalX, 0, finalZ)
    if (this.room) this.room.position.copy(this.floorOrigin)

    const quaternionY = new THREE.Quaternion()
    quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI - (azimuth * Math.PI) / 180)
    const quaternionX = new THREE.Quaternion()
    quaternionX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), (elevation * Math.PI) / 180)
    const finalQuaternion = new THREE.Quaternion()
    finalQuaternion.multiplyQuaternions(quaternionY, quaternionX)
    this.radarGroup.quaternion.copy(finalQuaternion)
    this.radarGroup.visible = false // 隐藏雷达指示器
    this.radarGroup.updateMatrix()

    const hasValidAzimuth = Number.isFinite(rawAzimuth)
    if (hasValidAzimuth && !this.radarModelReady) {
      this.radarModelReady = true
      if (this.room) this.room.visible = this.sectorFloorVisible
    }
    const nextForwardDeg = 180 - rawAzimuth
    if (hasValidAzimuth && Math.abs(nextForwardDeg - this.floorForwardDeg) > 0.1) {
      this.floorForwardDeg = nextForwardDeg
      this.updateRoom(this.config.roomWidth, this.config.roomDepth)
    }
  }

  updateRoom(width, depth) {
    this.config.roomWidth = width
    this.config.roomDepth = depth
    if (this.room) {
      this.room.traverse((obj) => this._disposeObject(obj))
      this.scene.remove(this.room)
    }
    this.room = new THREE.Group()
    this.createSectorFloor(this.room)
    this.room.position.copy(this.floorOrigin)
    this.room.visible = this.sectorFloorVisible && this.radarModelReady
    this.scene.add(this.room)
  }

  setSectorFloorVisible(visible) {
    this.sectorFloorVisible = !!visible
    if (this.room) this.room.visible = this.sectorFloorVisible && this.radarModelReady
  }

  setSectorFloorIdle(active) {
    const next = !!active
    if (this.sectorFloorIdle === next) return
    this.sectorFloorIdle = next
    this.updateRoom(this.config.roomWidth, this.config.roomDepth)
  }

  createSectorFloor(group) {
    const forwardDeg = this.floorForwardDeg
    const startDeg = forwardDeg - 60
    const endDeg = forwardDeg + 60
    const idle = this.sectorFloorIdle
    const radii = [2, 2.5, 5]
    const y = 0.01

    this.createSectorGradient(group, startDeg, endDeg, 5, y - 0.003, idle)

    this.createDashedRay(group, startDeg, 5, y, idle)
    this.createDashedRay(group, endDeg, 5, y, idle)

    radii.forEach((r) => {
      this.createDashedArc(group, startDeg, endDeg, r, y, 80, idle)
    })

    const angleMid = forwardDeg
    const midPos = this.getSectorPoint(5.45, angleMid)
    const angleLabel = this.createTextSprite(
      "120°",
      64,
      idle ? "#C4C4C4" : "#9fe8ff",
      idle ? "rgba(60,60,60,0.85)" : "rgba(15,36,45,0.9)"
    )
    angleLabel.position.set(midPos.x, 0.05, midPos.z)
    group.add(angleLabel)

    const leftLabelDeg = endDeg + 2
    const rightLabelDeg = startDeg - 2
    const labelItems = [
      { text: "2m", radius: 2.1 },
      { text: "2.5m", radius: 2.65 },
      { text: "5m", radius: 5.15 },
    ]
    const distLabelColor = idle ? "#C4C4C4" : "#8dd7ea"
    const distLabelStroke = idle ? "rgba(60,60,60,0.85)" : "rgba(15,36,45,0.9)"
    labelItems.forEach((item) => {
      const leftPoint = this.getSectorPoint(item.radius, leftLabelDeg)
      const leftLabel = this.createTextSprite(item.text, 52, distLabelColor, distLabelStroke)
      leftLabel.position.set(leftPoint.x, 0.05, leftPoint.z)
      group.add(leftLabel)

      const rightPoint = this.getSectorPoint(item.radius, rightLabelDeg)
      const rightLabel = this.createTextSprite(item.text, 52, distLabelColor, distLabelStroke)
      rightLabel.position.set(rightPoint.x, 0.05, rightPoint.z)
      group.add(rightLabel)
    })
  }

  createDashedRay(group, angleDeg, radius, y = 0.01, idle = false) {
    const p0 = new THREE.Vector3(0, y, 0)
    const p1xz = this.getSectorPoint(radius, angleDeg)
    const p1 = new THREE.Vector3(p1xz.x, y, p1xz.z)
    const geometry = new THREE.BufferGeometry().setFromPoints([p0, p1])
    const material = new THREE.LineDashedMaterial({
      color: idle ? 0xc4c4c4 : 0x8cc7d8,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: idle ? 0.95 : 0.9,
    })
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    group.add(line)
  }

  createDashedArc(group, startDeg, endDeg, radius, y = 0.01, segments = 80, idle = false) {
    const points = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const deg = startDeg + (endDeg - startDeg) * t
      const p = this.getSectorPoint(radius, deg)
      points.push(new THREE.Vector3(p.x, y, p.z))
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineDashedMaterial({
      color: idle ? (radius >= 5 ? 0xd0d0d0 : 0xbcbcbc) : radius >= 5 ? 0xa5edff : 0x77b4c8,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: idle ? 0.95 : radius >= 5 ? 0.95 : 0.82,
    })
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    group.add(line)
  }

  getSectorPoint(radius, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: Math.sin(rad) * radius,
      z: Math.cos(rad) * radius,
    }
  }

  createTextSprite(text, fontSize = 48, color = "#9fe8ff", strokeStyle = "rgba(15,36,45,0.9)") {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const pad = 26
    ctx.font = `600 ${fontSize}px sans-serif`
    const textWidth = Math.ceil(ctx.measureText(text).width)
    canvas.width = textWidth + pad * 2
    canvas.height = fontSize + pad * 2

    const drawCtx = canvas.getContext("2d")
    drawCtx.font = `600 ${fontSize}px sans-serif`
    drawCtx.textAlign = "center"
    drawCtx.textBaseline = "middle"
    drawCtx.fillStyle = color
    drawCtx.strokeStyle = strokeStyle
    drawCtx.lineWidth = 8
    drawCtx.strokeText(text, canvas.width / 2, canvas.height / 2)
    drawCtx.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    })
    const sprite = new THREE.Sprite(material)
    const scale = 0.0036
    sprite.scale.set(canvas.width * scale, canvas.height * scale, 1)
    sprite.renderOrder = 30
    return sprite
  }

  createSectorGradient(group, startDeg, endDeg, maxRadius, y = 0.005, idle = false) {
    const segments = 120
    const positions = []
    const alphas = []
    const indices = []

    positions.push(0, y, 0)
    alphas.push(idle ? 0.42 : 0.5)

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const deg = startDeg + (endDeg - startDeg) * t
      const p = this.getSectorPoint(maxRadius, deg)
      positions.push(p.x, y, p.z)
      alphas.push(0.0)
    }

    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute("aAlpha", new THREE.Float32BufferAttribute(alphas, 1))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(idle ? "#C4C4C4" : "#D2FCFF") },
      },
      vertexShader: `
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.renderOrder = 1
    group.add(mesh)
  }

  kptToScene(personData, i) {
    const roomDepth = this.config.roomDepth
    const x = Number(personData[0][i]) - roomDepth / 2
    const y = Number(personData[2][i])
    const z = -Number(personData[1][i])
    return new THREE.Vector3(x, y, z)
  }

  personDataToKeypoints(personData) {
    const keypoints = {}
    const n = Math.min(17, personData[0]?.length ?? 0, personData[2]?.length ?? 0)
    for (let i = 5; i <= 16 && i < n; i++) {
      const v = this.kptToScene(personData, i)
      const name = COCO_ORDER[i]
      if (name) keypoints[name] = { x: v.x, y: v.y, z: v.z }
    }
    return keypoints
  }

  getOrCreateStickmanLines(id) {
    if (this.stickmanMap.has(id)) return this.stickmanMap.get(id)
    const group = new THREE.Group()
    const makeMaterial = (color) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.02 })
    const materials = {
      skin: makeMaterial(0xd8a07a),
      hair: makeMaterial(0x35261f),
      shirt: makeMaterial(0x5b7cfa),
      pants: makeMaterial(0x263a68),
      shoes: makeMaterial(0xf1f4f8),
    }
    const parts = {}
    const addPart = (name, geometry, material) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = this.config.enableShadows
      mesh.receiveShadow = this.config.enableShadows
      mesh.frustumCulled = false
      mesh.visible = false
      parts[name] = mesh
      group.add(mesh)
      return mesh
    }

    addPart("torso", new THREE.CylinderGeometry(1, 0.72, 1, 14), materials.shirt)
    addPart("pelvis", new THREE.SphereGeometry(1, 14, 10), materials.pants)
    addPart("neck", new THREE.CylinderGeometry(0.82, 1, 1, 12), materials.skin)
    addPart("head", new THREE.SphereGeometry(1, 18, 14), materials.skin)
    addPart("hair", new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), materials.hair)
    addPart("nose", new THREE.SphereGeometry(1, 10, 8), materials.skin)

    ;["leftUpperArm", "rightUpperArm"].forEach((name) =>
      addPart(name, new THREE.CylinderGeometry(0.78, 1, 1, 12), materials.shirt)
    )
    ;["leftForearm", "rightForearm"].forEach((name) =>
      addPart(name, new THREE.CylinderGeometry(0.72, 1, 1, 12), materials.skin)
    )
    ;["leftThigh", "rightThigh"].forEach((name) =>
      addPart(name, new THREE.CylinderGeometry(0.72, 1, 1, 12), materials.pants)
    )
    ;["leftShin", "rightShin"].forEach((name) =>
      addPart(name, new THREE.CylinderGeometry(0.68, 1, 1, 12), materials.pants)
    )
    ;["leftElbow", "rightElbow"].forEach((name) =>
      addPart(name, new THREE.SphereGeometry(1, 12, 10), materials.skin)
    )
    ;["leftKnee", "rightKnee"].forEach((name) =>
      addPart(name, new THREE.SphereGeometry(1, 12, 10), materials.pants)
    )
    ;["leftHand", "rightHand"].forEach((name) =>
      addPart(name, new THREE.SphereGeometry(1, 12, 10), materials.skin)
    )
    ;["leftFoot", "rightFoot"].forEach((name) =>
      addPart(name, new THREE.SphereGeometry(1, 12, 8), materials.shoes)
    )

    const { root: labelRoot, cap: labelCap } = this._createStickmanDistanceLabelDOM()
    const distanceLabel = new CSS2DObject(labelRoot)
    distanceLabel.visible = false
    this.scene.add(distanceLabel)
    this.scene.add(group)
    this.stickmanMap.set(id, {
      stickmanLines: group,
      humanoidParts: parts,
      distanceLabel,
      distanceLabelTextEl: labelCap,
    })
    return this.stickmanMap.get(id)
  }

  getOrCreateStickman(id) {
    if (this.config.renderMode === "stickman") return this.getOrCreateStickmanLines(id)
    if (this.stickmanMap.has(id)) return this.stickmanMap.get(id)
    if (!this.stickmanTemplateModel) return null
    const model = this.stickmanTemplateModel.clone(true)
    this.rebindSkeletonToClone(model)
    this.enableModelShadows(model)
    const boneController = new BoneController(model)
    this.scene.add(model)
    this.stickmanMap.set(id, { model, boneController })
    return this.stickmanMap.get(id)
  }

  computeHeadPose(personData) {
    const n = Math.min(17, personData[0]?.length ?? 0, personData[1]?.length ?? 0, personData[2]?.length ?? 0)
    if (n < 1) return null
    const nose = this.kptToScene(personData, 0)
    nose.y += 1
    const points = [nose]
    for (let i = 1; i <= 4 && i < n; i++) {
      const p = this.kptToScene(personData, i)
      p.y += 1
      points.push(p)
    }
    const center = new THREE.Vector3(0, 0, 0)
    points.forEach((p) => center.add(p))
    center.divideScalar(points.length)
    if (n > 6) {
      const leftShoulder = this.kptToScene(personData, 5)
      leftShoulder.y += 1
      const rightShoulder = this.kptToScene(personData, 6)
      rightShoulder.y += 1
      const shoulderCenter = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5)
      center.lerp(shoulderCenter, 0.2)
    }
    let forward = new THREE.Vector3()
    if (n > 4) {
      const leftEar = this.kptToScene(personData, 3)
      leftEar.y += 1
      const rightEar = this.kptToScene(personData, 4)
      rightEar.y += 1
      const earCenter = new THREE.Vector3().addVectors(leftEar, rightEar).multiplyScalar(0.5)
      forward.subVectors(nose, earCenter)
    } else if (n > 6) {
      const leftShoulder = this.kptToScene(personData, 5)
      leftShoulder.y += 1
      const rightShoulder = this.kptToScene(personData, 6)
      rightShoulder.y += 1
      const shoulderCenter = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5)
      forward.subVectors(nose, shoulderCenter)
    } else {
      forward.set(0, 0, 1)
    }
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, 1)
    forward.normalize()
    return { center, forward }
  }

  _createStickmanDistanceLabelDOM() {
    const wrap = document.createElement("div")
    wrap.style.cssText =
      "display:flex;flex-direction:column;align-items:center;pointer-events:none;user-select:none;position:relative;"
    const cap = document.createElement("div")
    cap.style.cssText =
      "background:#18FE55;color:#090808;padding:4px 6px;border-radius:999px;font-size:12px;font-weight:600;line-height:1.2;white-space:nowrap;"
    const tail = document.createElement("div")
    tail.style.cssText =
      "width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #18FE55;margin-top:-1px;left:50%;transform:translateX(-50%);position:absolute;"
    wrap.appendChild(cap)
    wrap.appendChild(tail)
    return { root: wrap, cap }
  }

  _syncStickmanDistanceLabel(data, personData) {
    const label = data.distanceLabel
    const cap = data.distanceLabelTextEl
    if (!label || !cap) return
    const roomDepth = this.config.roomDepth
    const n = Math.min(17, personData[0]?.length ?? 0, personData[1]?.length ?? 0, personData[2]?.length ?? 0)
    if (n < 2) {
      label.visible = false
      return
    }
    const pose = this.computeHeadPose(personData)
    if (!pose) {
      label.visible = false
      return
    }
    const { x, z } = kptJointToSceneXZ(personData, 0, roomDepth)
    const dx = x - this.floorOrigin.x
    const dz = z - this.floorOrigin.z
    const distM = horizontalDistanceFromOriginXZ(dx, dz)
    cap.textContent = `${distM.toFixed(2)}m`
    label.position.copy(pose.center).add(new THREE.Vector3(0, 0.32, 0))
    label.visible = this.skeletonVisible
  }

  _removeStickmanDistanceLabel(data) {
    if (!data?.distanceLabel) return
    this.scene.remove(data.distanceLabel)
    data.distanceLabel = null
    data.distanceLabelTextEl = null
    data._lastPersonData = null
  }

  _fitHumanoidLimb(mesh, start, end, radius) {
    _limbDir.subVectors(end, start)
    const length = _limbDir.length()
    if (length < HUMANOID_MIN_LIMB_LENGTH) {
      mesh.visible = false
      return
    }
    mesh.position.addVectors(start, end).multiplyScalar(0.5)
    mesh.quaternion.setFromUnitVectors(_UP, _limbDir.normalize())
    mesh.scale.set(radius, length, radius)
    mesh.visible = this.skeletonVisible
  }

  _placeHumanoidJoint(mesh, position, scale, quaternion = null) {
    mesh.position.copy(position)
    mesh.scale.copy(scale)
    if (quaternion) mesh.quaternion.copy(quaternion)
    else mesh.quaternion.identity()
    mesh.visible = this.skeletonVisible
  }

  updateStickmanLinesFromPersonData(data, personData) {
    const n = Math.min(17, personData[0]?.length ?? 0, personData[1]?.length ?? 0, personData[2]?.length ?? 0)
    const parts = data.humanoidParts
    if (n < 17 || !parts) {
      if (data.distanceLabel) data.distanceLabel.visible = false
      if (parts) Object.values(parts).forEach((mesh) => (mesh.visible = false))
      return
    }
    const point = (index) => {
      const value = this.kptToScene(personData, index)
      value.y += 1
      return value
    }
    const leftShoulder = point(5)
    const rightShoulder = point(6)
    const leftElbow = point(7)
    const rightElbow = point(8)
    const leftWrist = point(9)
    const rightWrist = point(10)
    const leftHip = point(11)
    const rightHip = point(12)
    const leftKnee = point(13)
    const rightKnee = point(14)
    const leftAnkle = point(15)
    const rightAnkle = point(16)
    const shoulderCenter = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5)
    const hipCenter = new THREE.Vector3().addVectors(leftHip, rightHip).multiplyScalar(0.5)
    const shoulderWidth = Math.max(0.24, leftShoulder.distanceTo(rightShoulder))
    const hipWidth = Math.max(0.18, leftHip.distanceTo(rightHip))
    const torsoLength = Math.max(0.3, shoulderCenter.distanceTo(hipCenter))
    const pose = this.computeHeadPose(personData)

    _bodyRight.subVectors(rightShoulder, leftShoulder).normalize()
    _bodyUp.subVectors(shoulderCenter, hipCenter).normalize()
    _bodyForward.crossVectors(_bodyRight, _bodyUp).normalize()
    if (_bodyForward.lengthSq() < 1e-6) _bodyForward.set(0, 0, 1)
    if (pose && _bodyForward.dot(pose.forward) < 0) {
      _bodyForward.multiplyScalar(-1)
      _bodyRight.multiplyScalar(-1)
    }
    _bodyUp.crossVectors(_bodyForward, _bodyRight).normalize()
    _bodyMatrix.makeBasis(_bodyRight, _bodyUp, _bodyForward)
    const bodyQuaternion = new THREE.Quaternion().setFromRotationMatrix(_bodyMatrix)

    parts.torso.position.addVectors(shoulderCenter, hipCenter).multiplyScalar(0.5)
    parts.torso.quaternion.copy(bodyQuaternion)
    parts.torso.scale.set(shoulderWidth * 0.52, torsoLength, shoulderWidth * 0.25)
    parts.torso.visible = this.skeletonVisible
    this._placeHumanoidJoint(
      parts.pelvis,
      hipCenter,
      new THREE.Vector3(hipWidth * 0.6, torsoLength * 0.16, hipWidth * 0.38),
      bodyQuaternion
    )

    if (pose) {
      const headRadius = THREE.MathUtils.clamp(shoulderWidth * 0.3, 0.095, 0.145)
      this._placeHumanoidJoint(
        parts.head,
        pose.center,
        new THREE.Vector3(headRadius * 0.82, headRadius, headRadius * 0.78),
        bodyQuaternion
      )
      const neckEnd = pose.center.clone().addScaledVector(_bodyUp, -headRadius * 0.72)
      this._fitHumanoidLimb(parts.neck, shoulderCenter, neckEnd, headRadius * 0.34)
      const hairCenter = pose.center.clone().addScaledVector(_bodyUp, headRadius * 0.12)
      this._placeHumanoidJoint(
        parts.hair,
        hairCenter,
        new THREE.Vector3(headRadius * 0.86, headRadius * 1.02, headRadius * 0.82),
        bodyQuaternion
      )
      const faceForward = pose.forward.clone().normalize()
      this._placeHumanoidJoint(
        parts.nose,
        pose.center.clone().addScaledVector(faceForward, headRadius * 0.8),
        new THREE.Vector3(headRadius * 0.12, headRadius * 0.16, headRadius * 0.12)
      )
    } else {
      ;[parts.head, parts.neck, parts.hair, parts.nose].forEach((mesh) => (mesh.visible = false))
    }

    const armRadius = THREE.MathUtils.clamp(shoulderWidth * 0.105, 0.032, 0.052)
    const legRadius = THREE.MathUtils.clamp(hipWidth * 0.19, 0.045, 0.075)
    this._fitHumanoidLimb(parts.leftUpperArm, leftShoulder, leftElbow, armRadius * 1.08)
    this._fitHumanoidLimb(parts.rightUpperArm, rightShoulder, rightElbow, armRadius * 1.08)
    this._fitHumanoidLimb(parts.leftForearm, leftElbow, leftWrist, armRadius * 0.86)
    this._fitHumanoidLimb(parts.rightForearm, rightElbow, rightWrist, armRadius * 0.86)
    this._fitHumanoidLimb(parts.leftThigh, leftHip, leftKnee, legRadius * 1.08)
    this._fitHumanoidLimb(parts.rightThigh, rightHip, rightKnee, legRadius * 1.08)
    this._fitHumanoidLimb(parts.leftShin, leftKnee, leftAnkle, legRadius * 0.82)
    this._fitHumanoidLimb(parts.rightShin, rightKnee, rightAnkle, legRadius * 0.82)

    const jointScale = new THREE.Vector3(armRadius * 0.9, armRadius * 0.9, armRadius * 0.9)
    this._placeHumanoidJoint(parts.leftElbow, leftElbow, jointScale)
    this._placeHumanoidJoint(parts.rightElbow, rightElbow, jointScale)
    const kneeScale = new THREE.Vector3(legRadius * 0.9, legRadius * 0.82, legRadius * 0.92)
    this._placeHumanoidJoint(parts.leftKnee, leftKnee, kneeScale)
    this._placeHumanoidJoint(parts.rightKnee, rightKnee, kneeScale)
    const handScale = new THREE.Vector3(armRadius * 0.82, armRadius * 1.25, armRadius * 0.62)
    this._placeHumanoidJoint(parts.leftHand, leftWrist, handScale)
    this._placeHumanoidJoint(parts.rightHand, rightWrist, handScale)
    const footScale = new THREE.Vector3(legRadius * 0.9, legRadius * 0.58, legRadius * 1.65)
    const leftFootPosition = leftAnkle.clone().addScaledVector(_bodyForward, legRadius * 0.5)
    const rightFootPosition = rightAnkle.clone().addScaledVector(_bodyForward, legRadius * 0.5)
    this._placeHumanoidJoint(parts.leftFoot, leftFootPosition, footScale, bodyQuaternion)
    this._placeHumanoidJoint(parts.rightFoot, rightFootPosition, footScale, bodyQuaternion)

    data._lastPersonData = personData
    this._syncStickmanDistanceLabel(data, personData)
  }

  updateHumanPose(kptsData, trackIds = []) {
    if (!kptsData || kptsData.length === 0) {
      this.stickmanMap.forEach((data) => {
        this._removeStickmanDistanceLabel(data)
        const obj = data.model ?? data.stickmanLines
        if (obj) {
          this.scene.remove(obj)
          obj.traverse((o) => this._disposeObject(o))
        }
      })
      this.stickmanMap.clear()
      return
    }
    const updated = new Set()
    kptsData.forEach((personData, index) => {
      const id = trackIds[index] ?? index
      const data = this.getOrCreateStickman(id)
      if (!data) return
      if (this.config.renderMode === "stickman") {
        data.stickmanLines.visible = this.skeletonVisible
        this.updateStickmanLinesFromPersonData(data, personData)
      } else {
        data.model.visible = this.skeletonVisible
        const keypoints = this.personDataToKeypoints(personData)
        if (Object.keys(keypoints).length >= 12) {
          data.boneController.updateWithKeypoints(keypoints, false)
        }
      }
      updated.add(id)
    })

    const toRemove = []
    this.stickmanMap.forEach((_data, id) => {
      if (!updated.has(id)) toRemove.push(id)
    })
    toRemove.forEach((id) => {
      const data = this.stickmanMap.get(id)
      if (!data) return
      this._removeStickmanDistanceLabel(data)
      const obj = data.model ?? data.stickmanLines
      if (obj) {
        this.scene.remove(obj)
        obj.traverse((o) => this._disposeObject(o))
      }
      this.stickmanMap.delete(id)
    })
  }

  animate() {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    if (this.labelRenderer) this.labelRenderer.render(this.scene, this.camera)
  }

  rotateViewLikeDrag(deg = 0) {
    const rad = (deg * Math.PI) / 180
    const offset = this.camera.position.clone().sub(this.controls.target)
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rad)
    this.camera.position.copy(this.controls.target.clone().add(offset))
    this.camera.lookAt(this.controls.target)
    this.controls.update()
  }

  handleResize(width, height) {
    this.config.width = width
    this.config.height = height
    this.renderer.setSize(width, height)
    this.applyViewport(width, height)
  }

  getViewport(width, height) {
    const fixedAspect = Number(this.config.fixedViewAspect)
    if (!Number.isFinite(fixedAspect) || fixedAspect <= 0 || width <= 0 || height <= 0) {
      return { x: 0, y: 0, width, height }
    }

    const containerAspect = width / height
    if (containerAspect > fixedAspect) {
      const viewportWidth = height * fixedAspect
      return {
        x: (width - viewportWidth) / 2,
        y: 0,
        width: viewportWidth,
        height,
      }
    }

    const viewportHeight = width / fixedAspect
    return {
      x: 0,
      y: (height - viewportHeight) / 2,
      width,
      height: viewportHeight,
    }
  }

  applyViewport(width, height) {
    if (!this.renderer || !this.camera || width <= 0 || height <= 0) return

    const viewport = this.getViewport(width, height)
    const viewportAspect = viewport.width / viewport.height

    this.camera.aspect = viewportAspect
    this.camera.updateProjectionMatrix()

    const hasFixedAspect = viewport.width !== width || viewport.height !== height
    if (hasFixedAspect) {
      // 清理上一次 viewport 残留，再在固定比例区域内渲染，避免不同窗口比例拉伸扇形。
      this.renderer.setScissorTest(false)
      this.renderer.setViewport(0, 0, width, height)
      this.renderer.setScissor(0, 0, width, height)
      this.renderer.clear()
      this.renderer.setScissor(viewport.x, viewport.y, viewport.width, viewport.height)
      this.renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height)
      this.renderer.setScissorTest(true)
    } else {
      this.renderer.setScissorTest(false)
      this.renderer.setViewport(0, 0, width, height)
    }

    if (this.labelRenderer) {
      this.labelRenderer.setSize(viewport.width, viewport.height)
      const labelElement = this.labelRenderer.domElement
      labelElement.style.left = `${viewport.x}px`
      labelElement.style.top = `${viewport.y}px`
      labelElement.style.width = `${viewport.width}px`
      labelElement.style.height = `${viewport.height}px`
    }
  }

  _disposeObject(obj) {
    if (!obj) return
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
      else obj.material.dispose()
    }
  }

  dispose() {
    if (this.pointCloudPoints) {
      this.pointCloudPoints.geometry?.dispose()
      this.pointCloudPoints.material?.dispose()
      this.scene.remove(this.pointCloudPoints)
    }
    this.scene.traverse((obj) => this._disposeObject(obj))
    this.scene.clear()
    if (this.stickmanTemplateModel) {
      this.stickmanTemplateModel.traverse((obj) => this._disposeObject(obj))
      this.stickmanTemplateModel = null
    }
    this.controls?.dispose()
    const canvasEl = this.canvas
    const gl = this.renderer.getContext()
    this.renderer.dispose()
    try {
      const ext = gl.getExtension("WEBGL_lose_context")
      if (ext) ext.loseContext()
    } catch {
      /* ignore */
    }
    if (canvasEl && canvasEl.parentElement) {
      canvasEl.parentElement.removeChild(canvasEl)
    }
    if (this.labelRenderer) {
      this.labelRenderer.domElement?.remove()
      this.labelRenderer = null
    }
    this.room = null
    this.radarGroup = null
    this.pointCloudPoints = null
    this.pointCloudQueue = []
    this.stickmanMap.clear()
    this.scene = null
    this.camera = null
    this.controls = null
    this.renderer = null
  }
}
