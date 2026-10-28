export type SourceId = 'internet' | 'task' | 'memory' | 'files'

export type AgentDef = {
  id: string
  name: string
  nameZh: string
  accent: string
}

export type ToolDef = {
  id: string
  name: string
}

export type MeshEdge = {
  id: string
  agentId: string
  toolId: string
}

export const SOURCES: { id: SourceId; label: string; labelZh: string }[] = [
  { id: 'internet', label: 'INTERNET', labelZh: '互联网' },
  { id: 'task', label: 'TASK', labelZh: '任务' },
  { id: 'memory', label: 'MEMORY', labelZh: '记忆' },
  { id: 'files', label: 'FILES', labelZh: '文件' },
]

export const AGENTS: AgentDef[] = [
  { id: 'web_researcher', name: 'Web Researcher', nameZh: '网页研究员', accent: '#22d3ee' },
  { id: 'lead_finder', name: 'Lead Finder', nameZh: '线索挖掘', accent: '#fb923c' },
  { id: 'price_checker', name: 'Price Checker', nameZh: '比价员', accent: '#c084fc' },
  { id: 'pdf_reader', name: 'PDF Reader', nameZh: 'PDF 阅读', accent: '#60a5fa' },
  { id: 'memory_keeper', name: 'Memory Keeper', nameZh: '记忆管家', accent: '#fbbf24' },
  { id: 'cms_publisher', name: 'CMS Publisher', nameZh: 'CMS 发布', accent: '#f87171' },
  { id: 'social_writer', name: 'Social Writer', nameZh: '社媒写手', accent: '#e879f9' },
  { id: 'data_analyst', name: 'Data Analyst', nameZh: '数据分析师', accent: '#38bdf8' },
  { id: 'fact_checker', name: 'Fact Checker', nameZh: '事实核查', accent: '#fb7185' },
  { id: 'risk_checker', name: 'Risk Checker', nameZh: '风控审查', accent: '#2dd4bf' },
  { id: 'code_runner', name: 'Code Runner', nameZh: '代码执行', accent: '#ef4444' },
  { id: 'email_drafter', name: 'Email Drafter', nameZh: '邮件起草', accent: '#a78bfa' },
  { id: 'seo_auditor', name: 'SEO Auditor', nameZh: 'SEO 审计', accent: '#f97316' },
  { id: 'market_scanner', name: 'Market Scanner', nameZh: '市场扫描', accent: '#14b8a6' },
  { id: 'qa_verifier', name: 'QA Verifier', nameZh: 'QA 验证', accent: '#dc2626' },
]

const TOOL_NAMES = [
  'feed.search',
  'link.parse',
  'pdf.merge',
  'sql.query',
  'email.fetch',
  'x.scan',
  'vector.parse',
  'repo.diff',
  'html.strip',
  'json.validate',
  'cache.get',
  'cache.set',
  'webhook.post',
  'slack.notify',
  'notion.page',
  'drive.read',
  'drive.write',
  'image.ocr',
  'audio.transcribe',
  'geo.lookup',
  'price.compare',
  'crm.upsert',
  'ads.bid',
  'seo.rank',
  'sitemap.crawl',
  'dns.resolve',
  'tls.check',
  'hash.sha256',
  'sign.verify',
  'token.mint',
  'graph.traverse',
  'embed.search',
  'chunk.split',
  'rerank.topk',
  'prompt.render',
  'tool.invoke',
  'sandbox.exec',
  'git.clone',
  'git.push',
  'ci.trigger',
  'log.tail',
  'metric.emit',
  'trace.span',
  'alert.fire',
  'ticket.create',
  'calendar.block',
  'sheet.append',
  'doc.export',
  'zip.unpack',
  'virus.scan',
  'pii.redact',
  'lang.detect',
  'translate.batch',
  'sentiment.score',
  'topic.cluster',
  'anomaly.flag',
  'forecast.run',
  'schema.infer',
  'csv.stream',
  'parquet.read',
  's3.list',
  'blob.put',
  'queue.enqueue',
  'queue.dequeue',
  'rate.limit',
  'auth.scope',
  'oauth.refresh',
  'secret.rotate',
  'config.reload',
  'feature.flag',
  'ab.assign',
  'payment.capture',
  'invoice.gen',
  'tax.calc',
  'contract.parse',
  'legal.review',
  'compliance.check',
  'backup.snap',
  'restore.point',
  'mesh.ping',
  'agent.handoff',
  'plan.decompose',
  'task.schedule',
  'review.approve',
  'review.reject',
  'memory.compact',
  'memory.recall',
  'file.watch',
  'file.diff',
  'browser.open',
  'screenshot.take',
  'dom.query',
  'form.fill',
  'captcha.solve',
  'proxy.rotate',
  'ip.geo',
  'whois.lookup',
  'rss.poll',
  'news.cluster',
  'stock.quote',
  'crypto.price',
  'weather.now',
  'map.route',
  'email.index',
  'inbox.sort',
  'spam.filter',
  'draft.send',
  'thread.summarize',
  'meeting.notes',
  'slide.build',
  'chart.render',
  'table.pivot',
  'ml.predict',
  'model.warm',
  'gpu.alloc',
  'batch.flush',
]

export const TOOLS: ToolDef[] = TOOL_NAMES.map((name, i) => ({
  id: `tool_${i}`,
  name,
}))

/** 伪随机但稳定的边集合 */
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function buildMeshEdges(): MeshEdge[] {
  const rand = seededRandom(42)
  const edges: MeshEdge[] = []
  for (const agent of AGENTS) {
    const count = 10 + Math.floor(rand() * 6)
    const used = new Set<number>()
    for (let i = 0; i < count; i++) {
      let ti = Math.floor(rand() * TOOLS.length)
      let guard = 0
      while (used.has(ti) && guard++ < 20) {
        ti = Math.floor(rand() * TOOLS.length)
      }
      used.add(ti)
      const tool = TOOLS[ti]!
      edges.push({
        id: `${agent.id}__${tool.id}`,
        agentId: agent.id,
        toolId: tool.id,
      })
    }
  }
  return edges
}

export const EDGES = buildMeshEdges()

export const SOURCE_AGENT_BIAS: Record<SourceId, string[]> = {
  internet: ['web_researcher', 'lead_finder', 'market_scanner', 'seo_auditor'],
  task: ['project_mgr_proxy', 'qa_verifier', 'code_runner'],
  memory: ['memory_keeper', 'data_analyst', 'fact_checker'],
  files: ['pdf_reader', 'cms_publisher', 'email_drafter'],
}

// fix task bias - no project_mgr_proxy in agents, use real ids
SOURCE_AGENT_BIAS.task = ['qa_verifier', 'code_runner', 'data_analyst', 'risk_checker']
SOURCE_AGENT_BIAS.memory = ['memory_keeper', 'data_analyst', 'fact_checker', 'social_writer']
SOURCE_AGENT_BIAS.files = ['pdf_reader', 'cms_publisher', 'email_drafter', 'code_runner']

export const LOG_ACTIONS = [
  'route.dispatch',
  'tool.invoke',
  'mesh.handoff',
  'verify.pass',
  'cache.hit',
  'retry.backoff',
  'source.missing',
  'quota.check',
  'plan.step',
]

export const PROJECT_ID = 'global / night-ops-02'
