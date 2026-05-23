// 北京交通委公告站解析层：把 HTML 字符串转成结构化数据。
// 零依赖，纯正则。

/* ---------- 通用工具 ---------- */

export function stripTags(html) {
  if (!html) return '';
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/g, ' ')
       .replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&ldquo;|&rdquo;/g, '"')
       .replace(/&lsquo;|&rsquo;/g, "'")
       .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  s = s.replace(/[ \t]+/g, ' ')
       .replace(/\n\s*\n+/g, '\n')
       .trim();
  return s;
}

export function normalizeNumberLike(s) {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[，]/g, ',')
    .replace(/[．]/g, '.')
    .replace(/[％]/g, '%');
}

/* ---------- 列表页：jggb / xwzz / bszn 同一套模板 ---------- */

export function parseListPage(html, baseUrl) {
  const items = [];
  const sectionMatch = /<div\s+class="subpage_list">([\s\S]*?)<\/div>\s*(?:<div\s+class="pageturn"|<\/div>)/i.exec(html);
  const scope = sectionMatch ? sectionMatch[1] : html;

  const ddRe = /<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  for (const m of scope.matchAll(ddRe)) {
    const block = m[1];
    const aMatch = /<a\s+class="text"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    const dMatch = /<span\s+class="date">([\s\S]*?)<\/span>/i.exec(block);
    if (!aMatch) continue;
    const rawTitle = stripTags(aMatch[2]);
    const url = absUrl(aMatch[1], baseUrl);
    const date = dMatch ? stripTags(dMatch[1]) : null;
    const period = extractPeriod(rawTitle);
    const kind = classifyTitle(rawTitle);
    items.push({ title: rawTitle, date, url, period, kind });
  }
  return items;
}

export function parsePagination(html, baseUrl) {
  const block = /<div\s+class="pageturn">([\s\S]*?)<\/div>/i.exec(html);
  if (!block) return { current: 1, totalPages: 1 };
  const seg = block[1];
  const cur = /当前第(\d+)页/.exec(seg);
  const total = /共(\d+)页/.exec(seg);
  const next = /<a\s+href="([^"]+)"[^>]*>下一页<\/a>/i.exec(seg);
  return {
    current: cur ? Number(cur[1]) : 1,
    totalPages: total ? Number(total[1]) : 1,
    nextUrl: next ? absUrl(next[1], baseUrl) : null,
  };
}

function extractPeriod(title) {
  const m = /(20\d{2})年(?:第)?\s*([一二三四五六七八九十0-9]+)\s*期/.exec(title);
  if (!m) return null;
  const cnNum = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  const year = Number(m[1]);
  const rawNo = m[2];
  const no = /^\d+$/.test(rawNo) ? Number(rawNo) : cnNum[rawNo] ?? null;
  return no == null ? null : { year, no, label: `${year}年第${no}期` };
}

function classifyTitle(t) {
  if (/配置结果/.test(t)) return 'result';
  if (/申请审核结果和配置工作/.test(t)) return 'config_notice';
  if (/亲属关系和婚姻状况核查/.test(t)) return 'family_check';
  if (/资格审核结果/.test(t)) return 'qualify_review';
  if (/指标配额/.test(t)) return 'quota';
  if (/买卖|出租|承租|出借|借用/.test(t)) return 'penalty';
  if (/十问十答|温馨提示/.test(t)) return 'faq';
  return 'other';
}

/* ---------- 详情页：subpage_article ---------- */

export function parseDetailPage(html, url) {
  const article =
    /<div\s+class="subpage_article">([\s\S]*?)<div\s+class="clearboth">/i.exec(html);
  const scope = article ? article[1] : html;

  const titleM = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(scope);
  const title = titleM ? stripTags(titleM[1]) : null;

  const h4M = /<h4[^>]*>([\s\S]*?)<\/h4>/i.exec(scope);
  const h4Text = h4M ? stripTags(h4M[1]) : '';
  const dateText = /发布日期[：:]\s*([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日)/.exec(h4Text)?.[1] || null;
  const dateIso = dateText ? cnDateToIso(dateText) : null;

  const attachments = [];
  const aRe = /<a[^>]+href="([^"]+\.(?:pdf|docx?|xlsx?|zip))"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of scope.matchAll(aRe)) {
    attachments.push({
      url: absUrl(m[1], url),
      name: stripTags(m[2]).replace(/^下载/, '').trim() || basename(m[1]),
    });
  }

  const bodyText = stripTags(scope);
  const metrics = extractMetricsFromText(bodyText);

  return {
    url,
    title,
    dateText,
    dateIso,
    bodyText,
    attachments,
    metrics,
  };
}

