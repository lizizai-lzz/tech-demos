/**
 * 逐帧离线渲染：固定时钟 seek + 页面截图 + ffmpeg。
 * 用法：先 `bun run dev`，再 `bun run render -- 16:9` 或 `9:16`
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const aspect = process.argv.includes('9:16') ? '9:16' : '16:9'
const width = aspect === '16:9' ? 1920 : 1080
const height = aspect === '16:9' ? 1080 : 1920
const duration = aspect === '16:9' ? 42 : 24
const fps = 30
const frames = Number(process.env.MAX_FRAMES ?? duration * fps)
const outDir = path.join('/tmp', aspect === '16:9' ? 'fly-frames-169' : 'fly-frames-916')
const videoPath =
  aspect === '16:9'
    ? '/opt/cursor/artifacts/fly-to-city-16x9.mp4'
    : '/opt/cursor/artifacts/fly-to-city-9x16.mp4'

const shots: Record<string, number> =
  aspect === '16:9'
    ? {
        'globe-midflight': Math.round(4.2 * fps),
        'lujiazui-orbit': Math.round(16 * fps),
        'shinjuku-orbit': Math.round(36 * fps),
      }
    : { 'frame-9x16': Math.round(10 * fps) }

await mkdir(outDir, { recursive: true })
await mkdir('/opt/cursor/artifacts/screenshots', { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    `--window-size=${width},${height}`,
  ],
  defaultViewport: { width, height, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(180000)
const url = `http://localhost:5173/?render=1&fps=${fps}&duration=${duration}`
console.log('打开', url)
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__flyReady === true, { timeout: 180000 })
console.log('场景就绪，开始', frames, '帧')

for (let i = 0; i < frames; i++) {
  await page.evaluate(async (frame) => {
    await window.__seek?.(frame)
  }, i)
  const file = path.join(outDir, `f-${String(i).padStart(5, '0')}.jpg`)
  const stage = await page.$('#stage')
  if (!stage) throw new Error('缺少 #stage')
  await stage.screenshot({ path: file, type: 'jpeg', quality: 86 })
  for (const [name, at] of Object.entries(shots)) {
    if (i === at) {
      const png = `/opt/cursor/artifacts/screenshots/${name}.png`
      await stage.screenshot({ path: png, type: 'png' })
      console.log('截图', png)
    }
  }
  if (i % 30 === 0) console.log(`${aspect} ${i}/${frames}`)
}

await browser.close()
const ffmpeg = `ffmpeg -y -framerate ${fps} -i ${outDir}/f-%05d.jpg -c:v libx264 -pix_fmt yuv420p -crf 16 ${videoPath}`
console.log(ffmpeg)
const proc = Bun.spawn(['bash', '-lc', ffmpeg], { stdout: 'inherit', stderr: 'inherit' })
const code = await proc.exited
if (code !== 0) throw new Error(`ffmpeg 失败 ${code}`)
console.log('完成', videoPath)
