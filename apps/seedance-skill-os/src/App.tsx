import { DirectorStepper } from '@/components/DirectorStepper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  EXAMPLE_SEEDS,
  fakeAgentDelay,
  getTroubleshootAdvice,
  interviewForIdea,
  runDirectorCompile,
  WORKFLOW_STEPS,
  type DirectorPackage,
  type TroubleshootIssue,
  type WorkflowStepId,
} from '@/pipeline'
import { Copy, Download, Play, RotateCcw, Sparkles } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast, Toaster } from 'sonner'

const TROUBLE_OPTIONS: { id: TroubleshootIssue; label: string }[] = [
  { id: 'blur', label: '画面发糊' },
  { id: 'shake', label: '抖动不稳' },
  { id: 'off_topic', label: '跑题不一致' },
]

function downloadJson(pkg: DirectorPackage) {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `seedance-director-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [step, setStep] = useState<WorkflowStepId>('idea')
  const [idea, setIdea] = useState(EXAMPLE_SEEDS[0].idea)
  const [exampleId, setExampleId] = useState<string | null>(EXAMPLE_SEEDS[0].id)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [pkg, setPkg] = useState<DirectorPackage | null>(null)
  const [busy, setBusy] = useState(false)
  const [simulateDelay, setSimulateDelay] = useState(true)
  const [troubleIssue, setTroubleIssue] = useState<TroubleshootIssue>('blur')

  const questions = useMemo(
    () => interviewForIdea(idea, exampleId),
    [idea, exampleId]
  )

  const completedIds = useMemo(() => {
    const order = WORKFLOW_STEPS.map((s) => s.id)
    const idx = order.indexOf(step)
    return order.slice(0, idx)
  }, [step])

  const runStep = useCallback(
    async (target: WorkflowStepId) => {
      setBusy(true)
      try {
        await fakeAgentDelay(680, simulateDelay)
        if (target === 'interview') {
          const qs = interviewForIdea(idea, exampleId)
          const defaults = Object.fromEntries(qs.map((q) => [q.id, q.choices[0]]))
          setAnswers(defaults)
        }
        if (target === 'brief' || target === 'shots' || target === 'prompt') {
          const compiled = runDirectorCompile(idea, answers, exampleId)
          setPkg(compiled)
        }
        setStep(target)
      } finally {
        setBusy(false)
      }
    },
    [answers, exampleId, idea, simulateDelay]
  )

  const runFullPipeline = async () => {
    setBusy(true)
    try {
      const qs = interviewForIdea(idea, exampleId)
      const defaults = Object.fromEntries(qs.map((q) => [q.id, q.choices[0]]))
      setAnswers(defaults)
      await fakeAgentDelay(500, simulateDelay)
      setStep('interview')
      await fakeAgentDelay(500, simulateDelay)
      setStep('brief')
      await fakeAgentDelay(500, simulateDelay)
      setStep('shots')
      await fakeAgentDelay(500, simulateDelay)
      const compiled = runDirectorCompile(idea, defaults, exampleId)
      setPkg(compiled)
      setStep('prompt')
      toast.success('流水线完成，可复制提示词或导出 JSON')
    } finally {
      setBusy(false)
    }
  }

  const resetAll = () => {
    setStep('idea')
    setPkg(null)
    setAnswers({})
  }

  const copyPrompt = async () => {
    if (!pkg) return
    await navigator.clipboard.writeText(pkg.prompt)
    toast.success('提示词已复制到剪贴板')
  }

  const selectExample = (id: string) => {
    const seed = EXAMPLE_SEEDS.find((s) => s.id === id)
    if (!seed) return
    setExampleId(seed.id)
    setIdea(seed.idea)
    setPkg(null)
    setStep('idea')
    setAnswers({})
  }

  const trouble = getTroubleshootAdvice(troubleIssue)

  return (
    <div className="min-h-svh bg-background">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border/80 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Seedance 导演台</h1>
            <p className="text-sm text-muted-foreground">
              本地空跑 · 澄清 → Brief → 分镜 → 提示词（不调用付费视频 API）
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="delay" className="text-xs text-muted-foreground">
              模拟延迟
            </Label>
            <Switch
              id="delay"
              checked={simulateDelay}
              onCheckedChange={setSimulateDelay}
            />
            <Badge variant="secondary" className="ml-1">空跑 MVP</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">流程</CardTitle>
              <CardDescription>纵向步骤条</CardDescription>
            </CardHeader>
            <CardContent>
              <DirectorStepper
                stages={WORKFLOW_STEPS}
                activeId={step}
                completedIds={completedIds}
                busy={busy}
              />
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" />
                示例种子
              </CardTitle>
              <CardDescription>至少三种中文场景，可一键填入想法</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {EXAMPLE_SEEDS.map((seed) => (
                <Button
                  key={seed.id}
                  type="button"
                  size="sm"
                  variant={exampleId === seed.id ? 'default' : 'outline'}
                  onClick={() => selectExample(seed.id)}
                >
                  {seed.title}
                </Button>
              ))}
            </CardContent>
          </Card>

          {step === 'idea' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. 想法</CardTitle>
                <CardDescription>用一句话描述你想拍的画面</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={idea}
                  onChange={(e) => {
                    setIdea(e.target.value)
                    setExampleId(null)
                  }}
                  rows={4}
                  placeholder="例如：雨夜天台俯瞰城市霓虹…"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={!idea.trim() || busy} onClick={() => runStep('interview')}>
                    下一步：澄清问答
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!idea.trim() || busy}
                    onClick={runFullPipeline}
                  >
                    <Play className="size-4" />
                    一键跑通
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'interview' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. 澄清问答</CardTitle>
                <CardDescription>1–2 题，锁定调性与平台</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium">{q.prompt}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.choices.map((choice) => (
                        <Button
                          key={choice}
                          type="button"
                          size="sm"
                          variant={answers[q.id] === choice ? 'default' : 'outline'}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: choice }))}
                        >
                          {choice}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep('idea')}>
                    上一步
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => runStep('brief')}>
                    生成 Brief
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'brief' && pkg && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Brief</CardTitle>
                <CardDescription>导演意图摘要</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><span className="text-muted-foreground">片名：</span>{pkg.brief.title}</p>
                <p><span className="text-muted-foreground">受众：</span>{pkg.brief.audience}</p>
                <p><span className="text-muted-foreground">调性：</span>{pkg.brief.tone}</p>
                <p><span className="text-muted-foreground">视觉：</span>{pkg.brief.visualStyle}</p>
                <p><span className="text-muted-foreground">时长：</span>约 {pkg.brief.durationSec} 秒</p>
                <p><span className="text-muted-foreground">故事线：</span>{pkg.brief.logline}</p>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.brief.mustHave.map((item) => (
                    <Badge key={item} variant="outline">{item}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep('interview')}>
                    上一步
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => runStep('shots')}>
                    编译分镜表
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'shots' && pkg && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">4. 分镜表</CardTitle>
                <CardDescription>{pkg.shots.length} 镜 · 含景别、运镜、时长、意图与声场</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">镜号</th>
                      <th className="py-2 pr-2 font-medium">景别</th>
                      <th className="py-2 pr-2 font-medium">运镜</th>
                      <th className="py-2 pr-2 font-medium">时长</th>
                      <th className="py-2 pr-2 font-medium">画面意图</th>
                      <th className="py-2 font-medium">对白/音效</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkg.shots.map((shot) => (
                      <tr key={shot.number} className="border-b border-border/60 align-top">
                        <td className="py-3 pr-2 font-medium">{shot.number}</td>
                        <td className="py-3 pr-2">{shot.framing}</td>
                        <td className="py-3 pr-2">{shot.cameraMove}</td>
                        <td className="py-3 pr-2">{shot.durationSec}s</td>
                        <td className="py-3 pr-2 max-w-[200px]">{shot.visualIntent}</td>
                        <td className="py-3 text-muted-foreground">{shot.dialogueSfx}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep('brief')}>
                    上一步
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => runStep('prompt')}>
                    生成提示词
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'prompt' && pkg && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">5. 提示词</CardTitle>
                <CardDescription>可复制或导出 JSON（brief + shots + prompt）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                  {pkg.prompt}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={copyPrompt}>
                    <Copy className="size-4" />
                    复制提示词
                  </Button>
                  <Button type="button" variant="outline" onClick={() => downloadJson(pkg)}>
                    <Download className="size-4" />
                    导出 JSON
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setStep('troubleshoot')}>
                    可选排障
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetAll}>
                    <RotateCcw className="size-4" />
                    重跑
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'troubleshoot' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">6. 排障（可选）</CardTitle>
                <CardDescription>针对假想的生成问题给出提示词修正建议</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {TROUBLE_OPTIONS.map((opt) => (
                    <Button
                      key={opt.id}
                      type="button"
                      size="sm"
                      variant={troubleIssue === opt.id ? 'default' : 'outline'}
                      onClick={() => setTroubleIssue(opt.id)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="font-medium">{trouble.title}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {trouble.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
                <Button type="button" variant="outline" onClick={() => setStep('prompt')}>
                  返回提示词
                </Button>
              </CardContent>
            </Card>
          )}

          {(step === 'brief' || step === 'shots' || step === 'prompt') && !pkg && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                请先完成澄清问答，或从「想法」页使用「一键跑通」。
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        灵感来自 Skill OS 工作流形态；本 demo 仅本地模板，不连接 Seedance / 即梦。
      </footer>
    </div>
  )
}
