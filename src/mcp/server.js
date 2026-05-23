// yaohao MCP server：让支持 Model Context Protocol 的客户端
// （Claude Code / Claude Desktop / Cursor / Codex CLI / Continue / Cline 等）
// 自动识别 yaohao 的 4 城摇号查询能力。

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRequire } from 'node:module';
import { getSource, listImplemented, getCityLabel } from '../source/index.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

const CityEnum = z.enum(listImplemented());

const server = new McpServer({
  name: 'yaohao',
  version,
});

// --------------------------------------------------------------------------
// Tool 1: calendar
// --------------------------------------------------------------------------
server.registerTool(
  'yaohao_calendar',
  {
    title: '查询中国 4 城摇号关键日历',
    description:
      '查询北京 / 广州 / 深圳 / 杭州的小客车摇号关键日期（申请窗口、资格审核结果、摇号日）。' +
      '返回当前及未来几个月的日期及距今天数。' +
      '适用于"距下次申请还有几天"等问题。',
    inputSchema: {
      city: CityEnum.describe('城市标识，可选: beijing / guangzhou / shenzhen / hangzhou'),
      year: z.number().int().optional().describe('查询年份，默认当年（如 2026）'),
    },
  },
  async ({ city, year }) => {
    try {
      const source = getSource(city);
      const result = source.getCalendar(year);
      return { content: [{ type: 'text', text: result.lines.join('\n') }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `错误: ${err.message}` }], isError: true };
    }
  },
);

// --------------------------------------------------------------------------
// Tool 2: market
// --------------------------------------------------------------------------
server.registerTool(
  'yaohao_market',
  {
    title: '查询当前摇号形势（中签率 / 申请人数 / 配置数）',
    description:
      '查询最新一期摇号的申请人数、配置指标、中签率。' +
      '北京含 PDF 解析的精确中签率（如个人 0.295% / 单位 0.501%）。' +
      '广州 / 深圳 / 杭州只解析 HTML 字段。',
    inputSchema: {
      city: CityEnum.describe('城市标识'),
      no_pdf: z.boolean().optional().describe('跳过 PDF 解析（仅对北京有影响，更快但拿不到精确中签率）'),
    },
  },
  async ({ city, no_pdf }) => {
    try {
      const source = getSource(city);
      const result = await source.extractMarketMetrics({ pdf: !no_pdf });
      return {
        content: [{ type: 'text', text: result.ok ? result.lines.join('\n') : result.error }],
        isError: !result.ok,
      };
    } catch (err) {
      return { content: [{ type: 'text', text: `错误: ${err.message}` }], isError: true };
    }
  },
);

