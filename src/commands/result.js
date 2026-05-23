import { output, success } from '../output.js';

// v1 范围：本人是否中签的查询请登录官网。开奖结果公告的订阅见 `yaohao watch result`。
export function registerResultCommand(program) {
  program
    .command('result')
    .description('（v1 不支持）查询本人是否中签')
    .action(async () => {
      output(success(
        { supported: false },
        [
          '本人中签结果查询 v1 不支持（基于隐私和合规考虑）。',
          '官方开奖公告订阅请用 `yaohao watch result`。',
          '查个人结果请直接登录官网：https://apply.jtw.beijing.gov.cn/apply/',
        ].join('\n'),
      ));
    });
}
