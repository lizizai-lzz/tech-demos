import { describe, expect, it } from 'bun:test'
import {
  AGENT_EXTRA_CHANNEL,
  CHANNEL_ROWS,
  SHEET_NAME_CHANNELS,
  SHEET_NAME_SUMMARY,
  SHEET_NAME_WEEK,
  allChannelsAfterAgent,
  buildContentWeeklyWorkbook,
  sumChannelEngagement,
  sumChannelViews,
} from './workbook-fixture'

describe('内容周报 fixture', () => {
  it('包含三个工作表且顺序正确', () => {
    const wb = buildContentWeeklyWorkbook()
    expect(wb.sheetOrder).toEqual(['sheet-week', 'sheet-channels', 'sheet-summary'])
    expect(wb.sheets['sheet-week']?.name).toBe(SHEET_NAME_WEEK)
    expect(wb.sheets['sheet-channels']?.name).toBe(SHEET_NAME_CHANNELS)
    expect(wb.sheets['sheet-summary']?.name).toBe(SHEET_NAME_SUMMARY)
  })

  it('预置渠道阅读量合计与汇总公式一致', () => {
    const expected = sumChannelViews(CHANNEL_ROWS)
    expect(expected).toBe(3200 + 8600 + 12400 + 25600)
    const summary = buildContentWeeklyWorkbook().sheets['sheet-summary']?.cellData?.[2]?.[1]
    expect(summary?.f).toBe(`=SUM(${SHEET_NAME_CHANNELS}!B2:B5)`)
    expect(summary?.v).toBe(expected)
  })

  it('Agent 补一行后阅读量应增加视频号数据', () => {
    const before = sumChannelViews(CHANNEL_ROWS)
    const after = sumChannelViews(allChannelsAfterAgent())
    expect(after - before).toBe(AGENT_EXTRA_CHANNEL.views)
    expect(sumChannelEngagement(allChannelsAfterAgent())).toBe(
      sumChannelEngagement(CHANNEL_ROWS) + AGENT_EXTRA_CHANNEL.engagement,
    )
  })
})