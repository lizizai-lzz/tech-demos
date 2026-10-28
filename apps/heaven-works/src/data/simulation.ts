export type UnitStatus = 'DONE' | 'VERIFY' | 'RUN' | 'WAIT'

export type LoopUnit = {
  id: string
  code: string
  nameEn: string
  nameZh: string
  progress: number
  status: UnitStatus
}

export const initialUnits: LoopUnit[] = [
  {
    id: 'U01',
    code: 'CODE_SMITH',
    nameEn: 'Code Smith',
    nameZh: '代码锻造',
    progress: 100,
    status: 'DONE',
  },
  {
    id: 'U02',
    code: 'RESEARCH',
    nameEn: 'Research',
    nameZh: '情报扫描',
    progress: 100,
    status: 'DONE',
  },
  {
    id: 'U03',
    code: 'BUILDER',
    nameEn: 'Builder',
    nameZh: '结构搭建',
    progress: 100,
    status: 'DONE',
  },
  {
    id: 'U04',
    code: 'REVIEWER',
    nameEn: 'Reviewer',
    nameZh: '质量审核',
    progress: 92,
    status: 'VERIFY',
  },
  {
    id: 'U05',
    code: 'DESIGNER',
    nameEn: 'Designer',
    nameZh: '品牌视觉',
    progress: 100,
    status: 'DONE',
  },
  {
    id: 'U06',
    code: 'SEO_WEAVE',
    nameEn: 'SEO Weave',
    nameZh: '页面与 SEO',
    progress: 100,
    status: 'DONE',
  },
  {
    id: 'U07',
    code: 'RESPONSIVE',
    nameEn: 'Responsive',
    nameZh: '全端适配',
    progress: 86,
    status: 'RUN',
  },
  {
    id: 'U08',
    code: 'DELIVER',
    nameEn: 'Deliver',
    nameZh: '交付打包',
    progress: 72,
    status: 'WAIT',
  },
]

export type StageCard = {
  id: string
  labelZh: string
  labelEn: string
  ok: boolean
  progress: number
  /** Hologram target in local space (x, y, z) */
  beamTarget: [number, number, number]
}

export const stageCards: StageCard[] = [
  {
    id: 'S01',
    labelZh: '导航与页面框架',
    labelEn: 'Nav & Framework',
    ok: true,
    progress: 100,
    beamTarget: [-1.4, 0.9, 0.1],
  },
  {
    id: 'S02',
    labelZh: '品牌视觉设计',
    labelEn: 'Brand Vision',
    ok: true,
    progress: 100,
    beamTarget: [-0.6, 1.4, 0.05],
  },
  {
    id: 'S03',
    labelZh: '产品卡片组件',
    labelEn: 'Product Components',
    ok: true,
    progress: 100,
    beamTarget: [0.2, 0.7, 0.08],
  },
  {
    id: 'S04',
    labelZh: '首页与内容区',
    labelEn: 'Homepage',
    ok: true,
    progress: 100,
    beamTarget: [0.8, 1.1, 0.06],
  },
  {
    id: 'S05',
    labelZh: '页面与 SEO',
    labelEn: 'SEO',
    ok: true,
    progress: 100,
    beamTarget: [1.2, 1.5, 0.04],
  },
  {
    id: 'S06',
    labelZh: '平板端适配',
    labelEn: 'Tablet',
    ok: true,
    progress: 94,
    beamTarget: [2.1, 1.0, 0.12],
  },
  {
    id: 'S07',
    labelZh: '手机端适配',
    labelEn: 'Mobile',
    ok: false,
    progress: 78,
    beamTarget: [2.9, 0.85, 0.1],
  },
  {
    id: 'S08',
    labelZh: '接口与表单联调',
    labelEn: 'Forms API',
    ok: false,
    progress: 65,
    beamTarget: [-0.2, 0.45, 0.15],
  },
]

export type PipelineStep = 'DISPATCH' | 'SCAN' | 'WEAVE' | 'VERIFY' | 'DELIVER'

export const pipelineSteps: PipelineStep[] = [
  'DISPATCH',
  'SCAN',
  'WEAVE',
  'VERIFY',
  'DELIVER',
]

export type TaskRow = {
  id: string
  agent: string
  title: string
  progress: number
}

export const initialTasks: TaskRow[] = [
  { id: 'T1', agent: 'U05', title: '品牌色板与字体栈', progress: 100 },
  { id: 'T2', agent: 'U03', title: '首页 Hero 栅格', progress: 100 },
  { id: 'T3', agent: 'U06', title: 'Meta 与结构化数据', progress: 100 },
  { id: 'T4', agent: 'U04', title: '组件回归快照', progress: 88 },
  { id: 'T5', agent: 'U07', title: '375px 断点微调', progress: 76 },
]

export const projectMeta = {
  title: '品牌官网全端改版',
  subtitle: 'Orbital Build · Cache 01',
  completion: 88,
  activeStep: 'VERIFY' as PipelineStep,
}
