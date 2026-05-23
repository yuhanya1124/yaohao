// source registry：注册所有支持的城市 source
// 接口规范见 source/beijing/index.js

import * as beijing from './beijing/index.js';
import * as guangzhou from './guangzhou/index.js';
import * as shenzhen from './shenzhen/index.js';
import * as hangzhou from './hangzhou/index.js';

const SOURCES = {
  beijing,
  guangzhou,
  shenzhen,
  hangzhou,
};

const IMPLEMENTED = ['beijing', 'guangzhou', 'shenzhen', 'hangzhou'];
const PLANNED = [];

const CITY_LABELS = {
  beijing: '北京',
  guangzhou: '广州',
  shenzhen: '深圳',
  hangzhou: '杭州',
};

export function listSources() {
  return Object.keys(SOURCES);
}

export function listImplemented() {
  return IMPLEMENTED;
}

export function listPlanned() {
  return PLANNED;
}

export function getCityLabel(city) {
  return CITY_LABELS[city] || city;
}

export function getSource(city) {
  if (!city) {
    throw new Error('未指定城市，请用 --city <beijing|guangzhou|shenzhen|hangzhou> 或运行 `yaohao init` 设置默认城市');
  }
  if (PLANNED.includes(city)) {
    throw new Error(`${getCityLabel(city)}（${city}）source 尚未实现，敬请期待。当前可用城市: ${IMPLEMENTED.map(getCityLabel).join(', ')}`);
  }
  const source = SOURCES[city];
  if (!source) {
    throw new Error(`未知城市: ${city}。支持的城市: ${IMPLEMENTED.concat(PLANNED).join(', ')}`);
  }
  return source;
}
