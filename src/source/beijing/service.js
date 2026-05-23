// 北京摇号公告抓取 + 形势数据汇总
import { fetchHtml } from './crawl.js';
import { parseListPage, parseDetailPage } from './parse.js';
import { extractPdfMetrics } from './pdfExtract.js';
import { URLS } from './constants.js';

// market 命令：抓最近一期 config_notice + 两个 result PDF，输出形势数据
export async function extractMarketMetrics(opts = {}) {
  const useCache = opts.cache !== false;
  const withPdf = opts.pdf !== false;

  const listPage = await fetchHtml(URLS.announceList, {
    useCache,
    maxCacheAgeMs: 5 * 60 * 1000,
  });
  const items = parseListPage(listPage.html, URLS.announceList);

  const cfg = items.find((i) => i.kind === 'config_notice');
  if (!cfg) {
    return {
      ok: false,
      error: '未找到"申请审核结果和配置工作"通告',
      lines: ['错误：未找到"申请审核结果和配置工作"通告'],
    };
  }

  const cfgDetail = parseDetailPage(
    (await fetchHtml(cfg.url, { useCache })).html,
    cfg.url,
  );
  const cfgM = cfgDetail.metrics;

  const periodLabel = cfg.period?.label;
  const results = items.filter(
    (i) => i.kind === 'result' && i.period?.label === periodLabel,
  );
  const familyPersonResult = results.find((r) => /家庭和个人/.test(r.title));
  const unitResult = results.find((r) => /单位/.test(r.title));

  let familyPersonPdf = null;
  let unitPdf = null;
  let familyPersonPdfM = {};
  let unitPdfM = {};

  if (familyPersonResult) {
    const d = parseDetailPage(
      (await fetchHtml(familyPersonResult.url, { useCache })).html,
      familyPersonResult.url,
    );
    familyPersonPdf = d.attachments.find((a) => /\.pdf$/i.test(a.url))?.url ?? null;
  }
  if (unitResult) {
    const d = parseDetailPage(
      (await fetchHtml(unitResult.url, { useCache })).html,
      unitResult.url,
    );
    unitPdf = d.attachments.find((a) => /\.pdf$/i.test(a.url))?.url ?? null;
  }

  if (withPdf) {
    if (familyPersonPdf) {
      try { familyPersonPdfM = await extractPdfMetrics(familyPersonPdf); }
      catch (err) { familyPersonPdfM = { _error: err.message }; }
    }
    if (unitPdf) {
      try { unitPdfM = await extractPdfMetrics(unitPdf); }
      catch (err) { unitPdfM = { _error: err.message }; }
    }
  }

  const unitAlloc = unitPdfM.allocTotal ?? cfgM.unitAlloc ?? null;
  const unitValid = unitPdfM.validEncodeCount ?? null;
  const unitRate = unitAlloc != null && unitValid
    ? `${(unitAlloc / unitValid * 100).toFixed(3)}% (${unitAlloc.toLocaleString()}/${unitValid.toLocaleString()})`
    : null;

  const fpAlloc = familyPersonPdfM.allocTotal ?? cfgM.familyPersonAlloc ?? null;
  const fpApply = (cfgM.familyApplyCount ?? 0) + (cfgM.personalApplyCount ?? 0);
  const fpRate = fpAlloc != null && fpApply > 0
    ? `${(fpAlloc / fpApply * 100).toFixed(3)}% (${fpAlloc.toLocaleString()}/${fpApply.toLocaleString()}) 理论值，实际家庭按积分确定中签`
    : null;

  const data = {
    period: periodLabel,
    source: cfg.url,
    publishDate: cfgDetail.dateIso,
    apply: {
      family: cfgM.familyApplyCount ?? null,
      personal: cfgM.personalApplyCount ?? null,
      unit: cfgM.unitApplyCount ?? null,
    },
    alloc: {
      familyAndPersonal: fpAlloc,
      unit: unitAlloc,
    },
    rate: {
      familyAndPersonal: fpRate,
      unit: unitRate,
    },
    pdfMetrics: { familyPerson: familyPersonPdfM, unit: unitPdfM },
    attachments: { familyPerson: familyPersonPdf, unit: unitPdf },
    familyMinScore: 'N/A (官方未在结构化字段中公布)',
    nev: { waitYears: cfgM.nevWaitYears ?? null },
    blackListCount: cfgM.blackListCount ?? null,
  };

  const lines = [];
  lines.push(`北京小客车摇号 ${data.period || '当期'} 形势播报`);
  lines.push(`公告: ${data.source}`);
  lines.push(`发布: ${data.publishDate || '未知'}`);
  lines.push('');
  lines.push('【有效申请编码】（来源：HTML 通告）');
  lines.push(`  家庭: ${fmt(data.apply.family)}`);
  lines.push(`  个人: ${fmt(data.apply.personal)}`);
  lines.push(`  单位: ${fmt(data.apply.unit)} 家`);
  if (unitValid) {
    lines.push(`  单位（PDF 有效编码总数，按企业规模/纳税倍率）: ${fmt(unitValid)}`);
  }
  lines.push('');
  lines.push('【本期配置指标】');
  lines.push(`  家庭+个人（同池）: ${fmt(data.alloc.familyAndPersonal)}`);
  lines.push(`  单位: ${fmt(data.alloc.unit)}`);
  lines.push('');
  lines.push('【中签率】');
  lines.push(`  家庭+个人: ${data.rate.familyAndPersonal || 'N/A'}`);
  lines.push(`  单位:      ${data.rate.unit || 'N/A'}`);
  lines.push('');
  lines.push('【家庭摇号最低中签积分】');
  lines.push(`  ${data.familyMinScore}`);
  if (data.nev.waitYears != null) {
    lines.push('');
    lines.push(`【新能源轮候】预计 ${data.nev.waitYears} 年`);
  }
  if (data.blackListCount != null) {
    lines.push('');
    lines.push(`【失信限制】${fmt(data.blackListCount)} 人`);
  }
  if (!withPdf) {
    lines.push('');
    lines.push('(已跳过 PDF 解析，中签率使用 HTML 字段近似)');
  }
  return { ok: true, data, lines };
}

