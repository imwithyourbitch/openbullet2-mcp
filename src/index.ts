#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { OB2Client } from './client/ob2-client.js';
import { getConfig } from './config.js';
import { registerServerTools } from './tools/server.js';
import { registerConfigTools } from './tools/configs.js';
import { registerJobTools } from './tools/jobs.js';
import { registerHitTools } from './tools/hits.js';
import { registerProxyTools } from './tools/proxies.js';
import { registerWordlistTools } from './tools/wordlists.js';
import { registerGuestTools } from './tools/guests.js';
import { registerSettingsTools } from './tools/settings.js';
import { registerAdminTools } from './tools/admin.js';
import { registerDebugTools } from './tools/debug.js';

const config = getConfig();

const server = new McpServer({
  name: 'openbullet2-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

const client = new OB2Client(server, config);

// Register all tool categories
registerServerTools(client);
registerConfigTools(client);
registerJobTools(client);
registerHitTools(client);
registerProxyTools(client);
registerWordlistTools(client);
registerGuestTools(client);
registerSettingsTools(client);
registerAdminTools(client);
registerDebugTools(client);

const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write(`OpenBullet 2 MCP server running (connected to ${config.ob2Url})\n`);
