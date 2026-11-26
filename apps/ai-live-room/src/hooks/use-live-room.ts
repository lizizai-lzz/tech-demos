import { useCallback, useEffect, useRef, useState } from 'react'
import { classifyDanmaku } from '@/pipeline/classify'
import { DEFAULT_PIPELINE_CONFIG, SIMULATED_DANMAKU_POOL } from '@/pipeline/defaults'
import { buildDispatchPlan } from '@/pipeline/dispatch'
import { filterDanmaku } from '@/pipeline/filter'
import { dequeueNext, enqueueDanmaku } from '@/pipeline/queue'
import type {
  DispatchPlan,
  FeedItem,
  PipelineConfig,
  QueuedDanmaku,
  StreamerViewState,
} from '@/pipeline/types'
import {
  createWarmupState,
  pickWarmupTopic,
  type WarmupState,
} from '@/pipeline/warmup'
import { loadConfig, saveConfig } from '@/lib/config-store'

export interface EventLogEntry {
  id: string
  at: number
  message: string
}

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function randomPoolLine(): string {
  return SIMULATED_DANMAKU_POOL[
    Math.floor(Math.random() * SIMULATED_DANMAKU_POOL.length)
  ]
}

export function useLiveRoom() {
  const [config, setConfig] = useState<PipelineConfig>(() => loadConfig())
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [queue, setQueue] = useState<QueuedDanmaku[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [dryRun, setDryRun] = useState(false)
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([])
  const [streamer, setStreamer] = useState<StreamerViewState>(() => ({
    mode: 'idle',
    subtitle: DEFAULT_PIPELINE_CONFIG.persona.openingLine,
    currentOutfit: DEFAULT_PIPELINE_CONFIG.wardrobe[0].name,
    currentOutfitColor: DEFAULT_PIPELINE_CONFIG.wardrobe[0].color,
    queueLength: 0,
  }))

  const queueRef = useRef<QueuedDanmaku[]>([])
  const warmupStateRef = useRef<WarmupState>(createWarmupState())
  const busyRef = useRef(false)
  const lastActivityRef = useRef(Date.now())
  const planTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const simulatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const configRef = useRef(config)

  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    queueRef.current = queue
    setStreamer((s) => ({ ...s, queueLength: queue.length }))
  }, [queue])

  const log = useCallback((message: string) => {
    setEventLog((prev) =>
      [{ id: randomId(), at: Date.now(), message }, ...prev].slice(0, 80)
    )
  }, [])

  const updateFeedStatus = useCallback(
    (id: string, status: FeedItem['status']) => {
      setFeed((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      )
    },
    []
  )

  const runPlan = useCallback(
    (plan: DispatchPlan, onDone: () => void) => {
      const cfg = configRef.current
      setStreamer((s) => ({
        ...s,
        mode: plan.mode,
        subtitle: plan.subtitle,
        actionName: plan.actionName,
        ...(plan.outfitName
          ? {
              currentOutfit: plan.outfitName,
              currentOutfitColor:
                cfg.wardrobe.find((w) => w.name === plan.outfitName)?.color ??
                s.currentOutfitColor,
            }
          : {}),
      }))

      if (planTimerRef.current) clearTimeout(planTimerRef.current)
      planTimerRef.current = setTimeout(() => {
        setStreamer((s) => ({
          ...s,
          mode: 'idle',
          actionName: undefined,
        }))
        onDone()
      }, plan.durationMs)
    },
    []
  )

  const tryProcessNext = useCallback(() => {
    if (busyRef.current) return
    const current = queueRef.current
    const { item, queue: rest } = dequeueNext(current)
    if (!item) return

    busyRef.current = true
    queueRef.current = rest
    setQueue(rest)
    lastActivityRef.current = Date.now()
    setProcessingId(item.id)
    updateFeedStatus(item.id, 'processing')

    const cfg = configRef.current
    const plan = buildDispatchPlan(item.intent, item.text, cfg)
    log(`开始处理：${item.text.slice(0, 24)}（${item.intent.kind}）`)

    runPlan(plan, () => {
      updateFeedStatus(item.id, 'done')
      setProcessingId(null)
      busyRef.current = false
      lastActivityRef.current = Date.now()
      log(`完成：${item.text.slice(0, 20)}`)
      tryProcessNext()
    })
  }, [log, runPlan, updateFeedStatus])

  const tryProcessNextRef = useRef(tryProcessNext)
  tryProcessNextRef.current = tryProcessNext

  const submitDanmaku = useCallback(
    (text: string, userLabel = '观众') => {
      const trimmed = text.trim()
      if (!trimmed) return

      const feedId = randomId()
      const cfg = configRef.current
      const filterResult = filterDanmaku(trimmed, cfg)

      if (!filterResult.ok) {
        const item: FeedItem = {
          id: feedId,
          text: trimmed,
          userLabel,
          status: 'filtered',
          filterReason: filterResult.reason,
          createdAt: Date.now(),
        }
        setFeed((prev) => [item, ...prev].slice(0, 100))
        log(`已过滤：${trimmed.slice(0, 16)}（${filterResult.reason}）`)
        return
      }

      const intent = classifyDanmaku(trimmed, cfg)
      const item: FeedItem = {
        id: feedId,
        text: trimmed,
        userLabel,
        status: 'queued',
        intent,
        createdAt: Date.now(),
      }
      setFeed((prev) => [item, ...prev].slice(0, 100))

      const { queue: next, merged } = enqueueDanmaku(queueRef.current, {
        id: feedId,
        text: trimmed,
        intent,
      })

      if (merged) {
        log(`合并重复弹幕：${trimmed.slice(0, 20)}`)
        updateFeedStatus(feedId, 'done')
        queueRef.current = next
        setQueue(next)
        return
      }

      queueRef.current = next
      setQueue(next)
      log(`入队 #${next.length}：${trimmed.slice(0, 24)}`)
      lastActivityRef.current = Date.now()
      tryProcessNextRef.current()
    },
    [log, updateFeedStatus]
  )

  const triggerWarmup = useCallback(() => {
    if (busyRef.current || queueRef.current.length > 0) return
    const cfg = configRef.current
    const pick = pickWarmupTopic(cfg.warmupTopics, warmupStateRef.current)
    if (!pick) return
    warmupStateRef.current = pick.nextState
    busyRef.current = true
    const plan = buildDispatchPlan(
      { kind: 'chat' },
      '',
      cfg,
      { isWarmup: true, warmupLine: pick.topic }
    )
    log(`暖场：${pick.topic}`)
    runPlan(plan, () => {
      busyRef.current = false
      lastActivityRef.current = Date.now()
    })
  }, [log, runPlan])

  useEffect(() => {
    const tick = setInterval(() => {
      if (!dryRun) return
      if (busyRef.current || queueRef.current.length > 0) return
      const idleSec = (Date.now() - lastActivityRef.current) / 1000
      if (idleSec >= config.idleWarmupSeconds) {
        triggerWarmup()
        lastActivityRef.current = Date.now()
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [config.idleWarmupSeconds, dryRun, triggerWarmup])

  useEffect(() => {
    if (!dryRun) {
      if (simulatorTimerRef.current) clearTimeout(simulatorTimerRef.current)
      return
    }

    const schedule = () => {
      const delay = 1000 + Math.random() * 2000
      simulatorTimerRef.current = setTimeout(() => {
        submitDanmaku(randomPoolLine(), '模拟观众')
        schedule()
      }, delay)
    }
    schedule()

    return () => {
      if (simulatorTimerRef.current) clearTimeout(simulatorTimerRef.current)
    }
  }, [dryRun, submitDanmaku])

  useEffect(() => {
    saveConfig(config)
  }, [config])

  useEffect(() => {
    return () => {
      if (planTimerRef.current) clearTimeout(planTimerRef.current)
      if (simulatorTimerRef.current) clearTimeout(simulatorTimerRef.current)
    }
  }, [])

  const updateConfig = useCallback((patch: Partial<PipelineConfig>) => {
    setConfig((c) => ({ ...c, ...patch }))
  }, [])

  return {
    config,
    updateConfig,
    feed,
    queue,
    processingId,
    streamer,
    dryRun,
    setDryRun,
    submitDanmaku,
    eventLog,
  }
}
