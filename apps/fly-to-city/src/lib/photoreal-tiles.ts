import { TilesRenderer, WGS84_ELLIPSOID } from '3d-tiles-renderer'
import { CesiumIonAuthPlugin, GLTFExtensionsPlugin } from '3d-tiles-renderer/plugins'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import * as THREE from 'three'

/** Google Photorealistic 3D Tiles 在 Cesium ion 上的资产编号。 */
export const GOOGLE_PHOTOREAL_ASSET = 2275207

type RuntimeTiles = TilesRenderer & {
  stats: { queued: number; downloading: number; parsing: number }
  downloadQueue: { running: boolean }
  parseQueue: { running: boolean }
}

let singleton: TilesRenderer | null = null
let ktx2: KTX2Loader | null = null
let ktxBound = false
let rootLoads = 0

export function cesiumIonToken() {
  const fromEnv = import.meta.env.VITE_CESIUM_ION_TOKEN
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim()
  const injected = window.__CESIUM_ION_TOKEN
  if (typeof injected === 'string' && injected.trim()) return injected.trim()
  return ''
}

/**
 * 整个页面只创建一次瓦片集。换城市只改坐标，不重新 new，避免重复请求根瓦片。
 * 请求不写磁盘缓存。
 */
export function acquirePhotorealTiles(token: string) {
  if (singleton) return singleton
  const tiles = new TilesRenderer()
  tiles.fetchOptions = { cache: 'no-store' }
  tiles.registerPlugin(
    new CesiumIonAuthPlugin({
      apiToken: token,
      assetId: String(GOOGLE_PHOTOREAL_ASSET),
      autoRefreshToken: true,
      useRecommendedSettings: true,
    }),
  )
  const draco = new DRACOLoader()
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
  ktx2 = new KTX2Loader()
  ktx2.setTranscoderPath(`${import.meta.env.BASE_URL}basis/`)
  tiles.registerPlugin(
    new GLTFExtensionsPlugin({
      dracoLoader: draco,
      ktxLoader: ktx2,
      meshoptDecoder: MeshoptDecoder,
      autoDispose: false,
    }),
  )
  tiles.addEventListener('load-root-tileset', () => {
    rootLoads += 1
    window.__photorealRootLoads = rootLoads
  })
  tiles.addEventListener('load-model', (event) => {
    const root = event.scene as THREE.Object3D
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        if (!mat) continue
        ;(mat as THREE.Material & { fog?: boolean }).fog = false
      }
    })
  })
  singleton = tiles
  return tiles
}

export function photorealRootLoads() {
  return rootLoads
}

/** 贴图转码要知道当前显卡支持哪种压缩格式。整个会话只探测一次。 */
export function bindPhotorealRenderer(gl: THREE.WebGLRenderer) {
  if (!ktx2 || ktxBound) return
  ktxBound = true
  try {
    ktx2.detectSupport(gl)
  } catch (error) {
    console.warn('KTX2 转码器初始化失败，实景贴图可能缺失', error)
  }
}

/** 根瓦片失败后，由用户再次打开实景时才重试。健康状态下这是空操作。 */
export function retryPhotorealTiles() {
  singleton?.resetFailedTiles()
}

const orientByTiles = new WeakMap<TilesRenderer, THREE.Matrix4>()
const _world = new THREE.Matrix4()
const _box = new THREE.Box3()
const _tileBox = new THREE.Box3()
const _size = new THREE.Vector3()
const _center = new THREE.Vector3()
const _proj = new THREE.Matrix4()
const _frustum = new THREE.Frustum()

/** 把地球坐标的瓦片摆到城市原点：X 向东，Y 向上，北是 -Z，和程序化城市同一套坐标。 */
export function orientTilesToCity(tiles: TilesRenderer, lng: number, lat: number) {
  const enu = new THREE.Matrix4()
  WGS84_ELLIPSOID.getEastNorthUpFrame((lat * Math.PI) / 180, (lng * Math.PI) / 180, 0, enu)
  enu.invert()
  const toOurs = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 1, 0),
  )
  const matrix = toOurs.multiply(enu)
  tiles.group.matrix.copy(matrix)
  const saved = orientByTiles.get(tiles) ?? new THREE.Matrix4()
  saved.copy(matrix)
  orientByTiles.set(tiles, saved)
  tiles.group.matrixAutoUpdate = false
  tiles.group.matrixWorldAutoUpdate = false
  refreshTileWorldMatrices(tiles.group)
}

/**
 * 瓦片组在矩阵没变时不会刷新子节点。新网格会停在地心坐标里，列表里却算「可见」。
 * 这里每帧把城市矩阵写回去，并强制重算正在显示的网格。
 */
