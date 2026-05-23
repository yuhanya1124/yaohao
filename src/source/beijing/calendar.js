// 北京小客车摇号关键日历（按往年节奏推断，年度更新由发版承担）
// 上半年申请窗口: 1/1 - 3/8
// 上半年资格审核结果公布: 4 月上旬
// 上半年摇号: 4 月下旬
// 下半年申请窗口: 8/1 - 10/8
// 下半年资格审核结果公布: 12 月中旬
// 下半年摇号: 12 月下旬

const SCHEDULE = {
  2026: [
    { event: '上半年申请窗口开放', start: '2026-01-01', end: '2026-03-08' },
    { event: '上半年资格审核结果公布', date: '2026-04-08' },
    { event: '上半年摇号日', date: '2026-04-26' },
    { event: '下半年申请窗口开放', start: '2026-08-01', end: '2026-10-08' },
    { event: '下半年资格审核结果公布', date: '2026-12-08' },
    { event: '下半年摇号日', date: '2026-12-26' },
  ],
};

function daysBetween(from, to) {
  const a = new Date(from); a.setHours(0, 0, 0, 0);
  const b = new Date(to); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function formatEvent(e, today) {
  const range = e.date ? e.date : `${e.start} 至 ${e.end}`;
  let status;
  if (e.date) {
    const days = daysBetween(today, e.date);
    if (days > 0) status = `还有 ${days} 天`;
    else if (days === 0) status = '就在今天';
    else status = `已过 ${-days} 天`;
  } else {
    const dStart = daysBetween(today, e.start);
    const dEnd = daysBetween(today, e.end);
    if (dStart > 0) status = `${dStart} 天后开放`;
    else if (dEnd >= 0) status = `进行中，剩 ${dEnd} 天`;
    else status = `已结束 ${-dEnd} 天`;
  }
  return { range, event: e.event, status };
}

export function getCalendar(year) {
  const y = year || new Date().getFullYear();
  const schedule = SCHEDULE[y];
  if (!schedule) {
    return {
      year: y,
      available: Object.keys(SCHEDULE).map(Number),
      schedule: [],
      lines: [`暂无 ${y} 年日历，目前支持: ${Object.keys(SCHEDULE).join(', ')}`],
    };
  }
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const items = schedule.map((e) => formatEvent(e, today));
  const lines = [`北京小客车摇号 ${y} 年关键日历（今天 ${todayStr}）:`, ''];
  for (const it of items) {
    lines.push(`  ${it.range.padEnd(28)}  ${it.event}  [${it.status}]`);
  }
  lines.push('');
  lines.push('注：日期按往年节奏推断，以官方公告为准。建议配合 `yaohao watch window` 订阅窗口开放推送。');
  return { year: y, today: todayStr, schedule: items, lines };
}
