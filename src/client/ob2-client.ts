import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getConfig, type Config } from '../config.js';

interface FetchOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  requireAuth?: boolean;
}

export class OB2Client {
  private config: Config;
  private token: string | null = null;
  private hasCredentials: boolean;
  readonly server: McpServer;

  constructor(server: McpServer, config?: Partial<Config>) {
    this.server = server;
    this.config = { ...getConfig(), ...config };
    this.hasCredentials = !!(this.config.ob2Username && this.config.ob2Password);
  }

  get baseUrl(): string {
    return `${this.config.ob2Url}/api/v1`;
  }

  get isConfigured(): boolean {
    return this.hasCredentials;
  }

  async login(username?: string, password?: string): Promise<string> {
    const user = username || this.config.ob2Username;
    const pass = password || this.config.ob2Password;

    if (!user || !pass) {
      throw new Error('No credentials configured. Set OB2_USERNAME and OB2_PASSWORD environment variables, or provide them to ob2_login.');
    }

    const res = await fetch(`${this.baseUrl}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Login failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { token: string };
    this.token = data.token;
    return this.token;
  }

  async ensureAuth(): Promise<void> {
    if (!this.hasCredentials) return;
    if (!this.token) {
      await this.login();
    }
  }

  async get<T>(path: string, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  async put<T>(path: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  async patch<T>(path: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  async delete<T>(path: string, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(method: string, path: string, options?: FetchOptions): Promise<T> {
    const requireAuth = options?.requireAuth !== false;
    if (requireAuth) {
      await this.ensureAuth();
    }

    let url = `${this.baseUrl}${path}`;
    if (options?.query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options?.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `${method} ${path} failed (${res.status})`;
      try {
        const json = JSON.parse(text);
        if (json.detail) errorMsg += `: ${json.detail}`;
        else if (json.message) errorMsg += `: ${json.message}`;
        else if (json.error) errorMsg += `: ${json.error}`;
        else errorMsg += `: ${text}`;
      } catch {
        if (text) errorMsg += `: ${text}`;
      }

      if (res.status === 401 && this.hasCredentials && requireAuth) {
        this.token = null;
        await this.ensureAuth();
        return this.request<T>(method, path, options);
      }

      throw new Error(errorMsg);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json() as Promise<T>;
    }

    return res.text() as Promise<T>;
  }

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }
}
