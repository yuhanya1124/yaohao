import { getSource, listImplemented } from '../source/index.js';
import { getUser } from '../lib/config-manager.js';
import { DEFAULT_CITY } from '../constants.js';
import { output, success, error } from '../output.js';

function resolveCity(opts) {
  if (opts.city) return opts.city;
  const user = getUser();
  return user?.default_city || DEFAULT_CITY;
}

export function registerMarketCommand(program) {
  program
    .command('market')
    .description('当前形势：申请数、配置数、中签率')
    .option('--city <city>', `城市 (${listImplemented().join('|')})`)
    .option('--no-pdf', '跳过 PDF 解析（更快，但拿不到中签率）')
    .option('--no-cache', '禁用本地缓存')
    .option('--json', '原始 JSON 输出')
    .action(async (opts) => {
      try {
        const city = resolveCity(opts);
        const source = getSource(city);
        const result = await source.extractMarketMetrics(opts);
        if (!result.ok) {
          output(error(result.error));
          process.exitCode = 1;
          return;
        }
        if (opts.json) {
          console.log(JSON.stringify({ city, ...result.data }, null, 2));
          return;
        }
        output(success({ city, ...result.data }, result.lines.join('\n')));
      } catch (err) {
        output(error(err.message));
        process.exitCode = 1;
      }
    });
}
