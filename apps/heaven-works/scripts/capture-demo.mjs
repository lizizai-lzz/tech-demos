import { chromium } from 'playwright'
import { mkdir, rename } from 'node:fs/promises'
import { readdir } from 'node:fs/promises'

const base = process.env.CAPTURE_URL ?? 'http://127.0.0.1:5173'
const outDir = '/opt/cursor/artifacts/screenshots'
const artifactDir = '/opt/cursor/artifacts'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader'],
})
const context = await browser.newContext({
  viewport: { width: 1920, height: 1200 },
  recordVideo: { dir: artifactDir, size: { width: 1920, height: 1200 } },
})
const page = await context.newPage()
await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(6500)

await page.screenshot({
  path: `${outDir}/heaven-works-dashboard.png`,
  fullPage: false,
})

await page.screenshot({
  path: `${outDir}/heaven-works-hologram-crop.png`,
  clip: { x: 380, y: 420, width: 1160, height: 680 },
})

await page.waitForTimeout(3500)
await context.close()
await browser.close()

const files = await readdir(artifactDir)
const webm = files.find((f) => f.endsWith('.webm') && f !== 'heaven-works-demo.webm')
if (webm) {
  await rename(`${artifactDir}/${webm}`, `${artifactDir}/heaven-works-demo.webm`)
}
console.log('capture done')
