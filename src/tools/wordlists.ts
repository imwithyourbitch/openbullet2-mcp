import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerWordlistTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_list_wordlists', { description: 'List all wordlists with id, name, purpose, type, line count, and file path.', inputSchema: {} }, async () => {
    const wordlists = await client.get('/wordlist/all');
    return { content: [{ type: 'text', text: JSON.stringify(wordlists, null, 2) }] };
  });

  server.registerTool('ob2_get_wordlist', { description: 'Get detailed info of a specific wordlist.', inputSchema: { id: z.number().describe('Wordlist ID') } }, async (args) => {
    const wordlist = await client.get('/wordlist', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(wordlist, null, 2) }] };
  });

  server.registerTool('ob2_preview_wordlist', { description: 'Preview the first N lines of a wordlist file.', inputSchema: { id: z.number().describe('Wordlist ID'), lineCount: z.number().optional().describe('Lines to preview. Default: 10') } }, async (args) => {
    const preview = await client.get('/wordlist/preview', { query: { id: args.id, lineCount: args.lineCount ?? 10 } });
    return { content: [{ type: 'text', text: JSON.stringify(preview, null, 2) }] };
  });

  server.registerTool('ob2_create_wordlist', {
    description: 'Create a wordlist entry referencing an existing file on disk.',
    inputSchema: {
      name: z.string().describe('Wordlist name'),
      purpose: z.string().describe('Purpose description'),
      wordlistType: z.string().describe('Wordlist type (e.g., "Default", "Credentials")'),
      filePath: z.string().describe('Path to the wordlist file'),
    },
  }, async (args) => {
    const wordlist = await client.post('/wordlist', { name: args.name, purpose: args.purpose, wordlistType: args.wordlistType, filePath: args.filePath });
    return { content: [{ type: 'text', text: `Wordlist created: ${JSON.stringify(wordlist, null, 2)}` }] };
  });

  server.registerTool('ob2_update_wordlist', {
    description: 'Update wordlist info (name, purpose, type). Only the fields you supply are changed; the rest are preserved by fetching the current wordlist first.',
    inputSchema: {
      id: z.number().describe('Wordlist ID'),
      name: z.string().optional().describe('New name'),
      purpose: z.string().optional().describe('New purpose'),
      wordlistType: z.string().optional().describe('New wordlist type'),
    },
  }, async (args) => {
    const current = await client.get<{ name?: string; purpose?: string; wordlistType?: string }>('/wordlist', { query: { id: args.id } });
    const wordlist = await client.patch('/wordlist/info', {
      id: args.id,
      name: args.name ?? current.name ?? '',
      purpose: args.purpose ?? current.purpose ?? '',
      wordlistType: args.wordlistType ?? current.wordlistType ?? '',
    });
    return { content: [{ type: 'text', text: `Wordlist updated: ${JSON.stringify(wordlist, null, 2)}` }] };
  });

  server.registerTool('ob2_delete_wordlist', { description: 'Delete a wordlist entry.', inputSchema: { id: z.number().describe('Wordlist ID'), alsoDeleteFile: z.boolean().optional().describe('Also delete file from disk. Default: false') } }, async (args) => {
    await client.delete('/wordlist', { query: { id: args.id, alsoDeleteFile: args.alsoDeleteFile ?? false } });
    return { content: [{ type: 'text', text: `Wordlist ${args.id} deleted.` }] };
  });

  server.registerTool('ob2_delete_not_found_wordlists', { description: 'Delete wordlists referencing missing files.', inputSchema: {} }, async () => {
    const result = await client.delete('/wordlist/not-found');
    return { content: [{ type: 'text', text: `Not-found wordlists deleted: ${JSON.stringify(result)}` }] };
  });
}
