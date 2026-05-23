// 广州中小客车摇号 source
import { SYSTEM_URL } from './constants.js';
import { getCalendar } from './calendar.js';
import { checkEligibility } from './eligibility.js';
import { extractMarketMetrics, watchTargets } from './service.js';

export const meta = {
  name: 'guangzhou',
  label: '广州',
  systemUrl: SYSTEM_URL,
  applyTypes: ['person', 'unit'],
  regTypes: ['普通指标', '节能车', '新能源'],
  supported: true,
  notes: '形势播报和 watch 爬虫待补全，calendar 和 eligibility 已可用',
};

export {
  getCalendar,
  checkEligibility,
  extractMarketMetrics,
  watchTargets,
};
