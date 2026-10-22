# vidu-live-avatar — AI 实时数字人直播间（一键套件）

把开源项目 [garycaogan/ai-live-avatar](https://github.com/garycaogan/ai-live-avatar)（Gary 曹淦，MIT 协议）和 [Vidu S2 实时数字人 API](https://platform.vidu.cn/vidu-stream/doc) 在自己电脑上跑起来的完整套件：一张形象图 + 一个 Vidu Key，就能得到一个会接弹幕、会说话的 AI 主播，可以只在本地预览，也可以接 OBS / 抖音直播伴侣。

**交给 AI 编程代理执行：👉 [AGENTS.md](./AGENTS.md)**（中文，按顺序执行即可，含免费预检和付费保护规则）。
遇到问题：[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。

## 套件里有什么

- `setup.sh`：克隆上游到固定提交 `5559ec5`、建虚拟环境、下载并校验阿里云 RTC SDK、打补丁、生成配置、写 Key、裁形象图。可重复运行。
- `scripts/`：启停脚本、**积分看门狗**（计费 20 秒没画面自动停，90 秒硬上限）、免费的 UDP/STUN 网络检查、浏览器 ICE 探测页、形象图 1.2:1 裁切。
- 我们自己的角色配置（「自在」，音色 Qiao，单场 3 分钟 / 400 积分上限）和人设。
- 不包含：任何密钥、主人的形象图和录屏、上游源码（运行时按固定提交克隆）、阿里云 RTC SDK（版权原因，由上游脚本从官方 CDN 下载）。

## 费用（Vidu 官方价）

1.5 积分/秒，1 积分 = ¥0.03125。

| 时长 | 积分 | 人民币 |
| --- | --- | --- |
| 看门狗兜底：20 秒无画面即停 | ≈30 | ≈¥0.94 |
| 1 分钟 | 90 | ≈¥2.81 |
| 看门狗默认上限 90 秒 | 135 | ≈¥4.22 |
| 3 分钟（实测一场 285 积分，含建连开销） | 270–285 | ≈¥8.4–8.9 |
| 1 小时 | 5400 | ≈¥169 |

## 最重要的一条经验

**网络必须有 UDP，最好是中国大陆的普通网络，并且 RTC 不走代理。** 我们在没有 UDP、流量走代理的云端机器上开过一场：照常计费，画面一直「画面连接中…」，浏览器还误报 CORS。所以套件把 `scripts/stun_check.py` 作为付费开播前的强制检查。

## 致谢

核心代码来自 [garycaogan/ai-live-avatar](https://github.com/garycaogan/ai-live-avatar)（MIT License, © Gary 曹淦），本目录只放安装脚本、配置、补丁和文档。数字人生成由 Vidu 提供；舞台页使用阿里云 RTC Web SDK（版权归阿里云）。
