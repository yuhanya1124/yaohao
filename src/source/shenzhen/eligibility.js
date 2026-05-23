import { input, select, confirm } from '@inquirer/prompts';

// 深圳小汽车增量指标资格规则（参考深圳市小汽车增量调控管理实施细则）
// 简化版，复杂情况以官方说明为准

const PERSON_TYPES = {
  SZHJ: '深圳市户籍居民',
  XLZG: '驻深现役军人或现役武警',
  GANG_AO_TAI: '港澳台居民 / 持外国人永久居留证 / 华侨',
  ZZZ: '持有效《深圳经济特区居住证》（含连续社保）',
};

export async function checkEligibility() {
  try {
    const personType = await select({
      message: '户籍/居住类型？',
      choices: [
        ...Object.entries(PERSON_TYPES).map(([k, v]) => ({ name: v, value: k })),
        { name: '以上都不是', value: 'NONE' },
      ],
    });
    if (personType === 'NONE') {
      return result(false, '不符合深圳摇号户籍/居住要求');
    }

    const age = Number(await input({
      message: '年龄？',
      default: '30',
      validate: (v) => /^\d+$/.test(v) && Number(v) > 0 || '请输入正整数',
    }));
    if (age < 18) return result(false, '需年满 18 周岁', { age });

    const hasLicense = await confirm({ message: '是否持有有效机动车驾驶证？', default: true });
    if (!hasLicense) return result(false, '需持有有效机动车驾驶证');

    const hasShenzhenPlate = await confirm({ message: '名下是否已有深圳籍小汽车？', default: false });
    if (hasShenzhenPlate) return result(false, '名下已有深圳籍小汽车');

    const hasIndicator = await confirm({ message: '是否已持有有效的增量指标？', default: false });
    if (hasIndicator) return result(false, '已持有有效指标，不能重复申请');

    // 非深户走居住证 + 社保
    if (personType === 'ZZZ') {
      // 2026 政策：取消非深户籍人员申请新能源小汽车增量指标的社保限制
      // 但普通指标仍要 24 个月连续社保
      const wantNev = await confirm({ message: '只关心新能源指标吗？（新能源已取消非深户社保限制）', default: false });
      if (!wantNev) {
        const sbYears = Number(await input({
          message: '在深连续缴纳社保的月数？',
          default: '0',
          validate: (v) => /^\d+(\.\d+)?$/.test(v) || '请输入数字',
        }));
        if (sbYears < 24) {
          return result(false, `非深户籍普通指标需 24 个月连续社保，差 ${(24 - sbYears).toFixed(0)} 个月。可考虑新能源（已无此限）`, { sbYears });
        }
      }
    }

    const lines = ['符合深圳摇号申请条件：'];
    lines.push('  ✓ 个人普通小汽车增量指标（摇号或竞价）');
    lines.push('  ✓ 个人新能源小汽车增量指标');
    if (personType !== 'ZZZ') {
      lines.push('  ✓ 个人混合动力小汽车增量指标（条件放宽）');
    }
    lines.push('');
    lines.push('下一步：每月 8 日前登录 xqctk.jtys.sz.gov.cn 提交申请。');
    lines.push('提示：2026 年 4-12 月实施阶梯摇号，累计摇号次数越多编码越多');

    return result(true, lines.join('\n'), {
      personType,
      personTypeLabel: PERSON_TYPES[personType],
      age,
      eligibility: { regular: true, new_energy: true },
    });
  } catch (err) {
    if (err && err.name === 'ExitPromptError') {
      return { pass: null, cancelled: true, lines: ['已取消'] };
    }
    throw err;
  }
}

function result(pass, message, extra = {}) {
  return {
    pass,
    message,
    ...extra,
    lines: [pass ? message : `不符合：${message}`],
  };
}
