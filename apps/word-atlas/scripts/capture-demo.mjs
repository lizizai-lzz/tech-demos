import { chromium } from 'playwright'
import { mkdir, rename, readdir } from 'node:fs/promises'

const base = process.env.DEMO_URL ?? 'http://127.0.0.1:5173'
const outDir = '/opt/cursor/artifacts/screenshots'
const artifactDir = '/opt/cursor/artifacts'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'zh-CN',
  recordVideo: { dir: artifactDir, size: { width: 1280, height: 800 } },
})
const page = await context.newPage()
await page.goto(base, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${outDir}/word-atlas-home.png`, fullPage: true })

await page.getByRole('button', { name: '开始今日' }).click()
await page.waitForTimeout(500)

async function rateIfFlipped() {
  for (const name of ['记得', '模糊', '忘记']) {
    const btn = page.getByRole('button', { name })
    if (await btn.isVisible().catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(450)
      return true
    }
  }
  return false
}

for (let step = 0; step < 6; step++) {
  if (await page.getByText('看义选词').isVisible().catch(() => false)) {
    await page.screenshot({ path: `${outDir}/word-atlas-quiz.png`, fullPage: true })
    const opt = page.locator('[data-slot="card-content"] button').first()
    if (await opt.count()) await opt.click()
    await page.waitForTimeout(500)
    continue
  }
  const flip = page.locator('button.w-full.text-left').first()
  if (await flip.isVisible().catch(() => false)) {
    await flip.click()
    await page.waitForTimeout(350)
    if (step === 0) {
      await page.screenshot({ path: `${outDir}/word-atlas-flip.png`, fullPage: true })
    }
    await rateIfFlipped()
  } else {
    break
  }
}

await page.getByRole('button', { name: '暂停并返回' }).click({ timeout: 3000 }).catch(() => {})
await page.waitForTimeout(300)
await page.getByRole('button', { name: '旅行' }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${outDir}/word-atlas-topic-sheet.png`, fullPage: true })
await page.keyboard.press('Escape')
await page.screenshot({ path: `${outDir}/word-atlas-starmap.png`, fullPage: true })

await page.close()
await context.close()
await browser.close()

const files = await readdir(artifactDir)
const webms = files.filter((f) => f.endsWith('.webm') && f !== 'word-atlas-demo.webm')
for (const f of webms) {
  await rename(`${artifactDir}/${f}`, `${artifactDir}/word-atlas-demo.webm`)
  break
}
console.log('capture done')
