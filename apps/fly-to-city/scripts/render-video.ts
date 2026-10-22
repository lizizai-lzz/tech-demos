/**
 * 逐帧离线渲染：固定时钟 seek + 页面截图 + ffmpeg。
 * 先 `bun run dev`，再：
 *   bun run render:16x9     1920×1080 30fps 42s（本机 GPU）
 *   bun run render:9x16     1080×1920 30fps 24s
 *   bun run render:preview  1280×720 24fps 15s，阴影 2048，只含地球→陆家嘴
 * 无 GPU 时加 SWIFTSHADER=1。浏览器路径可用 CHROME_PATH。
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
  videoName: string | null
  shots: Record<string, number>
}

const arg = process.argv.find((a) => ['16:9', '9:16', 'preview', 'still-9x16'].includes(a)) ?? '16:9'

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
    shots: { 'frame-9x16': Math.round(10 * 24) },
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
const url =
  `http://localhost:5173/?render=1&fps=${profile.fps}&duration=${profile.duration}` +
  `&shadow=${profile.shadow}&timeline=${profile.timeline}`
console.log('打开', url, swift ? '(SwiftShader)' : '(GPU)')
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__flyReady === true, { timeout: 240000 })
console.log('场景就绪，开始', frames, '帧', profile.width + 'x' + profile.height)

const only = profile.frames === 1 ? Object.values(profile.shots) : null
const indexes = only ?? Array.from({ length: frames }, (_, i) => i)

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
    if (i === at) {
      const png = path.join(shotDir, `${name}.png`)
      await stage.screenshot({ path: png, type: 'png' })
      console.log('截图', png)
    }
  }
  if (i % profile.fps === 0) console.log(`${profile.id} ${i}/${frames}`)
}

await browser.close()

if (!profile.videoName) {
  console.log('完成静帧')
  process.exit(0)
}

const videoPath = path.join(outRoot, profile.videoName)
const ffmpeg = `ffmpeg -y -framerate ${profile.fps} -i ${frameDir}/f-%05d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart ${videoPath}`
console.log(ffmpeg)
const proc = Bun.spawn(['bash', '-lc', ffmpeg], { stdout: 'inherit', stderr: 'inherit' })
const code = await proc.exited
if (code !== 0) throw new Error(`ffmpeg 失败 ${code}`)
console.log('完成', videoPath)
