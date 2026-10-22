import { describe, expect, test } from 'bun:test'
import { landmarkById, globePose } from './render-timeline'
import { globeToLocal, localToGlobe, orbitPose, photorealBlend, photorealFlightPose, roamPose } from './view-pose'

const focus = { x: 12, y: 150, z: -40 }

describe('实景机位和地图机位', () => {
  test('程序化地球终点保持原来的 zoom、俯角和方位', () => {
    const pose = globePose(landmarkById('shanghai-lujiazui'), 1)
    expect(pose.zoom).toBeCloseTo(16.2, 5)
    expect(pose.pitch).toBeCloseTo(68, 5)
    expect(pose.bearing).toBeCloseTo(36, 5)
  })

  test('新宿更靠近西口，俯角和其他城市相同', () => {
    const tokyo = orbitPose('tokyo-shinjuku', 0.5, 0.5, 1, focus)
    const hongkong = orbitPose('hongkong-central', 0.5, 0.5, 1, focus)
    expect(tokyo.lookX).toBeLessThan(-500)
    const tokyoHoriz = Math.hypot(tokyo.x - tokyo.lookX, tokyo.z - tokyo.lookZ)
    const hkHoriz = Math.hypot(hongkong.x - hongkong.lookX, hongkong.z - hongkong.lookZ)
    expect(tokyoHoriz).toBeGreaterThan(700)
    expect(tokyoHoriz).toBeLessThan(1200)
    expect(hkHoriz).toBeGreaterThan(2000)
    expect((tokyo.y - tokyo.lookY) / tokyoHoriz).toBeCloseTo((hongkong.y - hongkong.lookY) / hkHoriz, 5)
    expect(tokyo.y).toBeGreaterThan(tokyo.lookY)
  })

  test('下降结束时机位和环绕起点是同一个镜头', () => {
    for (const id of ['tokyo-shinjuku', 'hongkong-central'] as const) {
      const city = landmarkById(id)
      for (const height of [720, 1080]) {
        const start = orbitPose(id, 0, 0, 0, focus)
        const flight = photorealFlightPose(city, 1, height, focus)
        const back = globeToLocal(city.lng, city.lat, flight, height)
        expect(back.x).toBeCloseTo(start.x, 0)
        expect(back.y).toBeCloseTo(start.y, 0)
        expect(back.z).toBeCloseTo(start.z, 0)
        expect(back.fov).toBeCloseTo(42, 5)
        const round = localToGlobe(city.lng, city.lat, start, height)
        const again = globeToLocal(city.lng, city.lat, round, height)
        expect(again.x).toBeCloseTo(start.x, 0)
        expect(again.y).toBeCloseTo(start.y, 0)
        expect(again.z).toBeCloseTo(start.z, 0)
      }
    }
  })

  test('淡入在靠近城市之前完成', () => {
    expect(photorealBlend(0.3)).toBe(0)
    expect(photorealBlend(0.7)).toBe(1)
    expect(photorealBlend(0.9)).toBe(1)
    const city = landmarkById('tokyo-shinjuku')
    expect(photorealFlightPose(city, 0.7, 720, focus).zoom).toBeLessThan(12)
  })

  test('四种漫游从落点出发，并且一直往下看', () => {
    const home = orbitPose('hongkong-central', 0, 0, 1, focus)
    for (const mode of ['flyover', 'orbit', 'tour', 'rise'] as const) {
      const start = roamPose('hongkong-central', mode, 0, focus)
      expect(start.x).toBeCloseTo(home.x, 4)
      expect(start.y).toBeCloseTo(home.y, 4)
      expect(start.z).toBeCloseTo(home.z, 4)
      for (const u of [0.2, 0.55, 0.9]) {
        const pose = roamPose('tokyo-shinjuku', mode, u, focus)
        const horiz = Math.hypot(pose.x - pose.lookX, pose.z - pose.lookZ)
        expect(pose.y).toBeGreaterThan(pose.lookY + 40)
        expect((pose.y - pose.lookY) / horiz).toBeCloseTo((home.y - home.lookY) / Math.hypot(home.x - home.lookX, home.z - home.lookZ), 4)
      }
    }
    const flown = roamPose('hongkong-central', 'flyover', 0.25, focus)
    expect(Math.hypot(flown.lookX - home.lookX, flown.lookZ - home.lookZ)).toBeGreaterThan(100)
  })
})
