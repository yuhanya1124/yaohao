import { input, select, confirm } from '@inquirer/prompts';

// 广州市中小客车增量指标资格规则（参考广州本地宝 2025 摇号申请指引）
// 简化版，复杂情况以《广州市小客车指标调控管理办法》为准

const PERSON_TYPES = {
  GZHJ: '广州市户籍人员',
  WJZJ: '驻穗武警 / 现役军人',
  GANG_AO_TAI: '港澳台居民 / 持外国人永久居留证 / 华侨',
  ZZZ: '持有效《广东省居住证》（连续居住 + 连续社保）',
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
      return result(false, '不符合广州摇号户籍/居住要求', { reason: 'huji_not_match' });
    }

    const age = Number(await input({
      message: '年龄？',
      default: '30',
      validate: (v) => /^\d+$/.test(v) && Number(v) > 0 || '请输入正整数',
    }));
    if (age < 18) return result(false, '需年满 18 周岁', { age });

    const hasLicense = await confirm({ message: '是否持有有效机动车驾驶证？', default: true });
    if (!hasLicense) return result(false, '需持有有效机动车驾驶证');

    const hasYueAPlate = await confirm({ message: '名下是否已有粤 A 牌小客车？', default: false });
    if (hasYueAPlate) return result(false, '名下已有粤 A 牌小客车');

    const hasIndicator = await confirm({ message: '是否已持有有效的增量指标或指标确认通知书？', default: false });
    if (hasIndicator) return result(false, '已持有有效指标，不能重复申请');

    // 非穗籍走居住证 + 社保
    if (personType === 'ZZZ') {
      const sbYears = Number(await input({
        message: '在穗连续缴纳社保的月数（断缴会清零，需中等社保险种）？',
        default: '0',
        validate: (v) => /^\d+(\.\d+)?$/.test(v) || '请输入数字',
      }));
      if (sbYears < 24) {
        return result(false, `非穗籍连续社保需满 24 个月，差 ${(24 - sbYears).toFixed(0)} 个月`, { sbYears });
      }
    }

    const lines = ['符合广州摇号申请条件：'];
    lines.push('  ✓ 个人普通车增量指标（摇号或竞价）');
    lines.push('  ✓ 个人节能车增量指标（无额度限制）');
    lines.push('  ✓ 个人新能源车增量指标（无额度限制）');
    lines.push('');
    lines.push('下一步：在每月 12 日 24 时前登录 jtzl.jtj.gz.gov.cn 提交申请。');
    lines.push('提示：本判定为简化版，复杂情况以《广州市小客车指标调控管理办法》为准。');

    return result(true, lines.join('\n'), {
      personType,
      personTypeLabel: PERSON_TYPES[personType],
      age,
      eligibility: {
        regular_lottery: true,
        regular_bidding: true,
        energy_saving: true,
        new_energy: true,
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
