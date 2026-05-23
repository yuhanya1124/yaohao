import { isInitialized, updateUser } from '../lib/config-manager.js';
import { listImplemented } from '../source/index.js';
import { output, success, error } from '../output.js';

const VALID_KEYS = {
  'default-city': {
    configKey: 'default_city',
    validValues: listImplemented(),
    description: '默认城市',
  },
  'reg-type': {
    configKey: 'reg_type',
    validValues: ['PTC', 'XNY'],
    description: '指标类型（PTC=普通指标，XNY=新能源指标）',
  },
  'apply-type': {
    configKey: 'apply_type',
    validValues: ['person', 'family'],
    description: '申请人类型（person=个人，family=家庭）',
  },
};

export function registerSetCommand(program) {
  program
    .command('set <key> <value>')
    .description(`修改配置项（支持: ${Object.keys(VALID_KEYS).join(', ')}）`)
    .action(async (key, value) => {
      try {
        if (!isInitialized()) {
          output(error('尚未初始化，请先运行 yaohao init'));
          process.exitCode = 1;
          return;
        }
        const keyDef = VALID_KEYS[key];
        if (!keyDef) {
          const validKeys = Object.keys(VALID_KEYS).join(', ');
          output(error(`不支持的配置项: ${key}，支持: ${validKeys}`));
          process.exitCode = 1;
          return;
        }
        if (!keyDef.validValues.includes(value)) {
          output(error(`无效的值: ${value}，${keyDef.description}必须是: ${keyDef.validValues.join(' / ')}`));
          process.exitCode = 1;
          return;
        }
        updateUser({ [keyDef.configKey]: value });
        output(success({ key, value }, `${keyDef.description}已设置为: ${value}`));
      } catch (err) {
        output(error(`设置失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
