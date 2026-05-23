// 广州市中小客车指标调控管理信息系统
export const SYSTEM_URL = 'https://jtzl.jtj.gz.gov.cn/';

export const URLS = {
  system: 'https://jtzl.jtj.gz.gov.cn/',
  // 公告/政策由广州市交通运输局门户提供
  noticeList: 'https://jtj.gz.gov.cn/gkmlpt/index',
  // 调控办与摇号相关栏目（通过门户搜索的二级路径）
  noticeIndex: 'https://jtj.gz.gov.cn/',
};

// 广州摇号节奏：申请窗口截至每月 12 日 24 时；摇号日为每月 25 日（遇非工作日顺延）
export const MONTHLY_RHYTHM = {
  applyDeadlineDay: 12,
  lotteryDay: 25,
};
