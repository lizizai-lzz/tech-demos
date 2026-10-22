import { describe, expect, test } from 'bun:test'
import { LANDMARKS, findLandmark } from './landmarks'

function near(lng: number, lat: number, expectLng: number, expectLat: number, km: number) {
  const dx = (lng - expectLng) * 111.32 * Math.cos((expectLat * Math.PI) / 180)
  const dy = (lat - expectLat) * 111.32
  expect(Math.hypot(dx, dy)).toBeLessThan(km)
}

describe('预设城市', () => {
  test('大约 40 座，id 不重复，坐标落在地球上', () => {
    expect(LANDMARKS.length).toBeGreaterThanOrEqual(40)
    expect(new Set(LANDMARKS.map((city) => city.id)).size).toBe(LANDMARKS.length)
    for (const city of LANDMARKS) {
      expect(city.lat).toBeGreaterThan(-60)
      expect(city.lat).toBeLessThan(70)
      expect(city.lng).toBeGreaterThan(-180)
      expect(city.lng).toBeLessThan(180)
    }
  })

  test('点名的城市在正确的地标附近', () => {
    const spot = (id: string, lng: number, lat: number) => {
      const city = findLandmark(id)
      expect(city).toBeTruthy()
      near(city!.lng, city!.lat, lng, lat, 1.5)
    }
    spot('tokyo-shinjuku', 139.7004, 35.6896)
    spot('tokyo-shibuya', 139.7006, 35.6595)
    spot('osaka-umeda', 135.4959, 34.7025)
    spot('kyoto-station', 135.7588, 34.9858)
    spot('hongkong-central', 114.158, 22.281)
    spot('taipei-101', 121.5645, 25.0339)
    spot('seoul-city-hall', 126.978, 37.5663)
    spot('singapore-marina-bay', 103.86, 1.283)
    spot('bangkok-sathorn', 100.529, 13.723)
    spot('sydney-opera', 151.2153, -33.8568)
    spot('dubai-burj', 55.2744, 25.1972)
    spot('cairo-pyramids', 31.1342, 29.9792)
    spot('cape-town', 18.4241, -33.9249)
    spot('nyc-midtown', -73.981, 40.754)
    spot('nyc-downtown', -74.0134, 40.7127)
    spot('chicago-loop', -87.6359, 41.8789)
    spot('san-francisco', -122.399, 37.793)
    spot('los-angeles', -118.254, 34.05)
    spot('las-vegas', -115.173, 36.114)
    spot('seattle-downtown', -122.332, 47.606)
    spot('toronto-downtown', -79.387, 43.643)
    spot('mexico-city', -99.168, 19.427)
    spot('rio-copacabana', -43.182, -22.971)
    spot('london-westminster', -0.12, 51.503)
    spot('paris-eiffel', 2.2945, 48.8584)
    spot('rome-colosseum', 12.4922, 41.8902)
    spot('barcelona-sagrada', 2.1744, 41.4036)
    spot('madrid-gran-via', -3.703, 40.42)
    spot('berlin-alex', 13.409, 52.521)
    spot('amsterdam-canals', 4.893, 52.373)
    spot('prague-old-town', 14.421, 50.087)
    spot('vienna-stephansdom', 16.373, 48.208)
    spot('venice-san-marco', 12.338, 45.434)
    spot('istanbul-sultanahmet', 28.98, 41.009)
    expect(findLandmark('shanghai-lujiazui')?.procedural).toBe(true)
    expect(findLandmark('beijing-cbd')?.procedural).toBe(true)
  })
})
