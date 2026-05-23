import { SYSTEM_URL } from './constants.js';
import { getCalendar } from './calendar.js';
import { checkEligibility } from './eligibility.js';
import { extractMarketMetrics, watchTargets } from './service.js';

export const meta = {
  name: 'hangzhou',
  label: '杭州',
  systemUrl: SYSTEM_URL,
  applyTypes: ['person', 'unit', 'tiered', 'multi_child', 'talent'],
  regTypes: ['普通指标', '新能源', '阶梯摇号'],
  supported: true,
};

export {
  getCalendar,
  checkEligibility,
  extractMarketMetrics,
  watchTargets,
};
