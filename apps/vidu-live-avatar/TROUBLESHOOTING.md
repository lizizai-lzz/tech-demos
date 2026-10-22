# TROUBLESHOOTING — 实测踩过的坑

以下都是我们真实遇到的问题（2026-10，在一台云端 Linux 机器 + Vidu S2 `env=cn` 上）。

## 1. 开播报错 `AuditSubmitIllegal`（形象图没过 Vidu 内容审核）

- 现象：`POST /api/session/start` 返回错误，信息里有 `AuditSubmitIllegal`。不计费。
- 原因：第一张汉服形象图是全身竖图，露腰腹，右下角还有「豆包AI生成」水印，被 Vidu 审核拒绝。
- 解决：裁成 **1.2:1 横构图半身**（肩膀到胸口，不露腰腹，没有水印/文字），第二次就通过了：

  ```bash
  ai-live-avatar/.venv/bin/python scripts/prepare_avatar.py /path/to/photo.png --name zizai-demo --out-dir ai-live-avatar/assets/avatars
  ```

  裁切逻辑：竖图保留全宽，高度 = 宽/1.2，裁切框底边在原图高度约 65% 处（`--bottom` 可调），原图底部（水印常在的地方）一定会被裁掉。换图后**重启服务**（`scripts/stop.sh all && scripts/start.sh server`）。还不过就换一张更保守的图（单人、正面、衣着得体、背景干净）。

## 2. 报 `avatar is still processing`

- 原因：新形象图第一次上传到 Vidu 后需要处理时间（几十秒）。
- 解决：等 60 秒再开播一次，不要连续狂点。

## 3. 计费了但预览一直「画面连接中…」，控制台报 CORS（`r5-rtcsub.media-sh.alivecdn.com`）

- 现象：会话状态到了 `waiting_stage`/`live`，Vidu 那边对话正常（服务端日志里有字幕和回复），但浏览器/OBS 里没有画面和声音；控制台显示对 `alivecdn.com` rtcsub 的请求 "blocked by CORS policy" 或 "Failed to fetch"；房间日志里音视频订阅状态停在 2（subscribing）约 86 秒后掉回 1；没有出现「舞台页收到数字人画面」。
- **真正原因是网络，不是 CORS，也不是代码**：
  1. 机器没有 UDP 出口（STUN 全部超时，ICE 只有 `host` 候选，没有 `srflx`），WebRTC 媒体通道连不上；
  2. 浏览器被强制走 HTTP 代理 / 系统走隧道（DNS 解析成 198.18.x.x 假 IP，阿里云 CDN 从美国节点响应）；
  3. CDN 对预检（OPTIONS）请求返回 403（`X-Tengine-Error: denied by req auth`），Chrome 把任何非 2xx 的预检都报成 CORS 错误。改 origin、http/https、SDK 参数都没用。
- 解决：在**中国大陆的普通网络**上跑（家宽/公司网/手机热点），关闭代理的全局/TUN/增强模式，或让 `*.alivecdn.com`、`*.aliyuncs.com`、`*.vidu.cn` 及 UDP 直连。付费前必须 `python3 scripts/stun_check.py` 为 PASS，并且 `scripts/ice_probe.html` 在开播用的浏览器里显示 `srflx>=1`。
- 预防：始终用 `scripts/start.sh real`（自带看门狗），20 秒无画面自动停，最多损失约 ¥0.94。

## 4. 舞台页提示「现在的输出方式是…」，不入会

- 原因：同一时间只有一个页面能占 RTC 席位，由输出方式决定：`local`→工作台预览（`/stage?embed=1`），`obs`→OBS 浏览器源（`role=obs`），`builtin`→内置推流。
- 解决：切到你要用的那一路：

  ```bash
  curl -s --noproxy '*' -X POST http://127.0.0.1:28900/api/output -H 'Content-Type: application/json' -d '{"mode":"local"}'   # 或 "obs"
  ```

## 5. OBS 浏览器源一片空白/黑屏（无 GPU 机器）

- 原因：OBS 内置浏览器（CEF）的 GPU 进程在没有显卡的机器上崩溃。
- 解决：OBS 设置 → 高级 → 取消「启用浏览器源硬件加速」，重启 OBS（对应 `global.ini`/`user.ini` 里 `BrowserHWAccel=false`）。Linux 上用 Flathub 版 OBS（`com.obsproject.Studio`），发行版自带的 OBS 常缺浏览器源插件；无显卡时可加 `--env=LIBGL_ALWAYS_SOFTWARE=1` 启动。

## 6. OBS 启动卡在「检测到崩溃 / Crash Detected」对话框

- 原因：OBS 上次被强制结束，留下了 sentinel 文件。
- 解决：删除 `.sentinel/run_*` 后再启动（或启动参数加 `--disable-shutdown-check`）：
  - macOS：`~/Library/Application Support/obs-studio/.sentinel/`
  - Linux：`~/.config/obs-studio/.sentinel/`；Flatpak：`~/.var/app/com.obsproject.Studio/config/obs-studio/.sentinel/`

## 7. `obs_control.py` 报 GetVirtualCamStatus 错误 604 后退出

- 原因：机器上没有虚拟摄像头设备（Linux 没装 v4l2loopback，或 macOS 没允许 OBS 摄像头扩展）。
- 解决：`setup.sh` 已应用 `patches/0001-obs-vcam-604.patch`，接受 604。真要用虚拟摄像头时：macOS 系统设置里允许 OBS 摄像头扩展；Linux `sudo apt install v4l2loopback-dkms`。

## 8. 其他

- `has_api_key: false`：Key 文件不存在/为空，或改完没重启服务。检查（不打印内容）：`test -s ~/.deepsea/vidu/api.key && grep -q '^vda_' ~/.deepsea/vidu/api.key && echo KEY_OK`。
- `start.sh real` 提示 `no stage page holds the RTC seat`：先打开工作台「直播间」保持预览连接（local），或开着 OBS 场景（obs）。
- 工作台角色列表里有上游示例 `xiaoshen`，本机没有它的图，忽略即可，用 `zizai-demo`。
- 本机 `curl` 访问 127.0.0.1 也走了代理：脚本都加了 `--noproxy '*'`，自己调接口时也加上。
- 看门狗退出码：0 会话自然结束，2 看门狗主动停止，3 等待超时没开播，4 服务不可达（仍会尝试停止）。
