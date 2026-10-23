import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"
import {
  credentialsFromEnv,
  jimengPollUntilDone,
  jimengSubmitTask,
  mockJimengResult,
  parseJimengKeyHeader,
  type JimengSubmitBody,
} from "./jimeng-volcengine.ts"

async function readJsonBody(
  req: IncomingMessage
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf-8")
  if (!raw.trim()) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
}

async function handleJimengGenerate(
  req: IncomingMessage,
  res: ServerResponse,
  kind: "image" | "video"
) {
  try {
    const body = await readJsonBody(req)
    const mock = body.mock === true || process.env.JIMENG_MOCK === "1"
    const creds =
      parseJimengKeyHeader(req.headers["x-toonflow-jimeng-key"] as string) ??
      credentialsFromEnv()

    if (mock) {
      const mocked = mockJimengResult(kind)
      sendJson(res, 200, { ok: true, mock: true, ...mocked })
      return
    }

    if (!creds) {
      sendJson(res, 401, {
        error:
          "缺少即梦凭证：请在设置中填写 AK/SK，或设置环境变量 JIMENG_ACCESS_KEY_ID / JIMENG_SECRET_ACCESS_KEY；演示可传 mock:true",
      })
      return
    }

    const submit: JimengSubmitBody = {
      req_key: String(body.req_key ?? ""),
      prompt: String(body.prompt ?? ""),
    }
    if (body.aspect_ratio) submit.aspect_ratio = String(body.aspect_ratio)
    if (typeof body.frames === "number") submit.frames = body.frames
    if (Array.isArray(body.image_urls)) {
      submit.image_urls = body.image_urls.map(String)
    }
    if (!submit.req_key || !submit.prompt) {
      sendJson(res, 400, { error: "req_key 与 prompt 必填" })
      return
    }

    const taskId = await jimengSubmitTask(creds, submit)
    const result = await jimengPollUntilDone(creds, submit.req_key, taskId, {
      maxAttempts: kind === "video" ? 60 : 45,
    })
    sendJson(res, 200, { ok: true, taskId, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "即梦代理错误"
    sendJson(res, 502, { error: message })
  }
}

export function jimengProxyPlugin(): Plugin {
  return {
    name: "toonflow-jimeng-proxy",
    configureServer(server) {
      server.middlewares.use("/api/jimeng/image", (req, res, next) => {
        if (req.method !== "POST") {
          next()
          return
        }
        void handleJimengGenerate(req, res, "image")
      })
      server.middlewares.use("/api/jimeng/video", (req, res, next) => {
        if (req.method !== "POST") {
          next()
          return
        }
        void handleJimengGenerate(req, res, "video")
      })
    },
  }
}
