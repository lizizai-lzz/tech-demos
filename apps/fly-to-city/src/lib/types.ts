export type Vec2 = [number, number]

export type BuildingFootprint = {
  id: string
  ring: Vec2[]
  height: number
  levels: number
}

export type WaterPolygon = {
  id: string
  ring: Vec2[]
}

export type CityData = {
  id: string
  nameEn: string
  nameZh: string
  subtitle: string
  center: { lng: number; lat: number }
  extentM: number
  gridSize: number
  terrainHeights: number[]
  minTerrain: number
  maxTerrain: number
  buildings: BuildingFootprint[]
  trees: Vec2[]
  water: WaterPolygon[]
  bakedAt: string
}

export type GeocodeResult = {
  label: string
  lng: number
  lat: number
}

export type AppPhase = 'globe' | 'transition' | 'diorama'

export type AspectRatio = '16:9' | '9:16'

export type RecordingStage =
  | 'idle'
  | 'fly-in'
  | 'transition'
  | 'orbit'
  | 'section'
  | 'hold'
