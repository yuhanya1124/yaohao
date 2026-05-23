#!/usr/bin/env node

// yaohao-mcp: MCP server entry point.
// 让支持 Model Context Protocol 的客户端（Claude Desktop / Cursor / Cline / Continue / Codex CLI 等）
// 通过 stdio 调用 yaohao 的工具。
//
// 在客户端配置类似：
//   {
//     "mcpServers": {
//       "yaohao": { "command": "npx", "args": ["-y", "yaohao-mcp"] }
//     }
//   }

import '../src/mcp/server.js';
