import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { BoneController } from "@/utils/BoneController"
import {
  COCO_ORDER,
  COCO_SKELETON_EDGES,
  COCO_EDGE_PART,
  STICKMAN_PART_COLORS,
  JOINT_PART,
} from "@/constants/cocoKpts"
import { horizontalDistanceFromOriginXZ, kptJointToSceneXZ } from "@/utils/radarPersonMetrics"

export class StickmanScene {
  constructor(canvas, config = {}) {
    this.canvas = canvas
    this.config = {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      roomWidth: 5,
      roomDepth: 5,
      roomHeight: 3,
      renderMode: "stickman",
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
    const cachedForward = Number.parseFloat(localStorage.getItem("radarFloorForwardDeg") || "")
    this.floorForwardDeg = Number.isFinite(cachedForward) ? cachedForward : 180
    this.floorOrigin = new THREE.Vector3(0, 0, 0)
    this.init()
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(this.config.width, this.config.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, this.config.width / this.config.height, 0.1, 100)
    this.camera.position.set(6, 5, 6)
    this.camera.lookAt(0, 1, 0)

    this.controls = new OrbitControls(this.camera, this.canvas)
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

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4)
    dirLight.position.set(5, 10, 6)
    dirLight.castShadow = true
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
    if (!this._pointCloudDummy) this._pointCloudDummy = new THREE.Object3D()
    const maxPoints = 100000
    const sphereRadius = 0.018
    const geom = new THREE.SphereGeometry(sphereRadius, 10, 10)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
    this.pointCloudPoints = new THREE.InstancedMesh(geom, mat, maxPoints)
    this.pointCloudPoints.count = 0
    this.pointCloudPoints.visible = false
    this.scene.add(this.pointCloudPoints)
  }

