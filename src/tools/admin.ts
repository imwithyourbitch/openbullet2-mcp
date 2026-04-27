import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerAdminTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_list_plugins', { description: 'List all active plugins. Admin only.', inputSchema: {} }, async () => {
    const plugins = await client.get('/plugin/all');
    return { content: [{ type: 'text', text: JSON.stringify(plugins, null, 2) }] };
  });

  server.registerTool('ob2_delete_plugin', { description: 'Mark a plugin for deletion. Removed on next server restart. Admin only.', inputSchema: { name: z.string().describe('Plugin name to delete') } }, async (args) => {
    await client.delete('/plugin', { query: { name: args.name } });
    return { content: [{ type: 'text', text: `Plugin "${args.name}" marked for deletion. Restart OB2 to complete removal.` }] };
  });

  server.registerTool('ob2_list_shared_endpoints', { description: 'List all shared config endpoints. Admin only.', inputSchema: {} }, async () => {
    const endpoints = await client.get('/shared/endpoint/all');
    return { content: [{ type: 'text', text: JSON.stringify(endpoints, null, 2) }] };
  });

  server.registerTool('ob2_create_shared_endpoint', {
    description: 'Create a shared endpoint to distribute configs to other OB2 clients. Admin only.',
    inputSchema: {
      route: z.string().describe('URL route for the endpoint (e.g., "/my-configs")'),
      apiKeys: z.string().describe('JSON array of API keys. E.g., ["key1", "key2"]'),
      configIds: z.string().describe('JSON array of config IDs to share. E.g., ["uuid1", "uuid2"]'),
    },
  }, async (args) => {
    const endpoint = await client.post('/shared/endpoint', { route: args.route, apiKeys: JSON.parse(args.apiKeys), configIds: JSON.parse(args.configIds) });
    return { content: [{ type: 'text', text: `Shared endpoint created: ${JSON.stringify(endpoint, null, 2)}` }] };
  });

  server.registerTool('ob2_update_shared_endpoint', {
    description: 'Update an existing shared endpoint. Admin only.',
    inputSchema: {
      route: z.string().describe('Current route of the endpoint'),
      apiKeys: z.string().describe('JSON array of API keys'),
      configIds: z.string().describe('JSON array of config IDs'),
    },
  }, async (args) => {
    const endpoint = await client.put('/shared/endpoint', { route: args.route, apiKeys: JSON.parse(args.apiKeys), configIds: JSON.parse(args.configIds) });
    return { content: [{ type: 'text', text: `Shared endpoint updated: ${JSON.stringify(endpoint, null, 2)}` }] };
  });

  server.registerTool('ob2_delete_shared_endpoint', { description: 'Delete a shared endpoint. Admin only.', inputSchema: { route: z.string().describe('Route of the endpoint to delete') } }, async (args) => {
    await client.delete('/shared/endpoint', { query: { route: args.route } });
    return { content: [{ type: 'text', text: `Shared endpoint "${args.route}" deleted.` }] };
  });

  server.registerTool('ob2_list_triggered_actions', { description: 'List all triggered actions in the Job Monitor. Admin only.', inputSchema: {} }, async () => {
    const actions = await client.get('/job-monitor/triggered-action/all');
    return { content: [{ type: 'text', text: JSON.stringify(actions, null, 2) }] };
  });

  server.registerTool('ob2_get_triggered_action', { description: 'Get a specific triggered action by ID. Admin only.', inputSchema: { id: z.string().describe('Triggered action ID (UUID)') } }, async (args) => {
    const action = await client.get('/job-monitor/triggered-action', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(action, null, 2) }] };
  });

  server.registerTool('ob2_create_triggered_action', {
    description: 'Create a new triggered action for the Job Monitor. Admin only.',
    inputSchema: {
      name: z.string().describe('Action name'),
      isActive: z.boolean().optional().describe('Whether active. Default: true'),
      isRepeatable: z.boolean().optional().describe('Whether repeatable. Default: false'),
      jobId: z.number().describe('Job ID to monitor'),
      triggers: z.string().describe('JSON array of trigger conditions'),
      actions: z.string().describe('JSON array of actions to perform'),
    },
  }, async (args) => {
    const action = await client.post('/job-monitor/triggered-action', {
      name: args.name, isActive: args.isActive ?? true, isRepeatable: args.isRepeatable ?? false,
      jobId: args.jobId, triggers: JSON.parse(args.triggers), actions: JSON.parse(args.actions),
    });
    return { content: [{ type: 'text', text: `Triggered action created: ${JSON.stringify(action, null, 2)}` }] };
  });

  server.registerTool('ob2_update_triggered_action', {
    description: 'Update an existing triggered action. Admin only. Only the fields you supply are changed; the rest are preserved by fetching the current action first.',
    inputSchema: {
      id: z.string().describe('Triggered action ID'),
      name: z.string().optional().describe('New name'),
      isActive: z.boolean().optional().describe('Whether active'),
      isRepeatable: z.boolean().optional().describe('Whether repeatable'),
      jobId: z.number().optional().describe('Job ID to monitor'),
      triggers: z.string().optional().describe('JSON array of triggers'),
      actions: z.string().optional().describe('JSON array of actions'),
    },
  }, async (args) => {
    const current = await client.get<{ name?: string; isActive?: boolean; isRepeatable?: boolean; jobId?: number; triggers?: unknown[]; actions?: unknown[] }>('/job-monitor/triggered-action', { query: { id: args.id } });
    const action = await client.put('/job-monitor/triggered-action', {
      id: args.id,
      name: args.name ?? current.name ?? '',
      isActive: args.isActive ?? current.isActive ?? true,
      isRepeatable: args.isRepeatable ?? current.isRepeatable ?? false,
      jobId: args.jobId ?? current.jobId ?? 0,
      triggers: args.triggers !== undefined ? JSON.parse(args.triggers) : (current.triggers ?? []),
      actions: args.actions !== undefined ? JSON.parse(args.actions) : (current.actions ?? []),
    });
    return { content: [{ type: 'text', text: `Triggered action updated: ${JSON.stringify(action, null, 2)}` }] };
  });

  server.registerTool('ob2_reset_triggered_action', { description: 'Reset a triggered action execution counter. Admin only.', inputSchema: { id: z.string().describe('Triggered action ID') } }, async (args) => {
    await client.post('/job-monitor/triggered-action/reset', null, { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Triggered action ${args.id} execution counter reset.` }] };
  });

  server.registerTool('ob2_set_triggered_action_active', { description: 'Enable or disable a triggered action. Admin only.', inputSchema: { id: z.string().describe('Triggered action ID'), active: z.boolean().describe('Whether to enable or disable') } }, async (args) => {
    await client.post('/job-monitor/triggered-action/set-active', null, { query: { id: args.id, active: args.active } });
    return { content: [{ type: 'text', text: `Triggered action ${args.id} set to ${args.active ? 'active' : 'inactive'}.` }] };
  });

  server.registerTool('ob2_delete_triggered_action', { description: 'Delete a triggered action. Admin only.', inputSchema: { id: z.string().describe('Triggered action ID') } }, async (args) => {
    await client.delete('/job-monitor/triggered-action', { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Triggered action ${args.id} deleted.` }] };
  });
}
