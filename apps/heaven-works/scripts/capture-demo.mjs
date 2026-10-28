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
await page.waitForTimeout(4000)

await page.getByRole('button', { name: '视角切换' }).click()
await page.waitForTimeout(1200)
await page.getByRole('button', { name: '视角切换' }).click()
await page.waitForTimeout(1200)

await page.screenshot({
  path: `${outDir}/heaven-works-dashboard.png`,
  fullPage: false,
})

await page.waitForTimeout(4000)
await context.close()
await browser.close()

const files = await readdir(artifactDir)
const webm = files.find((f) => f.endsWith('.webm'))
if (webm) {
  await rename(`${artifactDir}/${webm}`, `${artifactDir}/heaven-works-demo.webm`)
}
console.log('capture done')
