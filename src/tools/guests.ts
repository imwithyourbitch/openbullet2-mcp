import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerGuestTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_list_guests', { description: 'List all guest users. Admin only.', inputSchema: {} }, async () => {
    const guests = await client.get('/guest/all');
    return { content: [{ type: 'text', text: JSON.stringify(guests, null, 2) }] };
  });

  server.registerTool('ob2_get_guest', { description: 'Get a specific guest user by ID. Admin only.', inputSchema: { id: z.number().describe('Guest user ID') } }, async (args) => {
    const guest = await client.get('/guest', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(guest, null, 2) }] };
  });

  server.registerTool('ob2_create_guest', {
    description: 'Create a new guest user. Guests can manage their own proxies, wordlists, jobs, and hits but cannot view/download configs or change settings. Admin only.',
    inputSchema: {
      username: z.string().describe('Guest username (3-32 characters)'),
      password: z.string().optional().describe('Guest password (minimum 8 characters required by OB2)'),
      accessExpiration: z.string().describe('Access expiration date in ISO 8601 format'),
      allowedAddresses: z.string().optional().describe('JSON array of allowed IP addresses. Empty array means any IP.'),
    },
  }, async (args) => {
    const guest = await client.post('/guest', {
      username: args.username,
      password: args.password || '',
      accessExpiration: args.accessExpiration,
      allowedAddresses: args.allowedAddresses ? JSON.parse(args.allowedAddresses) : [],
    });
    return { content: [{ type: 'text', text: `Guest created: ${JSON.stringify(guest, null, 2)}` }] };
  });

  server.registerTool('ob2_update_guest', {
    description: 'Update a guest user info (username, expiration, allowed IPs). Admin only.',
    inputSchema: {
      id: z.number().describe('Guest ID'),
      username: z.string().optional().describe('New username'),
      accessExpiration: z.string().optional().describe('New expiration date (ISO 8601)'),
      allowedAddresses: z.string().optional().describe('JSON array of allowed IPs'),
    },
  }, async (args) => {
    const guest = await client.patch('/guest/info', {
      id: args.id,
      username: args.username || '',
      accessExpiration: args.accessExpiration || '',
      allowedAddresses: args.allowedAddresses ? JSON.parse(args.allowedAddresses) : [],
    });
    return { content: [{ type: 'text', text: `Guest updated: ${JSON.stringify(guest, null, 2)}` }] };
  });

  server.registerTool('ob2_update_guest_password', {
    description: 'Update a guest user password. Admin only.',
    inputSchema: {
      id: z.number().describe('Guest ID'),
      password: z.string().describe('New password'),
    },
  }, async (args) => {
    const guest = await client.patch('/guest/password', { id: args.id, password: args.password });
    return { content: [{ type: 'text', text: `Guest password updated: ${JSON.stringify(guest, null, 2)}` }] };
  });

  server.registerTool('ob2_delete_guest', { description: 'Delete a guest user. Admin only.', inputSchema: { id: z.number().describe('Guest ID to delete') } }, async (args) => {
    await client.delete('/guest', { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Guest ${args.id} deleted.` }] };
  });
}
