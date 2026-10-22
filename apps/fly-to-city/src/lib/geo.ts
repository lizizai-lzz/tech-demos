import type { Vec2 } from './types'

const METERS_PER_DEG_LAT = 111_320

export function metersPerDegLng(lat: number) {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180)
}

/** 经纬度 → 以中心为原点的局部米制坐标（X 东、Z 北取反以匹配 three.js） */
export function lngLatToLocal(
  lng: number,
  lat: number,
  centerLng: number,
  centerLat: number,
): Vec2 {
  const x = (lng - centerLng) * metersPerDegLng(centerLat)
  const z = -(lat - centerLat) * METERS_PER_DEG_LAT
  return [x, z]
}

export function localToLngLat(
  x: number,
  z: number,
  centerLng: number,
  centerLat: number,
): { lng: number; lat: number } {
  const lng = centerLng + x / metersPerDegLng(centerLat)
  const lat = centerLat - z / METERS_PER_DEG_LAT
  return { lng, lat }
}

export function bboxAround(
  lng: number,
  lat: number,
  radiusM: number,
): { south: number; west: number; north: number; east: number } {
  const dLat = radiusM / METERS_PER_DEG_LAT
  const dLng = radiusM / metersPerDegLng(lat)
  return {
    south: lat - dLat,
    west: lng - dLng,
    north: lat + dLat,
    east: lng + dLng,
  }
}

export function ringArea(ring: Vec2[]): number {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    a += ring[i][0] * ring[j][1] - ring[j][0] * ring[i][1]
  }
  return Math.abs(a) / 2
}

export function pointInRing(px: number, pz: number, ring: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const zi = ring[i][1]
    const xj = ring[j][0]
    const zj = ring[j][1]
    const intersect =
      zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi
    if (intersect) inside = !inside
  }
  return inside
}