export function keepTilesOriented(tiles: TilesRenderer) {
  const group = tiles.group
  const saved = orientByTiles.get(tiles)
  if (saved && !group.matrix.equals(saved)) group.matrix.copy(saved)
  group.visible = true
  group.matrixAutoUpdate = false
  group.matrixWorldAutoUpdate = false
  refreshTileWorldMatrices(group)
  tiles.forEachLoadedModel((scene, tile) => {
    if (!tiles.visibleTiles.has(tile) && !tiles.activeTiles.has(tile)) return
    scene.updateMatrixWorld(true)
  })
}

/** 用组上的矩阵重写世界矩阵。不走 TilesGroup.updateMatrixWorld，那个会在矩阵没变时跳过子节点。 */
export function refreshTileWorldMatrices(group: THREE.Object3D) {
  group.matrixAutoUpdate = false
  group.matrixWorldAutoUpdate = false
  const parent = group.parent
  if (parent) {
    parent.updateWorldMatrix(true, false)
    _world.multiplyMatrices(parent.matrixWorld, group.matrix)
  } else {
    _world.copy(group.matrix)
  }
  group.matrixWorld.copy(_world)
  group.matrixWorldNeedsUpdate = false
  const inverse = (group as THREE.Object3D & { matrixWorldInverse?: THREE.Matrix4 }).matrixWorldInverse
  if (inverse) inverse.copy(_world).invert()
  for (const child of group.children) child.updateMatrixWorld(true)
}

/**
 * 网格的世界包围盒是不是落在城市附近，并且切进了当前镜头。
 * 地心坐标下的盒子中心在几十万米外，直接算没画上。
 */
export function localBoxOnScreen(box: THREE.Box3, camera: THREE.Camera) {
  if (box.isEmpty()) return false
  box.getSize(_size)
  box.getCenter(_center)
  const span = Math.max(_size.x, _size.y, _size.z)
  if (_center.length() > 100_000) return false
  if (span < 0.5 || span > 800_000) return false
  _proj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  _frustum.setFromProjectionMatrix(_proj, camera.coordinateSystem)
  return _frustum.intersectsBox(box)
}

/** 按网格自己的世界矩阵量包围盒，不再调用 setFromObject，避免测量时把错误矩阵悄悄改掉。 */
function boxFromStoredWorld(scene: THREE.Object3D, target: THREE.Box3) {
  target.makeEmpty()
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    const geometry = mesh.geometry
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    if (!geometry.boundingBox) return
    _box.copy(geometry.boundingBox).applyMatrix4(mesh.matrixWorld)
    target.union(_box)
  })
  return target
}

export function photorealTilesOnScreen(tiles: TilesRenderer, camera: THREE.Camera) {
  let meshes = 0
  let onScreen = false
  tiles.forEachLoadedModel((scene, tile) => {
    if (!tiles.visibleTiles.has(tile)) return
    boxFromStoredWorld(scene, _tileBox)
    if (_tileBox.isEmpty()) return
    meshes += 1
    if (localBoxOnScreen(_tileBox, camera)) onScreen = true
  })
  const groupLive = tiles.group.visible && tiles.group.parent !== null
  return { onScreen: onScreen && groupLive, meshes }
}

export function tilesBusy(tiles: TilesRenderer) {
  const stats = (tiles as RuntimeTiles).stats
  const queued = (stats?.queued ?? 0) + (stats?.downloading ?? 0) + (stats?.parsing ?? 0)
  return queued > 0 || tiles.downloadQueue.running || tiles.parseQueue.running
}

/**
 * 可见瓦片里有没有「又细又高」的网格。
 * 没有令牌时对不了真瓦片，所以这只是几何上的建筑迹象：误差小于约 48 米，高度够，而且不像一整片平地。
 */
export function tileBuildingSignal(tiles: TilesRenderer) {
  let minError = Number.POSITIVE_INFINITY
  let building = false
  const box = new THREE.Box3()
  tiles.forEachLoadedModel((scene, tile) => {
    if (!tiles.visibleTiles.has(tile)) return
    const err = Number.isFinite(tile.geometricError) ? tile.geometricError : Number.POSITIVE_INFINITY
    if (err < minError) minError = err
    if (err > 48) return
    box.setFromObject(scene)
    if (box.isEmpty()) return
    const height = box.max.y - box.min.y
    const span = Math.max(box.max.x - box.min.x, box.max.z - box.min.z, 1)
    if (height >= 16 && (height >= 30 || height / span >= 0.12)) building = true
  })
  return { building, minError }
}

export function tileCreditLines(tiles: TilesRenderer) {
  const lines: string[] = []
  for (const item of tiles.getAttributions()) {
    if (typeof item.value === 'string' && item.value.trim()) lines.push(item.value.trim())
  }
  return lines
}
