// PDF 解析模块：把 attachment 里的 PDF 转纯文本，复用 parse.js 的 extractMetricsFromText。
// 用 pdfjs-dist（纯 JS，无原生依赖）。

import { fetchBinary } from './crawl.js';
import { extractMetricsFromText } from './parse.js';

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
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
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
