import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerDebugTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_garbage_collect', {
    description: 'Trigger .NET garbage collection to free memory. Admin only.',
    inputSchema: {
      generations: z.number().optional().describe('GC generations (-1 for all). Default: -1'),
      mode: z.string().optional().describe('GC mode. Default: Default'),
      blocking: z.boolean().optional().describe('Block until complete. Default: true'),
      compacting: z.boolean().optional().describe('Compact heap. Default: true'),
    },
  }, async (args) => {
    await client.post('/debug/gc', { generations: args.generations ?? -1, mode: args.mode || 'Default', blocking: args.blocking ?? true, compacting: args.compacting ?? true });
    return { content: [{ type: 'text', text: 'Garbage collection triggered successfully.' }] };
  });

  server.registerTool('ob2_get_server_logs', { description: 'Download the latest server log as text. Admin only.', inputSchema: {} }, async () => {
    const logs = await client.get('/debug/server-logs');
    return { content: [{ type: 'text', text: typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2) }] };
  });
}
