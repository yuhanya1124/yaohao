import { select, confirm } from '@inquirer/prompts';
import { isInitialized, updateUser } from '../lib/config-manager.js';
import { listImplemented, getCityLabel, listPlanned } from '../source/index.js';
import { DEFAULT_CITY } from '../constants.js';
import { output, success, error } from '../output.js';

export function registerInitCommand(program) {
  program
    .command('init')
    .description('初始化（设置默认城市 / 指标类型 / 申请人类型 / 通知渠道）')
    .option('--city <city>', '默认城市（非交互）')
    .option('--reg-type <type>', '指标类型 PTC / XNY（非交互）')
    .option('--apply-type <type>', '申请人类型 person / family（非交互）')
    .option('--notify <url>', '通知渠道 URL（可多次指定）', (val, acc) => {
      acc.push(val); return acc;
    }, [])
    .option('-f, --force', '已有配置时强制覆盖')
    .action(async (opts) => {
      try {
        const alreadyInit = isInitialized();
        const nonInteractive = opts.city || opts.regType || opts.applyType || opts.notify.length > 0;

        if (alreadyInit && nonInteractive && !opts.force) {
          output(error('已有配置，加 -f 强制覆盖，或用 `yaohao set <key> <value>` / `yaohao notify` 修改单项'));
          process.exitCode = 1;
          return;
        }

        let city, regType, applyType, notifyUrls;

        if (nonInteractive) {
          city = opts.city || DEFAULT_CITY;
          regType = opts.regType || 'PTC';
          applyType = opts.applyType || 'person';
          notifyUrls = opts.notify;
        } else {
          if (alreadyInit) {
            const ok = await confirm({ message: '已有配置，是否覆盖？', default: false });
            if (!ok) {
              output(success(null, '已取消'));
              return;
            }
          }
          const implemented = listImplemented();
          const planned = listPlanned();
          city = await select({
            message: '默认城市:',
            choices: [
              ...implemented.map((c) => ({ name: getCityLabel(c), value: c })),
              ...planned.map((c) => ({
                name: `${getCityLabel(c)}（v1 未实现，敬请期待）`,
                value: c,
                disabled: '（暂不可选）',
              })),
            ],
            default: DEFAULT_CITY,
          });
          regType = await select({
            message: '默认关注的指标类型:',
            choices: [
              { name: '普通指标', value: 'PTC' },
              { name: '新能源指标', value: 'XNY' },
            ],
            default: 'PTC',
          });
          applyType = await select({
            message: '申请人类型:',
            choices: [
              { name: '个人', value: 'person' },
              { name: '家庭', value: 'family' },
            ],
            default: 'person',
          });
          notifyUrls = [];
        }

        updateUser({
          default_city: city,
          reg_type: regType,
          apply_type: applyType,
          notify_urls: notifyUrls,
        });
        output(success(
          { default_city: city, reg_type: regType, apply_type: applyType, notify_count: notifyUrls.length },
          [
            '初始化完成。',
            `  默认城市: ${getCityLabel(city)}`,
            `  指标类型: ${regType === 'PTC' ? '普通指标' : '新能源指标'}`,
            `  申请人类型: ${applyType === 'person' ? '个人' : '家庭'}`,
            `  通知渠道: ${notifyUrls.length} 个${notifyUrls.length === 0 ? '（运行 `yaohao notify add <url>` 添加）' : ''}`,
          ].join('\n'),
        ));
      } catch (err) {
        if (err && err.name === 'ExitPromptError') {
          output(success(null, '已取消'));
          return;
        }
        output(error(`初始化失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
