// PDF 解析模块：把 attachment 里的 PDF 转纯文本，复用 parse.js 的 extractMetricsFromText。
// 用 pdfjs-dist（纯 JS，无原生依赖）。

import path from 'node:path';
import { createRequire } from 'node:module';
import { fetchBinary } from './crawl.js';
import { extractMetricsFromText } from './parse.js';

const require = createRequire(import.meta.url);

// pdfjs-dist 标准字体目录：Node 版需要直接文件系统路径（非 file:// URL），末尾必须带 /
const PDFJS_DIR = path.dirname(require.resolve('pdfjs-dist/package.json'));
const STANDARD_FONT_DATA_URL = `${PDFJS_DIR}/standard_fonts/`;

let _pdfjs = null;

async function getPdfjs() {
  if (!_pdfjs) {
    _pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return _pdfjs;
}

/**
 * 抓取 PDF 并抽取所有页面的纯文本。
 * @returns {Promise<string>}
 */
export async function extractPdfText(pdfUrl) {
  const pdfjs = await getPdfjs();
  const { buffer } = await fetchBinary(pdfUrl);
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    disableFontFace: true,         // 文本抽取不需要字体形状，直接禁用避免加载
    useSystemFonts: false,
    verbosity: 0,                  // 0=ERRORS only，去掉 info/warning 噪音
  }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => it.str).join(' '));
  }
  await doc.destroy();
  return pages.join('\n');
}

/**
 * 抓取 PDF 并抽取关键指标（中签率、家庭最低分等）。
 * @returns {Promise<object>}
 */
export async function extractPdfMetrics(pdfUrl) {
  const text = await extractPdfText(pdfUrl);
  return extractMetricsFromText(text);
}