// watch 命令：fetch 候选 items 列表
export const watchTargets = {
  result: {
    desc: '开奖结果',
    async fetch(opts = {}) {
      const useCache = opts.cache !== false;
      const page = await fetchHtml(URLS.announceList, {
        useCache,
        maxCacheAgeMs: 5 * 60 * 1000,
      });
      const items = parseListPage(page.html, URLS.announceList);
      return items.filter((i) => i.kind === 'result' || i.kind === 'config_notice');
    },
  },
  policy: {
    desc: '政策变化',
    async fetch(opts = {}) {
      const useCache = opts.cache !== false;
      const page = await fetchHtml(URLS.policyList, {
        useCache,
        maxCacheAgeMs: 5 * 60 * 1000,
      });
      return parseListPage(page.html, URLS.policyList);
    },
  },
  window: {
    desc: '申请窗口开放',
    async fetch(opts = {}) {
      const useCache = opts.cache !== false;
      const [a, b] = await Promise.all([
        fetchHtml(URLS.announceList, { useCache, maxCacheAgeMs: 5 * 60 * 1000 }),
        fetchHtml(URLS.guideList, { useCache, maxCacheAgeMs: 5 * 60 * 1000 }),
      ]);
      const aItems = parseListPage(a.html, URLS.announceList)
        .filter((i) => i.kind === 'quota' || i.kind === 'qualify_review');
      const bItems = parseListPage(b.html, URLS.guideList);
      return [...aItems, ...bItems];
    },
  },
};

function fmt(n) {
  if (n == null) return '未知';
  if (typeof n === 'number') return n.toLocaleString('zh-CN');
  return String(n);
}
