import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fetchOverpass, processOsmElements } from '../src/lib/osm-fetch'
import { LANDMARKS } from '../src/lib/landmarks'
import { sampleTerrainNode } from './terrain-node'
import type { CityData } from '../src/lib/types'

const outDir = path.join(import.meta.dir, '../public/data')

async function bakeOneEfficient(lm: (typeof LANDMARKS)[0]) {
  console.log(`烘焙 ${lm.nameZh} (${lm.id})…`)
  const elements = await fetchOverpass(lm.lng, lm.lat, lm.extentM / 2)
  const base = processOsmElements(elements, {
    id: lm.id,
    nameEn: lm.nameEn,
    nameZh: lm.nameZh,
    subtitle: lm.subtitle,
    lng: lm.lng,
    lat: lm.lat,
    extentM: lm.extentM,
  })
  const terrain = await sampleTerrainNode(lm.lng, lm.lat, lm.extentM, base.gridSize)
  const final: CityData = {
    ...base,
    terrainHeights: terrain.heights,
    minTerrain: terrain.min,
    maxTerrain: terrain.max,
  }
  await mkdir(outDir, { recursive: true })
  const file = path.join(outDir, `${lm.id}.json`)
  await writeFile(file, JSON.stringify(final))
  console.log(
    `已写入 ${file}（建筑 ${final.buildings.length}，树 ${final.trees.length}，水面 ${final.water.length}）`,
  )
}

const args = process.argv.slice(2)
const all = args.includes('--all')
const ids = args.filter((a) => !a.startsWith('--'))

const targets = all
  ? LANDMARKS
  : ids.length
    ? LANDMARKS.filter((l) => ids.includes(l.id))
    : [LANDMARKS.find((l) => l.id === 'tokyo-shinjuku')!]

for (const lm of targets) {
  await bakeOneEfficient(lm)
}
