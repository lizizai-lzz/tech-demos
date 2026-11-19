import { describe, expect, test } from "bun:test"
import demo from "@/data/demo.json"
import type { DemoData } from "@/types"
import {
  buildInsights,
  highestEngagementPlatform,
  latestEpisode,
  netGainForWindow,
  platformWithHighestNetGain,
  publishDayBroughtExtraFollowers,
  sameAgePlayRatio,
  findPreviousPublished,
  totalFollowers,
} from "./analytics"

const data = demo as DemoData

describe("粉丝汇总", () => {
  test("七平台粉丝合计", () => {
    const sum = data.platforms.reduce(
      (s, id) => s + data.followers[id].followers,
      0,
    )
    expect(totalFollowers(data)).toBe(sum)
  })

  test("30 日净增与逐日加总一致", () => {
    const fromFn = netGainForWindow(data, 30)
    const manual = data.platforms.reduce((s, id) => {
      return s + data.followers[id].dailyNet.reduce((a, b) => a + b, 0)
    }, 0)
    expect(fromFn).toBe(manual)
  })
})

describe("同龄对比", () => {
  test("当期相对上一期有倍率", () => {
    const current = latestEpisode(data)
    const prev = findPreviousPublished(data, current.id)
    expect(prev).toBeDefined()
    const ratio = sameAgePlayRatio(current, prev, "bilibili", 3)
    expect(ratio).not.toBeNull()
    expect(ratio!).toBeGreaterThan(0)
  })
})

describe("本地洞察规则", () => {
  test("能选出 7 日涨粉最多的平台", () => {
    const winner = platformWithHighestNetGain(data, 7)
    expect(data.platforms).toContain(winner)
    const nets = data.platforms.map((id) => netGainForWindow(data, 7, id))
    expect(netGainForWindow(data, 7, winner)).toBe(Math.max(...nets))
  })

  test("发布日带粉判定为布尔值", () => {
    expect(typeof publishDayBroughtExtraFollowers(data)).toBe("boolean")
  })

  test("能选出互动率最高的平台", () => {
    const ep = latestEpisode(data)
    const id = highestEngagementPlatform(ep)
    expect(data.platforms).toContain(id)
  })

  test("洞察输出三条", () => {
    const lines = buildInsights(data, latestEpisode(data))
    expect(lines).toHaveLength(3)
  })
})