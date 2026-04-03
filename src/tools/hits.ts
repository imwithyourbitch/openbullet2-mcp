import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerHitTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_list_hits', {
    description: 'List hits with pagination and filtering.',
    inputSchema: {
      pageNumber: z.number().optional().describe('Page number (1-indexed). Default: 1'),
      pageSize: z.number().optional().describe('Items per page. Default: 50'),
      searchTerm: z.string().optional().describe('Search term'),
      configName: z.string().optional().describe('Filter by config name'),
      types: z.string().optional().describe('Comma-separated hit types (SUCCESS,CUSTOM,NONE)'),
      minDate: z.string().optional().describe('Minimum date (ISO 8601)'),
      maxDate: z.string().optional().describe('Maximum date (ISO 8601)'),
      sortBy: z.string().optional().describe('Sort field'),
      sortDescending: z.boolean().optional().describe('Sort descending. Default: true'),
    },
  }, async (args) => {
    const hits = await client.get('/hit/all', {
      query: {
        pageNumber: args.pageNumber ?? 1, pageSize: args.pageSize ?? 50,
        searchTerm: args.searchTerm, configName: args.configName,
        types: args.types, minDate: args.minDate, maxDate: args.maxDate,
        sortBy: args.sortBy, sortDescending: args.sortDescending ?? true,
      },
    });
    return { content: [{ type: 'text', text: JSON.stringify(hits, null, 2) }] };
  });

  server.registerTool('ob2_get_config_names', { description: 'Get all distinct config names that have hits.', inputSchema: {} }, async () => {
    const names = await client.get('/hit/config-names');
    return { content: [{ type: 'text', text: JSON.stringify(names, null, 2) }] };
  });

  server.registerTool('ob2_get_formatted_hits', {
    description: 'Get hits formatted with a specific export format.',
    inputSchema: {
      format: z.string().describe('Export format (e.g., "<DATA> | <CAPTURE>")'),
      configName: z.string().optional().describe('Filter by config name'),
      types: z.string().optional().describe('Comma-separated hit types'),
    },
  }, async (args) => {
    const hits = await client.get('/hit/formatted/many', { query: { format: args.format, configName: args.configName, types: args.types } });
    return { content: [{ type: 'text', text: Array.isArray(hits) ? hits.join('\n') : JSON.stringify(hits, null, 2) }] };
  });

  server.registerTool('ob2_delete_hit', { description: 'Delete a single hit by its ID.', inputSchema: { id: z.number().describe('Hit ID to delete') } }, async (args) => {
    await client.delete('/hit', { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Hit ${args.id} deleted successfully.` }] };
  });

  server.registerTool('ob2_delete_hits', {
    description: 'Delete hits matching filters.',
    inputSchema: {
      searchTerm: z.string().optional().describe('Search term'),
      configName: z.string().optional().describe('Filter by config name'),
      types: z.string().optional().describe('Comma-separated hit types'),
      minDate: z.string().optional().describe('Minimum date'),
      maxDate: z.string().optional().describe('Maximum date'),
    },
  }, async (args) => {
    const result = await client.delete('/hit/many', { query: { searchTerm: args.searchTerm, configName: args.configName, types: args.types, minDate: args.minDate, maxDate: args.maxDate } });
    return { content: [{ type: 'text', text: `Deleted hits matching filters. Result: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_delete_duplicate_hits', { description: 'Remove duplicate hits from the database.', inputSchema: {} }, async () => {
    const result = await client.delete('/hit/duplicates');
    return { content: [{ type: 'text', text: `Duplicate hits deleted. Result: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_purge_hits', { description: 'Delete ALL hits from the database. This is irreversible.', inputSchema: { confirm: z.boolean().describe('Must be true to confirm purge') } }, async (args) => {
    if (!args.confirm) return { content: [{ type: 'text', text: 'Purge cancelled. Set confirm=true to delete ALL hits.' }] };
    const result = await client.delete('/hit/purge');
    return { content: [{ type: 'text', text: `ALL hits purged. Result: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_recent_hits', { description: 'Get recent hit statistics over the last N days.', inputSchema: { days: z.number().optional().describe('Days to look back. Default: 7') } }, async (args) => {
    const stats = await client.get('/hit/recent', { query: { days: args.days ?? 7 } });
    return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
  });

  server.registerTool('ob2_send_to_recheck', {
    description: 'Send hits matching filters to recheck. Creates a new MultiRun Job.',
    inputSchema: {
      configName: z.string().optional().describe('Filter hits by config name'),
      types: z.string().optional().describe('Comma-separated hit types to recheck'),
      searchTerm: z.string().optional().describe('Search term'),
    },
  }, async (args) => {
    const result = await client.post('/hit/send-to-recheck', { configName: args.configName, types: args.types, searchTerm: args.searchTerm });
    return { content: [{ type: 'text', text: `Hits sent to recheck. New job ID: ${JSON.stringify(result)}` }] };
  });

}
