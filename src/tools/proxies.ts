import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerProxyTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_list_proxies', {
    description: 'List proxies with pagination and filtering.',
    inputSchema: {
      proxyGroupId: z.number().optional().describe('Proxy group ID (-1 for all). Default: -1'),
      pageNumber: z.number().optional().describe('Page number. Default: 1'),
      pageSize: z.number().optional().describe('Items per page. Default: 50'),
      searchTerm: z.string().optional().describe('Search term'),
      type: z.string().optional().describe('Filter by type (HTTP, SOCKS4, SOCKS5)'),
      status: z.string().optional().describe('Filter by status (Working, NotWorking, ToCheck, Banned)'),
      sortBy: z.string().optional().describe('Sort field'),
      sortDescending: z.boolean().optional().describe('Sort descending'),
    },
  }, async (args) => {
    const proxies = await client.get('/proxy/all', {
      query: { proxyGroupId: args.proxyGroupId ?? -1, pageNumber: args.pageNumber ?? 1, pageSize: args.pageSize ?? 50, searchTerm: args.searchTerm, type: args.type, status: args.status, sortBy: args.sortBy, sortDescending: args.sortDescending ?? false },
    });
    return { content: [{ type: 'text', text: JSON.stringify(proxies, null, 2) }] };
  });

  server.registerTool('ob2_add_proxies', {
    description: 'Add proxies from a list of proxy strings. Format: "(type)host:port:user:pass" or "(type)host:port".',
    inputSchema: {
      proxyGroupId: z.number().describe('Proxy group ID'),
      proxies: z.string().describe('JSON array of proxy strings. E.g. ["(http)1.2.3.4:8080:user:pass"]'),
      defaultType: z.string().optional().describe('Default type. Default: HTTP'),
      defaultUsername: z.string().optional().describe('Default username'),
      defaultPassword: z.string().optional().describe('Default password'),
    },
  }, async (args) => {
    const result = await client.post('/proxy/add', { proxyGroupId: args.proxyGroupId, proxies: JSON.parse(args.proxies), defaultType: args.defaultType || 'HTTP', defaultUsername: args.defaultUsername || '', defaultPassword: args.defaultPassword || '' });
    return { content: [{ type: 'text', text: `Proxies added: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_add_proxies_from_remote', {
    description: 'Add proxies from a remote URL that returns proxies (one per line).',
    inputSchema: {
      proxyGroupId: z.number().describe('Proxy group ID'),
      url: z.string().describe('URL returning proxy list'),
      defaultType: z.string().optional().describe('Default type. Default: HTTP'),
      defaultUsername: z.string().optional().describe('Default username'),
      defaultPassword: z.string().optional().describe('Default password'),
    },
  }, async (args) => {
    const result = await client.post('/proxy/add-from-remote', { proxyGroupId: args.proxyGroupId, url: args.url, defaultType: args.defaultType || 'HTTP', defaultUsername: args.defaultUsername || '', defaultPassword: args.defaultPassword || '' });
    return { content: [{ type: 'text', text: `Proxies added from remote: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_delete_proxies', {
    description: 'Delete proxies matching filters.',
    inputSchema: {
      proxyGroupId: z.number().describe('Proxy group ID (-1 for all)'),
      searchTerm: z.string().optional().describe('Search term'),
      type: z.string().optional().describe('Filter by type'),
      status: z.string().optional().describe('Filter by status'),
    },
  }, async (args) => {
    const result = await client.delete('/proxy/many', { query: { proxyGroupId: args.proxyGroupId, searchTerm: args.searchTerm, type: args.type, status: args.status } });
    return { content: [{ type: 'text', text: `Proxies deleted: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_move_proxies', {
    description: 'Move proxies from one group to another.',
    inputSchema: {
      proxyGroupId: z.number().describe('Source group ID'),
      destinationGroupId: z.number().describe('Destination group ID'),
      searchTerm: z.string().optional().describe('Search term'),
      type: z.string().optional().describe('Filter by type'),
      status: z.string().optional().describe('Filter by status'),
    },
  }, async (args) => {
    const result = await client.post('/proxy/move/many', { proxyGroupId: args.proxyGroupId, destinationGroupId: args.destinationGroupId, searchTerm: args.searchTerm, type: args.type, status: args.status, pageNumber: 1, pageSize: 1000000 });
    return { content: [{ type: 'text', text: `Proxies moved: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_delete_slow_proxies', {
    description: 'Delete slow working proxies based on ping threshold.',
    inputSchema: {
      proxyGroupId: z.number().describe('Proxy group ID'),
      maxPing: z.number().optional().describe('Max ping in ms. Default: 10000'),
    },
  }, async (args) => {
    const result = await client.delete('/proxy/slow', { query: { proxyGroupId: args.proxyGroupId, maxPing: args.maxPing ?? 10000 } });
    return { content: [{ type: 'text', text: `Slow proxies deleted: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_list_proxy_groups', { description: 'List all proxy groups.', inputSchema: {} }, async () => {
    const groups = await client.get('/proxy-group/all');
    return { content: [{ type: 'text', text: JSON.stringify(groups, null, 2) }] };
  });

  server.registerTool('ob2_create_proxy_group', { description: 'Create a new proxy group.', inputSchema: { name: z.string().describe('Group name') } }, async (args) => {
    const group = await client.post('/proxy-group', { name: args.name });
    return { content: [{ type: 'text', text: `Proxy group created: ${JSON.stringify(group, null, 2)}` }] };
  });

  server.registerTool('ob2_update_proxy_group', { description: 'Update a proxy group name.', inputSchema: { id: z.number().describe('Group ID'), name: z.string().describe('New name') } }, async (args) => {
    const group = await client.put('/proxy-group', { id: args.id, name: args.name });
    return { content: [{ type: 'text', text: `Proxy group updated: ${JSON.stringify(group, null, 2)}` }] };
  });

  server.registerTool('ob2_delete_proxy_group', { description: 'Delete a proxy group and all its proxies.', inputSchema: { id: z.number().describe('Group ID to delete') } }, async (args) => {
    const result = await client.delete('/proxy-group', { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Proxy group deleted. Proxies removed: ${JSON.stringify(result)}` }] };
  });
}
