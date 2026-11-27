import type { IWorkbookData } from '@univerjs/core'
import { LocaleType } from '@univerjs/core'

export const WORKBOOK_ID = 'wb-content-weekly'

export const SHEET_WEEK = 'sheet-week'
export const SHEET_CHANNELS = 'sheet-channels'
export const SHEET_SUMMARY = 'sheet-summary'

export const SHEET_NAME_WEEK = '本周选题'
export const SHEET_NAME_CHANNELS = '渠道数据'
export const SHEET_NAME_SUMMARY = '周报汇总'

export interface ChannelRow {
  channel: string
  views: number
  engagement: number
}

/** 预置渠道行（不含 Agent 后续补录的一行） */
export const CHANNEL_ROWS: ChannelRow[] = [
  { channel: '公众号', views: 3200, engagement: 180 },
  { channel: '小红书', views: 8600, engagement: 420 },
  { channel: 'B站', views: 12400, engagement: 890 },
  { channel: '抖音', views: 25600, engagement: 1200 },
]

/** Agent 演示补录行 */
export const AGENT_EXTRA_CHANNEL: ChannelRow = {
  channel: '视频号短评',
  views: 15200,
  engagement: 95,
}

export function sumChannelViews(rows: readonly ChannelRow[]): number {
  return rows.reduce((acc, row) => acc + row.views, 0)
}

export function sumChannelEngagement(rows: readonly ChannelRow[]): number {
  return rows.reduce((acc, row) => acc + row.engagement, 0)
}

export function allChannelsAfterAgent(): ChannelRow[] {
  return [...CHANNEL_ROWS, AGENT_EXTRA_CHANNEL]
}

export function buildContentWeeklyWorkbook(): IWorkbookData {
  const channelCellData: Record<
    number,
    Record<number, { v?: string | number; f?: string }>
  > = {
    0: {
      0: { v: '渠道' },
      1: { v: '阅读量' },
      2: { v: '互动数' },
    },
  }

  CHANNEL_ROWS.forEach((row, index) => {
    const r = index + 1
    channelCellData[r] = {
      0: { v: row.channel },
      1: { v: row.views },
      2: { v: row.engagement },
    }
  })

  const weekCellData: Record<
    number,
    Record<number, { v?: string | number }>
  > = {
    0: {
      0: { v: '序号' },
      1: { v: '选题' },
      2: { v: '负责人' },
      3: { v: '状态' },
    },
    1: {
      0: { v: 1 },
      1: { v: 'Univer 表格入门' },
      2: { v: '阿宁' },
      3: { v: '已发布' },
    },
    2: {
      0: { v: 2 },
      1: { v: '周报自动化畅想' },
      2: { v: '小周' },
      3: { v: '剪辑中' },
    },
    3: {
      0: { v: 3 },
      1: { v: '数据复盘模板' },
      2: { v: '老陈' },
      3: { v: '策划中' },
    },
    4: {
      0: { v: 4 },
      1: { v: '粉丝问答精选' },
      2: { v: '待分配' },
      3: { v: '草稿' },
    },
  }

  const totalViews = sumChannelViews(CHANNEL_ROWS)
  const totalEng = sumChannelEngagement(CHANNEL_ROWS)

  const summaryCellData: Record<
    number,
    Record<number, { v?: string | number; f?: string }>
  > = {
    0: { 0: { v: '内容周报汇总' } },
    1: { 0: { v: '指标' }, 1: { v: '数值' } },
    2: {
      0: { v: '总阅读量' },
      1: { f: `=SUM(${SHEET_NAME_CHANNELS}!B2:B5)`, v: totalViews },
    },
    3: {
      0: { v: '总互动' },
      1: { f: `=SUM(${SHEET_NAME_CHANNELS}!C2:C5)`, v: totalEng },
    },
    4: { 0: { v: '备注' }, 1: { v: '（等待脚本 Agent…）' } },
  }

  return {
    id: WORKBOOK_ID,
    name: '内容周报',
    appVersion: '0.10.9',
    locale: LocaleType.ZH_CN,
    styles: {},
    sheetOrder: [SHEET_WEEK, SHEET_CHANNELS, SHEET_SUMMARY],
    sheets: {
      [SHEET_WEEK]: {
        id: SHEET_WEEK,
        name: SHEET_NAME_WEEK,
        rowCount: 24,
        columnCount: 8,
        cellData: weekCellData,
      },
      [SHEET_CHANNELS]: {
        id: SHEET_CHANNELS,
        name: SHEET_NAME_CHANNELS,
        rowCount: 24,
        columnCount: 6,
        cellData: channelCellData,
      },
      [SHEET_SUMMARY]: {
        id: SHEET_SUMMARY,
        name: SHEET_NAME_SUMMARY,
        rowCount: 24,
        columnCount: 6,
        cellData: summaryCellData,
      },
    },
  }
}