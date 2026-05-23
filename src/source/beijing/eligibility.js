import { input, select, confirm } from '@inquirer/prompts';

// 资格判定基于《北京市小客车数量调控暂行规定》（2025 年修订）
// 4 种身份类型代码取自官方系统 choosePerson 页：BSHJ / JJ / ZZZ / GZJZZ

const PERSON_TYPES = {
  BSHJ: '本市户籍居民',
  JJ: '驻京部队现役军人和现役武警',
  ZZZ: '持有效居住证的非本市户籍人员',
  GZJZZ: '持北京市工作居住证人员',
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
      return result(false, '不符合户籍/居住要求', { reason: 'huji_not_match' });
    }

    const age = Number(await input({
      message: '年龄？',
      default: '30',
      validate: (v) => /^\d+$/.test(v) && Number(v) > 0 || '请输入正整数',
    }));
    if (age < 18) return result(false, '需年满 18 周岁', { age });

    const hasLicense = await confirm({ message: '是否持有有效机动车驾驶证？', default: true });
    if (!hasLicense) return result(false, '需持有有效机动车驾驶证');

    const hasBjPlate = await confirm({ message: '名下是否已有京牌小客车？', default: false });
    if (hasBjPlate) return result(false, '名下已有京牌小客车，须先处理');

    const hasIndicator = await confirm({ message: '名下是否已持有有效的小客车指标（含指标确认通知书）？', default: false });
    if (hasIndicator) return result(false, '已持有有效指标，不能重复申请');

    // 非京籍走 5 年社保 + 个税
    if (personType === 'ZZZ') {
      const sbYears = Number(await input({
        message: '在京连续缴纳社保和个税年数（按整年算，断缴会清零）？',
        default: '0',
        validate: (v) => /^\d+(\.\d+)?$/.test(v) || '请输入数字',
      }));
      if (sbYears < 5) {
        return result(false, `非京籍连续社保和个税不足 5 年，还差 ${(5 - sbYears).toFixed(1)} 年`, { sbYears });
      }
    }

    // 家庭摇号判断
    const considerFamily = await confirm({
      message: '是否考虑家庭摇号（积分制，比个人摇号中签率高）？',
      default: true,
    });
    let familyEligible = false;
    let familySize = 1;
    if (considerFamily) {
      familySize = Number(await input({
        message: '家庭主申请人 + 配偶 + 子女 + 双方父母合计有效成员数？',
        default: '2',
        validate: (v) => /^\d+$/.test(v) || '请输入整数',
      }));
      familyEligible = familySize >= 2;
    }

    const lines = ['符合申请条件：'];
    lines.push('  ✓ 个人普通指标（PTC）— 阶梯倍率制，参与年限越长倍率越高');
    lines.push('  ✓ 个人新能源指标（XNY）— 排队轮候制');
    if (familyEligible) {
      lines.push('  ✓ 家庭普通指标（PTC）— 家庭积分制，比个人中签率高');
      lines.push('  ✓ 家庭新能源指标（XNY）— 家庭积分轮候');
    } else if (considerFamily) {
      lines.push('  ✗ 家庭摇号：需至少 2 名家庭成员');
    }
    lines.push('');
    lines.push('下一步：在申请窗口期（每年 1/1-3/8、8/1-10/8）登录 xkczb.jtw.beijing.gov.cn 提交申请。');
    lines.push('提示：本判定为简化版，复杂情况以官方说明为准。');

    return result(true, lines.join('\n'), {
      personType,
      personTypeLabel: PERSON_TYPES[personType],
      age,
      familySize,
      eligibility: {
        personal_ptc: true,
        personal_xny: true,
        family_ptc: familyEligible,
        family_xny: familyEligible,
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
