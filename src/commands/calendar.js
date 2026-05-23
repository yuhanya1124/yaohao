import { getSource, listImplemented, getCityLabel } from '../source/index.js';
import { getUser } from '../lib/config-manager.js';
import { DEFAULT_CITY } from '../constants.js';
import { output, success, error } from '../output.js';

function resolveCity(opts) {
  if (opts.city) return opts.city;
  const user = getUser();
  return user?.default_city || DEFAULT_CITY;
}

export function registerCalendarCommand(program) {
  program
    .command('calendar')
    .description('关键日历：申请窗口、摇号日、资格审核结果公布日')
    .option('--city <city>', `城市 (${listImplemented().join('|')})`)
    .option('--year <year>', '查询年份', String(new Date().getFullYear()))
    .action(async (opts) => {
      try {
        const city = resolveCity(opts);
        const source = getSource(city);
        const result = source.getCalendar(Number(opts.year));
        output(success({ city, ...result }, result.lines.join('\n')));
      } catch (err) {
        output(error(err.message));
        process.exitCode = 1;
      }
    });
}
