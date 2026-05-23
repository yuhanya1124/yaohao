// 北京小客车摇号 source 入口
// 统一接口规范：meta / getCalendar / checkEligibility / extractMarketMetrics / watchTargets

import { SYSTEM_URL } from './constants.js';
import { getCalendar } from './calendar.js';
import { checkEligibility } from './eligibility.js';
import { extractMarketMetrics, watchTargets } from './service.js';

export const meta = {
  name: 'beijing',
  label: '北京',
  systemUrl: SYSTEM_URL,
  applyTypes: ['person', 'family'],
  regTypes: ['PTC', 'XNY'],
  supported: true,
};

export {
  getCalendar,
  checkEligibility,
  extractMarketMetrics,
  watchTargets,
};
