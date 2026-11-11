export type WorkflowStepId =
  | 'idea'
  | 'interview'
  | 'brief'
  | 'shots'
  | 'prompt'
  | 'troubleshoot'

export const WORKFLOW_STEPS: { id: WorkflowStepId; label: string }[] = [
  { id: 'idea', label: '想法' },
  { id: 'interview', label: '澄清问答' },
  { id: 'brief', label: 'Brief' },
  { id: 'shots', label: '分镜表' },
  { id: 'prompt', label: '提示词' },
  { id: 'troubleshoot', label: '排障（可选）' },
]

export type SeedKind = 'drama' | 'unbox' | 'broll' | 'generic'

export interface ExampleSeed {
  id: string
  kind: SeedKind
  title: string
  idea: string
}

export interface InterviewQuestion {
  id: string
  prompt: string
  choices: string[]
}

export interface Brief {
  title: string
  audience: string
  tone: string
  visualStyle: string
  durationSec: number
  logline: string
  mustHave: string[]
}

export interface ShotRow {
  number: number
  framing: string
  cameraMove: string
  durationSec: number
  visualIntent: string
  dialogueSfx: string
}

export interface DirectorPackage {
  idea: string
  seedKind: SeedKind
  answers: Record<string, string>
  brief: Brief
  shots: ShotRow[]
  prompt: string
}

export type TroubleshootIssue = 'blur' | 'shake' | 'off_topic'
