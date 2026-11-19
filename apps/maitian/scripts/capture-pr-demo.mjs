import { chromium } from "playwright"
import { mkdir, rename } from "node:fs/promises"
import { readdir } from "node:fs/promises"

const base = process.env.MAITIAN_URL ?? "http://127.0.0.1:5173"
const artifactDir = "/opt/cursor/artifacts"
const shotDir = `${artifactDir}/screenshots`
await mkdir(shotDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "zh-CN",
  recordVideo: { dir: artifactDir, size: { width: 1440, height: 900 } },
})
const page = await context.newPage()
await page.goto(base, { waitUntil: "networkidle" })
await page.waitForTimeout(800)

await page.screenshot({
  path: `${shotDir}/maitian_board_dashboard.png`,
  fullPage: true,
})

const nav = page.locator("header nav")
await nav.getByRole("button", { name: "日历", exact: true }).click()
await page.waitForTimeout(500)
await page.screenshot({
  path: `${shotDir}/maitian_calendar.png`,
  fullPage: true,
})

await page.getByRole("button", { name: "空跑演示：七站一屏怎么排期" }).click()
await page.waitForTimeout(600)
await page.screenshot({
  path: `${shotDir}/maitian_episode_same_age_review.png`,
  fullPage: true,
})

await page.getByRole("button", { name: "← 返回" }).click()
await nav.getByRole("button", { name: "转化", exact: true }).click()
await page.waitForTimeout(500)
await page.screenshot({
  path: `${shotDir}/maitian_conversion_funnel.png`,
  fullPage: true,
})

await nav.getByRole("button", { name: "大屏", exact: true }).click()
await page.waitForTimeout(400)

await context.close()
await browser.close()

const files = await readdir(artifactDir)
const webm = files.find((f) => f.endsWith(".webm"))
if (webm) {
  await rename(`${artifactDir}/${webm}`, `${artifactDir}/maitian_seven_platform_walkthrough.webm`)
}

console.log("PR demo artifacts saved to", artifactDir)