import type { StyleSpecification } from 'maplibre-gl'

/**
 * 白模地面：只要土地、公园、水和道路。
 * 不要标注、POI、图标，也不要 MapLibre 自己的建筑（建筑只来自 three.js）。
 */
const LAND = '#e6e1d8'
const PARK = '#d5ead0'
const WOOD = '#c9e0c2'
const WATER = '#bfe0f0'
const ROAD = '#ffffff'
const CASING = '#c8c0b4'
const RAIL = '#b7b2aa'

function width(at13: number, at16: number) {
  return ['interpolate', ['linear'], ['zoom'], 13, at13, 16, at16]
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
    },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': LAND } },
      {
        id: 'landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['match', ['get', 'class'], ['grass', 'wood', 'farmland', 'crop'], true, false],
        paint: {
          'fill-color': ['match', ['get', 'class'], 'wood', WOOD, PARK],
          'fill-opacity': 0.9,
        },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': PARK },
      },
      {
        id: 'landuse-green',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: ['match', ['get', 'class'], ['park', 'cemetery', 'pitch', 'grass'], true, false],
        paint: { 'fill-color': PARK, 'fill-opacity': 0.85 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'fill-color': WATER },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': WATER,
          'line-width': width(1.2, 5),
        },
      },
      {
        id: 'rail',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['rail', 'transit']),
        paint: { 'line-color': RAIL, 'line-width': width(0.8, 1.6) },
      },
      {
        id: 'casing-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['minor', 'service', 'track']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': CASING, 'line-width': width(2.2, 4.2) },
      },
      {
        id: 'casing-secondary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['secondary', 'tertiary']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': CASING, 'line-width': width(3.2, 6.4) },
      },
      {
        id: 'casing-primary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['primary', 'trunk']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': CASING, 'line-width': width(4.2, 8.6) },
      },
      {
        id: 'casing-motorway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['motorway']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': CASING, 'line-width': width(5.2, 11) },
      },
      {
        id: 'road-service',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['service', 'track']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROAD, 'line-width': width(1.1, 2.2) },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['minor']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROAD, 'line-width': width(1.5, 3) },
      },
      {
        id: 'road-secondary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['secondary', 'tertiary']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROAD, 'line-width': width(2.1, 4.4) },
      },
      {
        id: 'road-primary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['primary', 'trunk']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROAD, 'line-width': width(2.8, 6.2) },
      },
      {
        id: 'road-motorway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['motorway']),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROAD, 'line-width': width(3.6, 8) },
      },
      {
        id: 'path',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: roads(['path', 'pedestrian']),
        paint: {
          'line-color': ROAD,
          'line-width': width(0.6, 1.2),
          'line-dasharray': [1.2, 0.9],
        },
      },
    ],
  }
  return style as StyleSpecification
}
