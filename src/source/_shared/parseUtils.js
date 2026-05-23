// 通用 HTML 解析工具：所有城市 source 共用

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

export function num(s) {
  return Number(String(s).replace(/,/g, ''));
}

export function cnDateToIso(s) {
  const m = /(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(s);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

export function isoFromUrlPath(url) {
  // 从 URL 路径如 /20260511/ 或 /202657/ 抽日期
  const m = /\/(\d{4})(\d{1,2})(\d{1,2})\//.exec(url);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

export function absUrl(href, base) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

// 标题里的"YYYY 年第 N 期" / "YYYY 年 M 月" 期号
export function extractPeriod(title) {
  // "2025 年第 2 期" 格式
  let m = /(20\d{2})年(?:第)?\s*([一二三四五六七八九十0-9]+)\s*期/.exec(title);
  if (m) {
    const cnNum = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    const year = Number(m[1]);
    const rawNo = m[2];
    const no = /^\d+$/.test(rawNo) ? Number(rawNo) : cnNum[rawNo] ?? null;
    if (no != null) return { year, no, label: `${year}年第${no}期`, kind: 'period' };
  }
  // "2026 年 5 月" 格式
  m = /(20\d{2})年\s*([0-9]+)\s*月/.exec(title);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    return { year, month, label: `${year}年${month}月`, kind: 'month' };
  }
  return null;
}

// 通用字段抽取：能识别尽量多的关键数字字段，找不到的留 undefined
export function extractMetricsFromText(rawText) {
  const text = normalizeNumberLike(rawText.replace(/\s+/g, ' '));
  const r = {};

  // 北京风格：申请有效编码
  let m = /家庭普通小客车指标申请共?计?\s*([\d,]+)\s*个?有效编码/.exec(text);
  if (m) r.familyApplyCount = num(m[1]);
  m = /个人普通小客车指标申请共?计?\s*([\d,]+)\s*个?有效编码/.exec(text);
  if (m) r.personalApplyCount = num(m[1]);
  m = /单位普通小客车指标申请共?计?\s*([\d,]+)\s*家/.exec(text);
  if (m) r.unitApplyCount = num(m[1]);

  // 北京风格：配置数
  m = /家庭(?:和|与)个人普通小客车指标共?计?\s*([\d,]+)\s*个/.exec(text);
  if (m) r.familyPersonAlloc = num(m[1]);
  m = /配置单位普通小客车指标\s*([\d,]+)\s*个/.exec(text);
  if (m) r.unitAlloc = num(m[1]);

  // 配置数（PDF 通用：广深杭都用这个表述）
  m = /有效编码总数[：:]\s*([\d,]+)/.exec(text);
  if (m) r.validEncodeCount = num(m[1]);
  m = /基数序号总数[：:]\s*([\d,]+)/.exec(text);
  if (m) r.baseSeedTotal = num(m[1]);
  m = /指标配置总数[：:]\s*([\d,]+)/.exec(text);
  if (m) r.allocTotal = num(m[1]);
  m = /指标配置种子数[：:]\s*([\d,]+)/.exec(text);
  if (m) r.randomSeed = num(m[1]);

  // 通用：配置指标数（广深杭"普通车增量指标 / 普通小汽车增量指标 X 个"）
  m = /配置(?:普通车|普通小汽车|增量)?指标\s*([\d,]+)\s*个/.exec(text);
  if (m) r.totalAlloc = num(m[1]);
  m = /(?:个人指标|个人增量指标)\s*([\d,]+)\s*个/.exec(text);
  if (m) r.personalAlloc = num(m[1]);
  m = /(?:单位指标|单位增量指标)\s*([\d,]+)\s*个/.exec(text);
  if (m) r.unitAllocNum = num(m[1]);

  // 通用：摇号方式 / 竞价方式
  m = /(?:以)?摇号方式配置\s*([\d,]+)\s*个/.exec(text);
  if (m) r.lotteryAlloc = num(m[1]);
  m = /(?:以)?竞价方式配置\s*([\d,]+)\s*个/.exec(text);
  if (m) r.biddingAlloc = num(m[1]);

  // 中签率（明示）
  m = /个人(?:普通(?:小客车)?指标)?中签率(?:约)?(?:为|是|:|：)?\s*([\d.]+%|1[/／]\d+)/.exec(text);
  if (m) r.personalRate = m[1];
  m = /单位(?:普通(?:小客车)?指标)?中签率(?:约)?(?:为|是|:|：)?\s*([\d.]+%|1[/／]\d+)/.exec(text);
  if (m) r.unitRate = m[1];

  // 家庭最低中签积分（北京）
  m = /家庭(?:摇号)?(?:最低)?中签(?:家庭)?(?:积分|分值)(?:为|是|:|：)\s*([\d.]+)/.exec(text);
  if (m) r.familyMinScore = Number(m[1]);

  // 新能源排队
  m = /新能源(?:小客车)?指标(?:轮候|排队)(?:.*?)(?:约|预计)?\s*([\d.]+)\s*年/.exec(text);
  if (m) r.nevWaitYears = Number(m[1]);

  // 失信被执行人
  m = /共有\s*([\d,]+)\s*个失信被执行人/.exec(text);
  if (m) r.blackListCount = num(m[1]);

  return r;
}
