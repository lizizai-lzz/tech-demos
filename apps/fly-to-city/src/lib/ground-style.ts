import type { StyleSpecification } from 'maplibre-gl'

/**
 * 城市地面：卫星底图压在下面，矢量把路、水、公园画清楚。
 * 不要标注、POI、图标，也不要 MapLibre 自己的建筑。
 * 卫星是 EOX Sentinel-2 cloudless 2020（CC BY 4.0）。2016 图层已从 WMTS 下线。
 */
const ASPHALT = '#2c323a'
const SIDEWALK = '#e7e0d4'
const LANE = '#f4f1ea'
const PARK = '#2f9a4e'
const WOOD = '#227a3d'
const WATER = '#1f74c4'
const SHORE = '#d5f0ea'
const PLAZA = '#d2cbc0'
const RAIL = '#6b5344'
const PATH = '#cfc6b8'

function width(at14: number, at16: number) {
  return ['interpolate', ['linear'], ['zoom'], 14, at14, 16, at16]
}

function roads(classes: string[]) {
  return ['all', ['!=', ['get', 'brunnel'], 'tunnel'], ['match', ['get', 'class'], classes, true, false]]
}

export function groundStyle(): StyleSpecification {
  const style = {
    version: 8,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
      },
      satellite: {
        type: 'raster',
        tiles: [
          'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
        ],
        tileSize: 256,
        maxzoom: 14,
        attribution:
          'Sentinel-2 cloudless by EOX (CC BY 4.0), contains modified Copernicus Sentinel data',
      },
    },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': '#c4bfb4' } },
      {
        id: 'satellite',
        type: 'raster',
        source: 'satellite',
        paint: {
          'raster-opacity': 0.78,
          'raster-saturation': -0.12,
          'raster-contrast': 0.06,
        },
      },
      {
        id: 'landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['match', ['get', 'class'], ['grass', 'wood', 'farmland', 'crop'], true, false],
        paint: {
          'fill-color': ['match', ['get', 'class'], 'wood', WOOD, PARK],
          'fill-opacity': 0.84,
        },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': PARK, 'fill-opacity': 0.88 },
      },
      {
        id: 'landuse-green',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: [
          'match',
          ['get', 'class'],
          ['park', 'cemetery', 'pitch', 'grass', 'garden', 'stadium', 'playground'],
          true,
          false,
        ],
        paint: { 'fill-color': PARK, 'fill-opacity': 0.9 },
      },
      {
        id: 'plaza',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: ['match', ['get', 'class'], ['commercial', 'retail', 'industrial', 'pedestrian'], true, false],
        paint: { 'fill-color': PLAZA, 'fill-opacity': 0.72 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'fill-color': WATER, 'fill-outline-color': SHORE },
      },
      {
        id: 'waterway-river',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        filter: [
          'all',
          ['!=', ['get', 'brunnel'], 'tunnel'],
          ['match', ['get', 'class'], ['river', 'canal'], true, false],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': WATER, 'line-width': width(12, 34) },
      },
      {
        id: 'waterway-stream',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        filter: [
          'all',
          ['!=', ['get', 'brunnel'], 'tunnel'],
          ['match', ['get', 'class'], ['stream', 'ditch', 'drain'], true, false],
        ],
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': WATER, 'line-width': width(3, 8) },
      },
      {
        id: 'rail',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['rail', 'transit']),
        paint: {
          'line-color': RAIL,
          'line-width': width(1.4, 3.2),
          'line-dasharray': [2, 1.4],
        },
      },
      {
        id: 'casing-service',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['service', 'track']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': SIDEWALK, 'line-width': width(4, 8) },
      },
      {
        id: 'casing-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['minor']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': SIDEWALK, 'line-width': width(8, 16) },
      },
      {
        id: 'casing-secondary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['secondary', 'tertiary']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': SIDEWALK, 'line-width': width(12, 24) },
      },
      {
        id: 'casing-primary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['primary']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': SIDEWALK, 'line-width': width(16, 34) },
      },
      {
        id: 'casing-motorway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['motorway', 'trunk']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': SIDEWALK, 'line-width': width(22, 46) },
      },
      {
        id: 'road-service',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['service', 'track']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ASPHALT, 'line-width': width(2.2, 4.6) },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['minor']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ASPHALT, 'line-width': width(5, 11) },
      },
      {
        id: 'road-secondary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['secondary', 'tertiary']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ASPHALT, 'line-width': width(8, 16) },
      },
      {
        id: 'road-primary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['primary']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ASPHALT, 'line-width': width(12, 24) },
      },
      {
        id: 'road-motorway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['motorway', 'trunk']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ASPHALT, 'line-width': width(16, 32) },
      },
      {
        id: 'lane-primary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['primary']),
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
        paint: {
          'line-color': LANE,
          'line-width': width(0.7, 1.5),
          'line-dasharray': [2.2, 1.6],
        },
      },
      {
        id: 'lane-motorway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['motorway', 'trunk']),
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
        paint: { 'line-color': LANE, 'line-width': width(0.9, 2.1) },
      },
      {
        id: 'path',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['path', 'pedestrian']),
        paint: {
          'line-color': PATH,
          'line-width': width(1.1, 2.4),
          'line-dasharray': [1.2, 0.8],
        },
      },
    ],
  }
  return style as StyleSpecification
}
