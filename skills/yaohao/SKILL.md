---
name: yaohao
version: 1.0.0
description: "国内城市车牌摇号 CLI：资格自检、关键日历、形势播报、开奖订阅、政策提醒。覆盖北京、广州、深圳、杭州。当用户提到摇号、指标、申请编码、家庭摇号、新能源指标、阶梯、中签、京牌/粤A/深圳籍/浙A、北京/广州/深圳/杭州买车等关键词时触发。"
---

# yaohao 国内城市车牌摇号 CLI

帮助用户通过命令行查询和订阅国内 4 城（北京、广州、深圳、杭州）的小客车摇号公开数据。

## 安装检测

```bash
which yaohao
```

如未安装：

```bash
npm install -g yaohao
```

## 支持的城市

| 城市 | --city 值 | 节奏 |
|---|---|---|
| 北京 | `beijing` | 半年制：1/1-3/8、8/1-10/8 申请，4/12 月摇号 |
| 广州 | `guangzhou` | 月度：每月 12 日截止申请，25 日摇号 |
| 深圳 | `shenzhen` | 月度：每月 8 日截止申请，26 日摇号 |
| 杭州 | `hangzhou` | 月度 + 阶梯：每月 26 日摇号，阶梯摇号每年一次 |

## 核心命令

所有命令支持 `--city <city>` 切换城市，缺省走默认城市。

### 资格自检

```bash
yaohao eligibility --city <city>
```

交互式问答：户籍 / 年龄 / 驾照 / 名下车牌 / 社保（非户籍）等，输出能不能摇号、能摇哪类。

### 关键日历

```bash
yaohao calendar --city <city>
```

输出当前及未来几个月的申请截止 / 摇号日，附"距今天还有 N 天"。

### 形势播报

```bash
yaohao market --city <city>
```

输出当期申请人数、配置指标、中签率（北京含 PDF 解析的精确数字）、最新公告链接。

### 订阅推送

```bash
yaohao watch result --city <city>    # 开奖结果
yaohao watch policy --city <city>    # 政策变化
yaohao watch window --city <city>    # 申请窗口 / 资格审核
```

首次运行只记录历史，下次起检测新增并通过通知渠道推送。

## 初始化检测

```bash
yaohao init   # 没初始化时提示用户跑这个
```

也支持非交互式：

```bash
yaohao init --city beijing --reg-type PTC --apply-type person
```

## 通知渠道

```bash
yaohao notify add <url>     # URL 格式兼容 Apprise: bark://, tgram://, dingtalk://, wecom://, feishu://, slack://
yaohao notify test
```

## 定时

```bash
yaohao cron setup           # 默认每天 9:00 检查公告
yaohao cron status
yaohao cron remove
```

## 用户场景示例

### 场景 A：刚来北京 / 广州 / 深圳 / 杭州，想知道能不能摇号

```bash
yaohao eligibility --city beijing
yaohao calendar --city beijing
```

### 场景 B：已经在摇，想被开奖结果通知

```bash
yaohao notify add bark://xxx
yaohao watch result --city shenzhen
yaohao cron setup
```

### 场景 C：政策可能要变，想被通知

```bash
yaohao watch policy --city guangzhou
```

## 边界

- v1 仅做公开数据查询和推送，**不做任何登录态查询**（不持有用户密码，不查本人状态/排名）
- 本人申请状态请直接登录各城官网：
  - 北京：https://apply.jtw.beijing.gov.cn/apply/
  - 广州：https://jtzl.jtj.gz.gov.cn/
  - 深圳：https://xqctk.jtys.sz.gov.cn/
  - 杭州：https://hzxkctk.cn/（或浙里办 APP）
- 不保证持续可用 —— 依赖官方公告页结构，改版可能导致部分功能失效
