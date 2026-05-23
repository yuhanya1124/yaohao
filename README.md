# yaohao

[![npm version](https://img.shields.io/npm/v/yaohao.svg)](https://www.npmjs.com/package/yaohao)
[![npm downloads](https://img.shields.io/npm/dm/yaohao.svg)](https://www.npmjs.com/package/yaohao)
[![CI](https://github.com/GuangyuZhan/yaohao/actions/workflows/ci.yml/badge.svg)](https://github.com/GuangyuZhan/yaohao/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/node/v/yaohao.svg)](https://nodejs.org/)

国内城市车牌摇号 CLI 工具 —— 让人类和 AI Agent 都能在终端做资格自检、查询摇号形势、订阅开奖结果与政策变化。

支持城市：**北京** · **广州** · **深圳** · **杭州**

> ⚠️ **不保证持续可用**：本工具依赖各城官方公告页结构，官网改版可能导致部分功能失效。Issue 跟踪修复，无 SLA 承诺。

## 安装

```bash
npm install -g yaohao
```

要求 Node.js >= 20。

## 快速开始

```bash
# 1. 初始化（交互式选默认城市 / 指标类型 / 申请人类型）
yaohao init

# 2. 看本年关键日历（窗口期、摇号日）
yaohao calendar                    # 默认城市
yaohao calendar --city shenzhen    # 指定城市

# 3. 自己能不能摇号
yaohao eligibility --city beijing

# 4. 当期形势
yaohao market --city guangzhou

# 5. 订阅开奖 + 政策推送
yaohao notify add bark://your-bark-key
yaohao watch result --city beijing    # 首次记录历史，下次起检测新增
yaohao cron setup                     # 写 crontab，默认每天 9:00 检查
```

## 城市能力矩阵

| 命令 | 北京 | 广州 | 深圳 | 杭州 |
|---|---|---|---|---|
| `calendar` 关键日历 | ✅ | ✅ | ✅ | ✅ |
| `eligibility` 资格自检 | ✅ | ✅ | ✅ | ✅ |
| `market` 形势播报 | ✅ 含 PDF 中签率 | ✅ HTML 字段 | ✅ HTML 字段 | ✅ HTML 字段 |
| `watch result` 开奖订阅 | ✅ | ✅ | ✅ | ✅ |
| `watch policy` 政策订阅 | ✅ | ✅ | ✅ | ✅ |
| `watch window` 窗口期订阅 | ✅ | ✅ | ✅ | ✅ |

各城节奏差异：

| 城市 | 申请窗口 | 摇号日 |
|---|---|---|
| 北京 | 每年 1/1-3/8、8/1-10/8 | 4 月、12 月 |
| 广州 | 每月 12 日截止 | 每月 25 日 |
| 深圳 | 每月 8 日截止（9 日入次月） | 每月 26 日 |
| 杭州 | 每月 1-8 日申报 | 每月 26 日 + 阶梯摇号年度专场 |

## 命令参考

### 全局选项

所有命令支持 `--city <beijing|guangzhou|shenzhen|hangzhou>`，缺省走 `yaohao init` 设置的默认城市。

### `calendar` 关键日历

```bash
yaohao calendar [--city <city>] [--year <year>]
```

输出：当前及未来几个月的关键日期（申请截止 / 资格审核 / 摇号日）+ 距离今天的天数。

### `eligibility` 资格自检

```bash
yaohao eligibility [--city <city>]
```

交互式问答：户籍类型 → 年龄 → 驾照 → 名下车牌 → 现有指标 → 社保（非户籍）→ 家庭/阶梯/人才（按城市差异）。

输出：能不能摇号、能摇哪类（普通/新能源/混合动力/家庭等）。

### `market` 形势播报

```bash
yaohao market [--city <city>] [--no-pdf] [--no-cache] [--json]
```

输出：当期申请人数、配置数量、中签率（北京含 PDF 解析的精确数字）、相关公告链接。

### `watch` 订阅

```bash
yaohao watch result   [--city <city>] [--no-notify] [--no-cache] [--json]   # 开奖结果
yaohao watch policy   [--city <city>]                                        # 政策变化
yaohao watch window   [--city <city>]                                        # 申请窗口/资格审核
```

首次运行只记录当前历史不推送；后续运行检测新增并通过通知渠道推送。

### `init` / `set` / `notify` / `cron`

```bash
yaohao init                                # 交互式初始化
yaohao init --city beijing --reg-type PTC --apply-type person --notify <url>

yaohao set default-city <city>             # 改默认城市
yaohao set reg-type <PTC|XNY>              # 改指标类型
yaohao set apply-type <person|family>      # 改申请人类型

yaohao notify add <url>                    # 添加通知渠道
yaohao notify remove <url>
yaohao notify test

yaohao cron setup [--schedule '0 9 * * *'] # 一键写 crontab
yaohao cron status
yaohao cron remove
```

通知 URL 兼容 [Apprise](https://github.com/caronc/apprise) 格式，支持 Bark / Telegram / 钉钉 / 企微 / 飞书 / Slack / Webhook。

## v1 不支持

以下命令在 v1 不实现（出于隐私和合规考虑，工具不持有用户密码）：

| 命令 | 提示 |
|---|---|
| `status` / `family` / `result` / `history` / `waitlist` | 本人账号查询请直接登录各城官网 |
| `watch renewal` / `watch expiry` / `watch ranking` | 同上 |

## 配置

存储在 `~/.yaohao/config.json`，`yaohao init` 自动创建。缓存在 `~/.yaohao/cache/`。

## AI Agent

Skill 文件位于 `skills/yaohao/SKILL.md`，触发关键词包括：摇号、指标、申请编码、家庭摇号、新能源指标、阶梯、中签、北京/广州/深圳/杭州买车等。

```bash
npx skills add yaohao -g
```

## 边界

- **仅用公开数据**：所有数据来自各城官方公告页（公开 HTML + PDF），不调用任何需要登录的接口
- **不持有用户密码**：所有配置仅存本地，请求直连官方域名，不经任何第三方中转
- **不做任何写入操作**：不替用户提交申请、不修改身份信息、不代他人查询
- **MIT 开源 + 无变现**

## 致谢

- [`fichas/cross_beijing_cli`](https://github.com/fichas/cross_beijing_cli) — 进京证 CLI，本项目脚手架来源
- [`JimmyLiang-lzm/BJJTW_Get`](https://github.com/JimmyLiang-lzm/BJJTW_Get) — 北京交通委接口参考
- [`sml2h3/ddddocr`](https://github.com/sml2h3/ddddocr) — 验证码识别模型

## License

MIT
