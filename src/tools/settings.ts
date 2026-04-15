import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerSettingsTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_get_system_settings', { description: 'Get system settings (read-only). Includes bot limit.', inputSchema: {} }, async () => {
    const settings = await client.get('/settings/system');
    return { content: [{ type: 'text', text: JSON.stringify(settings, null, 2) }] };
  });

  server.registerTool('ob2_get_environment', { description: 'Get environment settings: wordlist types, custom statuses, export formats from Environment.ini.', inputSchema: {} }, async () => {
    const settings = await client.get('/settings/environment');
    return { content: [{ type: 'text', text: JSON.stringify(settings, null, 2) }] };
  });

  server.registerTool('ob2_get_settings', { description: 'Get OpenBullet settings (general, remote, security, customization). Admin only.', inputSchema: {} }, async () => {
    const settings = await client.get('/settings');
    return { content: [{ type: 'text', text: JSON.stringify(settings, null, 2) }] };
  });

  server.registerTool('ob2_get_safe_settings', { description: 'Get safe (guest-visible) OpenBullet settings.', inputSchema: {} }, async () => {
    const settings = await client.get('/settings/safe');
    return { content: [{ type: 'text', text: JSON.stringify(settings, null, 2) }] };
  });

  server.registerTool('ob2_get_rurilib_settings', { description: 'Get RuriLib global settings (HTTP, proxy, captcha). Admin only.', inputSchema: {} }, async () => {
    const settings = await client.get('/settings/rurilib');
    return { content: [{ type: 'text', text: JSON.stringify(settings, null, 2) }] };
  });

  server.registerTool('ob2_update_rurilib_settings', { description: 'Update RuriLib global settings. Admin only.', inputSchema: { settings: z.string().describe('JSON string of full RuriLib global settings') } }, async (args) => {
    const settings = await client.put('/settings/rurilib', JSON.parse(args.settings));
    return { content: [{ type: 'text', text: `RuriLib settings updated: ${JSON.stringify(settings, null, 2)}` }] };
  });

  server.registerTool('ob2_update_settings', { description: 'Update OpenBullet settings. Admin only.', inputSchema: { settings: z.string().describe('JSON string of full OpenBullet settings') } }, async (args) => {
    const settings = await client.put('/settings', JSON.parse(args.settings));
    return { content: [{ type: 'text', text: `OpenBullet settings updated: ${JSON.stringify(settings, null, 2)}` }] };
  });

  server.registerTool('ob2_update_admin_password', { description: 'Update the admin account password. Admin only.', inputSchema: { password: z.string().describe('New admin password') } }, async (args) => {
    await client.patch('/settings/admin/password', { password: args.password });
    return { content: [{ type: 'text', text: 'Admin password updated successfully.' }] };
  });

  server.registerTool('ob2_list_themes', { description: 'List all available CSS themes. Admin only.', inputSchema: {} }, async () => {
    const themes = await client.get('/settings/theme/all');
    return { content: [{ type: 'text', text: JSON.stringify(themes, null, 2) }] };
  });

  server.registerTool('ob2_get_custom_snippets', { description: 'Get custom LoliCode snippets defined in settings. Admin only.', inputSchema: {} }, async () => {
    const snippets = await client.get('/settings/custom-snippets');
    return { content: [{ type: 'text', text: JSON.stringify(snippets, null, 2) }] };
  });
}
