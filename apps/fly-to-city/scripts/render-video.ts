/**
 * 逐帧离线渲染：固定时钟 seek + 页面截图 + ffmpeg。
 * 先 `bun run dev`，再：
 *   bun run render:16x9     1920×1080 30fps 42s（本机 GPU）
 *   bun run render:9x16     1080×1920 30fps 24s
 *   bun run render:preview  1280×720 24fps 15s，阴影 2048，只含地球→陆家嘴
 * 地球段是第一人称冲刺（速度线、云、视场），进城后按贴面进度收进定稿机位。
 * 无 GPU 时加 SWIFTSHADER=1。浏览器路径可用 CHROME_PATH。
 * 署名默认不画。公开发布的成片加上 `--attribution`。
 */
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

type Profile = {
  id: string
  width: number
  height: number
  fps: number
  duration: number
  shadow: number
  timeline: 'full' | 'lujiazui'
  frames?: number
  /** 从这一帧开始写序列，给短预览用 */
  start?: number
  videoName: string | null
  /** 同一机位各存一张白模和一张贴面 */
  compareFacade?: boolean
  shots: Record<string, number>
}

const arg = process.argv.find((a) => ['16:9', '9:16', 'preview', 'still-9x16', 'stills', 'reveal'].includes(a)) ?? '16:9'
const showAttribution = process.argv.includes('--attribution')

const profiles: Record<string, Profile> = {
  '16:9': {
    id: '16:9',
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 42,
    shadow: 4096,
    timeline: 'full',
    videoName: 'fly-to-city-16x9.mp4',
    shots: {
      'globe-midflight': Math.round(4.2 * 30),
      'lujiazui-orbit': Math.round(16 * 30),
      'shinjuku-orbit': Math.round(36 * 30),
    },
  },
  '9:16': {
    id: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 24,
    shadow: 4096,
    timeline: 'full',
    videoName: 'fly-to-city-9x16.mp4',
    shots: { 'frame-9x16': Math.round(10 * 30) },
  },
  preview: {
    id: 'preview',
    width: 1280,
    height: 720,
    fps: 24,
    duration: 15,
    shadow: 2048,
    timeline: 'lujiazui',
    videoName: 'fly-to-city-preview.mp4',
    shots: {
      'globe-midflight': Math.round(3 * 24),
      'lujiazui-orbit': Math.round(11 * 24),
    },
  },
  'still-9x16': {
    id: 'still-9x16',
    width: 1080,
    height: 1920,
    fps: 24,
    duration: 15,
    shadow: 2048,
    timeline: 'lujiazui',
    frames: 1,
    videoName: null,
    shots: { 'frame-9x16': Math.round(12 * 24) },
  },
  stills: {
    id: 'stills',
    width: 1280,
    height: 720,
    fps: 24,
    duration: 42,
    shadow: 2048,
    timeline: 'full',
    frames: 1,
    videoName: null,
    compareFacade: true,
    shots: {
      'lujiazui-orbit': Math.round(16 * 24),
      'shinjuku-orbit': Math.round(36 * 24),
    },
  },
  reveal: {
    id: 'reveal',
    width: 1280,
    height: 720,
    fps: 12,
    duration: 15,
    shadow: 2048,
    timeline: 'lujiazui',
    start: Math.round(15 * 0.45 * 12),
    frames: 48,
    videoName: 'fly-to-city-reveal.mp4',
    shots: {},
  },
}

const profile = profiles[arg]
const outRoot = process.env.RENDER_OUT ?? '/opt/cursor/artifacts'
const shotDir = path.join(outRoot, 'screenshots')
const frameDir = path.join('/tmp', `fly-frames-${profile.id.replace(':', '')}`)
const frames =
  profile.frames ??
  Number(process.env.MAX_FRAMES ?? profile.duration * profile.fps)

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter((p): p is string => !!p && existsSync(p))

const executablePath = chromeCandidates[0]
if (!executablePath) throw new Error('找不到 Chrome，请设置 CHROME_PATH')

const swift = process.env.SWIFTSHADER === '1'
const args = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  `--window-size=${profile.width},${profile.height}`,
]
if (swift) {
  args.push('--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader')
}

await mkdir(frameDir, { recursive: true })
await mkdir(shotDir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args,
  defaultViewport: { width: profile.width, height: profile.height, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(240000)
const facadeFlag = process.env.FACADE === '0' || process.env.FACADE === '1' ? `&facade=${process.env.FACADE}` : ''
const attributionFlag = showAttribution ? '&attribution=1' : ''
const url =
  `http://localhost:5173/?render=1&fps=${profile.fps}&duration=${profile.duration}` +
  `&shadow=${profile.shadow}&timeline=${profile.timeline}${facadeFlag}${attributionFlag}`
console.log('打开', url, swift ? '(SwiftShader)' : '(GPU)')
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__flyReady === true, { timeout: 360000 })
console.log('场景就绪，开始', frames, '帧', profile.width + 'x' + profile.height)

const start = profile.start ?? 0
const only = profile.frames === 1 || process.env.ONLY_SHOTS === '1' ? Object.values(profile.shots) : null
const indexes = only ?? Array.from({ length: frames }, (_, i) => start + i)

for (const i of indexes) {
  await page.evaluate(async (frame) => {
    await window.__seek?.(frame)
  }, i)
  const stage = await page.$('#stage')
  if (!stage) throw new Error('缺少 #stage')
  if (!only) {
    const file = path.join(frameDir, `f-${String(i).padStart(5, '0')}.jpg`)
    await stage.screenshot({ path: file, type: 'jpeg', quality: 86 })
  }
  for (const [name, at] of Object.entries(profile.shots)) {
    if (i !== at) continue
    if (profile.compareFacade) {
      await page.evaluate(async () => {
        await window.__setFacade?.(0)
      })
      const white = path.join(shotDir, `${name}-white.png`)
      await stage.screenshot({ path: white, type: 'png' })
      await page.evaluate(async () => {
        await window.__setFacade?.(1)
      })
      const facade = path.join(shotDir, `${name}-facade.png`)
      await stage.screenshot({ path: facade, type: 'png' })
      console.log('截图', white, facade)
    } else {
      const png = path.join(shotDir, `${name}.png`)
      await stage.screenshot({ path: png, type: 'png' })
      console.log('截图', png)
    }
  }
  if (i % profile.fps === 0) console.log(`${profile.id} ${i}/${frames}`)
}

await browser.close()

if (!profile.videoName || process.env.ONLY_SHOTS === '1') {
  console.log('完成静帧')
  process.exit(0)
}

const videoPath = path.join(outRoot, profile.videoName)
const ffmpeg =
  `ffmpeg -y -framerate ${profile.fps} -start_number ${start} -i ${frameDir}/f-%05d.jpg` +
  ` -frames:v ${indexes.length} -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart ${videoPath}`
console.log(ffmpeg)
const proc = Bun.spawn(['bash', '-lc', ffmpeg], { stdout: 'inherit', stderr: 'inherit' })
const code = await proc.exited
if (code !== 0) throw new Error(`ffmpeg 失败 ${code}`)
console.log('完成', videoPath)
