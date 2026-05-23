import fs from 'node:fs';
import path from 'node:path';
import { homedir, platform } from 'node:os';
import { output, success, error } from '../output.js';

// 一键检测 + 安装 yaohao MCP server 到所有支持的 AI Agent 客户端
// 策略：JSON 配置自动 merge；YAML 配置只检测 + 提示手动添加（避免误改用户手写 YAML）

const home = homedir();
const isWin = platform() === 'win32';
const isMac = platform() === 'darwin';

const MCP_SERVER = { command: 'npx', args: ['-y', 'yaohao-mcp'] };

// 各 AI Agent 的配置元数据
const AGENTS = [
  {
    name: 'Claude Code',
    configPath: path.join(home, '.claude', 'mcp.json'),
    format: 'json',
    mergeKey: 'mcpServers',
  },
  {
    name: 'Claude Desktop',
    configPath: isWin
      ? path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json')
      : isMac
        ? path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
        : path.join(home, '.config', 'Claude', 'claude_desktop_config.json'),
    detectDir: isMac
      ? path.join(home, 'Library', 'Application Support', 'Claude')
      : isWin
        ? path.join(process.env.APPDATA || '', 'Claude')
        : path.join(home, '.config', 'Claude'),
    format: 'json',
    mergeKey: 'mcpServers',
  },
  {
    name: 'Cursor',
    configPath: path.join(home, '.cursor', 'mcp.json'),
    format: 'json',
    mergeKey: 'mcpServers',
  },
  {
    name: 'Continue',
    configPath: path.join(home, '.continue', 'config.json'),
    format: 'json-continue',
    mergeKey: 'mcpServers',
  },
  {
    name: 'OpenClaw',
    configPath: path.join(home, '.openclaw', 'config.yaml'),
    format: 'yaml',
    yamlSnippet: `mcp:
  servers:
    yaohao:
      command: npx
      args:
        - "-y"
        - "yaohao-mcp"`,
  },
  {
    name: 'Hermes Agent',
    configPath: path.join(home, '.hermes', 'config.yaml'),
    format: 'yaml',
    yamlSnippet: `mcp_servers:
  yaohao:
    command: npx
    args:
      - "-y"
      - "yaohao-mcp"`,
  },
];

function detectAgent(agent) {
  // 优先看 detectDir（专门指定的检测目录），否则看 config 文件的父目录
  const dir = agent.detectDir || path.dirname(agent.configPath);
  return fs.existsSync(dir);
}

function installJsonAgent(agent, dryRun) {
  let config = {};
  let existed = false;
  if (fs.existsSync(agent.configPath)) {
    existed = true;
    try {
      const raw = fs.readFileSync(agent.configPath, 'utf-8').trim();
      config = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return { status: 'error', message: `JSON 解析失败: ${e.message}` };
    }
  }
  const key = agent.mergeKey;
  config[key] = config[key] || {};
  if (config[key].yaohao) {
    return { status: 'exists', path: agent.configPath };
  }
  config[key].yaohao = MCP_SERVER;
  if (!dryRun) {
    fs.mkdirSync(path.dirname(agent.configPath), { recursive: true });
    fs.writeFileSync(agent.configPath, JSON.stringify(config, null, 2) + '\n');
  }
  return { status: existed ? 'merged' : 'created', path: agent.configPath };
}

function installYamlAgent(agent) {
  // YAML 不自动改，避免破坏用户手写复杂 YAML
  return {
    status: 'manual',
    path: agent.configPath,
    snippet: agent.yamlSnippet,
    existsAlready: fs.existsSync(agent.configPath),
  };
}

export function registerInstallCommand(program) {
  program
    .command('install')
    .description('检测系统中的 AI Agent，一键注入 yaohao MCP server 配置')
    .option('--dry-run', '只检测和预览，不实际写文件')
    .option('--json', 'JSON 输出（脚本使用）')
    .action(async (opts) => {
      const dry = !!opts.dryRun;
      const results = [];

      for (const agent of AGENTS) {
        const detected = detectAgent(agent);
        if (!detected) {
          results.push({ name: agent.name, status: 'not_found', configPath: agent.configPath });
          continue;
        }
        if (agent.format === 'json' || agent.format === 'json-continue') {
          const r = installJsonAgent(agent, dry);
          results.push({ name: agent.name, ...r });
        } else if (agent.format === 'yaml') {
          const r = installYamlAgent(agent);
          results.push({ name: agent.name, ...r });
        }
      }

      if (opts.json) {
        console.log(JSON.stringify({ dryRun: dry, results }, null, 2));
        return;
      }

      const lines = [];
      lines.push(`🔍 检测系统中已安装的 AI Agent...${dry ? '（dry-run 预览模式）' : ''}`);
      lines.push('');

      let counts = { created: 0, merged: 0, exists: 0, manual: 0, not_found: 0, error: 0 };

      for (const r of results) {
        counts[r.status]++;
        if (r.status === 'created') {
          lines.push(`✓ ${r.name}：${dry ? '[dry-run] 将创建' : '已创建'} ${r.path}`);
        } else if (r.status === 'merged') {
          lines.push(`✓ ${r.name}：${dry ? '[dry-run] 将合并到' : '已合并到'} ${r.path}`);
        } else if (r.status === 'exists') {
          lines.push(`◯ ${r.name}：yaohao 配置已存在，跳过 (${r.path})`);
        } else if (r.status === 'manual') {
          lines.push(`✎ ${r.name}：检测到客户端，YAML 配置需要你手动添加`);
          lines.push(`  路径: ${r.path}${r.existsAlready ? '' : '（文件不存在，需要新建）'}`);
          lines.push('  内容:');
          for (const ln of r.snippet.split('\n')) {
            lines.push(`    ${ln}`);
          }
        } else if (r.status === 'not_found') {
          lines.push(`⊘ ${r.name}：未检测到（${r.configPath} 父目录不存在）`);
        } else if (r.status === 'error') {
          lines.push(`✗ ${r.name}：${r.message}`);
        }
      }

      lines.push('');
      const summary = [];
      if (counts.created + counts.merged > 0) summary.push(`${counts.created + counts.merged} 已写入`);
      if (counts.exists > 0) summary.push(`${counts.exists} 已存在`);
      if (counts.manual > 0) summary.push(`${counts.manual} 需手动 (YAML)`);
      if (counts.not_found > 0) summary.push(`${counts.not_found} 未检测到`);
      if (counts.error > 0) summary.push(`${counts.error} 失败`);
      lines.push(`📊 结果：${summary.join(' / ')}`);

      if ((counts.created + counts.merged) > 0 && !dry) {
        lines.push('');
        lines.push('🎯 完成。重启对应 AI 客户端后，可直接对话调用 yaohao。');
        lines.push('   例如："北京摇号窗口期还有几天"、"深圳本期中签率多少"');
      }
      if (counts.not_found === AGENTS.length) {
        lines.push('');
        lines.push('⚠️  没检测到任何 AI Agent 客户端。请先安装 Claude Code / Cursor 等再运行。');
      }

      output(success({ dryRun: dry, counts, results }, lines.join('\n')));
    });
}
