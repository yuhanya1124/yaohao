import { getSource, listImplemented } from '../source/index.js';
import { getUser } from '../lib/config-manager.js';
import { DEFAULT_CITY } from '../constants.js';
import { output, success, error } from '../output.js';

function resolveCity(opts) {
  if (opts.city) return opts.city;
  const user = getUser();
  return user?.default_city || DEFAULT_CITY;
}

export function registerEligibilityCommand(program) {
  program
    .command('eligibility')
    .description('资格自检：回答几个问题判断是否满足摇号申请条件')
    .option('--city <city>', `城市 (${listImplemented().join('|')})`)
    .action(async (opts) => {
      try {
        const city = resolveCity(opts);
        const source = getSource(city);
        const result = await source.checkEligibility();
        output(success({ city, ...result }, result.lines.join('\n')));
      } catch (err) {
        output(error(err.message));
        process.exitCode = 1;
      }
    });
}
