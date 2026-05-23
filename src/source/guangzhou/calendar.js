// 广州摇号关键日历：月度循环。
// 申请窗口截至每月 12 日 24 时；摇号日为每月 25 日（遇非工作日顺延）

import { MONTHLY_RHYTHM } from './constants.js';

function daysBetween(from, to) {
  const a = new Date(from); a.setHours(0, 0, 0, 0);
  const b = new Date(to); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function pad(n) { return String(n).padStart(2, '0'); }

function statusOf(today, dateStr) {
  const days = daysBetween(today, dateStr);
  if (days > 0) return `还有 ${days} 天`;
  if (days === 0) return '就在今天';
  return `已过 ${-days} 天`;
}

function buildMonthSchedule(year) {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const deadline = `${year}-${pad(m)}-${pad(MONTHLY_RHYTHM.applyDeadlineDay)}`;
    const lottery = `${year}-${pad(m)}-${pad(MONTHLY_RHYTHM.lotteryDay)}`;
    months.push({ month: m, deadline, lottery });
  }
  return months;
}

export function getCalendar(year) {
  const y = year || new Date().getFullYear();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const months = buildMonthSchedule(y);

  // 只显示当前及未来 4 个月（避免冗余）
  const currentMonth = today.getFullYear() === y ? today.getMonth() + 1 : 1;
  const upcoming = months.filter((m) => m.month >= currentMonth).slice(0, 4);

  const items = upcoming.flatMap((m) => [
    { event: `${m.month} 月申请截止`, date: m.deadline, status: statusOf(today, m.deadline) },
    { event: `${m.month} 月摇号日`,   date: m.lottery,  status: statusOf(today, m.lottery) },
  ]);

  const lines = [`广州中小客车摇号 ${y} 年关键日历（今天 ${todayStr}）:`, ''];
  for (const it of items) {
    lines.push(`  ${it.date.padEnd(28)}  ${it.event}  [${it.status}]`);
  }
  lines.push('');
  lines.push('规则：申请窗口截至每月 12 日 24 时，摇号日为每月 25 日（遇非工作日顺延，以官方公告为准）');
  lines.push('提示：累计参加摇号 72 次以上的个人可直接申领普通车增量指标，不占配置额度');
  return { year: y, today: todayStr, schedule: items, lines };
}
