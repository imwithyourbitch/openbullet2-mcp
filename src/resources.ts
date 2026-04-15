import { OB2Client } from './client/ob2-client.js';
import { LOLICODE_SYNTAX_REFERENCE, LOLICODE_QUICK_REFERENCE, CONFIG_CREATION_GUIDE } from './lolicode-reference.js';

interface ServerInfo {
  os?: string;
  buildNumber?: string;
  uptime?: string;
  workingDirectory?: string;
}

interface CollectionStats {
  jobs?: number;
  proxies?: number;
  wordlists?: number;
  hits?: number;
  configs?: number;
  guests?: number;
  plugins?: number;
}

interface HitStats {
  total?: number;
  byType?: Record<string, number>;
  byConfig?: Record<string, number>;
}

export function registerResources(client: OB2Client) {
  const server = client.server;

  server.resource(
    'lolicode-syntax-reference',
    'ob2://lolicode/syntax-reference',
    async () => ({
      contents: [{
        uri: 'ob2://lolicode/syntax-reference',
        text: LOLICODE_SYNTAX_REFERENCE,
        mimeType: 'text/markdown',
      }],
    }),
  );

  server.resource(
    'lolicode-quick-reference',
    'ob2://lolicode/quick-reference',
    async () => ({
      contents: [{
        uri: 'ob2://lolicode/quick-reference',
        text: LOLICODE_QUICK_REFERENCE,
        mimeType: 'text/markdown',
      }],
    }),
  );

  server.resource(
    'config-creation-guide',
    'ob2://guides/config-creation',
    async () => ({
      contents: [{
        uri: 'ob2://guides/config-creation',
        text: CONFIG_CREATION_GUIDE,
        mimeType: 'text/markdown',
      }],
    }),
  );

  server.resource(
    'server-status',
    'ob2://server/status',
    async () => {
      try {
        const [health, info, stats] = await Promise.all([
          client.get<string>('/health', { requireAuth: false }),
          client.get<ServerInfo>('/info/server'),
          client.get<CollectionStats>('/info/collection'),
        ]);
        const statusText = `## OpenBullet 2 Server Status

**Health:** ${health}
**Server Info:**
- OS: ${info.os ?? 'Unknown'}
- Build: ${info.buildNumber ?? 'Unknown'}
- Uptime: ${info.uptime ?? 'Unknown'}
- Working Directory: ${info.workingDirectory ?? 'Unknown'}

**Collection Stats:**
- Jobs: ${stats.jobs ?? 0}
- Proxies: ${stats.proxies ?? 0}
- Wordlists: ${stats.wordlists ?? 0}
- Hits: ${stats.hits ?? 0}
- Configs: ${stats.configs ?? 0}
- Guests: ${stats.guests ?? 0}
- Plugins: ${stats.plugins ?? 0}
`;
        return {
          contents: [{
            uri: 'ob2://server/status',
            text: statusText,
            mimeType: 'text/markdown',
          }],
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'ob2://server/status',
            text: `Error fetching server status: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: 'text/markdown',
          }],
        };
      }
    },
  );

  server.resource(
    'active-jobs',
    'ob2://jobs/active',
    async () => {
      try {
        const jobs = await client.get<any[]>('/job/all');
        const activeJobs = Array.isArray(jobs) ? jobs.filter((j: any) => j.status === 'Running' || j.status === 'Paused') : [];
        const jobsText = `## Active Jobs

${activeJobs.length === 0 ? 'No active jobs.' : activeJobs.map((j: any) => `
### ${j.name || `Job #${j.id}`}
- **Status:** ${j.status}
- **Config:** ${j.configName || 'Unknown'}
- **Progress:** ${j.progress || 0}%
- **Hits:** ${j.hits || 0}
- **Bots:** ${j.bots || 0}
- **CPM:** ${j.cpm || 0}
`).join('\n')}
`;
        return {
          contents: [{
            uri: 'ob2://jobs/active',
            text: jobsText,
            mimeType: 'text/markdown',
          }],
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'ob2://jobs/active',
            text: `Error fetching active jobs: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: 'text/markdown',
          }],
        };
      }
    },
  );

  server.resource(
    'recent-hits',
    'ob2://hits/recent',
    async () => {
      try {
        const stats = await client.get<HitStats>('/hit/recent', { query: { days: 7 } });
        const byTypeText = stats.byType ? Object.entries(stats.byType).map(([type, count]) => `- ${type}: ${count}`).join('\n') : 'No data';
        const byConfigText = stats.byConfig ? Object.entries(stats.byConfig).map(([config, count]) => `- ${config}: ${count}`).join('\n') : 'No data';
        const statsText = `## Recent Hits (Last 7 Days)

**Total Hits:** ${stats.total ?? 0}
**By Type:**
${byTypeText}

**By Config:**
${byConfigText}
`;
        return {
          contents: [{
            uri: 'ob2://hits/recent',
            text: statsText,
            mimeType: 'text/markdown',
          }],
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'ob2://hits/recent',
            text: `Error fetching recent hits: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: 'text/markdown',
          }],
        };
      }
    },
  );

  server.resource(
    'configs-summary',
    'ob2://configs/summary',
    async () => {
      try {
        const configs = await client.get<any[]>('/config/all', { query: { reload: false } });
        const summary = Array.isArray(configs) ? configs.map((c: any) => ({
          name: c.name,
          category: c.category,
          author: c.author,
          mode: c.mode,
          id: c.id,
        })) : [];
        const summaryText = `## Configs Summary (${summary.length} configs)

| Name | Category | Mode | ID |
|------|----------|------|-----|
${summary.map((c: any) => `| ${c.name} | ${c.category} | ${c.mode} | \`${c.id}\` |`).join('\n')}
`;
        return {
          contents: [{
            uri: 'ob2://configs/summary',
            text: summaryText,
            mimeType: 'text/markdown',
          }],
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'ob2://configs/summary',
            text: `Error fetching configs summary: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: 'text/markdown',
          }],
        };
      }
    },
  );
}
