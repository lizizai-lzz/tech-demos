/**
 * 一个页面会话里拍实景：地球冲进新宿（约 15 秒 720p），再定格新宿和香港。
 * 先在另一个终端运行 bun run dev。
 * 令牌写在 .env.local 的 VITE_CESIUM_ION_TOKEN，也可以临时放在同名环境变量里。
 * 不要把令牌写进地址栏或提交到仓库。根瓦片请求超过 5 次会中止。
 */
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { readEnvLocal } from './read-env-local.ts'
import { frameColorSpread, frameIsFlat } from '../src/lib/frame-paint.ts'
import { findLandmark } from '../src/lib/landmarks.ts'
import { parseRoam } from '../src/lib/view-pose.ts'

function argValue(name: string) {
  const eq = process.argv.find((item) => item.startsWith(`--${name}=`))
  if (eq) return eq.slice(name.length + 3)
  const index = process.argv.indexOf(`--${name}`)
  const next = index >= 0 ? process.argv[index + 1] : ''
  if (next && !next.startsWith('--')) return next
  return ''
}

const cityArg = argValue('city')
const roamArg = argValue('roam')
if (cityArg && !findLandmark(cityArg)) {
  console.error(`没有这个预设：${cityArg}。城市 id 写在 README 的预设列表里。`)
  process.exit(1)
}
const roam = roamArg ? parseRoam(roamArg) : 'flyover'
if (!roam) {
  console.error('漫游模式只能是 flyover、orbit、tour 或 rise。')
  process.exit(1)
}

const appDir = path.join(import.meta.dir, '..')
const fromFile = readEnvLocal(appDir).VITE_CESIUM_ION_TOKEN?.trim() ?? ''
const token = fromFile || process.env.VITE_CESIUM_ION_TOKEN?.trim() || ''
if (!token) {
  console.error(
    '没有找到 Cesium ion 令牌。请在 apps/fly-to-city/.env.local 写入 VITE_CESIUM_ION_TOKEN=你的令牌，然后重新运行 bun run shoot:photoreal。',
  )
  process.exit(1)
}

const ping = await fetch('http://127.0.0.1:5173/').catch(() => null)
if (!ping?.ok) {
  console.error('开发服务器没有开。请先在 apps/fly-to-city 运行 bun run dev，再运行 bun run shoot:photoreal。')
  process.exit(1)
}

const width = 1280
const height = 720
const fps = 24
const duration = 15
const frames = duration * fps
const outRoot = process.env.RENDER_OUT ?? path.join(appDir, 'photoreal-out')
const frameDir = path.join(outRoot, 'frames')
await mkdir(frameDir, { recursive: true })

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter((item): item is string => !!item && existsSync(item))
const executablePath = chromeCandidates[0]
if (!executablePath) {
  console.error('找不到 Chrome，请设置 CHROME_PATH')
  process.exit(1)
}

const swift = process.env.SWIFTSHADER === '1'
const args = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  `--window-size=${width},${height}`,
]
if (swift) args.push('--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader')

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args,
  defaultViewport: { width, height, deviceScaleFactor: 1 },
})

async function rootLoads(page: import('puppeteer-core').Page) {
  return page.evaluate(() => window.__photorealRootLoads ?? 0)
}

/** 读城市画布中下部。WebGL 的 y 从下往上，这块区域应该是楼，不是天空，也不包括 HTML 标题。 */
async function readCitySamples(page: import('puppeteer-core').Page) {
  return page.evaluate(() => {
    const canvases = [...document.querySelectorAll('#stage canvas')] as HTMLCanvasElement[]
    const canvas = canvases
      .filter((item) => item.width > 2 && item.height > 2 && !item.classList.contains('maplibregl-canvas'))
      .sort((a, b) => b.width * b.height - a.width * a.height)[0]
    if (!canvas) return null
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return null
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    const cols = 20
    const rows = 12
    const buf = new Uint8Array(4)
    const rgb: number[] = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = Math.min(canvas.width - 1, Math.floor((0.15 + (0.7 * col) / (cols - 1)) * canvas.width))
        const y = Math.min(canvas.height - 1, Math.floor((0.08 + (0.54 * row) / (rows - 1)) * canvas.height))
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf)
        rgb.push(buf[0] ?? 0, buf[1] ?? 0, buf[2] ?? 0)
      }
    }
    return rgb
  })
}