  updatePointCloud(xyz = []) {
    if (!this.pointCloudPoints) return
    if (!xyz || xyz.length === 0) {
      this.pointCloudQueue = []
      this.pointCloudPoints.count = 0
      this.pointCloudPoints.visible = false
      return
    }
    const queueSize = 10
    const displayRatio = 1 / 2

    this.pointCloudQueue.push(xyz.map((p) => [Number(p[0]) || 0, Number(p[1]) || 0, Number(p[2]) || 0]))
    if (this.pointCloudQueue.length > queueSize) this.pointCloudQueue.shift()

    const allPoints = this.pointCloudQueue.flat()
    const n = allPoints.length
    const toShow = Math.floor(n * displayRatio)
    if (toShow <= 0) {
      this.pointCloudPoints.count = 0
      this.pointCloudPoints.visible = false
      return
    }
    const indices = new Set()
    while (indices.size < toShow) {
      indices.add(Math.floor(Math.random() * n))
    }
    const sampled = Array.from(indices).map((i) => allPoints[i])

    const roomDepth = this.config.roomDepth
    const dummy = this._pointCloudDummy
    for (let i = 0; i < sampled.length; i++) {
      const p = sampled[i]
      dummy.position.set(p[0] - roomDepth / 2, p[2] + 1, -p[1])
      dummy.updateMatrix()
      this.pointCloudPoints.setMatrixAt(i, dummy.matrix)
    }
    this.pointCloudPoints.count = sampled.length
    this.pointCloudPoints.instanceMatrix.needsUpdate = true
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
      this.pointCloudPoints.visible = this.pointCloudVisible && this.pointCloudPoints.count > 0
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
    const azimuth = parseFloat(params.radarAzimuth_room ?? params.radarAzimuthroom ?? params.azimuth_room) || 0
    const elevation = parseFloat(params.downtAngle) ?? 0
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

    const nextForwardDeg = 180 - azimuth
    if (Math.abs(nextForwardDeg - this.floorForwardDeg) > 0.1) {
      this.floorForwardDeg = nextForwardDeg
      localStorage.setItem("radarFloorForwardDeg", String(nextForwardDeg))
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
    this.scene.add(this.room)
  }

  createSectorFloor(group) {
    const startDeg = this.floorForwardDeg - 60
    const endDeg = this.floorForwardDeg + 60
    const radii = [2, 2.5, 5]
    const y = 0.01

    // 扇形底色：中心#D2FCFF，向边缘透明渐变
    this.createSectorGradient(group, startDeg, endDeg, 5, y - 0.003)

    // 两条120°边界射线（虚线）
    this.createDashedRay(group, startDeg, 5, y)
    this.createDashedRay(group, endDeg, 5, y)

    // 2m / 2.5m / 5m 弧形虚线
    radii.forEach((r) => {
      this.createDashedArc(group, startDeg, endDeg, r, y, 80)
    })

    // 文本标注：5m弧线外中点“120°”
    const angleMid = this.floorForwardDeg
    const midPos = this.getSectorPoint(5.45, angleMid)
    const angleLabel = this.createTextSprite("120°", 64, "#9fe8ff")
    angleLabel.position.set(midPos.x, 0.05, midPos.z)
    group.add(angleLabel)

    // 左右两侧距离标注：2m / 2.5m / 5m
    const leftLabelDeg = endDeg + 2
    const rightLabelDeg = startDeg - 2
    const labelItems = [
      { text: "2m", radius: 2.1 },
      { text: "2.5m", radius: 2.65 },
      { text: "5m", radius: 5.15 },
    ]
    labelItems.forEach((item) => {
      const leftPoint = this.getSectorPoint(item.radius, leftLabelDeg)
      const leftLabel = this.createTextSprite(item.text, 52, "#8dd7ea")
      leftLabel.position.set(leftPoint.x, 0.05, leftPoint.z)
      group.add(leftLabel)

      const rightPoint = this.getSectorPoint(item.radius, rightLabelDeg)
      const rightLabel = this.createTextSprite(item.text, 52, "#8dd7ea")
      rightLabel.position.set(rightPoint.x, 0.05, rightPoint.z)
      group.add(rightLabel)
    })
  }

  createDashedRay(group, angleDeg, radius, y = 0.01) {
    const p0 = new THREE.Vector3(0, y, 0)
    const p1xz = this.getSectorPoint(radius, angleDeg)
    const p1 = new THREE.Vector3(p1xz.x, y, p1xz.z)
    const geometry = new THREE.BufferGeometry().setFromPoints([p0, p1])
    const material = new THREE.LineDashedMaterial({
      color: 0x8cc7d8,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.9,
    })
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    group.add(line)
  }

  createDashedArc(group, startDeg, endDeg, radius, y = 0.01, segments = 80) {
    const points = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const deg = startDeg + (endDeg - startDeg) * t
      const p = this.getSectorPoint(radius, deg)
      points.push(new THREE.Vector3(p.x, y, p.z))
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineDashedMaterial({
      color: radius >= 5 ? 0xa5edff : 0x77b4c8,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: radius >= 5 ? 0.95 : 0.82,
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

  createTextSprite(text, fontSize = 48, color = "#9fe8ff") {
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
    drawCtx.strokeStyle = "rgba(15,36,45,0.9)"
    drawCtx.lineWidth = 8
    drawCtx.strokeText(text, canvas.width / 2, canvas.height / 2)
    drawCtx.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    const sprite = new THREE.Sprite(material)
    const scale = 0.0036
    sprite.scale.set(canvas.width * scale, canvas.height * scale, 1)
    sprite.renderOrder = 30
    return sprite
  }

  createSectorGradient(group, startDeg, endDeg, maxRadius, y = 0.005) {
    const segments = 120
    const positions = []
    const alphas = []
    const indices = []

    // 中心点
    positions.push(0, y, 0)
    alphas.push(0.5)

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
        uColor: { value: new THREE.Color("#D2FCFF") },
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
      depthTest: false,
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
    const edgeCount = COCO_SKELETON_EDGES.length
    const positions = new Float32Array(edgeCount * 6)
    const colors = new Float32Array(edgeCount * 6)
    for (let e = 0; e < edgeCount; e++) {
      const [r, g, b] = STICKMAN_PART_COLORS[COCO_EDGE_PART[e]] || STICKMAN_PART_COLORS.arms
      const i = e * 6
      colors[i] = r
      colors[i + 1] = g
      colors[i + 2] = b
      colors[i + 3] = r
      colors[i + 4] = g
      colors[i + 5] = b
    }
    const geom = new LineSegmentsGeometry()
    geom.setPositions(positions)
    geom.setColors(colors)
    const mat = new LineMaterial({ linewidth: 5, worldUnits: false, vertexColors: true })
    const lineSegments = new LineSegments2(geom, mat)
    const group = new THREE.Group()
    group.add(lineSegments)
    const headGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24)
    const headMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(...STICKMAN_PART_COLORS.head),
      side: THREE.DoubleSide,
    })
    const headCircle = new THREE.Mesh(headGeom, headMat)
    headCircle.visible = false
    group.add(headCircle)

    const jointRadius = 0.025
    const jointGeom = new THREE.SphereGeometry(jointRadius, 12, 12)
    const chestJoints = new THREE.InstancedMesh(
      jointGeom,
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...STICKMAN_PART_COLORS.chest) }),
      4
    )
    const armJoints = new THREE.InstancedMesh(
      jointGeom.clone(),
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...STICKMAN_PART_COLORS.arms) }),
      4
    )
    const legJoints = new THREE.InstancedMesh(
      jointGeom.clone(),
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...STICKMAN_PART_COLORS.legs) }),
      4
    )
    ;[chestJoints, armJoints, legJoints].forEach((m) => {
      m.count = 0
      m.visible = false
      group.add(m)
    })
    const { root: labelRoot, cap: labelCap } = this._createStickmanDistanceLabelDOM()
    const distanceLabel = new CSS2DObject(labelRoot)
    distanceLabel.visible = false
    this.scene.add(distanceLabel)
    this.scene.add(group)
    this.stickmanMap.set(id, {
      stickmanLines: group,
      lineGeom: geom,
      positions,
      edgeCount,
      headCircle,
      jointPoints: { chest: chestJoints, arms: armJoints, legs: legJoints },
      _jointDummy: new THREE.Object3D(),
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

  updateStickmanLinesFromPersonData(data, personData) {
    const n = Math.min(17, personData[0]?.length ?? 0, personData[1]?.length ?? 0, personData[2]?.length ?? 0)
    if (n < 2) {
      if (data.distanceLabel) data.distanceLabel.visible = false
      return
    }
    const positions = data.positions
    for (let e = 0; e < data.edgeCount; e++) {
      const [a, b] = COCO_SKELETON_EDGES[e]
      if (a >= n || b >= n) continue
      const va = this.kptToScene(personData, a)
      const vb = this.kptToScene(personData, b)
      const i = e * 6
      positions[i] = va.x
      positions[i + 1] = va.y + 1
      positions[i + 2] = va.z
      positions[i + 3] = vb.x
      positions[i + 4] = vb.y + 1
      positions[i + 5] = vb.z
    }
    const attr = data.lineGeom.attributes.instanceStart
    if (attr) attr.needsUpdate = true

    const headCircle = data.headCircle
    if (headCircle) {
      const pose = this.computeHeadPose(personData)
      if (pose) {
        headCircle.position.copy(pose.center)
        const defaultUp = new THREE.Vector3(0, 1, 0)
        headCircle.quaternion.setFromUnitVectors(defaultUp, pose.forward)
        headCircle.visible = true
      } else {
        headCircle.visible = false
      }
    }

    const joints = data.jointPoints
    const jointDummy = data._jointDummy
    if (joints && jointDummy) {
      const counts = { chest: 0, arms: 0, legs: 0 }
      for (let i = 5; i < n && i < 17; i++) {
        const part = JOINT_PART[i] || "arms"
        const mesh = joints[part]
        if (!mesh) continue
        const v = this.kptToScene(personData, i)
        jointDummy.position.set(v.x, v.y + 1, v.z)
        jointDummy.scale.setScalar(1)
        jointDummy.updateMatrix()
        mesh.setMatrixAt(counts[part], jointDummy.matrix)
        counts[part]++
      }
      ;["chest", "arms", "legs"].forEach((part) => {
        const mesh = joints[part]
        mesh.count = counts[part]
        mesh.instanceMatrix.needsUpdate = true
        mesh.visible = counts[part] > 0 && this.skeletonVisible
      })
    }

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
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    if (this.labelRenderer) this.labelRenderer.setSize(width, height)
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
    this.renderer.dispose()
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
