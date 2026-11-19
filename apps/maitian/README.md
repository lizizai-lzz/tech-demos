# 麦田 · 七平台内容运营大屏（空跑演示）

本目录是 [tech-demos](https://github.com/lizizai-lzz/tech-demos) 中的 **dry-run / 空跑** 单页应用，交互形态灵感来自开源项目 [麦田 mdldm-maitian](https://github.com/CzzzzzzJ/mdldm-maitian)，但**不克隆上游仓库、不登录任何平台、不使用 Chrome 扩展 / CDP / 自动发布或采集**；所有数字与文案均为本地虚构 fixture。

## 功能概览

- **大屏**：七平台粉丝汇总、30 日净增堆叠柱、规则生成的「数据分析」、平台卡与当期播放
- **日历**：排期与状态（已发布 / 已定时 / 等你点发布 / 计划中）
- **单期复盘**：分平台数据表、第 1/3/7 天同龄倍率、分平台播放走势
- **转化**：渠道表与每期漏斗（播放 → 注册 → 会员 → 收入）
- **流量 / 档案**：播放矩阵与文案快照占位

## 运行

需安装 [Bun](https://bun.sh)。

```bash
cd apps/maitian
bun install
bun run dev
```

测试（粉丝合计、同龄对比、本地洞察规则）：

```bash
bun test
```

构建：

```bash
bun run build
```

## 说明

- 数据文件：`src/data/demo.json`
- 业务规则与洞察：`src/lib/analytics.ts`
- 实现计划见同目录 `PLAN.md`