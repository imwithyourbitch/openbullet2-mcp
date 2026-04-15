import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerServerTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_login', {
    description: 'Authenticate with OpenBullet 2 and get a JWT token. Only needed if your OB2 instance has auth enabled. If you just run OB2 without setting up accounts, you can skip this - the server will work without credentials.',
    inputSchema: {
      username: z.string().optional().describe('Admin or guest username. Defaults to env OB2_USERNAME if set.'),
      password: z.string().optional().describe('Admin or guest password. Defaults to env OB2_PASSWORD if set.'),
    },
  }, async (args) => {
    if (!client.isConfigured && !args.username && !args.password) {
      return {
        content: [{ type: 'text', text: 'No credentials configured. If your OB2 instance requires authentication, set OB2_USERNAME and OB2_PASSWORD environment variables, or provide them as arguments. If your OB2 instance has no auth, you can skip this tool - other tools will work without a token.' }],
      };
    }
    const token = await client.login(args.username, args.password);
    return {
      content: [{ type: 'text', text: `Successfully authenticated with OpenBullet 2. Token: ${token.slice(0, 20)}...` }],
    };
  });

  server.registerTool('ob2_health', {
    description: 'Check if the OpenBullet 2 server is running and reachable.',
    inputSchema: {},
  }, async () => {
    const result = await client.get<string>('/health', { requireAuth: false });
    return {
      content: [{ type: 'text', text: `OpenBullet 2 server is healthy. Response: ${result}` }],
    };
  });

  server.registerTool('ob2_server_info', {
    description: 'Get detailed server information including OS, build number, working directory, uptime, and client IP.',
    inputSchema: {},
  }, async () => {
    const info = await client.get('/info/server');
    return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
  });

  server.registerTool('ob2_collection_stats', {
    description: 'Get collection statistics: counts of jobs, proxies, wordlists, hits, configs, guests, and plugins.',
    inputSchema: {},
  }, async () => {
    const stats = await client.get('/info/collection');
    return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
  });

  server.registerTool('ob2_announcement', {
    description: 'Get the current OpenBullet 2 announcement message.',
    inputSchema: {},
  }, async () => {
    const announcement = await client.get('/info/announcement');
    return { content: [{ type: 'text', text: JSON.stringify(announcement, null, 2) }] };
  });

  server.registerTool('ob2_changelog', {
    description: 'Get the changelog for a specific version or the latest version.',
    inputSchema: {
      version: z.string().optional().describe('Version string (e.g. "0.3.2"). Leave empty for latest.'),
    },
  }, async (args) => {
    const changelog = await client.get('/info/changelog', { query: args.version ? { v: args.version } : {} });
    return { content: [{ type: 'text', text: JSON.stringify(changelog, null, 2) }] };
  });

  server.registerTool('ob2_check_update', {
    description: 'Check if an update is available for OpenBullet 2.',
    inputSchema: {},
  }, async () => {
    const update = await client.get('/info/update');
    return { content: [{ type: 'text', text: JSON.stringify(update, null, 2) }] };
  });
}
