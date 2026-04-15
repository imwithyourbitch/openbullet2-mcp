import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

export interface Config {
  ob2Url: string;
  ob2Username?: string;
  ob2Password?: string;
}

export function getConfig(): Config {
  const ob2Url = process.env.OB2_URL || 'http://localhost:5000';
  const ob2Username = process.env.OB2_USERNAME || undefined;
  const ob2Password = process.env.OB2_PASSWORD || undefined;

  return {
    ob2Url: ob2Url.replace(/\/+$/, ''),
    ob2Username,
    ob2Password,
  };
}
