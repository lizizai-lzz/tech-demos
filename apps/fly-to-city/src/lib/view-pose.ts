import { lngLatToLocal, localToLngLat } from './geo'
import { findLandmark, type TourStop } from './landmarks'

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

export type RoamMode = 'flyover' | 'orbit' | 'tour' | 'rise'

export const ROAM_MODES: RoamMode[] = ['flyover', 'orbit', 'tour', 'rise']

export function parseRoam(value: string | null | undefined): RoamMode | null {
  if (value === 'flyover' || value === 'orbit' || value === 'tour' || value === 'rise') return value
  return null
}

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

type Tune = {
  bearing0: number
  lookEast: number
  lookNorth: number
  closeness: number
  lookHero: boolean
  tour: TourStop[]
}

function tuneOf(cityId: string): Tune {
  const city = findLandmark(cityId)
  return {
    bearing0: city?.bearing0 ?? 0.7,
    lookEast: city?.lookEast ?? 0,
    lookNorth: city?.lookNorth ?? 0,
    closeness: city?.closeness ?? 1,
    lookHero: Boolean(city?.lookHero),
    tour: city?.tour ?? [],
  }
}

function homeLook(tune: Tune, focus: Focus) {
  if (tune.lookHero) return { x: focus.x, z: focus.z }
  return { x: tune.lookEast, z: -tune.lookNorth }
}

/**
 * 定稿斜俯视。俯角始终是 atan(940/3168)，只改距离，不抬头。
 * 新宿看西口楼群，并且更近。陆家嘴看向地标重心，从黄浦西岸看过去。
 */
export function orbitPose(cityId: string, orbit: number, push: number, arrive: number, focus: Focus): LocalPose {
  const tune = tuneOf(cityId)
  const settled = clamp01(arrive)
  const settle = 0.75 + (1 - settled) * 0.5
  const scale = (settle / 0.75) * (0.75 - push * 0.1) * tune.closeness
  const horiz = 3168 * scale
  const lookY = 50
  const look = homeLook(tune, focus)
  const ang = tune.bearing0 + orbit * 1.15
  return {
    x: look.x + Math.sin(ang) * horiz,
    y: lookY + horiz * PITCH_TAN,
    z: look.z + Math.cos(ang) * horiz,
    lookX: look.x,
    lookY,
    lookZ: look.z,
    fov: 42,
  }
}

function loopUnit(u: number) {
  return u - Math.floor(u)
}

function smooth(t: number) {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/** 掠过、巡礼、升起在 u=0 时都等于环绕的落点，下降交接不会跳。 */
export function roamPose(cityId: string, mode: RoamMode, u: number, focus: Focus): LocalPose {
  const home = orbitPose(cityId, 0, 0, 1, focus)
  if (mode === 'orbit') return orbitPose(cityId, u, 0, 1, focus)
  if (mode === 'tour') return tourPose(cityId, home, loopUnit(u), focus)
  if (mode === 'rise') return risePose(home, loopUnit(u))
  return flyoverPose(home, loopUnit(u))
}

function flyoverPose(home: LocalPose, e: number): LocalPose {
  const ox = home.x - home.lookX
  const oz = home.z - home.lookZ
  const horiz = Math.hypot(ox, oz) || 1
  const fx = -ox / horiz
  const fz = -oz / horiz
  const rx = -fz
  const rz = fx
  const along = Math.sin(e * Math.PI * 2) * horiz * 0.34
  const cross = Math.sin(e * Math.PI * 4) * horiz * 0.1
  const lx = home.lookX + fx * along + rx * cross
  const lz = home.lookZ + fz * along + rz * cross
  return {
    x: lx + ox,
    y: home.y,
    z: lz + oz,
    lookX: lx,
    lookY: home.lookY,
    lookZ: lz,
    fov: home.fov,
  }
}

function tourPoints(cityId: string, home: LocalPose, focus: Focus) {
  const tune = tuneOf(cityId)
  const look = homeLook(tune, focus)
  const named = tune.tour.map((stop) => {
    const raw = { x: stop.east, z: -stop.north }
    const dx = raw.x - home.lookX
    const dz = raw.z - home.lookZ
    const dist = Math.hypot(dx, dz)
    if (dist <= 1100) return raw
    const scale = 1100 / dist
    return { x: home.lookX + dx * scale, z: home.lookZ + dz * scale }
  })
  const around =
    named.length >= 2
      ? named
      : [
          { x: look.x + 650, z: look.z - 180 },
          { x: look.x - 220, z: look.z + 720 },
          { x: look.x + 180, z: look.z - 680 },
        ]
  return [{ x: home.lookX, z: home.lookZ }, ...around]
}

function tourPose(cityId: string, home: LocalPose, e: number, focus: Focus): LocalPose {
  const points = tourPoints(cityId, home, focus)
  const n = points.length
  const scaled = e * n
  const i = Math.min(n - 1, Math.floor(scaled))
  const f = smooth(scaled - i)
  const a = points[i % n]
  const b = points[(i + 1) % n]
  const lookX = lerp(a.x, b.x, f)
  const lookZ = lerp(a.z, b.z, f)
  const ox = home.x - home.lookX
  const oz = home.z - home.lookZ
  return {
    x: lookX + ox,
    y: home.y,
    z: lookZ + oz,
    lookX,
    lookY: home.lookY,
    lookZ,
    fov: home.fov,
  }
}

function riseScale(e: number) {
  if (e < 0.34) return lerp(1, 0.48, smooth(e / 0.34))
  if (e < 0.78) return lerp(0.48, 1.45, smooth((e - 0.34) / 0.44))
  return lerp(1.45, 1, smooth((e - 0.78) / 0.22))
}

function risePose(home: LocalPose, e: number): LocalPose {
  const ox = home.x - home.lookX
  const oz = home.z - home.lookZ
  const horiz = Math.hypot(ox, oz) || 1
  const pull = Math.max(riseScale(e), 780 / horiz)
  return {
    x: home.lookX + ox * pull,
    y: home.lookY + horiz * pull * PITCH_TAN,
    z: home.lookZ + oz * pull,
    lookX: home.lookX,
    lookY: home.lookY,
    lookZ: home.lookZ,
    fov: home.fov,
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