async function assertCityPainted(page: import('puppeteer-core').Page, label: string) {
  const rgb = await readCitySamples(page)
  const flags = await page.evaluate(() => ({
    visible: window.__photorealVisible === true,
    onScreen: window.__photorealOnScreen === true,
  }))
  if (!rgb) throw new Error(`${label}：没有读到城市画布，不能把这一帧当成实景。`)
  const spread = frameColorSpread(rgb)
  const flat = frameIsFlat(rgb)
  console.log(
    label,
    flat ? `画面是纯色，跨度 ${spread}` : `画面有内容，跨度 ${spread}`,
    flags.onScreen ? '网格在镜头里' : '网格不在镜头里',
  )
  if (flat || !flags.visible) {
    throw new Error(
      flat
        ? `${label}：画面是一片纯色（通道跨度 ${spread}）。瓦片列表不能当成已经看见。`
        : `${label}：实景网格没有进入镜头。`,
    )
  }
}

try {
  const pages = await browser.pages()
  const page = pages[0] ?? (await browser.newPage())
  page.setDefaultTimeout(240000)
  await page.evaluateOnNewDocument((value: string) => {
    window.__CESIUM_ION_TOKEN = value
  }, token)
  const attributionFlag = process.argv.includes('--attribution') ? '&attribution=1' : ''
  const cityFlag = cityArg ? `&city=${encodeURIComponent(cityArg)}` : ''
  const url =
    'http://127.0.0.1:5173/?render=1&photoreal=1&shoot=1&fps=24&duration=15&shadow=2048&timeline=shinjuku' +
    `&roam=${roam}${cityFlag}${attributionFlag}`
  console.log('打开实景拍摄页', swift ? '(SwiftShader)' : '(GPU)', '令牌已注入，不打印内容')
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__flyReady === true, { timeout: 360000 })
  await page.evaluate(async () => {
    await window.__preloadPhotoreal?.()
  })
  await page
    .waitForFunction(() => window.__photorealReady === true, { timeout: 50000 })
    .catch(() => console.log('下降段预加载超时，继续逐帧拍摄'))
  console.log('场景就绪。本次使用 1 个页面，开始', frames, '帧')

  for (let i = 0; i < frames; i++) {
    await page.evaluate(async (frame) => {
      await window.__seek?.(frame)
    }, i)
    await page
      .waitForFunction(() => window.__photorealReady === true, { timeout: 50000 })
      .catch(() => console.log('第', i, '帧实景等待超时'))
    const stage = await page.$('#stage')
    if (!stage) throw new Error('缺少 #stage')
    const file = path.join(frameDir, `f-${String(i).padStart(5, '0')}.jpg`)
    await stage.screenshot({ path: file, type: 'jpeg', quality: 86 })
    if (i === frames - 1 || i === Math.round(frames * 0.8)) {
      await assertCityPainted(page, `第 ${i} 帧`)
    }
    if (i === Math.round(3 * fps)) {
      const mid = path.join(outRoot, 'globe-midflight.png')
      await stage.screenshot({ path: mid, type: 'png' })
      console.log('截图', mid)
    }
    if (i % fps === 0) {
      const loads = await rootLoads(page)
      console.log(`新宿预览 ${i}/${frames}，根瓦片请求 ${loads} 次`)
      if (loads > 5) throw new Error(`根瓦片已请求 ${loads} 次，停止以免超出额度`)
    }
  }

  const videoPath = path.join(outRoot, 'shinjuku-preview.mp4')
  const ffmpeg =
    `ffmpeg -y -framerate ${fps} -i ${frameDir}/f-%05d.jpg` +
    ` -frames:v ${frames} -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart ${videoPath}`
  const proc = Bun.spawn(['bash', '-lc', ffmpeg], { stdout: 'inherit', stderr: 'inherit' })
  const code = await proc.exited
  if (code !== 0) throw new Error(`ffmpeg 失败 ${code}`)
  console.log('预览', videoPath)

  const stage = await page.$('#stage')
  if (!stage) throw new Error('缺少 #stage')
  const stills: [string, string][] = cityArg
    ? [[cityArg, `${cityArg}.png`]]
    : [
        ['tokyo-shinjuku', 'shinjuku.png'],
        ['hongkong-central', 'hongkong.png'],
      ]
  for (const [id, name] of stills) {
    await page.evaluate(async (cityId) => {
      await window.__showCity?.(cityId)
    }, id)
    await page
      .waitForFunction(() => window.__photorealReady === true, { timeout: 50000 })
      .catch(() => console.log(name, '实景等待超时'))
    const png = path.join(outRoot, name)
    await stage.screenshot({ path: png, type: 'png' })
    console.log('截图', png)
    await assertCityPainted(page, name)
  }

  const loads = await rootLoads(page)
  console.log('根瓦片请求次数', loads, '（上限 5）')
  if (loads > 5) throw new Error(`根瓦片请求 ${loads} 次，超过 5 次上限`)
  if (loads < 1) throw new Error('没有请求到根瓦片。请检查令牌、localhost 限制和网络。')
  console.log('完成', outRoot)
} finally {
  await browser.close()
}
