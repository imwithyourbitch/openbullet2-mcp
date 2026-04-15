import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerJobTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_list_jobs', {
    description: `List all jobs (MultiRun and ProxyCheck).

USE WHEN: Checking current job status, monitoring running jobs, or finding a job ID.
SIDE EFFECTS: None - read-only.
RETURNS: Array of job objects with id, name, status, progress, bots, hits, cpm.`,
    inputSchema: {},
  }, async () => {
    const jobs = await client.get('/job/all');
    return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] };
  });

  server.registerTool('ob2_list_multirun_jobs', {
    description: `List all MultiRun jobs (config runners).

USE WHEN: Viewing config execution jobs, checking progress, seeing hit counts.
SIDE EFFECTS: None - read-only.
RETURNS: Array of MultiRun job objects with configName, status, progress, hits, errors.`,
    inputSchema: {},
  }, async () => {
    const jobs = await client.get('/job/multi-run/all');
    return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] };
  });

  server.registerTool('ob2_list_proxycheck_jobs', {
    description: `List all ProxyCheck jobs (proxy testers).

USE WHEN: Viewing proxy check job status and results.
SIDE EFFECTS: None - read-only.
RETURNS: Array with groupName, working count, notWorking count, status.`,
    inputSchema: {},
  }, async () => {
    const jobs = await client.get('/job/proxy-check/all');
    return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] };
  });

  server.registerTool('ob2_get_multirun_job', {
    description: `Get detailed MultiRun job info including hits and statistics.

USE WHEN: Checking job progress, viewing captured hits, debugging issues.
SIDE EFFECTS: None - read-only.
RETURNS: Full job object with config, dataPool, proxySources, hitOutputs, stats, hits array.`,
    inputSchema: { id: z.number().describe('MultiRun Job ID (integer)') },
  }, async (args) => {
    const job = await client.get('/job/multi-run', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(job, null, 2) }] };
  });

  server.registerTool('ob2_get_proxycheck_job', {
    description: `Get detailed ProxyCheck job info.

USE WHEN: Checking proxy test progress and results.
SIDE EFFECTS: None - read-only.
RETURNS: Full ProxyCheck job object with group, target, timeout, progress.`,
    inputSchema: { id: z.number().describe('ProxyCheck Job ID (integer)') },
  }, async (args) => {
    const job = await client.get('/job/proxy-check', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(job, null, 2) }] };
  });

  server.registerTool('ob2_create_multirun_job', {
    description: `Create a MultiRun job to run a config against data.

USE WHEN: Starting a config run (checking credentials, scraping, etc.)
SIDE EFFECTS: Creates and starts a job in OB2.
RETURNS: Job object with ID. Use ob2_start_job if startCondition was changed.

Data Pool Options (dataPool JSON):
- {"_polyTypeName":"infiniteDataPool"} - Infinite test data
- {"_polyTypeName":"wordlistDataPool","wordlistId":1} - Use a wordlist
- {"_polyTypeName":"fileDataPool","fileName":"data.txt","wordlistType":"Default"} - Use a file

Proxy Sources (proxySources JSON):
- [{"_polyTypeName":"groupProxySource","groupId":1}] - Proxy group
- [{"_polyTypeName":"fileProxySource","fileName":"proxies.txt"}] - Proxy file`,
    inputSchema: {
      configId: z.string().describe('Config ID (UUID) to run'),
      name: z.string().describe('Job name (e.g., "Test Run 1")'),
      bots: z.number().describe('Number of parallel bots (threads). Recommended: 10-50'),
      startAfter: z.string().optional().describe('Start delay (e.g., "00:05:00" for 5 min). Default: immediate'),
      skip: z.number().optional().describe('Skip first N data lines. Default: 0'),
      proxyMode: z.enum(['Default', 'On', 'Off', 'OnSuccess']).optional().describe('When to use proxies. Default: Default'),
      shuffleProxies: z.boolean().optional().describe('Randomize proxy order. Default: true'),
      noValidProxyBehaviour: z.enum(['Reload', 'Abort', 'Continue']).optional().describe('No valid proxies action. Default: Reload'),
      dataPool: z.string().optional().describe('JSON data pool config. See description for options.'),
      proxySources: z.string().optional().describe('JSON array of proxy sources. See description for options.'),
      hitOutputs: z.string().optional().describe('JSON array for hit output destinations (database, file, etc.)'),
    },
  }, async (args) => {
    const startCondition = args.startAfter
      ? { _polyTypeName: 'relativeTimeStartCondition', startAfter: args.startAfter }
      : { _polyTypeName: 'relativeTimeStartCondition', startAfter: '00:00:00' };

    const job = await client.post('/job/multi-run', {
      configId: args.configId,
      name: args.name,
      bots: args.bots,
      startCondition,
      skip: args.skip ?? 0,
      proxyMode: args.proxyMode || 'Default',
      shuffleProxies: args.shuffleProxies ?? true,
      noValidProxyBehaviour: args.noValidProxyBehaviour || 'Reload',
      proxyBanTimeSeconds: 0,
      markAsToCheckOnAbort: false,
      neverBanProxies: false,
      concurrentProxyMode: false,
      periodicReloadIntervalSeconds: 0,
      dataPool: args.dataPool ? JSON.parse(args.dataPool) : { _polyTypeName: 'infiniteDataPool' },
      proxySources: args.proxySources ? JSON.parse(args.proxySources) : [],
      hitOutputs: args.hitOutputs ? JSON.parse(args.hitOutputs) : [],
    });
    return { content: [{ type: 'text', text: `MultiRun job created:\n${JSON.stringify(job, null, 2)}` }] };
  });

  server.registerTool('ob2_create_proxycheck_job', {
    description: `Create a ProxyCheck job to test proxy connectivity.

USE WHEN: Testing if proxies work and their response time.
SIDE EFFECTS: Creates and starts a proxy check job.
RETURNS: Job object with ID.`,
    inputSchema: {
      groupId: z.number().describe('Proxy group ID to check'),
      name: z.string().describe('Job name (e.g., "Proxy Test 1")'),
      bots: z.number().optional().describe('Parallel bots. Default: 10'),
      checkOnlyUntested: z.boolean().optional().describe('Only test new proxies. Default: true'),
      target: z.string().optional().describe('URL to test against (e.g., "https://example.com")'),
      timeoutMilliseconds: z.number().optional().describe('Timeout per proxy. Default: 10000'),
    },
  }, async (args) => {
    const job = await client.post('/job/proxy-check', {
      groupId: args.groupId, name: args.name, bots: args.bots ?? 10,
      checkOnlyUntested: args.checkOnlyUntested ?? true,
      target: args.target || null, timeoutMilliseconds: args.timeoutMilliseconds ?? 10000,
      startCondition: 'StartImmediately', checkOutput: undefined,
    });
    return { content: [{ type: 'text', text: `ProxyCheck job created:\n${JSON.stringify(job, null, 2)}` }] };
  });

  server.registerTool('ob2_update_multirun_job', {
    description: `Update an idle MultiRun job configuration.

USE WHEN: Modifying job settings before starting (job must be idle).
SIDE EFFECTS: Updates job in OB2. Job must not be running.
RETURNS: Updated job object.`,
    inputSchema: {
      id: z.number().describe('Job ID to update'),
      configId: z.string().optional().describe('New Config ID to run'),
      name: z.string().optional().describe('New job name'),
      bots: z.number().optional().describe('New bot count'),
      dataPool: z.string().optional().describe('JSON data pool config'),
      proxySources: z.string().optional().describe('JSON proxy sources array'),
      hitOutputs: z.string().optional().describe('JSON hit outputs array'),
    },
  }, async (args) => {
    const job = await client.put('/job/multi-run', {
      id: args.id, configId: args.configId || '', name: args.name || '', bots: args.bots ?? 1,
      skip: 0, proxyMode: 'Default', shuffleProxies: true, noValidProxyBehaviour: 'Reload',
      proxyBanTimeSeconds: 0, markAsToCheckOnAbort: false, neverBanProxies: false,
      concurrentProxyMode: false, periodicReloadIntervalSeconds: 0,
      startCondition: { _polyTypeName: 'relativeTimeStartCondition', startAfter: '00:00:00' },
      dataPool: args.dataPool ? JSON.parse(args.dataPool) : { _polyTypeName: 'infiniteDataPool' },
      proxySources: args.proxySources ? JSON.parse(args.proxySources) : [],
      hitOutputs: args.hitOutputs ? JSON.parse(args.hitOutputs) : [],
    });
    return { content: [{ type: 'text', text: `Job updated:\n${JSON.stringify(job, null, 2)}` }] };
  });

  const jobActionSchema = {
    jobId: z.number().describe('Job ID'),
    wait: z.boolean().optional().describe('Wait for action to complete. Default: false'),
  };

  server.registerTool('ob2_start_job', {
    description: `Start a job (MultiRun or ProxyCheck).

USE WHEN: Starting a job that was created with a delayed start.
SIDE EFFECTS: Job begins executing immediately.
RETURNS: Confirmation message.`,
    inputSchema: jobActionSchema,
  }, async (args) => {
    await client.post('/job/start', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} started.` }] };
  });

  server.registerTool('ob2_stop_job', {
    description: `Stop a running job gracefully.

USE WHEN: Ending a job but allowing current tasks to finish.
SIDE EFFECTS: Job stops after current tasks complete.
RETURNS: Confirmation message.`,
    inputSchema: jobActionSchema,
  }, async (args) => {
    await client.post('/job/stop', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} stopping.` }] };
  });

  server.registerTool('ob2_pause_job', {
    description: `Pause a running job.

USE WHEN: Temporarily stopping a job to resume later.
SIDE EFFECTS: Job pauses. Use ob2_resume_job to continue.
RETURNS: Confirmation message.`,
    inputSchema: jobActionSchema,
  }, async (args) => {
    await client.post('/job/pause', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} paused.` }] };
  });

  server.registerTool('ob2_resume_job', {
    description: `Resume a paused job.

USE WHEN: Continuing a job after it was paused.
SIDE EFFECTS: Job resumes from where it left off.
RETURNS: Confirmation message.`,
    inputSchema: jobActionSchema,
  }, async (args) => {
    await client.post('/job/resume', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} resumed.` }] };
  });

  server.registerTool('ob2_abort_job', {
    description: `Abort a job immediately.

USE WHEN: Forcefully stopping a job (data loss possible).
SIDE EFFECTS: Immediate termination. May lose current progress.
RETURNS: Confirmation message.`,
    inputSchema: jobActionSchema,
  }, async (args) => {
    await client.post('/job/abort', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} aborted.` }] };
  });

  server.registerTool('ob2_skip_wait', {
    description: `Skip delayed start timer for a job.

USE WHEN: Job has startAfter delay but you want it to start now.
SIDE EFFECTS: Job starts immediately.
RETURNS: Confirmation message.`,
    inputSchema: { jobId: z.number().describe('Job ID') },
  }, async (args) => {
    await client.post('/job/skip-wait', { jobId: args.jobId, wait: false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} wait skipped.` }] };
  });

  server.registerTool('ob2_change_bots', {
    description: `Change bot count for a running job.

USE WHEN: Adjusting parallelism (increase for speed, decrease for stability).
SIDE EFFECTS: Changes concurrent bot count immediately.
RETURNS: Confirmation with new bot count.`,
    inputSchema: { 
      jobId: z.number().describe('Job ID'),
      bots: z.number().describe('New bot count'),
    },
  }, async (args) => {
    await client.post('/job/change-bots', { jobId: args.jobId, bots: args.bots });
    return { content: [{ type: 'text', text: `Job ${args.jobId} bots: ${args.bots}` }] };
  });

  server.registerTool('ob2_bot_details', {
    description: `Get detailed info for all bots in a MultiRun job.

USE WHEN: Debugging issues, seeing what each bot is doing.
SIDE EFFECTS: None - read-only.
RETURNS: Array of bot objects with status, currentBlock, proxy, data, log, variables.`,
    inputSchema: { jobId: z.number().describe('MultiRun Job ID') },
  }, async (args) => {
    const bots = await client.get('/job/multi-run/bot-details', { query: { jobId: args.jobId } });
    return { content: [{ type: 'text', text: JSON.stringify(bots, null, 2) }] };
  });

  server.registerTool('ob2_delete_job', {
    description: `Delete an idle job.

USE WHEN: Removing a completed or idle job.
SIDE EFFECTS: PERMANENT deletion. Cannot recover.
RETURNS: Confirmation message.`,
    inputSchema: { id: z.number().describe('Job ID to delete (must be idle)') },
  }, async (args) => {
    await client.delete('/job', { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Job ${args.id} deleted.` }] };
  });

  server.registerTool('ob2_delete_all_jobs', {
    description: `Delete ALL idle jobs.

USE WHEN: Cleaning up completed jobs.
SIDE EFFECTS: PERMANENT deletion of all idle jobs.
RETURNS: Confirmation with count deleted.`,
    inputSchema: {},
  }, async () => {
    const result = await client.delete('/job/all');
    return { content: [{ type: 'text', text: `Idle jobs deleted: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_get_custom_inputs', {
    description: `Get custom input questions for a job.

USE WHEN: Job requires additional inputs before starting.
SIDE EFFECTS: None - read-only.
RETURNS: Array of input questions with variableName and question text.`,
    inputSchema: { id: z.number().describe('MultiRun Job ID') },
  }, async (args) => {
    const questions = await client.get('/job/multi-run/custom-inputs', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(questions, null, 2) }] };
  });

  server.registerTool('ob2_set_custom_inputs', {
    description: `Set answers for custom input questions.

USE WHEN: Answering required inputs before starting a job.
SIDE EFFECTS: Sets job inputs. Job can then be started.
RETURNS: Confirmation message.`,
    inputSchema: {
      jobId: z.number().describe('MultiRun Job ID'),
      answers: z.string().describe('JSON array: [{"variableName":"VAR1","answer":"value1"}]'),
    },
  }, async (args) => {
    await client.patch('/job/multi-run/custom-inputs', { jobId: args.jobId, answers: JSON.parse(args.answers) });
    return { content: [{ type: 'text', text: `Inputs set for job ${args.jobId}.` }] };
  });
}
