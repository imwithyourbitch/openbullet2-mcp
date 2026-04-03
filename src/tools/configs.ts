import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerConfigTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_list_configs', {
    description: 'List all configs (scripts) in OpenBullet 2. Returns id, name, author, category, mode, and other metadata for each config.',
    inputSchema: { reload: z.boolean().optional().describe('Whether to reload configs from disk before listing. Default: false') },
  }, async (args) => {
    const configs = await client.get('/config/all', { query: { reload: args.reload || false } });
    return { content: [{ type: 'text', text: JSON.stringify(configs, null, 2) }] };
  });

  server.registerTool('ob2_get_config', {
    description: 'Get full details of a specific config including scripts (LoliCode, C#, LoliScript), settings, metadata, and readme.',
    inputSchema: { id: z.string().describe('Config ID (UUID format)') },
  }, async (args) => {
    const config = await client.get('/config', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(config, null, 2) }] };
  });

  server.registerTool('ob2_get_config_metadata', {
    description: 'Get metadata for a specific config (name, category, author, image, dates, plugins).',
    inputSchema: { id: z.string().describe('Config ID (UUID format)') },
  }, async (args) => {
    const metadata = await client.get('/config/metadata', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(metadata, null, 2) }] };
  });

  server.registerTool('ob2_get_config_readme', {
    description: 'Get the readme (documentation) for a specific config.',
    inputSchema: { id: z.string().describe('Config ID (UUID format)') },
  }, async (args) => {
    const readme = await client.get('/config/readme', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(readme, null, 2) }] };
  });

  server.registerTool('ob2_create_config', {
    description: 'Create a new empty config in OpenBullet 2. Returns the new config with a generated ID.',
    inputSchema: {},
  }, async () => {
    const config = await client.post('/config', {});
    return { content: [{ type: 'text', text: `New config created successfully:\n${JSON.stringify(config, null, 2)}` }] };
  });

  server.registerTool('ob2_update_config', {
    description: 'Update an existing config. You must provide the full config data including id, mode, metadata, settings, and scripts.',
    inputSchema: { configData: z.string().describe('JSON string of the full config data to update. Must include id, mode, metadata, settings, and script fields.') },
  }, async (args) => {
    const data = JSON.parse(args.configData);
    const config = await client.put('/config', data);
    return { content: [{ type: 'text', text: `Config updated successfully:\n${JSON.stringify(config, null, 2)}` }] };
  });

  server.registerTool('ob2_delete_config', {
    description: 'Delete a config by its ID. This action cannot be undone.',
    inputSchema: { id: z.string().describe('Config ID (UUID format) to delete') },
  }, async (args) => {
    await client.delete('/config', { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Config ${args.id} deleted successfully.` }] };
  });

  server.registerTool('ob2_clone_config', {
    description: 'Clone an existing config to create a copy. Returns the new cloned config.',
    inputSchema: { id: z.string().describe('Config ID (UUID format) to clone') },
  }, async (args) => {
    const config = await client.post('/config/clone', null, { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Config cloned successfully:\n${JSON.stringify(config, null, 2)}` }] };
  });

  server.registerTool('ob2_debug_config', {
    description: 'Debug/test a config execution with sample data. Returns the log output, captured variables, and any errors. Useful for testing LoliCode scripts.',
    inputSchema: {
      configId: z.string().describe('Config ID (UUID format) to debug'),
      testData: z.string().describe('Sample input data to test with (e.g., "username:password" for credential configs)'),
      wordlistType: z.string().describe('Wordlist type to use (e.g., "Default", "Credentials"). Determines how testData is parsed.'),
      testProxy: z.string().nullable().optional().describe('Optional proxy to use in format "(type)host:port:user:pass" or null'),
      proxyType: z.string().optional().describe('Proxy type if using testProxy (http, socks4, socks5). Default: http'),
    },
  }, async (args) => {
    const result = await client.post('/config/debug', {
      configId: args.configId,
      testData: args.testData,
      wordlistType: args.wordlistType,
      testProxy: args.testProxy || null,
      proxyType: args.proxyType || 'http',
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('ob2_convert_lolicode', {
    description: 'Convert between LoliCode, C#, and Stack (block) representations. Specify the source format and target format.',
    inputSchema: {
      source: z.string().describe('Source code/script to convert from'),
      direction: z.enum(['lolicode-to-csharp', 'lolicode-to-stack', 'stack-to-lolicode']).describe('Conversion direction'),
    },
  }, async (args) => {
    let result;
    switch (args.direction) {
      case 'lolicode-to-csharp':
        result = await client.post('/config/convert/lolicode/csharp', {
          loliCode: args.source,
          settings: {
            generalSettings: {},
            proxySettings: {},
            inputSettings: {},
            dataSettings: {},
            browserSettings: {},
            scriptSettings: {},
          },
        });
        break;
      case 'lolicode-to-stack':
        result = await client.post('/config/convert/lolicode/stack', { loliCode: args.source });
        break;
      case 'stack-to-lolicode':
        result = await client.post('/config/convert/stack/lolicode', { stack: args.source });
        break;
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('ob2_get_block_descriptors', {
    description: 'Get all available block descriptors that can be used in configs. Shows available blocks with their parameters.',
    inputSchema: {},
  }, async () => {
    const blocks = await client.get('/config/block-descriptors');
    return { content: [{ type: 'text', text: JSON.stringify(blocks, null, 2) }] };
  });

  server.registerTool('ob2_get_category_tree', {
    description: 'Get the hierarchical category tree of available blocks for config building.',
    inputSchema: {},
  }, async () => {
    const tree = await client.get('/config/category-tree');
    return { content: [{ type: 'text', text: JSON.stringify(tree, null, 2) }] };
  });

  server.registerTool('ob2_get_block_snippets', {
    description: 'Get LoliCode snippets for all available blocks. Useful for learning how to write blocks.',
    inputSchema: {},
  }, async () => {
    const snippets = await client.get('/config/block-snippets');
    return { content: [{ type: 'text', text: JSON.stringify(snippets, null, 2) }] };
  });
}
