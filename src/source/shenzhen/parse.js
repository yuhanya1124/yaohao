// 深圳公告解析：xqctk.jtys.sz.gov.cn/gbl/ 结构与杭州/北京一致
// <dd><a class="text" href>...</a><span class="date">YYYY-MM-DD</span></dd>

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
  const ddRe = /<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  for (const m of html.matchAll(ddRe)) {
    const block = m[1];
    const aMatch = /<a\s+class="text"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    const dMatch = /<span\s+class="date">([\s\S]*?)<\/span>/i.exec(block);
    if (!aMatch) continue;
    const title = stripTags(aMatch[2]);
    const date = dMatch ? stripTags(dMatch[1]) : (isoFromUrlPath(aMatch[1]) || null);
    items.push({
      title,
      date,
      url: absUrl(aMatch[1], baseUrl),
      period: extractPeriod(title),
      kind: classifyTitle(title),
    });
  }
  return items;
}

export function parseDetailPage(html, url) {
  let scope = html;
  const articleMatch =
    /<div[^>]+class="[^"]*(?:article|content|TRS_Editor|main_content|subpage_article)[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
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
