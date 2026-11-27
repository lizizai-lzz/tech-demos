import {
  AGENT_EXTRA_CHANNEL,
  SHEET_NAME_CHANNELS,
  SHEET_NAME_SUMMARY,
  SHEET_NAME_WEEK,
} from '@/data/workbook-fixture'

export type AgentStep =
  | { id: string; kind: 'narrate'; label: string }
  | {
      id: string
      kind: 'activateSheet'
      sheetName: string
      label: string
    }
  | {
      id: string
      kind: 'setValue'
      sheetName: string
      range: string
      value: string | number
      label: string
    }
  | {
      id: string
      kind: 'setFormula'
      sheetName: string
      range: string
      formula: string
      label: string
    }
  | {
      id: string
      kind: 'highlight'
      sheetName: string
      range: string
      color: string
      label: string
    }

export const AGENT_STEPS: AgentStep[] = [
  {
    id: 's1',
    kind: 'narrate',
    label: '读取本周选题与渠道数据（本地脚本，无大模型）',
  },
  {
    id: 's2',
    kind: 'activateSheet',
    sheetName: SHEET_NAME_WEEK,
    label: `切换到「${SHEET_NAME_WEEK}」`,
  },
  {
    id: 's3',
    kind: 'setValue',
    sheetName: SHEET_NAME_WEEK,
    range: 'D5',
    value: '待排期',
    label: '更新第 4 条选题状态为「待排期」',
  },
  {
    id: 's4',
    kind: 'activateSheet',
    sheetName: SHEET_NAME_CHANNELS,
    label: `切换到「${SHEET_NAME_CHANNELS}」`,
  },
  {
    id: 's5',
    kind: 'setValue',
    sheetName: SHEET_NAME_CHANNELS,
    range: 'A6',
    value: AGENT_EXTRA_CHANNEL.channel,
    label: '补录一行：视频号短评',
  },
  {
    id: 's6',
    kind: 'setValue',
    sheetName: SHEET_NAME_CHANNELS,
    range: 'B6',
    value: AGENT_EXTRA_CHANNEL.views,
    label: `写入阅读量 ${AGENT_EXTRA_CHANNEL.views}`,
  },
  {
    id: 's7',
    kind: 'setValue',
    sheetName: SHEET_NAME_CHANNELS,
    range: 'C6',
    value: AGENT_EXTRA_CHANNEL.engagement,
    label: `写入互动数 ${AGENT_EXTRA_CHANNEL.engagement}`,
  },
  {
    id: 's8',
    kind: 'activateSheet',
    sheetName: SHEET_NAME_SUMMARY,
    label: `切换到「${SHEET_NAME_SUMMARY}」`,
  },
  {
    id: 's9',
    kind: 'setFormula',
    sheetName: SHEET_NAME_SUMMARY,
    range: 'B3',
    formula: `=SUM(${SHEET_NAME_CHANNELS}!B2:B6)`,
    label: '扩展总阅读量公式至 B6',
  },
  {
    id: 's10',
    kind: 'setFormula',
    sheetName: SHEET_NAME_SUMMARY,
    range: 'B4',
    formula: `=SUM(${SHEET_NAME_CHANNELS}!C2:C6)`,
    label: '扩展总互动公式至 C6',
  },
  {
    id: 's11',
    kind: 'highlight',
    sheetName: SHEET_NAME_SUMMARY,
    range: 'A3:B4',
    color: '#fef3c7',
    label: '高亮汇总指标区域',
  },
  {
    id: 's12',
    kind: 'setValue',
    sheetName: SHEET_NAME_SUMMARY,
    range: 'B5',
    value: 'Agent：已纳入视频号补录数据',
    label: '写入备注',
  },
]