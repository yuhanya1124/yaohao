// 杭州摇号关键日历：月度循环 + 阶梯摇号特殊期
// 常规：每月 1-8 日申报、23 日审核结果、26 日摇号
// 2026 阶梯摇号 J1 期：申请 2025-12-15 至 2026-01-14，摇号 2026-01-30

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

const TIERED_LOTTERY = {
  2026: [{ name: '2026J1 期个人阶梯摇号', applyStart: '2025-12-15', applyEnd: '2026-01-14', lottery: '2026-01-30' }],
};

export function getCalendar(year) {
  const y = year || new Date().getFullYear();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const currentMonth = today.getFullYear() === y ? today.getMonth() + 1 : 1;

  const items = [];
  // 常规月度日历
  for (let m = currentMonth; m <= Math.min(currentMonth + 3, 12); m++) {
    const apply = `${y}-${pad(m)}-${pad(MONTHLY_RHYTHM.applyEndDay)}`;
    const audit = `${y}-${pad(m)}-${pad(MONTHLY_RHYTHM.auditDay)}`;
    const lottery = `${y}-${pad(m)}-${pad(MONTHLY_RHYTHM.lotteryDay)}`;
    items.push({ event: `${m} 月申报截止`, date: apply, status: statusOf(today, apply) });
    items.push({ event: `${m} 月资格审核结果`, date: audit, status: statusOf(today, audit) });
    items.push({ event: `${m} 月摇号日`, date: lottery, status: statusOf(today, lottery) });
  }
  // 阶梯摇号
  const tiered = TIERED_LOTTERY[y] || [];
  for (const t of tiered) {
    items.push({ event: `${t.name}（申报）`, date: `${t.applyStart} 至 ${t.applyEnd}`, status: 'see below' });
    items.push({ event: `${t.name}（摇号）`, date: t.lottery, status: statusOf(today, t.lottery) });
  }

  const lines = [`杭州小客车摇号 ${y} 年关键日历（今天 ${todayStr}）:`, ''];
  for (const it of items) {
    if (it.status === 'see below') {
      lines.push(`  ${it.date.padEnd(28)}  ${it.event}`);
    } else {
      lines.push(`  ${String(it.date).padEnd(28)}  ${it.event}  [${it.status}]`);
    }
  }
  lines.push('');
  lines.push('规则：每月 1-8 日申报、23 日左右审核结果、26 日摇号（遇非工作日顺延）');
  lines.push('阶梯摇号：累计摇号 24 次以上可参与，每年举办一次');
  lines.push('业务已迁移至"浙里办"APP / 浙江政务服务网');
  return { year: y, today: todayStr, schedule: items, lines };
}
