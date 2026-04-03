import { z } from 'zod';
import { OB2Client } from '../client/ob2-client.js';

export function registerJobTools(client: OB2Client) {
  const server = client.server;

  server.registerTool('ob2_list_jobs', { description: 'List all jobs (both MultiRun and ProxyCheck) with their status, progress, CPM, and bot count.', inputSchema: {} }, async () => {
    const jobs = await client.get('/job/all');
    return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] };
  });

  server.registerTool('ob2_list_multirun_jobs', { description: 'List all MultiRun jobs with overview info including config name, hits, progress, and status.', inputSchema: {} }, async () => {
    const jobs = await client.get('/job/multi-run/all');
    return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] };
  });

  server.registerTool('ob2_list_proxycheck_jobs', { description: 'List all ProxyCheck jobs with overview info including group name, working/not-working counts.', inputSchema: {} }, async () => {
    const jobs = await client.get('/job/proxy-check/all');
    return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] };
  });

  server.registerTool('ob2_get_multirun_job', { description: 'Get detailed info of a specific MultiRun job including config, data pool, proxy sources, hit outputs, stats, and hits.', inputSchema: { id: z.number().describe('Job ID (integer)') } }, async (args) => {
    const job = await client.get('/job/multi-run', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(job, null, 2) }] };
  });

  server.registerTool('ob2_get_proxycheck_job', { description: 'Get detailed info of a specific ProxyCheck job including group, target, timeout, and progress.', inputSchema: { id: z.number().describe('Job ID (integer)') } }, async (args) => {
    const job = await client.get('/job/proxy-check', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(job, null, 2) }] };
  });

  server.registerTool('ob2_create_multirun_job', {
    description: 'Create a new MultiRun job. A MultiRun job executes a config across multiple data lines (from a wordlist, file, range, etc.) using multiple bots in parallel.',
    inputSchema: {
      configId: z.string().describe('Config ID (UUID) to run'),
      name: z.string().describe('Name for this job'),
      bots: z.number().describe('Number of parallel bots/threads'),
      startAfter: z.string().optional().describe('Start after a relative time span (e.g. "00:05:00" for 5 minutes). If omitted, starts immediately.'),
      skip: z.number().optional().describe('Data lines to skip. Default: 0'),
      proxyMode: z.enum(['Default', 'On', 'Off', 'OnSuccess']).optional().describe('Proxy mode. Default: Default'),
      shuffleProxies: z.boolean().optional().describe('Shuffle proxies. Default: true'),
      noValidProxyBehaviour: z.enum(['Reload', 'Abort', 'Continue']).optional().describe('When no valid proxies. Default: Reload'),
      proxyBanTimeSeconds: z.number().optional().describe('Ban duration for bad proxies. Default: 0'),
      markAsToCheckOnAbort: z.boolean().optional().describe('Mark aborted proxies for recheck. Default: false'),
      neverBanProxies: z.boolean().optional().describe('Never ban proxies. Default: false'),
      concurrentProxyMode: z.boolean().optional().describe('Use concurrent proxy mode. Default: false'),
      periodicReloadIntervalSeconds: z.number().optional().describe('Auto-reload interval. Default: 0'),
      dataPool: z.string().optional().describe('JSON for data pool with _polyTypeName. Options: {"_polyTypeName":"infiniteDataPool"} | {"_polyTypeName":"wordlistDataPool","wordlistId":1} | {"_polyTypeName":"fileDataPool","fileName":"test.txt","wordlistType":"Default"} | {"_polyTypeName":"rangeDataPool","start":0,"amount":100,"step":1,"pad":false,"wordlistType":"Default"}'),
      proxySources: z.string().optional().describe('JSON array of proxy sources with _polyTypeName. E.g. [{"_polyTypeName":"groupProxySource","groupId":1}] or [{"_polyTypeName":"fileProxySource","fileName":"proxies.txt"}] or [{"_polyTypeName":"remoteProxySource","url":"http://example.com/proxies"}]'),
      hitOutputs: z.string().optional().describe('JSON array of hit outputs with _polyTypeName. E.g. [{"_polyTypeName":"databaseHitOutput"}] or [{"_polyTypeName":"fileSystemHitOutput","path":"hits.txt"}]'),
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
      proxyBanTimeSeconds: args.proxyBanTimeSeconds ?? 0,
      markAsToCheckOnAbort: args.markAsToCheckOnAbort ?? false,
      neverBanProxies: args.neverBanProxies ?? false,
      concurrentProxyMode: args.concurrentProxyMode ?? false,
      periodicReloadIntervalSeconds: args.periodicReloadIntervalSeconds ?? 0,
      dataPool: args.dataPool ? JSON.parse(args.dataPool) : { _polyTypeName: 'infiniteDataPool' },
      proxySources: args.proxySources ? JSON.parse(args.proxySources) : [],
      hitOutputs: args.hitOutputs ? JSON.parse(args.hitOutputs) : [],
    });
    return { content: [{ type: 'text', text: `MultiRun job created successfully:\n${JSON.stringify(job, null, 2)}` }] };
  });

  server.registerTool('ob2_create_proxycheck_job', {
    description: 'Create a new ProxyCheck job to test proxies in a group for connectivity and speed.',
    inputSchema: {
      groupId: z.number().describe('Proxy group ID to check'),
      name: z.string().describe('Name for this job'),
      bots: z.number().optional().describe('Number of parallel bots. Default: 10'),
      checkOnlyUntested: z.boolean().optional().describe('Only check proxies that have not been tested yet. Default: true'),
      target: z.string().optional().describe('Target URL to test proxies against'),
      timeoutMilliseconds: z.number().optional().describe('Timeout in ms for each proxy test. Default: 10000'),
      startCondition: z.string().optional().describe('When to start. Default: StartImmediately'),
    },
  }, async (args) => {
    const job = await client.post('/job/proxy-check', {
      groupId: args.groupId, name: args.name, bots: args.bots ?? 10,
      checkOnlyUntested: args.checkOnlyUntested ?? true,
      target: args.target || null, timeoutMilliseconds: args.timeoutMilliseconds ?? 10000,
      startCondition: args.startCondition || 'StartImmediately', checkOutput: undefined,
    });
    return { content: [{ type: 'text', text: `ProxyCheck job created successfully:\n${JSON.stringify(job, null, 2)}` }] };
  });

  server.registerTool('ob2_update_multirun_job', {
    description: 'Update a MultiRun job. The job must be idle (not running) to be updated.',
    inputSchema: {
      id: z.number().describe('Job ID to update'),
      configId: z.string().optional().describe('Config ID to run'),
      name: z.string().optional().describe('Job name'),
      bots: z.number().optional().describe('Number of bots'),
      dataPool: z.string().optional().describe('JSON for data pool with _polyTypeName. E.g. {"_polyTypeName":"infiniteDataPool"}'),
      proxySources: z.string().optional().describe('JSON array of proxy sources with _polyTypeName. E.g. [{"_polyTypeName":"groupProxySource","groupId":1}]'),
      hitOutputs: z.string().optional().describe('JSON array of hit outputs with _polyTypeName. E.g. [{"_polyTypeName":"databaseHitOutput"}]'),
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
    return { content: [{ type: 'text', text: `MultiRun job updated successfully:\n${JSON.stringify(job, null, 2)}` }] };
  });

  const jobActionSchema = {
    jobId: z.number().describe('Job ID'),
    wait: z.boolean().optional().describe('Whether to wait for the action to complete. Default: false'),
  };

  server.registerTool('ob2_start_job', { description: 'Start a job (MultiRun or ProxyCheck). The job will begin executing.', inputSchema: jobActionSchema }, async (args) => {
    await client.post('/job/start', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} started successfully.` }] };
  });

  server.registerTool('ob2_stop_job', { description: 'Stop a running job gracefully. The job will finish its current tasks and then stop.', inputSchema: jobActionSchema }, async (args) => {
    await client.post('/job/stop', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} stop command sent.` }] };
  });

  server.registerTool('ob2_pause_job', { description: 'Pause a running job. It can be resumed later.', inputSchema: jobActionSchema }, async (args) => {
    await client.post('/job/pause', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} pause command sent.` }] };
  });

  server.registerTool('ob2_resume_job', { description: 'Resume a paused job.', inputSchema: jobActionSchema }, async (args) => {
    await client.post('/job/resume', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} resume command sent.` }] };
  });

  server.registerTool('ob2_abort_job', { description: 'Abort a job immediately. This is more forceful than stop.', inputSchema: jobActionSchema }, async (args) => {
    await client.post('/job/abort', { jobId: args.jobId, wait: args.wait ?? false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} abort command sent.` }] };
  });

  server.registerTool('ob2_skip_wait', { description: 'Skip the wait time for a job that has a delayed start condition.', inputSchema: { jobId: z.number().describe('Job ID to skip wait for') } }, async (args) => {
    await client.post('/job/skip-wait', { jobId: args.jobId, wait: false });
    return { content: [{ type: 'text', text: `Job ${args.jobId} wait skipped.` }] };
  });

  server.registerTool('ob2_change_bots', { description: 'Change the number of bots (parallel threads) for a running job.', inputSchema: { jobId: z.number().describe('Job ID'), bots: z.number().describe('New number of bots/threads') } }, async (args) => {
    await client.post('/job/change-bots', { jobId: args.jobId, bots: args.bots });
    return { content: [{ type: 'text', text: `Job ${args.jobId} bot count changed to ${args.bots}.` }] };
  });

  server.registerTool('ob2_bot_details', { description: 'Get detailed info about all bots in a MultiRun job, including their current status, block, proxy, data, log, and variables.', inputSchema: { jobId: z.number().describe('MultiRun job ID') } }, async (args) => {
    const bots = await client.get('/job/multi-run/bot-details', { query: { jobId: args.jobId } });
    return { content: [{ type: 'text', text: JSON.stringify(bots, null, 2) }] };
  });

  server.registerTool('ob2_delete_job', { description: 'Delete a single job. The job must be idle.', inputSchema: { id: z.number().describe('Job ID to delete') } }, async (args) => {
    await client.delete('/job', { query: { id: args.id } });
    return { content: [{ type: 'text', text: `Job ${args.id} deleted successfully.` }] };
  });

  server.registerTool('ob2_delete_all_jobs', { description: 'Delete ALL jobs. All jobs must be idle. Use with caution.', inputSchema: {} }, async () => {
    const result = await client.delete('/job/all');
    return { content: [{ type: 'text', text: `All idle jobs deleted. Result: ${JSON.stringify(result)}` }] };
  });

  server.registerTool('ob2_get_custom_inputs', { description: 'Get custom input questions for a MultiRun job. Some configs define custom inputs that need to be answered before starting.', inputSchema: { id: z.number().describe('MultiRun job ID') } }, async (args) => {
    const questions = await client.get('/job/multi-run/custom-inputs', { query: { id: args.id } });
    return { content: [{ type: 'text', text: JSON.stringify(questions, null, 2) }] };
  });

  server.registerTool('ob2_set_custom_inputs', { description: 'Set answers for custom input questions on a MultiRun job before starting it.', inputSchema: { jobId: z.number().describe('MultiRun job ID'), answers: z.string().describe('JSON array of answers: [{"variableName":"VAR1","answer":"value1"}]') } }, async (args) => {
    await client.patch('/job/multi-run/custom-inputs', { jobId: args.jobId, answers: JSON.parse(args.answers) });
    return { content: [{ type: 'text', text: `Custom inputs set for job ${args.jobId}.` }] };
  });
}
