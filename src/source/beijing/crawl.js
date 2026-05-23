// 北京交通委公告站抓取层：负责 HTTP 请求、编码处理、本地缓存。
// 零外部依赖，依赖 Node 18+ 自带的 fetch。

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { homedir } from 'node:os';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

const CACHE_DIR = path.join(homedir(), '.yaohao', 'cache');

/**
 * 抓取一个 URL，返回 { url, status, html, contentType, fromCache, elapsedMs }
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {boolean} [opts.useCache=true]  本地缓存，避免反复打官网
 * @param {number}  [opts.timeoutMs=15000]
 * @param {number}  [opts.retries=2]
 * @param {number}  [opts.maxCacheAgeMs] 缓存最大有效期（毫秒），默认无限
 */
export async function fetchHtml(url, opts = {}) {
  const { useCache = true, timeoutMs = 15000, retries = 2, maxCacheAgeMs } = opts;

  if (useCache) {
    const cached = await readCache(url, maxCacheAgeMs);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const t0 = Date.now();
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: DEFAULT_HEADERS,
        signal: ac.signal,
        redirect: 'follow',
      });
      const contentType = res.headers.get('content-type') || '';
      const buf = Buffer.from(await res.arrayBuffer());
      const html = decode(buf, contentType);
      const elapsedMs = Date.now() - t0;
      const payload = {
        url,
        status: res.status,
        contentType,
        html,
        elapsedMs,
        fromCache: false,
        savedAt: Date.now(),
      };
      if (useCache && res.status === 200) {
        await writeCache(url, payload);
      }
      return payload;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`fetchHtml(${url}) failed after ${retries + 1} tries: ${lastErr?.message || lastErr}`);
}

/**
 * 抓取一个二进制资源（PDF 等），返回 { url, status, buffer }。
 * 走单独缓存目录 ~/.yaohao/cache/pdf/，按 url sha1 命名。
 */
export async function fetchBinary(url, opts = {}) {
  const { useCache = true, timeoutMs = 30000 } = opts;
  const pdfDir = path.join(CACHE_DIR, 'binary');
  await fs.mkdir(pdfDir, { recursive: true });
  const file = path.join(pdfDir, crypto.createHash('sha1').update(url).digest('hex') + path.extname(url));

  if (useCache) {
    try {
      const buf = await fs.readFile(file);
      return { url, status: 200, buffer: buf, fromCache: true };
    } catch {
      /* miss */
    }
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: ac.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(file, buf);
    return { url, status: res.status, buffer: buf, fromCache: false };
  } finally {
    clearTimeout(timer);
  }
}

function decode(buf, contentType) {
  let charset = 'utf-8';
  const m = /charset=([\w-]+)/i.exec(contentType);
  if (m) charset = m[1].toLowerCase();
  const head = buf.slice(0, 1024).toString('ascii');
  const metaMatch = /charset=["']?([\w-]+)/i.exec(head);
  if (metaMatch) charset = metaMatch[1].toLowerCase();

  if (charset === 'utf-8' || charset === 'utf8') {
    return buf.toString('utf8');
  }
  try {
    return new TextDecoder(charset).decode(buf);
  } catch {
    return buf.toString('utf8');
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cacheKey(url) {
  return crypto.createHash('sha1').update(url).digest('hex') + '.json';
}

async function readCache(url, maxAgeMs) {
  try {
    const file = path.join(CACHE_DIR, cacheKey(url));
    const raw = await fs.readFile(file, 'utf8');
    const payload = JSON.parse(raw);
    if (maxAgeMs && payload.savedAt && Date.now() - payload.savedAt > maxAgeMs) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function writeCache(url, payload) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, cacheKey(url));
  await fs.writeFile(file, JSON.stringify(payload), 'utf8');
}
