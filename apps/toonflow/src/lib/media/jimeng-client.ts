import type { JimengConfig } from "@/lib/media/media-settings"
import { encodeJimengCredentials } from "@/lib/media/media-settings"

export interface JimengGenerateRequest {
  prompt: string
  reqKey: string
  aspectRatio?: string
  frames?: number
  imageUrls?: string[]
  mock?: boolean
}

export interface JimengGenerateResult {
  imageUrls: string[]
  videoUrl?: string
  mock?: boolean
}

export class JimengClientError extends Error {
  code: "proxy" | "config" | "api"

  constructor(message: string, code: "proxy" | "config" | "api") {
    super(message)
    this.name = "JimengClientError"
    this.code = code
  }
}

export async function jimengGenerateImage(
  jimeng: JimengConfig,
  req: JimengGenerateRequest
): Promise<JimengGenerateResult> {
  return callJimengEndpoint("/api/jimeng/image", jimeng, req)
}

export async function jimengGenerateVideo(
  jimeng: JimengConfig,
  req: JimengGenerateRequest
): Promise<JimengGenerateResult> {
  return callJimengEndpoint("/api/jimeng/video", jimeng, req)
}

async function callJimengEndpoint(
  path: string,
  jimeng: JimengConfig,
  req: JimengGenerateRequest
): Promise<JimengGenerateResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (jimeng.accessKeyId && jimeng.secretAccessKey) {
    headers["X-Toonflow-Jimeng-Key"] = encodeJimengCredentials(jimeng)
  }

  let res: Response
  try {
    res = await fetch(path, {
      method: "POST",
      headers,
      body: JSON.stringify({
        req_key: req.reqKey,
        prompt: req.prompt,
        aspect_ratio: req.aspectRatio ?? jimeng.aspectRatio,
        frames: req.frames ?? jimeng.frames,
        image_urls: req.imageUrls,
        mock: req.mock,
      }),
    })
  } catch {
    throw new JimengClientError(
      "无法连接本机即梦代理，请使用 bun run dev 启动（含 Vite 中间件）",
      "proxy"
    )
  }

  const json = (await res.json()) as {
    ok?: boolean
    error?: string
    imageUrls?: string[]
    videoUrl?: string
    mock?: boolean
  }

  if (!res.ok) {
    throw new JimengClientError(json.error ?? `即梦请求失败 (${res.status})`, "api")
  }
  return {
    imageUrls: json.imageUrls ?? [],
    videoUrl: json.videoUrl,
    mock: json.mock,
  }
}