/* ---------- 字段抽取器：从中文段落里捞数字 ---------- */

export function extractMetricsFromText(rawText) {
  const text = normalizeNumberLike(rawText.replace(/\s+/g, ' '));
  const r = {};

  const fam = /家庭普通小客车指标申请共?计?\s*([\d,]+)\s*个?有效编码/.exec(text);
  if (fam) r.familyApplyCount = num(fam[1]);
  const per = /个人普通小客车指标申请共?计?\s*([\d,]+)\s*个?有效编码/.exec(text);
  if (per) r.personalApplyCount = num(per[1]);
  const uni = /单位普通小客车指标申请共?计?\s*([\d,]+)\s*家/.exec(text);
  if (uni) r.unitApplyCount = num(uni[1]);

  const famPerAlloc = /家庭(?:和|与)个人普通小客车指标共?计?\s*([\d,]+)\s*个/.exec(text);
  if (famPerAlloc) r.familyPersonAlloc = num(famPerAlloc[1]);
  const unitAlloc = /配置单位普通小客车指标\s*([\d,]+)\s*个/.exec(text);
  if (unitAlloc) r.unitAlloc = num(unitAlloc[1]);

  const nevFam = /家庭新能源小客车指标申请共?计?\s*([\d,]+)/.exec(text);
  if (nevFam) r.familyNevApplyCount = num(nevFam[1]);
  const nevPer = /个人新能源小客车指标申请共?计?\s*([\d,]+)/.exec(text);
  if (nevPer) r.personalNevApplyCount = num(nevPer[1]);
  const nevWait =
    /新能源(?:小客车)?指标(?:轮候|排队)(?:.*?)(?:约|预计)?\s*([\d.]+)\s*年/.exec(text);
  if (nevWait) r.nevWaitYears = Number(nevWait[1]);

  const minScore =
    /家庭(?:摇号)?(?:最低)?中签(?:家庭)?(?:积分|分值)(?:为|是|:|：)\s*([\d.]+)/.exec(text) ||
    /家庭(?:摇号)?(?:积分|分值)(?:最低|不低于).*?([\d.]+)\s*分/.exec(text);
  if (minScore) r.familyMinScore = Number(minScore[1]);

  const pRate = /个人(?:普通(?:小客车)?指标)?中签率(?:约)?(?:为|是|:|：)?\s*([\d.]+%|1[/／]\d+)/.exec(text);
  if (pRate) r.personalRate = pRate[1];
  const uRate = /单位(?:普通(?:小客车)?指标)?中签率(?:约)?(?:为|是|:|：)?\s*([\d.]+%|1[/／]\d+)/.exec(text);
  if (uRate) r.unitRate = uRate[1];

  const bl = /共有\s*([\d,]+)\s*个失信被执行人/.exec(text);
  if (bl) r.blackListCount = num(bl[1]);

  // 配置结果 PDF 里的关键字段
  const validEncode = /有效编码总数[：:]\s*([\d,]+)/.exec(text);
  if (validEncode) r.validEncodeCount = num(validEncode[1]);
  const baseSeed = /基数序号总数[：:]\s*([\d,]+)/.exec(text);
  if (baseSeed) r.baseSeedTotal = num(baseSeed[1]);
  const allocTotal = /指标配置总数[：:]\s*([\d,]+)/.exec(text);
  if (allocTotal) r.allocTotal = num(allocTotal[1]);
  const randSeed = /指标配置种子数[：:]\s*([\d,]+)/.exec(text);
  if (randSeed) r.randomSeed = num(randSeed[1]);

  return r;
}

/* ---------- 小工具 ---------- */

function num(s) {
  return Number(String(s).replace(/,/g, ''));
}

function cnDateToIso(s) {
  const m = /(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(s);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

function absUrl(href, base) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function basename(p) {
  return String(p).split(/[\\/]/).pop() || p;
}
