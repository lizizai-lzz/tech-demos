import type { UniverAPI } from '@/components/UniverSheet'
import type { AgentStep } from './agent-steps'

function getWorksheet(univerAPI: UniverAPI, sheetName: string) {
  const fWorkbook = univerAPI.getActiveWorkbook()
  if (!fWorkbook) throw new Error('未找到活动工作簿')
  const fWorksheet = fWorkbook.getSheetByName(sheetName)
  if (!fWorksheet) throw new Error(`未找到工作表：${sheetName}`)
  return { fWorkbook, fWorksheet }
}

export async function runAgentStep(
  univerAPI: UniverAPI,
  step: AgentStep,
): Promise<void> {
  if (step.kind === 'narrate') {
    return
  }

  if (step.kind === 'activateSheet') {
    const { fWorkbook } = getWorksheet(univerAPI, step.sheetName)
    const sheet = fWorkbook.getSheetByName(step.sheetName)
    if (sheet) {
      fWorkbook.setActiveSheet(sheet)
    }
    return
  }

  const { fWorksheet } = getWorksheet(univerAPI, step.sheetName)
  const range = fWorksheet.getRange(step.range)

  if (step.kind === 'setValue') {
    range.activate()
    range.setValue(step.value)
    return
  }

  if (step.kind === 'setFormula') {
    range.activate()
    range.setFormula(step.formula)
    return
  }

  if (step.kind === 'highlight') {
    range.activate()
    range.setBackgroundColor(step.color)
  }
}