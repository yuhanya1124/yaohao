// 广州公告页解析：jtzl.jtj.gz.gov.cn 首页含 <dl><dt><a><dd>YYYY-MM-DD</dd> 结构

import {
  stripTags,
  extractMetricsFromText as commonMetrics,
  cnDateToIso,
  isoFromUrlPath,
  absUrl,
  extractPeriod,
} from '../_shared/parseUtils.js';
import { classifyTitle } from '../_shared/titleClassify.js';

export function parseListPage(html, baseUrl) {
  const items = [];
  const dlRe = /<dl[^>]*>([\s\S]*?)<\/dl>/gi;
  for (const m of html.matchAll(dlRe)) {
    const block = m[1];
    const aMatch = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    const dateMatch = /<dd[^>]*>\s*(\d{4}-\d{1,2}-\d{1,2})\s*<\/dd>/i.exec(block);
    if (!aMatch) continue;
    const href = aMatch[1];
    if (!/\/index\/gbl\//i.test(href)) continue; // 只要公告页
    const title = stripTags(aMatch[2]);
    const date = dateMatch ? dateMatch[1] : (isoFromUrlPath(href) || null);
    items.push({
      title,
      date,
      url: absUrl(href, baseUrl),
      period: extractPeriod(title),
      kind: classifyTitle(title),
    });
  }
  return items;
}

export function parseDetailPage(html, url) {
  // 广州详情页正文区域大致用 .article 或 .content 类名
  let scope = html;
  const articleMatch =
    /<div[^>]+class="[^"]*(?:article|content|TRS_Editor)[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
  if (articleMatch) scope = articleMatch[1];

  const titleM = /<h1[^>]*>([\s\S]*?)<\/h1>|<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(html);
  const title = titleM ? stripTags(titleM[1] || titleM[2]) : null;

  const dateText = (/发布(?:日期|时间)[：:]\s*([0-9-/]+|\d{4}年\d{1,2}月\d{1,2}日)/.exec(html) || [])[1] || null;
  const dateIso = dateText
    ? (cnDateToIso(dateText) || (/^\d{4}-\d{1,2}-\d{1,2}/.test(dateText) ? dateText.replace(/\//g, '-') : null))
    : isoFromUrlPath(url);

  const attachments = [];
  const aRe = /<a[^>]+href="([^"]+\.(?:pdf|docx?|xlsx?|zip))"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(aRe)) {
    attachments.push({ url: absUrl(m[1], url), name: stripTags(m[2]).trim() });
  }

  const bodyText = stripTags(scope);
  const metrics = commonMetrics(bodyText);

  return { url, title, dateText, dateIso, bodyText, attachments, metrics };
}
