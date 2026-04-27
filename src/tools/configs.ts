import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';
import { LOLICODE_SYNTAX_REFERENCE, LOLICODE_QUICK_REFERENCE, CONFIG_CREATION_GUIDE } from '../lolicode-reference.js';

/** Escape a user-supplied string so it is safe to embed inside a LoliCode "..." literal. */
function escapeLoli(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Validate a LoliCode identifier (variable / capture name). */
function assertLoliIdentifier(name: string, label: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid ${label} '${name}': must match [A-Za-z_][A-Za-z0-9_]*`);
  }
}

export function registerConfigTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_lolicode_reference', {
    description: `Get the complete LoliCode syntax reference for writing OpenBullet 2 configs. Returns comprehensive documentation covering block syntax (BLOCK:Name ... ENDBLOCK), setting values, common blocks (HttpRequest, Parse, Keycheck), statements, flow control, variables, and complete examples. CALL THIS FIRST before writing or editing any LoliCode config.

USE WHEN: Writing or editing any LoliCode config. This is your primary reference for syntax.
SIDE EFFECTS: None - read-only.
RETURNS: Full syntax documentation. Use section="quick" for a condensed cheat sheet, section="guide" for config creation workflow.`,
    inputSchema: {
      section: z.enum(['full', 'quick', 'guide']).optional().describe('Which reference to return: "full" = complete syntax reference (default), "quick" = cheat sheet, "guide" = config creation workflow'),
    },
  }, async (args) => {
    const section = args.section || 'full';
    let text: string;
    switch (section) {
      case 'quick':
        text = LOLICODE_QUICK_REFERENCE;
        break;
      case 'guide':
        text = CONFIG_CREATION_GUIDE;
        break;
      default:
        text = LOLICODE_SYNTAX_REFERENCE;
        break;
    }
    text += '\n\n---\nTIP: For exact block syntax verified by your OB2 instance, also call ob2_get_block_snippets to get real LoliCode snippets for every available block.';
    return { content: [{ type: 'text', text }] };
  });

  server.registerTool('ob2_list_configs', {
    description: `List all configs (scripts) in OpenBullet 2.

USE WHEN: Finding a config ID, browsing available configs, or checking what configs exist.
SIDE EFFECTS: None - read-only.
RETURNS: Array of config objects with id, name, author, category, mode, creationDate, lastModified.
TIP: Set reload=true if configs were recently added/modified on disk.`,
    inputSchema: { 
      reload: z.boolean().optional().describe('Reload configs from disk before listing. Use if configs were recently added. Default: false') 
    },
  }, async (args) => {
    const configs = await client.get('/config/all', { query: { reload: args.reload || false } });
    return { content: [{ type: 'text', text: JSON.stringify(configs, null, 2) }] };
  });

  server.registerTool('ob2_get_config', {
    description: `Get full details of a specific config including scripts, settings, metadata.

USE WHEN: Viewing/editing a specific config, examining LoliCode scripts, or getting settings for modification.
SIDE EFFECTS: None - read-only.
RETURNS: Complete config object with loliCodeScript, settings, metadata, readme.
EXAMPLE: Get config, modify loliCodeScript, save with ob2_update_config.`,
    inputSchema: { id: z.string().describe('Config ID (UUID). Find IDs with ob2_list_configs.') },
  }, async (args) => {
    const config = await client.get('/config', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(config, null, 2) }] };
  });

  server.registerTool('ob2_get_config_metadata', {
    description: `Get basic metadata for a config (name, category, author, dates).

USE WHEN: Need quick info about a config without full script/details.
SIDE EFFECTS: None - read-only.
RETURNS: Metadata object with name, category, author, base64Image, creationDate, lastModified, plugins.`,
    inputSchema: { id: z.string().describe('Config ID (UUID)') },
  }, async (args) => {
    const metadata = await client.get('/config/metadata', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(metadata, null, 2) }] };
  });

  server.registerTool('ob2_get_config_readme', {
    description: `Get the documentation/readme for a config.

USE WHEN: Understanding what a config does, how to use it, or what it captures.
SIDE EFFECTS: None - read-only.
RETURNS: The readme/documentation text.`,
    inputSchema: { id: z.string().describe('Config ID (UUID)') },
  }, async (args) => {
    const readme = await client.get('/config/readme', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(readme, null, 2) }] };
  });

  server.registerTool('ob2_create_config', {
    description: `Create a new empty config in OpenBullet 2.

USE WHEN: Starting a new config from scratch.
SIDE EFFECTS: Creates a new config entry in OB2.
RETURNS: New config object with generated ID. Use the 'id' field for ob2_update_config.
PREREQUISITE: Call ob2_lolicode_reference first for syntax guidance.`,
    inputSchema: {},
  }, async () => {
    const config = await client.post('/config', {});
    return { content: [{ type: 'text', text: `New config created:\n${JSON.stringify(config, null, 2)}` }] };
  });

  server.registerTool('ob2_update_config', {
    description: `Save/update a config with LoliCode script, metadata, and settings. Primary tool for creating or modifying configs.

USE WHEN: Saving a new config or updating an existing one.
SIDE EFFECTS: Permanently updates the config in OB2.
RETURNS: The updated config object.

REQUIRED configData fields:
- id: Config UUID (from ob2_create_config or ob2_get_config)
- mode: "LoliCode"
- metadata: { name, category, author, base64Image, creationDate, lastModified, plugins }
- settings: { allowedWordlistTypes, proxyRules, dataRules, captureGroups, boolean flags }
- loliCodeScript: Your LoliCode script
- readme: Description
- persistent: true

LoliCode SYNTAX (CRITICAL):
- Blocks: BLOCK:BlockId ... ENDBLOCK
- Settings: settingName = value (3-space indent)
- Variables: @varName (reference), $"text <varName>" (interpolation)
- Captures: => CAP @name (for hit output)
- Parse modes: MODE:LR / MODE:CSS / MODE:JSON / MODE:REGEX (on own line)

EXAMPLE SCRIPT:
BLOCK:HttpRequest
  url = "https://api.example.com"
  method = GET
ENDBLOCK
BLOCK:Parse
  input = @data.SOURCE
  jToken = "$.token"
  MODE:JSON
  => CAP @token
ENDBLOCK
BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "success"
  KEYCHAIN FAIL OR
    INTKEY @data.STATUS Is 401
ENDBLOCK

TIP: Test with ob2_debug_config before running jobs. Call ob2_lolicode_reference for full syntax guide.`,
    inputSchema: { 
      configData: z.string().describe('Complete JSON config. See description for required fields and LoliCode syntax.') 
    },
  }, async (args) => {
    const data = JSON.parse(args.configData);
    const config = await client.put('/config', data);
    return { content: [{ type: 'text', text: `Config updated:\n${JSON.stringify(config, null, 2)}` }] };
  });

  server.registerTool('ob2_delete_config', {
    description: `Delete a config permanently.

USE WHEN: Removing an unwanted config.
SIDE EFFECTS: PERMANENT deletion. Cannot be undone.
RETURNS: Confirmation message.`,
    inputSchema: { id: z.string().describe('Config ID (UUID) to delete. Cannot be recovered.') },
  }, async (args) => {
    await client.delete('/config', { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Config ${args.id} deleted.` }] };
  });

  server.registerTool('ob2_clone_config', {
    description: `Clone an existing config to create a copy.

USE WHEN: Creating a variant of a config without modifying the original.
SIDE EFFECTS: Creates new config entry with same content but new ID.
RETURNS: Cloned config object with new ID.`,
    inputSchema: { id: z.string().describe('Config ID (UUID) to clone') },
  }, async (args) => {
    const config = await client.post('/config/clone', null, { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Config cloned:\n${JSON.stringify(config, null, 2)}` }] };
  });

  server.registerTool('ob2_debug_config', {
    description: `Test a config with sample data. Returns detailed execution logs and captured variables.

USE WHEN: Verifying a config works before running jobs. Essential for debugging.
SIDE EFFECTS: Executes config once with test data. No hits created.
RETURNS: Log output showing block execution, captures, data.SOURCE, errors.

EXAMPLE: Test login config with "user@example.com:password123" and wordlistType "Credentials".
Common wordlistTypes: "Credentials" (user:pass -> input.USER/input.PASS), "Default" (single value).`,
    inputSchema: {
      configId: z.string().describe('Config ID (UUID) to test'),
      testData: z.string().describe('Sample input data. "Credentials" uses "user:pass" format.'),
      wordlistType: z.string().describe('How testData is parsed. "Credentials" splits on ":", "Default" uses full line.'),
      testProxy: z.string().nullable().optional().describe('Proxy in format "(type)host:port:user:pass" or null'),
      proxyType: z.string().optional().describe('Proxy type (http/socks4/socks5). Default: http'),
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
    description: `Convert between LoliCode, C#, and Stack (visual blocks) formats.

USE WHEN: Understanding LoliCode structure, converting between formats, or learning OB2.
SIDE EFFECTS: None - conversion only.
RETURNS: Converted code in target format.`,
    inputSchema: {
      source: z.string().describe('Code/script to convert'),
      direction: z.enum(['lolicode-to-csharp', 'lolicode-to-stack', 'stack-to-lolicode']).describe('Conversion: "lolicode-to-csharp" (C#), "lolicode-to-stack" (visual JSON), "stack-to-lolicode" (LoliCode)'),
    },
  }, async (args) => {
    let result;
    switch (args.direction) {
      case 'lolicode-to-csharp':
        result = await client.post('/config/convert/lolicode/csharp', {
          loliCode: args.source,
          settings: { generalSettings: {}, proxySettings: {}, inputSettings: {}, dataSettings: {}, browserSettings: {}, scriptSettings: {} },
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
    description: `Get all available block types with their parameters and defaults.

USE WHEN: Discovering available blocks beyond HttpRequest/Parse/Keycheck.
SIDE EFFECTS: None - read-only.
RETURNS: Array of block descriptors with names, categories, parameters, types, defaults.
TIP: Use this to find advanced blocks like OB2Data, OB2Click, OB2Wait, etc.`,
    inputSchema: {},
  }, async () => {
    const blocks = await client.get('/config/block-descriptors');
    return { content: [{ type: 'text', text: JSON.stringify(blocks, null, 2) }] };
  });

  server.registerTool('ob2_get_category_tree', {
    description: `Get the block category hierarchy for OB2's visual editor.

USE WHEN: Understanding how blocks are organized.
SIDE EFFECTS: None - read-only.
RETURNS: Tree showing block categories and members.`,
    inputSchema: {},
  }, async () => {
    const tree = await client.get('/config/category-tree');
    return { content: [{ type: 'text', text: JSON.stringify(tree, null, 2) }] };
  });

  server.registerTool('ob2_get_block_snippets', {
    description: `Get LoliCode code snippets for all available blocks from the OB2 server.

USE WHEN: Need exact syntax for a specific block type.
SIDE EFFECTS: None - read-only.
RETURNS: Object mapping block names to LoliCode snippets. Copy and modify.`,
    inputSchema: {},
  }, async () => {
    const snippets = await client.get('/config/block-snippets');
    return { content: [{ type: 'text', text: JSON.stringify(snippets, null, 2) }] };
  });

  server.registerTool('ob2_create_credential_checker_config', {
    description: `WORKFLOW TOOL: Create a complete login/credential checker config with one call.

USE WHEN: User wants to check username:password combinations against a login endpoint.
SIDE EFFECTS: Creates a new config in OB2.
RETURNS: Created config object with ID. Ready for ob2_debug_config or ob2_create_multirun_job.

This tool:
1. Creates empty config
2. Generates complete LoliCode script for login checking
3. Saves with proper settings (name from domain, category blank, readme blank)
4. Returns the config

Required inputs:
- loginUrl: Full login API URL (e.g., "https://site.com/api/login")
- successIndicator: Text in response for success (e.g., "token" or "authenticated")
- failureIndicator: Text for failure (e.g., "invalid" or "incorrect")

The generated config:
- POSTs credentials to loginUrl
- Captures useful data on success
- Keychecks SUCCESS/FAIL based on indicators`,
    inputSchema: {
      loginUrl: z.string().describe('Login API URL (e.g., "https://example.com/api/login")'),
      successIndicator: z.string().describe('Text in response indicating success (e.g., "token", "authenticated")'),
      failureIndicator: z.string().describe('Text indicating failure (e.g., "invalid", "incorrect")'),
      captureField: z.string().optional().describe('JSON field to capture on success (e.g., "subscription", "email"). Leave empty for no capture.'),
    },
  }, async (args) => {
    if (args.captureField !== undefined) {
      assertLoliIdentifier(args.captureField, 'captureField');
    }
    const captureBlock = args.captureField ? `
BLOCK:Parse
  input = @data.SOURCE
  jToken = "$.${escapeLoli(args.captureField)}"
  MODE:Json
  => CAP @${args.captureField}
ENDBLOCK` : '';

    const loliCodeScript = `BLOCK:HttpRequest
  url = "${escapeLoli(args.loginUrl)}"
  method = POST
  TYPE:STANDARD
  $"{\\"email\\":\\"<input.USER>\\",\\"password\\":\\"<input.PASS>\\"}"
  "application/json"
ENDBLOCK${captureBlock}
BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "${escapeLoli(args.successIndicator)}"
  KEYCHAIN FAIL OR
    STRINGKEY @data.SOURCE Contains "${escapeLoli(args.failureIndicator)}"
    INTKEY @data.RESPONSECODE EqualTo 401
  KEYCHAIN RETRY OR
    INTKEY @data.RESPONSECODE EqualTo 429
    STRINGKEY @data.SOURCE Contains "rate limit"
ENDBLOCK`;

    const now = new Date().toISOString();
    const domain = args.loginUrl.match(/(?:https?:\/\/)?([^/]+)/)?.[1] || args.loginUrl;
    const configData = {
      id: '',
      mode: 'LoliCode',
      metadata: { name: domain, category: '', author: 'OB2 MCP AI', base64Image: '', creationDate: now, lastModified: now, plugins: [] },
      settings: { allowedWordlistTypes: ['Credentials'], proxyRules: [], dataRules: [], captureGroups: [], maxEmptyResponses: 5, clearCookies: false, exitOnEnd: false, successNewLine: false, ignoreResponseErrors: false, urlEncodedPostData: false, encodeData: false, forceEncodeData: false, separateCaptchaContent: false, skipDefaultCaptchaSetup: false, usingCustomInputs: false, allowBinaryResponses: false, forceSni: false, decodeGzip: true, decodeImage: false, autoDecode: true, wordlistPurposes: [] },
      readme: '',
      loliCodeScript,
      startupLoliCodeScript: '',
      loliScript: '',
      startupCSharpScript: '',
      cSharpScript: '',
      persistent: true,
    };

    const newConfig = await client.post<{ id: string }>('/config', {});
    configData.id = newConfig.id;
    const updated = await client.put('/config', configData);
    return { content: [{ type: 'text', text: `Credential checker config created:\n${JSON.stringify(updated, null, 2)}` }] };
  });

  server.registerTool('ob2_create_scraper_config', {
    description: `WORKFLOW TOOL: Create a complete web scraper config with one call.

USE WHEN: User wants to scrape data (titles, prices, links) from a website.
SIDE EFFECTS: Creates a new config in OB2.
RETURNS: Created config object with ID. Ready for ob2_debug_config or ob2_create_multirun_job.

This tool:
1. Creates empty config
2. Generates complete LoliCode script for scraping
3. Saves with proper settings (name from domain, category blank, readme blank)
4. Returns the config

Required inputs:
- targetUrl: URL to scrape (e.g., "https://books.toscrape.com/")
- cssSelector: CSS selector for elements (e.g., "h3 a" for titles, ".price_color" for prices)
- primaryField: What to extract (title/price/description/link/image)

The generated config:
- Makes GET request to targetUrl
- Extracts data using CSS selector
- Keychecks for SUCCESS/FAIL`,
    inputSchema: {
      targetUrl: z.string().describe('URL to scrape (e.g., "https://books.toscrape.com/")'),
      primaryField: z.string().describe('Capture name for the primary field (LoliCode identifier, e.g., "title", "price")'),
      cssSelector: z.string().describe('CSS selector (e.g., "h3 a" for titles, ".price_color" for prices, "img.thumbnail" for images)'),
      attributeToExtract: z.string().optional().describe('Attribute to extract for the primary field. "href" for links, "src" for images. Leave empty for text content.'),
      secondField: z.string().optional().describe('Capture name for an optional second field (LoliCode identifier)'),
      secondCssSelector: z.string().optional().describe('CSS selector for the second field'),
      secondAttributeToExtract: z.string().optional().describe('Attribute to extract for the second field. Leave empty for text content.'),
    },
  }, async (args) => {
    assertLoliIdentifier(args.primaryField, 'primaryField');
    if (args.secondField !== undefined) {
      assertLoliIdentifier(args.secondField, 'secondField');
    }
    const primaryAttr = args.attributeToExtract ? `\n  attributeName = "${escapeLoli(args.attributeToExtract)}"` : '';
    const secondAttr = args.secondAttributeToExtract ? `\n  attributeName = "${escapeLoli(args.secondAttributeToExtract)}"` : '';
    const secondCaptureBlock = args.secondField && args.secondCssSelector ? `
BLOCK:Parse
  input = @data.SOURCE
  cssSelector = "${escapeLoli(args.secondCssSelector)}"${secondAttr}
  MODE:CSS
  => CAP @${args.secondField}
ENDBLOCK` : '';

    const loliCodeScript = `BLOCK:HttpRequest
  url = "${escapeLoli(args.targetUrl)}"
  method = GET
ENDBLOCK
BLOCK:Parse
  input = @data.SOURCE
  cssSelector = "${escapeLoli(args.cssSelector)}"${primaryAttr}
  MODE:CSS
  => CAP @${args.primaryField}
ENDBLOCK${secondCaptureBlock}
BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "${escapeLoli(args.primaryField)}"
  KEYCHAIN FAIL OR
    INTKEY @data.STATUS GreaterThan 399
ENDBLOCK`;

    const now = new Date().toISOString();
    const domain = args.targetUrl.match(/(?:https?:\/\/)?([^/]+)/)?.[1] || args.targetUrl;
    const configData = {
      id: '',
      mode: 'LoliCode',
      metadata: { name: domain, category: '', author: 'OB2 MCP AI', base64Image: '', creationDate: now, lastModified: now, plugins: [] },
      settings: { allowedWordlistTypes: ['Default'], proxyRules: [], dataRules: [], captureGroups: [], maxEmptyResponses: 5, clearCookies: false, exitOnEnd: false, successNewLine: false, ignoreResponseErrors: false, urlEncodedPostData: false, encodeData: false, forceEncodeData: false, separateCaptchaContent: false, skipDefaultCaptchaSetup: false, usingCustomInputs: false, allowBinaryResponses: false, forceSni: false, decodeGzip: true, decodeImage: false, autoDecode: true, wordlistPurposes: [] },
      readme: '',
      loliCodeScript,
      startupLoliCodeScript: '',
      loliScript: '',
      startupCSharpScript: '',
      cSharpScript: '',
      persistent: true,
    };

    const newConfig = await client.post<{ id: string }>('/config', {});
    configData.id = newConfig.id;
    const updated = await client.put('/config', configData);
    return { content: [{ type: 'text', text: `Scraper config created:\n${JSON.stringify(updated, null, 2)}` }] };
  });
}
