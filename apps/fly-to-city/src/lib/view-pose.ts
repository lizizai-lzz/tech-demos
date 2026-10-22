import { lngLatToLocal, localToLngLat } from './geo'

/** 与 MapLibre 默认瓦片尺寸一致，用来互算 zoom 和米。 */
const TILE_SIZE = 512
const EARTH_CIRCUMFERENCE = 2 * Math.PI * 6378137

export type Focus = { x: number; y: number; z: number }

export type LocalPose = {
  x: number
  y: number
  z: number
  lookX: number
  lookY: number
  lookZ: number
  fov: number
}

export type GlobeCam = {
  lng: number
  lat: number
  zoom: number
  pitch: number
  bearing: number
  fov: number
}

const PITCH_TAN = 940 / 3168

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpAngle(a: number, b: number, t: number) {
  const delta = ((((b - a) % 360) + 540) % 360) - 180
  return a + delta * t
}

/**
 * 定稿斜俯视。俯角始终是 atan(940/3168)，只改距离，不抬头。
 * 新宿看西口楼群，并且更近，让塔楼占住画面中部。香港和其他城市保持原来的距离。
 */
export function orbitPose(cityId: string, orbit: number, push: number, arrive: number, focus: Focus): LocalPose {
  const settled = clamp01(arrive)
  const settle = 0.75 + (1 - settled) * 0.5
  const tokyo = cityId === 'tokyo-shinjuku'
  const closeness = tokyo ? 0.4 : 1
  const scale = (settle / 0.75) * (0.75 - push * 0.1) * closeness
  const horiz = 3168 * scale
  const lookY = 50
  const shanghai = cityId === 'shanghai-lujiazui'
  const lookX = shanghai ? focus.x : tokyo ? -700 : 0
  const lookZ = shanghai ? focus.z : tokyo ? -30 : 0
  const bearing0 = shanghai ? -2.35 : 0.7
  const ang = bearing0 + orbit * 1.15
  return {
    x: lookX + Math.sin(ang) * horiz,
    y: lookY + horiz * PITCH_TAN,
    z: lookZ + Math.cos(ang) * horiz,
    lookX,
    lookY,
    lookZ,
    fov: 42,
  }
}

/** 把 three.js 机位换成 MapLibre 机位。屏幕中心是视线落到地面的那一点。 */
export function localToGlobe(centerLng: number, centerLat: number, pose: LocalPose, viewportHeight: number): GlobeCam {
  const dx = pose.lookX - pose.x
  const dy = pose.lookY - pose.y
  const dz = pose.lookZ - pose.z
  const len = Math.hypot(dx, dy, dz) || 1
  const dirY = dy / len
  const tGround = dirY < -1e-4 ? (0 - pose.y) / dirY : 0
  const gx = pose.x + (dx / len) * tGround
  const gz = pose.z + (dz / len) * tGround
  const groundDist = Math.hypot(gx - pose.x, gz - pose.z)
  const altitude = Math.max(0, pose.y)
  const center = localToLngLat(gx, gz, centerLng, centerLat)
  const pitch = (Math.atan2(groundDist, Math.max(altitude, 1)) * 180) / Math.PI
  const bearing = (Math.atan2(gx - pose.x, -(gz - pose.z)) * 180) / Math.PI
  const halfFov = ((pose.fov * Math.PI) / 180) / 2
  const cameraToCenter = (0.5 / Math.tan(halfFov)) * viewportHeight
  const range = Math.hypot(groundDist, altitude)
  const circ = EARTH_CIRCUMFERENCE * Math.cos((center.lat * Math.PI) / 180)
  const worldSize = cameraToCenter / Math.max(range / circ, 1e-9)
  const zoom = Math.log2(worldSize / TILE_SIZE)
  return { lng: center.lng, lat: center.lat, zoom, pitch, bearing, fov: pose.fov }
}

/** 上面的逆变换。视线对准地面中心，和 MapLibre 的 center 是同一个点。 */
export function globeToLocal(centerLng: number, centerLat: number, cam: GlobeCam, viewportHeight: number): LocalPose {
  const pitch = (cam.pitch * Math.PI) / 180
  const bearing = (cam.bearing * Math.PI) / 180
  const halfFov = ((cam.fov * Math.PI) / 180) / 2
  const cameraToCenter = (0.5 / Math.tan(halfFov)) * viewportHeight
  const circ = EARTH_CIRCUMFERENCE * Math.cos((cam.lat * Math.PI) / 180)
  const worldSize = TILE_SIZE * 2 ** cam.zoom
  const range = (cameraToCenter / worldSize) * circ
  const altitude = Math.cos(pitch) * range
  const groundDist = Math.sin(pitch) * range
  const [gx, gz] = lngLatToLocal(cam.lng, cam.lat, centerLng, centerLat)
  return {
    x: gx - Math.sin(bearing) * groundDist,
    y: altitude,
    z: gz + Math.cos(bearing) * groundDist,
    lookX: gx,
    lookY: 0,
    lookZ: gz,
    fov: cam.fov,
  }
}

/**
 * 实景下降的整段机位。u=0 还在地球上方，u=1 正好是环绕开始时的斜俯视。
 * 视场在中途略拉开，落到 42°，和 three.js 城市镜头一致。
 */
export function photorealFlightPose(
  city: { id: string; lng: number; lat: number },
  u: number,
  viewportHeight: number,
  focus: Focus,
): GlobeCam {
  const e = clamp01(u)
  const end = localToGlobe(city.lng, city.lat, orbitPose(city.id, 0, 0, 0, focus), viewportHeight)
  const dive = e ** 2.15
  const aim = e ** 1.35
  return {
    lng: lerp(city.lng, end.lng, aim),
    lat: lerp(city.lat, end.lat, aim),
    zoom: lerp(1.15, end.zoom, dive),
    pitch: lerp(0, end.pitch, aim),
    bearing: lerpAngle(-24, end.bearing, aim),
    fov: lerp(36.87, end.fov, e) + Math.sin(e * Math.PI) * 9,
  }
}

/** 实景从地图淡入的进度。0.7 之后地图已经完全让开，灰楼挤出体不会再入画。 */
export function photorealBlend(u: number) {
  const t = (clamp01(u) - 0.46) / (0.7 - 0.46)
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/** 从这个进度开始更新瓦片，下降段就能预加载，不必等到硬切。 */
export const PHOTOREAL_STREAM_U = 0.34

export function stageHeight() {
  const stage = document.getElementById('stage')
  return Math.max(1, stage?.clientHeight || window.innerHeight)
}
