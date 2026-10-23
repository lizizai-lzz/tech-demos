import type { ModelSettings } from "@/lib/model-settings"

export class ChatCompletionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ChatCompletionError"
  }
}

function chatUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "")
  if (trimmed.endsWith("/chat/completions")) return trimmed
  return `${trimmed}/chat/completions`
}

export async function chatCompletionJson<T>(
  settings: ModelSettings,
  system: string,
  user: string
): Promise<T> {
  const res = await fetch(chatUrl(settings.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.modelId,
      temperature: settings.temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new ChatCompletionError(
      `模型请求失败（${res.status}）${text ? `：${text.slice(0, 200)}` : ""}`
    )
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new ChatCompletionError("模型返回为空")
  }

  try {
    return JSON.parse(content) as T
  } catch {
    throw new ChatCompletionError("无法解析模型 JSON 输出")
  }
}
