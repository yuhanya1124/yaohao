import { fetchHtml } from '../_shared/crawl.js';
import { parseListPage, parseDetailPage } from './parse.js';
import { URLS, SYSTEM_URL } from './constants.js';

const MAX_CACHE_AGE = 5 * 60 * 1000;

async function fetchList(opts = {}) {
  const useCache = opts.cache !== false;
  const page = await fetchHtml(URLS.tzggList, { useCache, maxCacheAgeMs: MAX_CACHE_AGE });
  return parseListPage(page.html, URLS.tzggList);
}

export async function extractMarketMetrics(opts = {}) {
  try {
    const useCache = opts.cache !== false;
    const items = await fetchList(opts);

    const cfg = items.find((i) => i.kind === 'config_notice' && /配置数量/.test(i.title));
    const result = items.find((i) => i.kind === 'result');
    const audit = items.find((i) => i.kind === 'qualify_review');

    const detailsToParse = [cfg, result, audit].filter(Boolean);
    const detailMetrics = {};
    for (const it of detailsToParse) {
      try {
        const page = await fetchHtml(it.url, { useCache });
        const d = parseDetailPage(page.html, it.url);
        detailMetrics[it.kind] = { ...d.metrics, title: d.title, url: it.url, date: it.date };
      } catch {}
    }

    const cfgM = detailMetrics.config_notice || {};
    const resM = detailMetrics.result || {};
    const totalAlloc = cfgM.totalAlloc ?? resM.totalAlloc ?? null;
    const personalAlloc = cfgM.personalAlloc ?? resM.personalAlloc ?? null;
    const unitAlloc = cfgM.unitAllocNum ?? resM.unitAllocNum ?? null;
    const lotteryAlloc = cfgM.lotteryAlloc ?? resM.lotteryAlloc ?? null;
    const biddingAlloc = cfgM.biddingAlloc ?? resM.biddingAlloc ?? null;

    const data = {
      city: 'hangzhou',
      period: cfg?.period?.label || result?.period?.label || null,
      source: SYSTEM_URL,
      latestConfig: cfg ? { date: cfg.date, title: cfg.title, url: cfg.url } : null,
      latestResult: result ? { date: result.date, title: result.title, url: result.url } : null,
      latestAudit: audit ? { date: audit.date, title: audit.title, url: audit.url } : null,
      alloc: { total: totalAlloc, personal: personalAlloc, unit: unitAlloc, lottery: lotteryAlloc, bidding: biddingAlloc },
      details: detailMetrics,
    };

    const lines = [];
    lines.push(`杭州小客车摇号 ${data.period || '当期'} 形势播报`);
    lines.push(`数据来源: ${SYSTEM_URL}`);
    lines.push('');
    if (cfg) {
      lines.push(`【最新配置数量公告】${cfg.date}`);
      lines.push(`  ${cfg.title}`);
      lines.push(`  ${cfg.url}`);
    }
    if (result) {
      lines.push('');
      lines.push(`【最新摇号结果】${result.date}`);
      lines.push(`  ${result.title}`);
      lines.push(`  ${result.url}`);
    }
    if (audit) {
      lines.push('');
      lines.push(`【最新资格审核结果】${audit.date}`);
      lines.push(`  ${audit.title}`);
      lines.push(`  ${audit.url}`);
    }
    if (totalAlloc || personalAlloc || unitAlloc || lotteryAlloc || biddingAlloc) {
      lines.push('');
      lines.push('【本期配置指标】');
      if (totalAlloc) lines.push(`  总配置: ${fmt(totalAlloc)}`);
      if (personalAlloc) lines.push(`  个人:   ${fmt(personalAlloc)}`);
      if (unitAlloc) lines.push(`  单位:   ${fmt(unitAlloc)}`);
      if (lotteryAlloc) lines.push(`  其中摇号: ${fmt(lotteryAlloc)}`);
      if (biddingAlloc) lines.push(`  其中竞价: ${fmt(biddingAlloc)}`);
    }
    lines.push('');
    lines.push('提示：杭州业务已迁移至"浙里办"APP / 浙江政务服务网');
    lines.push('每月 26 日摇号；阶梯摇号每年举办一次（累计摇号 24 次以上可参与）');
    return { ok: true, data, lines };
  } catch (err) {
    return {
      ok: false,
      error: `杭州数据抓取失败: ${err.message}`,
      lines: [`错误: ${err.message}`, '', `请直接访问 ${SYSTEM_URL}`],
    };
  }
}

export const watchTargets = {
  result: {
    desc: '杭州摇号结果',
    async fetch(opts = {}) {
      const items = await fetchList(opts);
      return items.filter((i) => i.kind === 'result' || i.kind === 'config_notice');
    },
  },
  policy: {
    desc: '杭州政策变化',
    async fetch(opts = {}) {
      const items = await fetchList(opts);
      return items.filter((i) => i.kind === 'quota' || i.kind === 'faq' || i.kind === 'penalty');
    },
  },
  window: {
    desc: '杭州申请窗口/资格审核',
    async fetch(opts = {}) {
      const items = await fetchList(opts);
      return items.filter((i) => i.kind === 'qualify_review' || i.kind === 'calendar_notice');
    },
  },
};

function fmt(n) {
  if (n == null) return '未知';
  if (typeof n === 'number') return n.toLocaleString('zh-CN');
  return String(n);
}