// --------------------------------------------------------------------------
// Tool 3: eligibility info
// --------------------------------------------------------------------------
server.registerTool(
  'yaohao_eligibility',
  {
    title: '查询摇号申请资格规则',
    description:
      '查询某个城市的摇号申请资格基本要求（户籍 / 居住证 / 社保 / 年龄等）。' +
      '不替用户做判定，返回规则说明。需要精确判定时让用户跑 `yaohao eligibility --city <city>` 交互式回答。',
    inputSchema: {
      city: CityEnum.describe('城市标识'),
    },
  },
  async ({ city }) => {
    const label = getCityLabel(city);
    const cityRules = {
      beijing: [
        `${label}摇号申请资格（简化版）：`,
        '',
        '1. 户籍类型必须是以下之一：',
        '   - 本市户籍居民（BSHJ）',
        '   - 驻京部队现役军人和现役武警（JJ）',
        '   - 持有效居住证的非本市户籍人员（ZZZ）',
        '   - 持北京市工作居住证人员（GZJZZ）',
        '2. 年满 18 周岁',
        '3. 持有有效机动车驾驶证',
        '4. 名下无京牌小客车',
        '5. 没有持有效的小客车指标',
        '6. 非本市户籍（ZZZ）需在京连续缴纳社保和个税满 5 年',
        '',
        '申请窗口：每年 1/1-3/8、8/1-10/8',
        '摇号日：每年 4 月、12 月各一次',
      ],
      guangzhou: [
        `${label}摇号申请资格（简化版）：`,
        '',
        '1. 户籍/居住类型必须是以下之一：',
        '   - 广州市户籍人员',
        '   - 驻穗武警 / 现役军人',
        '   - 港澳台居民 / 外国人永久居留 / 华侨',
        '   - 持有效《广东省居住证》（非穗籍需 24 个月连续社保）',
        '2. 年满 18 周岁',
        '3. 持有有效机动车驾驶证',
        '4. 名下无粤 A 牌小客车',
        '5. 累计参加摇号 72 次以上的个人可直接申领（不占额度）',
        '',
        '申请窗口：每月 12 日 24 时截止',
        '摇号日：每月 25 日',
      ],
      shenzhen: [
        `${label}摇号申请资格（简化版）：`,
        '',
        '1. 户籍/居住类型必须是以下之一：',
        '   - 深圳市户籍居民',
        '   - 驻深现役军人或现役武警',
        '   - 港澳台居民 / 外国人永久居留 / 华侨',
        '   - 持有效《深圳经济特区居住证》（普通指标需 24 个月连续社保，新能源已无此限制）',
        '2. 年满 18 周岁',
        '3. 持有有效机动车驾驶证',
        '4. 名下无深圳籍小汽车',
        '5. 2026 年 4-12 月实施阶梯摇号（累计 24 次未中升 1 阶）',
        '',
        '申请窗口：每月 8 日前申请当月、9 日及以后入下月',
        '摇号日：每月 26 日',
      ],
      hangzhou: [
        `${label}摇号申请资格（简化版）：`,
        '',
        '1. 户籍/居住类型必须是以下之一：',
        '   - 杭州市户籍居民',
        '   - 驻杭部队现役军人或现役武警',
        '   - 港澳台居民 / 外国人永久居留 / 华侨',
        '   - 持有效《浙江省居住证》（非杭籍需 24 个月连续社保）',
        '2. 年满 18 周岁',
        '3. 持有有效机动车驾驶证',
        '4. 名下无浙 A 牌小客车',
        '5. 累计摇号 24 次以上可参与阶梯摇号',
        '6. 多孩家庭 / 经认定人才可直接申领',
        '',
        '申请窗口：每月 1-8 日',
        '摇号日：每月 26 日',
        '业务已迁移至浙里办 APP / 浙江政务服务网',
      ],
    };
    const lines = cityRules[city] || [`${label}规则数据未收录，请访问官方系统。`];
    lines.push('');
    lines.push(`精确判定请让用户跑：yaohao eligibility --city ${city}`);
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// --------------------------------------------------------------------------
// Tool 4: watch (latest announcements)
// --------------------------------------------------------------------------
server.registerTool(
  'yaohao_watch',
  {
    title: '查询最新公告（开奖结果 / 政策 / 申请窗口）',
    description:
      '查询某城最新摇号相关公告列表。target=result（开奖结果）/ policy（政策变化）/ window（申请窗口、资格审核）。' +
      '返回最近 10 条公告的标题、日期、URL。',
    inputSchema: {
      city: CityEnum.describe('城市标识'),
      target: z
        .enum(['result', 'policy', 'window'])
        .describe('订阅目标：result=开奖结果 / policy=政策变化 / window=申请窗口或资格审核'),
    },
  },
  async ({ city, target }) => {
    try {
      const source = getSource(city);
      const watcher = source.watchTargets?.[target];
      if (!watcher) {
        return {
          content: [{ type: 'text', text: `${city} 不支持 watch ${target}` }],
          isError: true,
        };
      }
      const items = await watcher.fetch({});
      if (items.length === 0) {
        return { content: [{ type: 'text', text: `${getCityLabel(city)} 当前没有 ${target} 类型公告` }] };
      }
      const lines = items.slice(0, 10).map((i, idx) => {
        const date = i.date || '日期未知';
        return `${idx + 1}. [${date}] ${i.title}\n   ${i.url}`;
      });
      lines.unshift(`${getCityLabel(city)} 最新 ${Math.min(items.length, 10)} 条公告 (target=${target})：`);
      lines.unshift('');
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `错误: ${err.message}` }], isError: true };
    }
  },
);

// --------------------------------------------------------------------------
// Tool 5: list cities
// --------------------------------------------------------------------------
server.registerTool(
  'yaohao_list_cities',
  {
    title: '列出 yaohao 支持的所有城市',
    description: '查询当前 yaohao 工具支持哪些城市的摇号查询。',
    inputSchema: {},
  },
  async () => {
    const lines = ['yaohao 当前支持以下城市：', ''];
    for (const city of listImplemented()) {
      lines.push(`  - ${city} (${getCityLabel(city)})`);
    }
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// --------------------------------------------------------------------------
// Start
// --------------------------------------------------------------------------
const transport = new StdioServerTransport();
await server.connect(transport);
