import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { getSource, listImplemented } from '../source/index.js';
import { getUser, isInitialized } from '../lib/config-manager.js';
import { notify } from '../lib/notifier.js';
import { DEFAULT_CITY, CONFIG_DIR } from '../constants.js';
import { output, success, error } from '../output.js';

const SEEN_FILE = path.join(homedir(), CONFIG_DIR, 'cache', 'watch-seen.json');

const UNSUPPORTED_TARGETS = {
  renewal: '年度延期确认提醒',
  expiry: '申请编码到期提醒',
  ranking: '家庭排名变化通知',
};

function resolveCity(opts) {
  if (opts.city) return opts.city;
  const user = getUser();
  return user?.default_city || DEFAULT_CITY;
}

function loadSeen() {
  try {
    return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf-8'));
  } catch {
    return {};
  }
}
function saveSeen(seen) {
  fs.mkdirSync(path.dirname(SEEN_FILE), { recursive: true });
  fs.writeFileSync(SEEN_FILE, JSON.stringify(seen, null, 2));
}
function fingerprint(item) {
  return `${item.url}|${item.date}`;
}

async function runWatch(city, targetName, opts) {
  if (UNSUPPORTED_TARGETS[targetName]) {
    output(success(
      { supported: false, target: targetName },
      [
        `${UNSUPPORTED_TARGETS[targetName]} v1 不支持（依赖本人账号登录态，基于隐私和合规考虑）。`,
        '请直接登录官网查看本人状态。',
      ].join('\n'),
    ));
    return;
  }

  const source = getSource(city);
  const target = source.watchTargets?.[targetName];
  if (!target) {
    output(error(`${city} 暂不支持 watch ${targetName}`));
    process.exitCode = 1;
    return;
  }

  const seen = loadSeen();
  const seenKey = `${city}_${targetName}`;
  const seenForTarget = new Set(seen[seenKey] || []);
  const isFirstRun = seenForTarget.size === 0;

  let items;
  try {
    items = await target.fetch(opts);
  } catch (err) {
    output(error(`抓取失败: ${err.message}`));
    process.exitCode = 1;
    return;
  }

  const newItems = [];
  for (const item of items) {
    const fp = fingerprint(item);
    if (seenForTarget.has(fp)) continue;
    seenForTarget.add(fp);
    newItems.push(item);
  }

  seen[seenKey] = Array.from(seenForTarget).slice(-200);
  saveSeen(seen);

  const shouldNotify = !isFirstRun && newItems.length > 0;

  if (opts.json) {
    console.log(JSON.stringify({ city, target: targetName, isFirstRun, newCount: newItems.length, items: newItems }, null, 2));
    return;
  }

  const lines = [];
  if (isFirstRun) {
    lines.push(`[${city} ${target.desc}] 首次运行，已记录当前 ${items.length} 条历史（不推送），下次运行后开始检测新增`);
  } else if (newItems.length === 0) {
    lines.push(`[${city} ${target.desc}] 无新增内容`);
  } else {
    lines.push(`[${city} ${target.desc}] 检测到 ${newItems.length} 条新增：`);
    for (const item of newItems) {
      lines.push(`  ${item.date}  ${item.kind ? `[${item.kind}] ` : ''}${item.title}`);
      lines.push(`    ${item.url}`);
    }
  }

  let notified = 0;
  if (shouldNotify && opts.notify !== false && isInitialized()) {
    const user = getUser();
    const notifyUrls = user.notify_urls || [];
    if (notifyUrls.length > 0) {
      const title = `[yaohao] ${city} ${target.desc}：${newItems.length} 条新增`;
      const body = newItems.map((i) => `${i.date} ${i.title}\n${i.url}`).join('\n\n');
      try {
        await notify(notifyUrls, title, body);
        notified = notifyUrls.length;
        lines.push('');
        lines.push(`已推送到 ${notified} 个通知渠道`);
      } catch (err) {
        lines.push('');
        lines.push(`(推送失败: ${err.message})`);
      }
    }
  }

  output(success(
    { city, target: targetName, isFirstRun, newCount: newItems.length, items: newItems, notified },
    lines.join('\n'),
  ));
}

export function registerWatchCommand(program) {
  const watch = program.command('watch').description('订阅/提醒类命令');

  const supportedTargets = [
    { name: 'result', desc: '开奖结果' },
    { name: 'policy', desc: '政策变化' },
    { name: 'window', desc: '申请窗口开放' },
  ];

  for (const t of supportedTargets) {
    watch
      .command(t.name)
      .description(t.desc)
      .option('--city <city>', `城市 (${listImplemented().join('|')})`)
      .option('--no-cache', '禁用缓存，强制重新抓取')
      .option('--no-notify', '不推送通知，只输出到 stdout')
      .option('--json', '原始 JSON 输出')
      .action(async (opts) => {
        await runWatch(resolveCity(opts), t.name, opts);
      });
  }

  for (const [name, desc] of Object.entries(UNSUPPORTED_TARGETS)) {
    watch
      .command(name)
      .description(`（v1 不支持）${desc}`)
      .action(async () => {
        await runWatch(null, name, {});
      });
  }
}
