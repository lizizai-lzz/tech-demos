import type { CityData, Vec2 } from './types'
import { pointInRing } from './geo'

/** 黄浦江：陆家嘴西侧，局部米制 XZ（东为正 X，南为正 Z） */
export const HUANGPU_XZ: Vec2[] = [
  [-1550, -2300],
  [-680, -2100],
  [-600, 2300],
  [-1600, 2500],
]

export function waterRingsXZ(data: CityData): Vec2[][] {
  const rings = data.water.map((w) => w.ring)
  if (data.id === 'shanghai-lujiazui') rings.push(HUANGPU_XZ)
  return rings
}

export function onWater(x: number, z: number, rings: Vec2[][]) {
  return rings.some((ring) => ring.length >= 3 && pointInRing(x, z, ring))
}
