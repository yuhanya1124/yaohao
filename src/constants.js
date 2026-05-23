// 全局通用常量（非城市特定）。城市特定的 URL / 规则放在 src/source/{city}/ 下。

export const CONFIG_DIR = '.yaohao';
export const CONFIG_FILE = 'config.json';

export const DEFAULT_CITY = 'beijing';

// 指标类型（适用于多数城市，少数城市可能有不同分类，由 source 自己处理）
export const REG_TYPE_MAP = {
  PTC: '普通指标',
  XNY: '新能源指标',
};

// 申请人类型
export const APPLY_TYPE_MAP = {
  person: '个人',
  family: '家庭',
};
