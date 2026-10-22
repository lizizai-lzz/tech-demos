# AGENTS.md — Vidu 实时数字人直播间：一键拉起指南（给 AI 编程代理执行）

> 读者：在主人自己电脑上运行的 AI 编程代理（Claude Code / Cursor / Codex 等）。
> 目标：把开源项目 [garycaogan/ai-live-avatar](https://github.com/garycaogan/ai-live-avatar)（MIT，固定在提交 `5559ec5440c93814737155183dbe832df0b9f215`）+ Vidu S2 实时数字人 API 在本机跑起来，先做**全部免费检查**，再在看门狗保护下做一次**短时付费**开播。
> 平台：macOS（首选，上游作者的环境）或 Linux。所有命令都在本目录（`apps/vidu-live-avatar/`）下执行，除非另有说明。
> 请从上到下执行。唯一需要停下来问人的地方是第 0 节列出的两样东西，以及第 6 节付费开播前的一次确认。

---

## ⛔ 代理硬性规则（Hard rules for agents）——任何时候都必须遵守

1. **绝不打印、回显、记录或提交 API Key / 密码。** 不要 `cat`、`echo`、`head` `~/.deepsea/` 下的任何文件；Key 只允许存在于环境变量 `VIDU_API_KEY` 或文件 `~/.deepsea/vidu/api.key`（权限 600）里，不要让人类把 Key 贴进聊天。检查 Key 只用 `test -s` 和 `grep -q '^vda_'`。
2. **真实（付费）会话之前必须先启动看门狗。** 用 `scripts/start.sh real`（它会先跑网络检查、确认舞台页在线、启动看门狗，然后才开播）。如果改用工作台按钮开播，必须先在另一个终端运行 `python3 scripts/watchdog.py --wait 300`，看到 `armed` 再点按钮。
3. **开始计费 20 秒内没出画面就立即停止。** 看门狗会自动做；如果你在盯着，发现预览一直是「画面连接中…」，马上执行 `scripts/stop.sh`。
4. **绝不让会话无人值守地运行。** 测完立刻 `scripts/stop.sh`。你（代理）要结束任务/退出前，先运行 `scripts/stop.sh` 并确认状态为 `ended`/`idle`。
5. **保持预算上限。** 不要调高 `config.json` 里的 `safety.max_session_minutes`（默认 3）和 `safety.budget_credits`（默认 400 ≈ ¥12.5），也不要调高看门狗 `HARD_LIMIT`（默认 90 秒），除非主人明确要求并且人在场。
6. **免费检查没全部通过，就不要付费开播。** 尤其是 `stun_check.py` 为 FAIL 时（网络没有 UDP），开播只会烧钱不出画面——这是我们实测踩过的坑。
7. **不要抓取抖音/任何直播平台网页**来获取弹幕；只能用平台官方开放接口。
8. 不要把主人的形象图、录屏、`config.json`、`~/.deepsea/` 提交到任何仓库。

---

## 0. 需要人类提供的东西（只有两样）

| 项目 | 说明 | 你怎么拿到 |
| --- | --- | --- |
| **Vidu API Key** | `vda_` 开头，来自 [Vidu 开放平台](https://platform.vidu.cn)，账号要有积分 | 先检查是否已存在：`test -s ~/.deepsea/vidu/api.key && grep -q '^vda_' ~/.deepsea/vidu/api.key && echo KEY_OK`。不存在时请人类二选一：① 在你的终端环境里 `export VIDU_API_KEY=...`（不要让人贴进聊天）；② macOS 上人类先复制 Key，再运行 `mkdir -p ~/.deepsea/vidu && pbpaste > ~/.deepsea/vidu/api.key && chmod 600 ~/.deepsea/vidu/api.key` |
| **一张形象图** | 单人、正面、近景/半身；没有水印/文字/Logo；衣着不暴露 | 问人类要本机路径，记为 `AVATAR_IMAGE`。脚本会自动裁成 1.2:1 半身图 |

可选：OBS 的 WebSocket 密码（只有走 OBS 路线才需要，见第 8 节）。

如果主人还没给形象图或 Key，**照样把第 1–5 节做完**（免费），最后再问。

---

## 1. 前置检查

```bash
python3 -c 'import sys; print(sys.version); assert sys.version_info >= (3, 11), "need python>=3.11"'
git --version && curl --version | head -1
ffmpeg -hide_banner -encoders 2>/dev/null | grep -E 'libx264|^ A.* aac ' || echo "ffmpeg 缺失或缺编码器（只影响内置推流/录制）"
```

缺什么就装什么：

- macOS：`brew install python@3.13 ffmpeg git`；OBS（可选）`brew install --cask obs`
- Ubuntu/Debian：`sudo apt install -y python3 python3-venv git curl ffmpeg`（Python < 3.11 时装 `python3.12 python3.12-venv`，再 `export PYTHON=python3.12`）；OBS（可选）用 Flathub 版 `flatpak install flathub com.obsproject.Studio`（发行版自带的 OBS 常常缺浏览器源）

国内网络慢时可选：`export PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple`；GitHub 克隆失败可以重试，或设 `UPSTREAM_URL` 为镜像地址。

## 2. 一键安装（幂等，可重复运行）

```bash
cd apps/vidu-live-avatar          # 已在本目录则跳过
chmod +x setup.sh scripts/*.sh
AVATAR_IMAGE="/path/to/photo.png" ./setup.sh
# 如果 Key 通过环境变量提供：VIDU_API_KEY 已 export 即可，setup.sh 会写入 ~/.deepsea/vidu/api.key (600) 且不打印
```

`setup.sh` 做的事：克隆上游到 `./ai-live-avatar` 并检出固定提交 → 建 `.venv` 装依赖 → 运行上游 `tools/fetch_vendor.sh` 下载并校验阿里云 RTC 网页 SDK（版权原因不随仓库分发）→ 应用 `patches/*.patch` → 复制人设 `personas/zizai-demo.md` → 用 `config.template.json` 生成 `ai-live-avatar/config.json` → 写 Key（若给了）→ 裁形象图（若给了）。

可选环境变量（生成配置时生效；已有 config.json 时要加 `FORCE_CONFIG=1`）：

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `PROFILE_KEY` | `zizai-demo` | 角色 ID，形象图存为 `assets/avatars/<PROFILE_KEY>.jpg` |
| `PROFILE_NAME` | `自在` | 角色名（人设里的 `{name}`） |
| `VOICE` | `Qiao` | Vidu 系统音色（活泼妹妹音）；全部音色：`curl -s http://127.0.0.1:28900/api/voices` |
| `BUDGET_CREDITS` | `400` | 单场积分上限 |
| `MAX_SESSION_MINUTES` | `3` | 单场时长上限 |

期望输出末尾：`[setup] done.`，且看到 `patch applied`/`patch already applied`、`rtc sdk: ok`、`[config] wrote ...`、`[avatar] ... (ratio 1.20)`。

**裁完图要看一眼**（代理可直接读图片）：`ai-live-avatar/assets/avatars/zizai-demo.jpg` 应该是单人、肩膀到胸口、看不到腰腹、没有水印。不满意可以调整裁切位置重跑：

```bash
ai-live-avatar/.venv/bin/python scripts/prepare_avatar.py "/path/to/photo.png" --name zizai-demo \
  --out-dir ai-live-avatar/assets/avatars --bottom 0.60   # bottom 越小越靠上（默认 0.65）
```

## 3. 启动服务

```bash
scripts/start.sh server
curl -s --noproxy '*' http://127.0.0.1:28900/api/state | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['status'], d['profile'], 'has_api_key=', d['has_api_key'], 'output=', d['output_mode'])"
```

期望：`idle zizai-demo has_api_key= True output= local`（`has_api_key=False` 说明 Key 还没放好——放好后 `scripts/stop.sh all && scripts/start.sh server` 重启）。
工作台：<http://127.0.0.1:28900/workbench>（macOS：`open http://127.0.0.1:28900/workbench`；Linux：`xdg-open ...`）。服务日志：`logs/server.log`。

## 4. 免费检查 ①：空跑（不调用 Vidu，不花钱）

```bash
scripts/start.sh dry
```

期望：`live` → `ended` → `[dry] OK`。

## 5. 免费检查 ②：WebRTC 网络（最重要）

数字人的音视频走阿里云 RTC（WebRTC），**必须有 UDP 出口**。没有 UDP 或流量被代理/海外隧道接管时，会话照样计费，但画面永远停在「画面连接中…」，浏览器控制台还会误报 CORS 错误（我们在云端机器上实测踩坑，见 TROUBLESHOOTING.md）。

```bash
python3 scripts/stun_check.py; echo "exit=$?"
```

- `exit=0` 且有 `PASS ... srflx(public) x.x.x.x` → 通过。
- `exit=2` → UDP 通但有警告（设置了代理环境变量 / 阿里云 CDN 走了美国节点 / DNS 是 198.18.x.x 假 IP）。按提示处理后再测。
- `exit=1` → **FAIL：禁止付费开播**。处理办法：用普通的**中国大陆网络**（家宽/公司网/手机热点均可）；关闭 Clash/Surge 等的「全局/TUN/增强模式」，或至少让 `*.alivecdn.com`、`*.aliyuncs.com`、`*.vidu.cn` 和 UDP 直连；不要在海外服务器/云沙箱上跑。

再用**即将开播的那个浏览器**做一次 ICE 探测（确认浏览器本身能拿到 srflx 候选）：

```bash
open scripts/ice_probe.html        # macOS；Linux 用 xdg-open scripts/ice_probe.html
```

页面显示 `PASS host=… srflx=≥1` 才算通过；页面标题会变成 `ICE PASS`/`ICE FAIL`。走 OBS 路线时，也可以临时把这个文件作为 OBS 浏览器源（本地文件）加载来测 OBS 内置浏览器。

## 6. 付费开播（只在第 4、5 节全部通过后）

费用：**1.5 积分/秒，1 积分 = ¥0.03125**（≈ ¥0.047/秒，≈ ¥169/小时）。看门狗兜底：没画面最多烧约 20 秒（≈30 积分 ≈ ¥0.94），默认最长 90 秒（≈135 积分 ≈ ¥4.2）。

开播前**问主人一句**：「现在开一场约 90 秒的付费测试（最多约 ¥4.2），可以吗？」得到同意再继续。

1. 让舞台页占住 RTC 席位（服务要求有页面在线才开播）：
   - 本地预览模式（默认 `output=local`）：打开 `http://127.0.0.1:28900/workbench` → 左侧「直播间」→ 确认角色「自在」、模型 `vidu-s2` → 预览区保持连接（不要点「断开预览」）。
   - OBS 模式：见第 8 节，OBS 里的浏览器源会占席位。
2. 开播（脚本依次：网络检查 → 确认 Key → 确认舞台页在线 → **启动看门狗** → `POST /api/session/start {"dry_run": false}` → 前台跟踪直到结束）：

   ```bash
   scripts/start.sh real
   ```

   想多演示一会儿（仍在 3 分钟上限内）：`HARD_LIMIT=170 scripts/start.sh real`。
3. 期望看到：`[watchdog] billing started` → 几秒内 `[watchdog] video received after X s`（= 舞台页收到数字人画面）→ 到时自动停止，`[real] final: ended ...`。
   - 出现 `STOP: no '舞台页收到数字人画面' within 20s` → 网络问题，回到第 5 节，**不要反复重试**。
   - `start failed: ... AuditSubmitIllegal` 或 `avatar is still processing` → 见 TROUBLESHOOTING.md。
4. 期间可发模拟弹幕测试互动：

   ```bash
   curl -s --noproxy '*' -X POST http://127.0.0.1:28900/api/danmaku -H 'Content-Type: application/json' -d '{"user":"观众A","text":"你好呀，今天穿的是什么？","gift":0}'
   ```

## 7. 停止

```bash
scripts/stop.sh          # 停当前会话（免费，随时可以运行，重复运行也安全）
scripts/stop.sh all      # 停会话 + 看门狗 + 服务
```

结束任务前务必确认：`curl -s --noproxy '*' http://127.0.0.1:28900/api/state | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])"` 输出 `ended` 或 `idle`（或服务已停止）。

## 8. 可选：接 OBS

1. 装 OBS 30+（见第 1 节），打开 OBS → 工具 → WebSocket 服务器设置 → 勾选启用，端口 `4455`，开启身份验证并设置密码。请人类把密码通过环境变量交给你，然后：

   ```bash
   OBS_WS_PASSWORD="(人类提供，不要回显)" ./setup.sh     # 写入 ~/.deepsea/obs/ws.password (600)
   ```

2. 把服务输出切到 OBS，并一键搭场景（竖屏 1080×1920，场景「AI 直播间」：背景 → 数字人画面 `http://127.0.0.1:28900/stage?obs=1&role=obs&layer=avatar` → 弹幕叠层 `http://127.0.0.1:28900/stage?overlay=1`）：

   ```bash
   curl -s --noproxy '*' -X POST http://127.0.0.1:28900/api/output -H 'Content-Type: application/json' -d '{"mode":"obs"}'
   cd ai-live-avatar && .venv/bin/python tools/obs_control.py setup && .venv/bin/python tools/obs_control.py status; cd ..
   # 抖音横屏版（1296×1080，左下角真人摄像头）：.venv/bin/python tools/obs_control.py setup douyin --camera FaceTime
   # 截图检查：.venv/bin/python tools/obs_control.py shot /tmp/obs-scene.png
   ```

   切回本地预览：`-d '{"mode":"local"}'`。输出模式决定谁能占唯一的 RTC 席位：`local`→工作台预览，`obs`→OBS 浏览器源。
3. 没有独立显卡/无 GPU 的 Linux：OBS 设置 → 高级 → 关闭「浏览器源硬件加速」，否则浏览器源是黑/空白的。
4. 本套件的补丁 `patches/0001-obs-vcam-604.patch` 让 `obs_control.py` 在没有虚拟摄像头设备时（错误码 604）不中断。
5. OBS 被强杀后再次启动卡在「检测到崩溃」对话框：删除 OBS 配置目录下 `.sentinel/run_*` 文件再启动（见 TROUBLESHOOTING.md）。
6. 开播仍然用 `scripts/start.sh real`（它会检查 OBS 浏览器源已占住席位）。

## 9. 抖音说明

- 画面交给抖音直播伴侣：OBS 虚拟摄像头（`tools/obs_control.py vcam start`，macOS 首次需在系统设置允许 OBS 摄像头扩展），或在直播伴侣里抓 OBS 投影窗口；有第三方推流权限也可直接在 OBS 填推流地址。虚拟摄像头不带声音，需要直播伴侣另外采集系统声音。
- **弹幕不会自动进来**：需要申请抖音开放平台的直播互动接口，再把弹幕 POST 到 `http://127.0.0.1:28900/api/danmaku`。**不要抓取直播间网页。**
- 叠层里的「AI 实时生成画面」标识是平台对 AI 数字人直播的要求，保留它。
- 公开直播前要把 `max_session_minutes`/`budget_credits` 调到合适值——这需要主人明确决定，代理不得自行调高。

## 10. 文件速查

| 路径 | 作用 |
| --- | --- |
| `setup.sh` | 一键安装（幂等） |
| `scripts/start.sh server\|dry\|real` / `scripts/stop.sh [all]` | 启停 |
| `scripts/watchdog.py` | 积分看门狗：计费 20 秒无画面 / 90 秒硬上限 / 卡在创建 60 秒 → 自动停 |
| `scripts/stun_check.py`、`scripts/ice_probe.html` | 免费网络检查 |
| `scripts/prepare_avatar.py` | 形象图裁成 1.2:1 半身 |
| `scripts/render_config.py`、`config.template.json` | 生成 `ai-live-avatar/config.json` |
| `personas/zizai-demo.md` | 人设（`{name}` 会替换成角色名） |
| `patches/` | 对上游的本地补丁 |
| `TROUBLESHOOTING.md` | 实测问题与解法 |
| `ai-live-avatar/`（运行后生成，git 忽略） | 上游代码、`.venv`、`config.json`、`assets/avatars/`、`logs/` |
