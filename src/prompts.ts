import { z } from 'zod';
import { OB2Client } from './client/ob2-client.js';
import { LOLICODE_SYNTAX_REFERENCE } from './lolicode-reference.js';

export function registerPrompts(client: OB2Client) {
  const server = client.server;

  server.prompt(
    'write-lolicode-config',
    'Generate a LoliCode config for a target URL. Includes full syntax reference and step-by-step guidance.',
    {
      targetUrl: z.string().describe('Target website URL (e.g., "https://books.toscrape.com/")'),
      configDescription: z.string().optional().describe('What the config should do (e.g., "scrape titles and prices", "check login credentials")'),
    },
    ({ targetUrl, configDescription }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `You are writing an OpenBullet 2 LoliCode config. Follow this workflow:

1. First, call ob2_create_config to create an empty config
2. Write a complete LoliCode script following the syntax below
3. Call ob2_update_config with the full config JSON including your script
4. Call ob2_debug_config with sample data to test

## REQUIRED LoliCode SYNTAX:

### Block Format:
BLOCK:BlockName
  settingName = value
  => CAP @variableName
ENDBLOCK

### HTTP Requests:
BLOCK:HttpRequest
  url = "https://example.com/api"
  method = GET (or POST/PUT/DELETE)
  type = STANDARD
  stringContent = $"{\"user\":\"<input.USER>\",\"pass\":\"<input.PASS>\"}"
  contentType = "application/json"
ENDBLOCK

### Parsing Data:
BLOCK:Parse
  input = @data.SOURCE
  cssSelector = "h3 a"
  MODE:CSS
  => CAP @title
ENDBLOCK

BLOCK:Parse
  input = @data.SOURCE
  jToken = "$.token"
  MODE:JSON
  => CAP @token
ENDBLOCK

### Keycheck (REQUIRED - determines SUCCESS/FAIL):
BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "welcome"
  KEYCHAIN FAIL OR
    STRINGKEY @data.SOURCE Contains "invalid"
    INTKEY @data.STATUS Is 401
  KEYCHAIN RETRY OR
    INTKEY @data.STATUS Is 429
ENDBLOCK

### Variable Interpolation:
url = $"https://site.com/user/<input.USER>/profile"
stringContent = $"{\"email\":\"<email>\"}"

### Auto Variables After HTTP:
@data.SOURCE (response body)
@data.STATUS (HTTP status code)
@data.HEADERS (response headers)
@data.COOKIES (response cookies)

### Input Variables:
@input.USER, @input.PASS (for Credentials wordlists)
@input.DATA (for Default wordlists)

---

## Target: ${targetUrl}
${configDescription ? `## Description: ${configDescription}` : ''}

Write a complete LoliCode script that:
1. Makes appropriate HTTP requests
2. Parses and captures useful data
3. Includes Keycheck with SUCCESS/FAIL/RETRY keychains

Return the complete loliCodeScript ready to use in ob2_update_config.`,
          },
        },
      ],
    }),
  );

  server.prompt(
    'edit-lolicode-config',
    'Edit an existing config. Fetches current config and applies changes.',
    {
      configId: z.string().describe('Config ID (UUID) to edit'),
      editInstructions: z.string().describe('What to change (e.g., "change the success indicator", "add price capture", "add retry keychain")'),
    },
    ({ configId, editInstructions }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `You are editing an OpenBullet 2 config.

WORKFLOW:
1. Call ob2_get_config with id="${configId}" to get the current config
2. Read the loliCodeScript field
3. Apply these changes: ${editInstructions}
4. Call ob2_update_config with the modified config

## LoliCode Syntax Reminder:

BLOCK:BlockName
  setting = value
ENDBLOCK

Variables: @varName, $"text <varName>"
Captures: => CAP @name
Parse modes: MODE:LR / MODE:CSS / MODE:JSON / MODE:REGEX

Keycheck format:
BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "text"
  KEYCHAIN FAIL OR
    INTKEY @data.STATUS Is 401
ENDBLOCK`,
          },
        },
      ],
    }),
  );

  server.prompt(
    'create-config-workflow',
    'Complete workflow: create config, write script, save, and test.',
    {
      targetUrl: z.string().describe('Target URL to create config for'),
      configName: z.string().describe('Name for the config (e.g., "Site Login Checker")'),
      wordlistType: z.string().optional().describe('Wordlist type ("Credentials" for user:pass, "Default" for single value). Default: Credentials'),
    },
    ({ targetUrl, configName, wordlistType }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Create a complete OpenBullet 2 config step by step:

## Step 1: Create Empty Config
Call: ob2_create_config

## Step 2: Write LoliCode Script
Write a script for: ${targetUrl}
Config name: ${configName}
Wordlist type: ${wordlistType || 'Credentials'}

## Step 3: Save Config
Call ob2_update_config with:
- id: (from Step 1)
- mode: "LoliCode"
- metadata: { name: "${configName}", category: "Custom", author: "OB2 MCP" }
- settings: { allowedWordlistTypes: ["${wordlistType || 'Credentials'}"] }
- loliCodeScript: (your script)

## Step 4: Test
Call ob2_debug_config with sample data to verify it works.

## Syntax Guide:
BLOCK:HttpRequest
  url = "${targetUrl}"
  method = GET
ENDBLOCK

BLOCK:Parse
  input = @data.SOURCE
  jToken = "$.field"
  MODE:JSON
  => CAP @field
ENDBLOCK

BLOCK:Keycheck
  KEYCHAIN SUCCESS OR
    STRINGKEY @data.SOURCE Contains "success"
  KEYCHAIN FAIL OR
    STRINGKEY @data.SOURCE Contains "error"
ENDBLOCK`,
          },
        },
      ],
    }),
  );

  server.prompt(
    'lolicode-syntax-help',
    'Get help with LoliCode syntax. Returns complete reference.',
    {
      question: z.string().optional().describe('Specific question about LoliCode syntax (optional)'),
    },
    ({ question }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `${LOLICODE_SYNTAX_REFERENCE}

${question ? `## Your Question:\n${question}\n\n---\n\nUse the syntax reference above to answer this question.` : 'Use this reference to answer any LoliCode syntax questions.'}`,
          },
        },
      ],
    }),
  );

  server.prompt(
    'job-management-workflow',
    'Complete workflow for running a config as a job.',
    {
      configId: z.string().describe('Config ID to run'),
      jobName: z.string().describe('Name for the job (e.g., "Test Run 1")'),
      bots: z.number().optional().describe('Number of bots/threads. Default: 10'),
      proxyGroupId: z.number().optional().describe('Proxy group ID to use (optional)'),
    },
    ({ configId, jobName, bots, proxyGroupId }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Run a config as a MultiRun job:

## Step 1: Verify Config
Call ob2_get_config with id="${configId}" to verify it exists and check settings.

## Step 2: Check Proxies (optional)
If using proxies, call ob2_list_proxy_groups to see available groups.

## Step 3: Create Job
Call ob2_create_multirun_job with:
- configId: "${configId}"
- name: "${jobName}"
- bots: ${bots || 10}
- proxySources: ${proxyGroupId ? `[{"_polyTypeName":"groupProxySource","groupId":${proxyGroupId}}]` : '[]'}
- dataPool: {"_polyTypeName":"infiniteDataPool"} (or use wordlistDataPool with a wordlist ID)

## Step 4: Monitor
Use ob2_list_multirun_jobs to see job status.
Use ob2_get_multirun_job with the returned job ID to see detailed stats.
Use ob2_bot_details to see individual bot status.

## Job Control:
- ob2_start_job - Start the job
- ob2_pause_job - Pause
- ob2_resume_job - Resume
- ob2_stop_job - Stop gracefully
- ob2_abort_job - Abort immediately`,
          },
        },
      ],
    }),
  );
}
