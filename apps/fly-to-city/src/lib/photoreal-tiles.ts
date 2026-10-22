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
  tiles.group.matrix.copy(toOurs.multiply(enu))
  tiles.group.matrixAutoUpdate = false
  tiles.group.updateMatrixWorld(true)
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
