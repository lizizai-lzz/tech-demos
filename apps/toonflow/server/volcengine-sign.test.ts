import { describe, expect, test } from "bun:test"
import {
  buildVolcengineAuthorization,
  canonicalQueryString,
} from "./volcengine-sign"

describe("volcengine sign", () => {
  test("canonical query string sorts keys", () => {
    expect(
      canonicalQueryString({ Version: "2022-08-31", Action: "CVSync2AsyncSubmitTask" })
    ).toBe("Action=CVSync2AsyncSubmitTask&Version=2022-08-31")
  })

  test("authorization header shape", () => {
    const date = new Date("2024-07-20T10:39:39.000Z")
    const body =
      '{"force_single":false,"max_ratio":3,"min_ratio":0.33,"prompt":"生成一张天空的图片","req_key":"jimeng_t2i_v40","scale":0.5,"size":4194304}'
    const { authorization, amzDate, payloadHash } = buildVolcengineAuthorization({
      method: "POST",
      path: "/",
      query: { Action: "CVSync2AsyncSubmitTask", Version: "2022-08-31" },
      headers: {
        host: "visual.volcengineapi.com",
        "content-type": "application/json",
      },
      body,
      accessKeyId: "Your AK",
      secretAccessKey: "Your SK",
      region: "cn-beijing",
      service: "cv",
      date,
    })

    expect(amzDate).toBe("20240720T103939Z")
    expect(payloadHash).toMatch(/^[a-f0-9]{64}$/)
    expect(authorization.startsWith("HMAC-SHA256 Credential=Your AK/")).toBe(true)
    expect(authorization).toContain("SignedHeaders=")
    expect(authorization).toContain("Signature=")
  })
})
