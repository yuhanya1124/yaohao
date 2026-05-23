import { output, success } from '../output.js';

// v1 范围：仅做公开数据查询和提醒。本人账号状态查询请登录官网。
export function registerStatusCommand(program) {
  program
    .command('status')
    .description('（v1 不支持）查看本人申请编码状态、阶梯倍率')
    .action(async () => {
      output(success(
        { supported: false },
        [
          '本人账号状态查询 v1 不支持（基于隐私和合规考虑，本工具不持有用户密码）。',
          '请直接登录官网查看：https://apply.jtw.beijing.gov.cn/apply/',
        ].join('\n'),
      ));
    });
}
