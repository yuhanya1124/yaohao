# Changelog

## 1.0.2 — 2026-05-23

### 变更

- 仓库迁移到 https://github.com/yuhanya1124/yaohao（GitHub 用户名更新）。同步更新 `package.json` 的 `repository` / `homepage` / `bugs` 字段和 README badges。
- 旧 URL 通过 GitHub 301 重定向仍可访问，但建议使用新地址。

## 1.0.1 — 2026-05-23

### 修复

- `market --city beijing` PDF 解析时的 `standardFontDataUrl` 警告（pdfjs-dist 字体加载）。指定本地字体路径 + 禁用字体形状加载，stderr 现在干净。功能本身未受影响（中签率字段从 1.0.0 起就能正确解析）。

## 1.0.0 — 2026-05-23

首次发布。

### 新增

- **4 城支持**：北京、广州、深圳、杭州
- **公开数据命令**（无需登录）：
  - `eligibility` 资格自检（交互式问答）
  - `calendar` 关键日历（窗口期 / 摇号日，月度或半年节奏）
  - `market` 形势播报（申请数 / 配置数 / 中签率）
  - `watch result / policy / window` 公告订阅 + 通知推送
- **脚手架命令**：`init` / `set` / `notify` / `cron`
- **AI Agent Skill**：`skills/yaohao/SKILL.md` 触发关键词覆盖 4 城
- **PDF 解析**：北京中签率字段（pdfjs-dist）
- **SSL 兼容**：深圳证书链 + 杭州 legacy renegotiation 已绕过
- **通知渠道**：兼容 Apprise URL（Bark / 飞书 / 钉钉 / 企微 / Telegram / Slack）

### 边界

v1 不做的命令（不持有用户密码 = 无合规风险）：

- `status` `family` `result` `history` `waitlist`
- `watch renewal / expiry / ranking`

如需查询本人摇号状态，请直接登录各城官网。

### 致谢

- [`fichas/cross_beijing_cli`](https://github.com/fichas/cross_beijing_cli) — 脚手架来源
- [`JimmyLiang-lzm/BJJTW_Get`](https://github.com/JimmyLiang-lzm/BJJTW_Get) — 北京接口参考
