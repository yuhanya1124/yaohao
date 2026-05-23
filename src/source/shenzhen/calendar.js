// 深圳摇号关键日历：月度循环
// 每月 8 日前申请当月、每月 23 日左右公布资格审核结果、每月 26 日摇号
// 2026 年阶梯摇号：4-12 月每月，24 次为 1 阶梯

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

export function getCalendar(year) {
  const y = year || new Date().getFullYear();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const currentMonth = today.getFullYear() === y ? today.getMonth() + 1 : 1;

  const items = [];
  for (let m = currentMonth; m <= Math.min(currentMonth + 3, 12); m++) {
    const apply = `${y}-${pad(m)}-${pad(MONTHLY_RHYTHM.applyDeadlineDay)}`;
    const audit = `${y}-${pad(m)}-23`;
    const lottery = `${y}-${pad(m)}-${pad(MONTHLY_RHYTHM.lotteryDay)}`;
    items.push({ event: `${m} 月申请截止`, date: apply, status: statusOf(today, apply) });
    items.push({ event: `${m} 月资格审核结果`, date: audit, status: statusOf(today, audit) });
    items.push({ event: `${m} 月摇号日`, date: lottery, status: statusOf(today, lottery) });
  }

  const lines = [`深圳小汽车增量指标摇号 ${y} 年关键日历（今天 ${todayStr}）:`, ''];
  for (const it of items) {
    lines.push(`  ${it.date.padEnd(28)}  ${it.event}  [${it.status}]`);
  }
  lines.push('');
  lines.push('规则：每月 8 日前申请当月、23 日左右公布审核结果、26 日摇号（遇周末/节假日顺延）');
  lines.push('2026 年 4-12 月实施阶梯摇号：累计 24 次未中签升 1 个阶梯，每升 1 阶增加 1 个摇号编码');
  return { year: y, today: todayStr, schedule: items, lines };
}
