import { input, select, confirm } from '@inquirer/prompts';

// 杭州小客车增量指标资格规则（参考杭州市小客车指标管理办法）
// 简化版，复杂情况以官方说明为准

const PERSON_TYPES = {
  HZHJ: '杭州市户籍居民',
  XLZG: '驻杭部队现役军人或现役武警',
  GANG_AO_TAI: '港澳台居民 / 持外国人永久居留证 / 华侨',
  ZZZ: '持有效《浙江省居住证》（含连续社保）',
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
      return result(false, '不符合杭州摇号户籍/居住要求');
    }

    const age = Number(await input({
      message: '年龄？',
      default: '30',
      validate: (v) => /^\d+$/.test(v) && Number(v) > 0 || '请输入正整数',
    }));
    if (age < 18) return result(false, '需年满 18 周岁', { age });

    const hasLicense = await confirm({ message: '是否持有有效机动车驾驶证？', default: true });
    if (!hasLicense) return result(false, '需持有有效机动车驾驶证');

    const hasZheAPlate = await confirm({ message: '名下是否已有浙 A 牌小客车？', default: false });
    if (hasZheAPlate) return result(false, '名下已有浙 A 牌小客车');

    const hasIndicator = await confirm({ message: '是否已持有有效的增量指标？', default: false });
    if (hasIndicator) return result(false, '已持有有效指标，不能重复申请');

    if (personType === 'ZZZ') {
      const sbYears = Number(await input({
        message: '在浙连续缴纳社保的月数？',
        default: '0',
        validate: (v) => /^\d+(\.\d+)?$/.test(v) || '请输入数字',
      }));
      if (sbYears < 24) {
        return result(false, `非杭籍连续社保需 24 个月，差 ${(24 - sbYears).toFixed(0)} 个月`, { sbYears });
      }
    }

    // 特殊定向：阶梯/多孩/人才
    const lotteryCount = Number(await input({
      message: '累计参加杭州摇号次数（用于判断阶梯摇号资格）？没参加过填 0',
      default: '0',
      validate: (v) => /^\d+$/.test(v) || '请输入整数',
    }));
    const isTierEligible = lotteryCount >= 24;

    const isMultiChild = await confirm({ message: '是否多孩家庭（2 孩及以上）？', default: false });
    const isTalent = await confirm({ message: '是否经杭州市认定的人才（如 E 类及以上）？', default: false });

    const lines = ['符合杭州摇号申请条件：'];
    lines.push('  ✓ 个人普通小客车增量指标（每月 26 日摇号）');
    lines.push('  ✓ 个人新能源小客车增量指标');
    if (isTierEligible) lines.push('  ✓ 个人阶梯摇号（累计摇号已达 24 次）');
    if (isMultiChild) lines.push('  ✓ 多孩家庭可直接申领指标（无需摇号）');
    if (isTalent) lines.push('  ✓ 经认定的人才可直接申领指标');
    lines.push('');
    lines.push('下一步：在"浙里办"APP 或浙江政务服务网申报，定位选择"杭州市"');
    lines.push('提示：杭州业务已迁移至"浙里办"，原 hzxkctk.cn 仅保留查询和公告功能');

    return result(true, lines.join('\n'), {
      personType,
      personTypeLabel: PERSON_TYPES[personType],
      age,
      lotteryCount,
      eligibility: {
        regular_lottery: true,
        new_energy: true,
        tiered_lottery: isTierEligible,
        multi_child_direct: isMultiChild,
        talent_direct: isTalent,
      },
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
