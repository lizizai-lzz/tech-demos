import { chromium } from "playwright"
import { mkdir, rename } from "node:fs/promises"
import { readdir } from "node:fs/promises"

const base = "http://localhost:5173"
const outDir = "/opt/cursor/artifacts/screenshots"
const artifactDir = "/opt/cursor/artifacts"
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  recordVideo: { dir: artifactDir, size: { width: 1400, height: 900 } },
})
const page = await context.newPage()
await page.goto(base, { waitUntil: "networkidle" })

await page.getByRole("button", { name: /写小说/ }).click()
await page.getByRole("button", { name: /地下高校/ }).click()

await page.screenshot({
  path: `${outDir}/toonflow-empty-stepper.png`,
  fullPage: true,
})

await page.getByRole("button", { name: /开始空跑/ }).click()
await page.waitForTimeout(2500)
await page.getByRole("button", { name: /暂停/ }).click()
await page.waitForTimeout(400)

await page.screenshot({
  path: `${outDir}/toonflow-paused-continue.png`,
  fullPage: true,
})

await page.getByRole("button", { name: /^继续$/ }).click()

for (let i = 0; i < 50; i++) {
  const done = await page.getByText("全部完成").isVisible().catch(() => false)
  if (done) break
  await page.waitForTimeout(1000)
}

await page.waitForTimeout(800)
await page.screenshot({
  path: `${outDir}/toonflow-quality-chips.png`,
  fullPage: true,
})

const verdict = page.locator(".react-flow__node").filter({ hasText: "质检裁定" }).first()
if (await verdict.count()) {
  await verdict.click()
  await page.waitForTimeout(500)
  await page.screenshot({
    path: `${outDir}/toonflow-verdict-sheet.png`,
    fullPage: true,
  })
}

await context.close()
await browser.close()

const files = await readdir(artifactDir)
const webm = files.find((f) => f.endsWith(".webm"))
if (webm) {
  await rename(`${artifactDir}/${webm}`, `${artifactDir}/toonflow-ux-demo.webm`)
}

console.log("capture done")
