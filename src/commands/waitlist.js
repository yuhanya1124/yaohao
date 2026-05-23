import { output, success } from '../output.js';

// v1 范围：本人新能源轮候位置查询请登录官网。新能源相关公告的订阅见 `yaohao watch result/policy`。
export function registerWaitlistCommand(program) {
  program
    .command('waitlist')
    .description('（v1 不支持）新能源轮候位置（前面还有多少人）')
    .action(async () => {
      output(success(
        { supported: false },
        [
          '本人新能源轮候位置 v1 不支持（基于隐私和合规考虑）。',
          '请直接登录官网查看：https://apply.jtw.beijing.gov.cn/apply/',
        ].join('\n'),
      ));
    });
}
