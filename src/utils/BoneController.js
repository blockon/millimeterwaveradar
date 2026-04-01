import * as THREE from "three"

export class BoneController {
  constructor(model) {
    this.model = model
    this.bones = {}
    this.initBones()
    this.lastForwardDirection = null
    this.keypointsHistory = []
    this.maxHistoryFrames = 5
    this.lastUpdateTime = Date.now()
  }

  initBones() {
    this.model.traverse((object) => {
      if (object.isBone) {
        this.bones[object.name] = object
      }
    })
    this.defaultBodyProportions = this.calculateDefaultProportions()
  }

  calculateDefaultProportions() {
    const leftShoulder = this.bones.UpperArmL
    const rightShoulder = this.bones.UpperArmR
    const leftHip = this.bones.UpperLegL
    const rightHip = this.bones.UpperLegR

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return null
    }

    return {
      shoulderWidth: leftShoulder.position.distanceTo(rightShoulder.position),
      hipWidth: leftHip.position.distanceTo(rightHip.position),
    }
  }

  calculateDirections(keypoints) {
    const leftShoulder = new THREE.Vector3(
      keypoints.Left_Shoulder.x,
      keypoints.Left_Shoulder.y,
      keypoints.Left_Shoulder.z
    )
    const rightShoulder = new THREE.Vector3(
      keypoints.Right_Shoulder.x,
      keypoints.Right_Shoulder.y,
      keypoints.Right_Shoulder.z
    )
    const leftHip = new THREE.Vector3(keypoints.Left_Hip.x, keypoints.Left_Hip.y, keypoints.Left_Hip.z)
    const rightHip = new THREE.Vector3(keypoints.Right_Hip.x, keypoints.Right_Hip.y, keypoints.Right_Hip.z)

    const shoulderCenter = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5)
    const hipCenter = new THREE.Vector3().addVectors(leftHip, rightHip).multiplyScalar(0.5)
    const bodyCenter = new THREE.Vector3().addVectors(shoulderCenter, hipCenter).multiplyScalar(0.5)

    let upDirection = new THREE.Vector3().subVectors(shoulderCenter, hipCenter).normalize()
    const rightDirection = new THREE.Vector3().subVectors(rightShoulder, leftShoulder).normalize()
    const forwardDirection = new THREE.Vector3().crossVectors(upDirection, rightDirection).normalize()
    upDirection = new THREE.Vector3().crossVectors(rightDirection, forwardDirection).normalize()

    return { forwardDirection, upDirection, rightDirection, bodyCenter }
  }

  calculateForwardDirection(keypoints) {
    return this.calculateDirections(keypoints).forwardDirection
  }

  smoothKeypoints(keypoints) {
    const currentTime = Date.now()
    if (currentTime - this.lastUpdateTime > 2000) {
      this.lastForwardDirection = null
      this.keypointsHistory = []
    }
    this.lastUpdateTime = currentTime

    if (!this.lastForwardDirection) {
      this.lastForwardDirection = this.calculateForwardDirection(keypoints)
      this.keypointsHistory = [JSON.parse(JSON.stringify(keypoints))]
      return keypoints
    }

    const currentForward = this.calculateForwardDirection(keypoints)
    const angle = this.lastForwardDirection.angleTo(currentForward) * (180 / Math.PI)

    if (angle > 20) {
      const lastKeypoints = this.keypointsHistory[this.keypointsHistory.length - 1]
      const smoothedKeypoints = {}

      const lastWeight = 0.9
      const currentWeight = 0.1

      for (const key in keypoints) {
        if (keypoints[key] && lastKeypoints[key]) {
          smoothedKeypoints[key] = {
            x: lastKeypoints[key].x * lastWeight + keypoints[key].x * currentWeight,
            y: lastKeypoints[key].y * lastWeight + keypoints[key].y * currentWeight,
            z: lastKeypoints[key].z * lastWeight + keypoints[key].z * currentWeight,
          }
        } else {
          smoothedKeypoints[key] = keypoints[key]
        }
      }

      this.keypointsHistory = [JSON.parse(JSON.stringify(smoothedKeypoints))]
      this.lastForwardDirection = this.calculateForwardDirection(smoothedKeypoints)
      return smoothedKeypoints
    }

    this.keypointsHistory = [JSON.parse(JSON.stringify(keypoints))]
    this.lastForwardDirection = currentForward
    return keypoints
  }

  orientModel(keypoints) {
    const { forwardDirection, upDirection, rightDirection, bodyCenter } = this.calculateDirections(keypoints)
    const targetRotationMatrix = new THREE.Matrix4()
    targetRotationMatrix.makeBasis(forwardDirection, upDirection, rightDirection)

    const quaternion = new THREE.Quaternion()
    quaternion.setFromRotationMatrix(targetRotationMatrix)

    const rootBone = this.bones.Root
    rootBone.quaternion.copy(quaternion)
    rootBone.updateMatrix()
    this.model.position.copy(bodyCenter)
    rootBone.updateMatrixWorld(true)
    this.model.updateMatrix()
    this.model.updateMatrixWorld(true)
  }

  controlBone(bone, worldStartPoint, worldEndPoint, constraints = null) {
    const startLocal = bone.parent.worldToLocal(worldStartPoint.clone())
    const endLocal = bone.parent.worldToLocal(worldEndPoint.clone())
    const originalScale = bone.scale.clone()
    const originalLength = bone.position.length()
    const targetDirection = new THREE.Vector3().subVectors(endLocal, startLocal)

    if (targetDirection.length() === 0) return

    targetDirection.normalize()
    const defaultDirection = new THREE.Vector3(0, 1, 0)
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(defaultDirection, targetDirection)

    if (constraints) this.applyConstraints(bone, quaternion, constraints)
    else bone.quaternion.copy(quaternion)

    bone.scale.copy(originalScale)
    bone.position.normalize().multiplyScalar(originalLength)
    bone.updateMatrix()
  }

  applyConstraints(bone, quaternion) {
    const euler = new THREE.Euler().setFromQuaternion(quaternion, "XZY")
    euler.y = 0
    quaternion.setFromEuler(euler)
    bone.quaternion.copy(quaternion)
    bone.updateMatrixWorld(true)
  }

  adjustBodyPoints(keypoints) {
    const leftShoulder = new THREE.Vector3(
      keypoints.Left_Shoulder.x,
      keypoints.Left_Shoulder.y,
      keypoints.Left_Shoulder.z
    )
    const rightShoulder = new THREE.Vector3(
      keypoints.Right_Shoulder.x,
      keypoints.Right_Shoulder.y,
      keypoints.Right_Shoulder.z
    )
    const shoulderCenter = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5)
    const leftHip = new THREE.Vector3(keypoints.Left_Hip.x, keypoints.Left_Hip.y, keypoints.Left_Hip.z)
    const rightHip = new THREE.Vector3(keypoints.Right_Hip.x, keypoints.Right_Hip.y, keypoints.Right_Hip.z)
    const hipCenter = new THREE.Vector3().addVectors(leftHip, rightHip).multiplyScalar(0.5)
    const bodyDirection = new THREE.Vector3().subVectors(shoulderCenter, hipCenter).normalize()

    const leftShoulder2 = leftShoulder.clone()
    const rightShoulder2 = rightShoulder.clone()
    const leftShoulderVec = new THREE.Vector3().subVectors(leftShoulder2, shoulderCenter)
    const rightShoulderVec = new THREE.Vector3().subVectors(rightShoulder2, shoulderCenter)
    const leftShoulderBodyDirection = bodyDirection.clone().multiplyScalar(leftShoulderVec.dot(bodyDirection))
    const rightShoulderBodyDirection = bodyDirection.clone().multiplyScalar(rightShoulderVec.dot(bodyDirection))

    leftShoulder2.sub(leftShoulderBodyDirection)
    rightShoulder2.sub(rightShoulderBodyDirection)
    keypoints.Left_Shoulder.x = leftShoulder2.x
    keypoints.Left_Shoulder.y = leftShoulder2.y
    keypoints.Left_Shoulder.z = leftShoulder2.z
    keypoints.Right_Shoulder.x = rightShoulder2.x
    keypoints.Right_Shoulder.y = rightShoulder2.y
    keypoints.Right_Shoulder.z = rightShoulder2.z

    const leftHipVec = new THREE.Vector3().subVectors(leftHip, hipCenter)
    const rightHipVec = new THREE.Vector3().subVectors(rightHip, hipCenter)
    const leftHipBodyDirection = bodyDirection.clone().multiplyScalar(leftHipVec.dot(bodyDirection))
    const rightHipBodyDirection = bodyDirection.clone().multiplyScalar(rightHipVec.dot(bodyDirection))
    leftHip.sub(leftHipBodyDirection)
    rightHip.sub(rightHipBodyDirection)
    keypoints.Left_Hip.x = leftHip.x
    keypoints.Left_Hip.y = leftHip.y
    keypoints.Left_Hip.z = leftHip.z
    keypoints.Right_Hip.x = rightHip.x
    keypoints.Right_Hip.y = rightHip.y
    keypoints.Right_Hip.z = rightHip.z

    return keypoints
  }

  adjustWidthScale(keypoints, shoulderCenter, hipCenter) {
    const leftShoulder = new THREE.Vector3(
      keypoints.Left_Shoulder.x,
      keypoints.Left_Shoulder.y,
      keypoints.Left_Shoulder.z
    )
    const rightShoulder = new THREE.Vector3(
      keypoints.Right_Shoulder.x,
      keypoints.Right_Shoulder.y,
      keypoints.Right_Shoulder.z
    )
    const shoulderWidth = leftShoulder.distanceTo(rightShoulder)

    const leftHip = new THREE.Vector3(keypoints.Left_Hip.x, keypoints.Left_Hip.y, keypoints.Left_Hip.z)
    const rightHip = new THREE.Vector3(keypoints.Right_Hip.x, keypoints.Right_Hip.y, keypoints.Right_Hip.z)
    const hipWidth = leftHip.distanceTo(rightHip)

    if (shoulderWidth < 0.2) {
      const scaleFactor = 0.2 / shoulderWidth
      const pointsToScale = {
        left: ["Left_Shoulder", "Left_Elbow", "Left_Wrist"],
        right: ["Right_Shoulder", "Right_Elbow", "Right_Wrist"],
      }

      const leftToPoint = new THREE.Vector3().subVectors(leftShoulder, shoulderCenter)
      const rightToPoint = new THREE.Vector3().subVectors(rightShoulder, shoulderCenter)
      const leftScaled = leftToPoint.clone().multiplyScalar(scaleFactor)
      const rightScaled = rightToPoint.clone().multiplyScalar(scaleFactor)
      const leftOffset = new THREE.Vector3().subVectors(leftScaled, leftToPoint)
      const rightOffset = new THREE.Vector3().subVectors(rightScaled, rightToPoint)
      pointsToScale.left.forEach((point) => {
        keypoints[point].x += leftOffset.x
        keypoints[point].y += leftOffset.y
        keypoints[point].z += leftOffset.z
      })
      pointsToScale.right.forEach((point) => {
        keypoints[point].x += rightOffset.x
        keypoints[point].y += rightOffset.y
        keypoints[point].z += rightOffset.z
      })
    }

    if (hipWidth < 0.2) {
      const scaleFactor = 0.2 / hipWidth
      const pointsToScale = {
        left: ["Left_Hip", "Left_Knee", "Left_Ankle"],
        right: ["Right_Hip", "Right_Knee", "Right_Ankle"],
      }

      const leftToPoint = new THREE.Vector3().subVectors(leftHip, hipCenter)
      const rightToPoint = new THREE.Vector3().subVectors(rightHip, hipCenter)
      const leftScaled = leftToPoint.clone().multiplyScalar(scaleFactor)
      const rightScaled = rightToPoint.clone().multiplyScalar(scaleFactor)
      const leftOffset = new THREE.Vector3().subVectors(leftScaled, leftToPoint)
      const rightOffset = new THREE.Vector3().subVectors(rightScaled, rightToPoint)
      pointsToScale.left.forEach((point) => {
        keypoints[point].x += leftOffset.x
        keypoints[point].y += leftOffset.y
        keypoints[point].z += leftOffset.z
      })
      pointsToScale.right.forEach((point) => {
        keypoints[point].x += rightOffset.x
        keypoints[point].y += rightOffset.y
        keypoints[point].z += rightOffset.z
      })
    }

    return keypoints
  }

  adjustBodyProportions(keypoints) {
    const leftShoulder = new THREE.Vector3(
      keypoints.Left_Shoulder.x,
      keypoints.Left_Shoulder.y,
      keypoints.Left_Shoulder.z
    )
    const rightShoulder = new THREE.Vector3(
      keypoints.Right_Shoulder.x,
      keypoints.Right_Shoulder.y,
      keypoints.Right_Shoulder.z
    )
    const shoulderCenter = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5)
    const leftHip = new THREE.Vector3(keypoints.Left_Hip.x, keypoints.Left_Hip.y, keypoints.Left_Hip.z)
    const rightHip = new THREE.Vector3(keypoints.Right_Hip.x, keypoints.Right_Hip.y, keypoints.Right_Hip.z)
    const hipCenter = new THREE.Vector3().addVectors(leftHip, rightHip).multiplyScalar(0.5)
    keypoints = this.adjustWidthScale(keypoints, shoulderCenter, hipCenter)
    return this.adjustBodyPoints(keypoints)
  }

  controlAllBones(keypoints) {
    const leftShoulder = new THREE.Vector3(
      keypoints.Left_Shoulder.x,
      keypoints.Left_Shoulder.y,
      keypoints.Left_Shoulder.z
    )
    const rightShoulder = new THREE.Vector3(
      keypoints.Right_Shoulder.x,
      keypoints.Right_Shoulder.y,
      keypoints.Right_Shoulder.z
    )
    const shoulderCenter = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5)
    const leftHip = new THREE.Vector3(keypoints.Left_Hip.x, keypoints.Left_Hip.y, keypoints.Left_Hip.z)
    const rightHip = new THREE.Vector3(keypoints.Right_Hip.x, keypoints.Right_Hip.y, keypoints.Right_Hip.z)
    const hipCenter = new THREE.Vector3().addVectors(leftHip, rightHip).multiplyScalar(0.5)
    keypoints = this.adjustWidthScale(keypoints, shoulderCenter, hipCenter)
    keypoints = this.adjustBodyPoints(keypoints)

    const legConstraints = { minY: 0, maxY: 0 }
    if (this.bones.UpperArmL) {
      this.controlBone(
        this.bones.UpperArmL,
        new THREE.Vector3(keypoints.Left_Shoulder.x, keypoints.Left_Shoulder.y, keypoints.Left_Shoulder.z),
        new THREE.Vector3(keypoints.Left_Elbow.x, keypoints.Left_Elbow.y, keypoints.Left_Elbow.z)
      )
    }
    if (this.bones.ArmL) {
      this.controlBone(
        this.bones.ArmL,
        new THREE.Vector3(keypoints.Left_Elbow.x, keypoints.Left_Elbow.y, keypoints.Left_Elbow.z),
        new THREE.Vector3(keypoints.Left_Wrist.x, keypoints.Left_Wrist.y, keypoints.Left_Wrist.z)
      )
    }
    if (this.bones.UpperArmR) {
      this.controlBone(
        this.bones.UpperArmR,
        new THREE.Vector3(keypoints.Right_Shoulder.x, keypoints.Right_Shoulder.y, keypoints.Right_Shoulder.z),
        new THREE.Vector3(keypoints.Right_Elbow.x, keypoints.Right_Elbow.y, keypoints.Right_Elbow.z)
      )
    }
    if (this.bones.ArmR) {
      this.controlBone(
        this.bones.ArmR,
        new THREE.Vector3(keypoints.Right_Elbow.x, keypoints.Right_Elbow.y, keypoints.Right_Elbow.z),
        new THREE.Vector3(keypoints.Right_Wrist.x, keypoints.Right_Wrist.y, keypoints.Right_Wrist.z)
      )
    }
    if (this.bones.UpperLegL) {
      this.controlBone(
        this.bones.UpperLegL,
        new THREE.Vector3(keypoints.Left_Hip.x, keypoints.Left_Hip.y, keypoints.Left_Hip.z),
        new THREE.Vector3(keypoints.Left_Knee.x, keypoints.Left_Knee.y, keypoints.Left_Knee.z),
        legConstraints
      )
    }
    if (this.bones.LegL) {
      this.controlBone(
        this.bones.LegL,
        new THREE.Vector3(keypoints.Left_Knee.x, keypoints.Left_Knee.y, keypoints.Left_Knee.z),
        new THREE.Vector3(keypoints.Left_Ankle.x, keypoints.Left_Ankle.y, keypoints.Left_Ankle.z)
      )
    }
    if (this.bones.UpperLegR) {
      this.controlBone(
        this.bones.UpperLegR,
        new THREE.Vector3(keypoints.Right_Hip.x, keypoints.Right_Hip.y, keypoints.Right_Hip.z),
        new THREE.Vector3(keypoints.Right_Knee.x, keypoints.Right_Knee.y, keypoints.Right_Knee.z),
        legConstraints
      )
    }
    if (this.bones.LegR) {
      this.controlBone(
        this.bones.LegR,
        new THREE.Vector3(keypoints.Right_Knee.x, keypoints.Right_Knee.y, keypoints.Right_Knee.z),
        new THREE.Vector3(keypoints.Right_Ankle.x, keypoints.Right_Ankle.y, keypoints.Right_Ankle.z)
      )
    }
    this.model.updateMatrixWorld(true)
  }

  updateWithKeypoints(keypoints, smooth = false) {
    const keypointsCopy = JSON.parse(JSON.stringify(keypoints))
    let smoothedKeypoints
    if (smooth) smoothedKeypoints = this.smoothKeypoints(keypointsCopy)
    else smoothedKeypoints = keypointsCopy
    smoothedKeypoints = this.adjustBodyProportions(smoothedKeypoints)
    this.orientModel(smoothedKeypoints)
    this.controlAllBones(smoothedKeypoints)
  }
}
