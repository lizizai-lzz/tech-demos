import { describe, expect, test } from 'bun:test'
import { TilesRenderer, WGS84_ELLIPSOID } from '3d-tiles-renderer'
import * as THREE from 'three'
import { orbitPose } from './view-pose'
import { keepTilesOriented, localBoxOnScreen, orientTilesToCity } from './photoreal-tiles'

const lng = 139.7006
const lat = 35.6896

function shinjukuCamera() {
  const pose = orbitPose('tokyo-shinjuku', 0, 0, 1, { x: 0, y: 0, z: 0 })
  const cam = new THREE.PerspectiveCamera(pose.fov, 1280 / 720, 1, 80_000)
  cam.position.set(pose.x, pose.y, pose.z)
  cam.lookAt(pose.lookX, pose.lookY, pose.lookZ)
  cam.updateMatrixWorld()
  return { cam, pose }
}

describe('实景瓦片的世界矩阵', () => {
  test('矩阵稳定后新加的地心网格不会自己进城市坐标，刷新后才会', () => {
    const tiles = new TilesRenderer()
    orientTilesToCity(tiles, lng, lat)
    const child = new THREE.Mesh(new THREE.BoxGeometry(40, 80, 40))
    const ecef = new THREE.Vector3()
    WGS84_ELLIPSOID.getCartographicToPosition((lat * Math.PI) / 180, (lng * Math.PI) / 180, 0, ecef)
    child.position.copy(ecef)
    child.updateMatrix()
    child.matrixWorld.copy(child.matrix)
    child.matrixWorldNeedsUpdate = false
    tiles.group.add(child)
    tiles.group.updateMatrixWorld(true)

    const stale = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld)
    expect(stale.length()).toBeGreaterThan(1_000_000)

    tiles.group.visible = false
    keepTilesOriented(tiles)
    const fixed = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld)
    expect(fixed.length()).toBeLessThan(5)
    expect(tiles.group.visible).toBe(true)
  })

  test('城市附近的盒子算在镜头里，地心里的盒子不算', () => {
    const { cam, pose } = shinjukuCamera()
    const near = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(pose.lookX, 40, pose.lookZ),
      new THREE.Vector3(120, 160, 120),
    )
    expect(localBoxOnScreen(near, cam)).toBe(true)

    const ecef = new THREE.Vector3()
    WGS84_ELLIPSOID.getCartographicToPosition((lat * Math.PI) / 180, (lng * Math.PI) / 180, 0, ecef)
    const far = new THREE.Box3().setFromCenterAndSize(ecef, new THREE.Vector3(80, 80, 80))
    expect(localBoxOnScreen(far, cam)).toBe(false)

    const buried = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, -8000, 0), new THREE.Vector3(20, 20, 20))
    expect(localBoxOnScreen(buried, cam)).toBe(false)
  })
})
