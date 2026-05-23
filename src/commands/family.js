import { output, success } from '../output.js';

// v1 范围：仅做公开数据查询和提醒。家庭积分/排名查询请登录官网。
export function registerFamilyCommand(program) {
  program
    .command('family')
    .description('（v1 不支持）家庭摇号积分、阶梯、当前排名')
    .action(async () => {
      output(success(
        { supported: false },
        [
          '家庭摇号积分和排名查询 v1 不支持（基于隐私和合规考虑）。',
          '请直接登录官网查看：https://apply.jtw.beijing.gov.cn/apply/',
        ].join('\n'),
      ));
    });
}
