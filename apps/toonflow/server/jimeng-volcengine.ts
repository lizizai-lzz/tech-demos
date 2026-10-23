import { buildVolcengineAuthorization } from "./volcengine-sign.ts"

const HOST = "visual.volcengineapi.com"
const SERVICE = "cv"
const API_VERSION = "2022-08-31"

export interface JimengCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export interface JimengSubmitBody {
  req_key: string
  prompt: string
  aspect_ratio?: string
  frames?: number
  image_urls?: string[]
}

interface VolcResponse<T> {
  code?: number
  message?: string
  data?: T
  ResponseMetadata?: { Error?: { Message?: string } }
}

async function signedFetch(
  creds: JimengCredentials,
  action: string,
  body: Record<string, unknown>
): Promise<VolcResponse<Record<string, unknown>>> {
  const bodyStr = JSON.stringify(body)
  const query = { Action: action, Version: API_VERSION }
  const path = "/"
  const date = new Date()

  const { authorization, amzDate, payloadHash } = buildVolcengineAuthorization({
    method: "POST",
    path,
    query,
    headers: {
      host: HOST,
      "content-type": "application/json",
    },
    body: bodyStr,
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    region: creds.region,
    service: SERVICE,
    date,
  })

  const url = `https://${HOST}/?${new URLSearchParams(query).toString()}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Host: HOST,
      "X-Date": amzDate,
      "X-Content-Sha256": payloadHash,
    },
    body: bodyStr,
  })

  const json = (await res.json()) as VolcResponse<Record<string, unknown>>
  if (!res.ok) {
    const msg =
      json.message ??
      json.ResponseMetadata?.Error?.Message ??
      `HTTP ${res.status}`
    throw new Error(msg)
  }
  if (json.code !== undefined && json.code !== 10000) {
    throw new Error(json.message ?? `即梦 API 错误 code=${json.code}`)
  }
  return json
}

export async function jimengSubmitTask(
  creds: JimengCredentials,
  body: JimengSubmitBody
): Promise<string> {
  const payload: Record<string, unknown> = {
    req_key: body.req_key,
    prompt: body.prompt,
  }
  if (body.aspect_ratio) payload.aspect_ratio = body.aspect_ratio
  if (body.frames) payload.frames = body.frames
  if (body.image_urls?.length) payload.image_urls = body.image_urls

  const resp = await signedFetch(creds, "CVSync2AsyncSubmitTask", payload)
  const taskId = resp.data?.task_id
  if (typeof taskId !== "string" || !taskId) {
    throw new Error("即梦提交任务未返回 task_id")
  }
  return taskId
}

export async function jimengGetResult(
  creds: JimengCredentials,
  reqKey: string,
  taskId: string
): Promise<{ status: string; imageUrls: string[]; videoUrl?: string }> {
  const resp = await signedFetch(creds, "CVSync2AsyncGetResult", {
    req_key: reqKey,
    task_id: taskId,
    req_json: JSON.stringify({ return_url: true }),
  })
  const data = resp.data ?? {}
  const status = String(data.status ?? "generating")
  const imageUrls = Array.isArray(data.image_urls)
    ? (data.image_urls as string[])
    : []
  const videoUrl =
    typeof data.video_url === "string"
      ? data.video_url
      : Array.isArray(data.video_urls)
        ? (data.video_urls as string[])[0]
        : undefined
  return { status, imageUrls, videoUrl }
}

export async function jimengPollUntilDone(
  creds: JimengCredentials,
  reqKey: string,
  taskId: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<{ imageUrls: string[]; videoUrl?: string }> {
  const maxAttempts = options?.maxAttempts ?? 45
  const intervalMs = options?.intervalMs ?? 2000
  for (let i = 0; i < maxAttempts; i++) {
    const result = await jimengGetResult(creds, reqKey, taskId)
    if (result.status === "success") {
      return { imageUrls: result.imageUrls, videoUrl: result.videoUrl }
    }
    if (result.status === "failed") {
      throw new Error("即梦任务失败")
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error("即梦任务超时")
}

export function parseJimengKeyHeader(header: string | null | undefined): JimengCredentials | null {
  if (!header?.trim()) return null
  try {
    const json = Buffer.from(header, "base64").toString("utf-8")
    const parsed = JSON.parse(json) as { ak?: string; sk?: string; region?: string }
    if (!parsed.ak || !parsed.sk) return null
    return {
      accessKeyId: parsed.ak,
      secretAccessKey: parsed.sk,
      region: parsed.region?.trim() || "cn-north-1",
    }
  } catch {
    return null
  }
}

export function credentialsFromEnv(): JimengCredentials | null {
  const ak = process.env.JIMENG_ACCESS_KEY_ID
  const sk = process.env.JIMENG_SECRET_ACCESS_KEY
  if (!ak || !sk) return null
  return {
    accessKeyId: ak,
    secretAccessKey: sk,
    region: process.env.JIMENG_REGION?.trim() || "cn-north-1",
  }
}

export function mockJimengResult(kind: "image" | "video") {
  if (kind === "video") {
    return {
      imageUrls: [] as string[],
      videoUrl: "https://example.com/toonflow-mock-jimeng-clip.mp4",
    }
  }
  return {
    imageUrls: ["https://example.com/toonflow-mock-jimeng-frame.png"],
    videoUrl: undefined,
  }
}
