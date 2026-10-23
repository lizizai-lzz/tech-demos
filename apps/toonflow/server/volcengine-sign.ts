import { createHash, createHmac } from "node:crypto"

export interface SignRequestInput {
  method: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  body: string
  accessKeyId: string
  secretAccessKey: string
  region: string
  service: string
  date: Date
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest()
}

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex")
}

function formatAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "")
}

function formatDateStamp(date: Date): string {
  return formatAmzDate(date).slice(0, 8)
}

export function canonicalQueryString(query: Record<string, string>): string {
  return Object.keys(query)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join("&")
}

function buildCanonicalHeaders(headers: Record<string, string>): {
  canonical: string
  signedHeaders: string
} {
  const lowered = Object.entries(headers).map(([k, v]) => [
    k.toLowerCase(),
    v.trim().replace(/\s+/g, " "),
  ])
  lowered.sort((a, b) => a[0].localeCompare(b[0]))
  const signedHeaders = lowered.map(([k]) => k).join(";")
  const canonical = lowered.map(([k, v]) => `${k}:${v}`).join("\n") + "\n"
  return { canonical, signedHeaders }
}

/** 火山引擎 OpenAPI HMAC-SHA256 V4（cv / visual） */
export function buildVolcengineAuthorization(input: SignRequestInput): {
  authorization: string
  amzDate: string
  payloadHash: string
} {
  const amzDate = formatAmzDate(input.date)
  const dateStamp = formatDateStamp(input.date)
  const payloadHash = sha256Hex(input.body)

  const headersWithRequired = {
    ...input.headers,
    host: input.headers.host ?? "visual.volcengineapi.com",
    "x-content-sha256": payloadHash,
    "x-date": amzDate,
  }

  const { canonical: canonicalHeadersBlock, signedHeaders } =
    buildCanonicalHeaders(headersWithRequired)
  const canonicalRequest = [
    input.method.toUpperCase(),
    input.path,
    canonicalQueryString(input.query),
    canonicalHeadersBlock,
    signedHeaders,
    payloadHash,
  ].join("\n")

  const credentialScope = `${dateStamp}/${input.region}/${input.service}/request`
  const stringToSign = [
    "HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n")

  const kDate = hmacSha256(input.secretAccessKey, dateStamp)
  const kRegion = hmacSha256(kDate, input.region)
  const kService = hmacSha256(kRegion, input.service)
  const kSigning = hmacSha256(kService, "request")
  const signature = hmacSha256(kSigning, stringToSign).toString("hex")

  const authorization = [
    "HMAC-SHA256",
    `Credential=${input.accessKeyId}/${credentialScope},`,
    `SignedHeaders=${signedHeaders},`,
    `Signature=${signature}`,
  ].join(" ")

  return { authorization, amzDate, payloadHash }
}
