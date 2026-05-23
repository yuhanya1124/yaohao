import { SYSTEM_URL } from './constants.js';
import { getCalendar } from './calendar.js';
import { checkEligibility } from './eligibility.js';
import { extractMarketMetrics, watchTargets } from './service.js';

export const meta = {
  name: 'shenzhen',
  label: '深圳',
  systemUrl: SYSTEM_URL,
  applyTypes: ['person', 'unit'],
  regTypes: ['普通指标', '混合动力', '新能源'],
  supported: true,
};

export {
  getCalendar,
  checkEligibility,
  extractMarketMetrics,
  watchTargets,
};
