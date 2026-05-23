#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

import { program } from 'commander';

program
  .name('yaohao')
  .description('国内城市车牌摇号 CLI - 资格自检、形势播报、开奖订阅、政策提醒（北京 / 广州 / 深圳 / 杭州）')
  .version(version);

import { registerInitCommand } from '../src/commands/init.js';
import { registerEligibilityCommand } from '../src/commands/eligibility.js';
import { registerCalendarCommand } from '../src/commands/calendar.js';
import { registerMarketCommand } from '../src/commands/market.js';
import { registerWatchCommand } from '../src/commands/watch.js';
import { registerStatusCommand } from '../src/commands/status.js';
import { registerFamilyCommand } from '../src/commands/family.js';
import { registerResultCommand } from '../src/commands/result.js';
import { registerHistoryCommand } from '../src/commands/history.js';
import { registerWaitlistCommand } from '../src/commands/waitlist.js';
import { registerNotifyCommand } from '../src/commands/notify.js';
import { registerSetCommand } from '../src/commands/set.js';
import { registerCronCommand } from '../src/commands/cron.js';

// 无登录态（任何人能用）
registerEligibilityCommand(program);
registerCalendarCommand(program);
registerMarketCommand(program);
registerWatchCommand(program);

// 登录态查询
registerInitCommand(program);
registerStatusCommand(program);
registerFamilyCommand(program);
registerResultCommand(program);
registerHistoryCommand(program);
registerWaitlistCommand(program);

// 脚手架
registerNotifyCommand(program);
registerSetCommand(program);
registerCronCommand(program);

program.parse();
