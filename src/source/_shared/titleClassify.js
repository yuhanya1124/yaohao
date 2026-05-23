// 通用标题分类：从公告标题判断类型
// 不同城市的公告分类大同小异：摇号结果 / 配置数量 / 资格审核 / 政策处罚 / 阶梯统计 等

export function classifyTitle(t) {
  // 处罚类
  if (/买卖|出租|承租|出借|借用/.test(t)) return 'penalty';
  // 摇号结果
  if (/摇号(?:配置)?结果|摇号结果公告|配置结果/.test(t)) return 'result';
  // 配置数量通告
  if (/配置数量|增量指标配置数量|配置工作有关事项/.test(t)) return 'config_notice';
  // 申请审核结果
  if (/申请审核结果和配置工作/.test(t)) return 'config_notice';
  // 资格审核结果
  if (/资格审核结果/.test(t)) return 'qualify_review';
  // 摇号公告（待摇号）
  if (/摇号公告|增量指标摇号公告/.test(t)) return 'lottery_notice';
  // 竞价
  if (/竞价(?:情况|公告|的通告)?/.test(t)) return 'bidding';
  // 阶梯分布统计
  if (/阶梯分布统计|阶梯摇号/.test(t)) return 'tier_stats';
  // 家庭核查（北京）
  if (/亲属关系和婚姻状况核查/.test(t)) return 'family_check';
  // 年度配额
  if (/指标配额|指标调控管理办法/.test(t)) return 'quota';
  // FAQ / 解读
  if (/十问十答|温馨提示|解读/.test(t)) return 'faq';
  // 日历
  if (/竞价日历|摇号日历/.test(t)) return 'calendar_notice';
  return 'other';
}
