import { output, success } from '../output.js';

// v1 范围：本人历史参与记录查询请登录官网。
export function registerHistoryCommand(program) {
  program
    .command('history')
    .description('（v1 不支持）历史参与记录（参与了多少期、什么时候开始）')
    .action(async () => {
      output(success(
        { supported: false },
        [
          '本人历史参与记录 v1 不支持（基于隐私和合规考虑）。',
          '请直接登录官网查看：https://apply.jtw.beijing.gov.cn/apply/',
        ].join('\n'),
      ));
    });
}
