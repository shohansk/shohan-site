import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from './env';

export interface Storage {
  mode: 'local' | 'github';
  list(dir: string): Promise<string[]>;
  read(file: string): Promise<string | null>;
  write(file: string, data: string | Buffer, message: string): Promise<void>;
  remove(file: string, message: string): Promise<void>;
}

const SAFE = /^(src\/content|public\/images|public\/cv)\/[\w\-./]+$/;

export function assertSafe(file: string) {
  if (!SAFE.test(file) || file.includes('..')) throw new Error(`Refusing path: ${file}`);
}

function localStorage(root: string): Storage {
  const abs = (p: string) => path.join(root, p);
  return {
    mode: 'local',
    async list(dir) {
      assertSafe(dir + '/x');
      return (await fs.readdir(abs(dir)).catch(() => [])).filter((f) => !f.startsWith('.'));
    },
    async read(file) {
      assertSafe(file);
      return fs.readFile(abs(file), 'utf8').catch(() => null);
    },
    async write(file, data) {
      assertSafe(file);
      await fs.mkdir(path.dirname(abs(file)), { recursive: true });
      await fs.writeFile(abs(file), data);
    },
    async remove(file) {
      assertSafe(file);
      await fs.rm(abs(file), { force: true });
    },
  };
}

function githubStorage(token: string, repo: string, branch: string): Storage {
  const api = `https://api.github.com/repos/${repo}/contents`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'shohan-site-admin' };

  const call = async (url: string, init: RequestInit = {}) => {
    const res = await fetch(url, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
    if (!res.ok && res.status !== 404) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
    return res;
  };
  const sha = async (file: string) => {
    const res = await call(`${api}/${file}?ref=${branch}`);
    return res.status === 404 ? undefined : ((await res.json()) as { sha: string }).sha;
  };

  return {
    mode: 'github',
    async list(dir) {
      assertSafe(dir + '/x');
      const res = await call(`${api}/${dir}?ref=${branch}`);
      if (res.status === 404) return [];
      return ((await res.json()) as { name: string; type: string }[]).filter((f) => f.type === 'file').map((f) => f.name);
    },
    async read(file) {
      assertSafe(file);
      const res = await call(`${api}/${file}?ref=${branch}`, { headers: { Accept: 'application/vnd.github.raw' } });
      return res.status === 404 ? null : res.text();
    },
    async write(file, data, message) {
      assertSafe(file);
      const content = Buffer.from(data).toString('base64');
      await call(`${api}/${file}`, { method: 'PUT', body: JSON.stringify({ message, content, branch, sha: await sha(file) }) });
    },
    async remove(file, message) {
      assertSafe(file);
      const s = await sha(file);
      if (s) await call(`${api}/${file}`, { method: 'DELETE', body: JSON.stringify({ message, sha: s, branch }) });
    },
  };
}

export function getStorage(): Storage {
  const token = env('GITHUB_TOKEN');
  if (token) {
    const repo = env('GITHUB_REPO') ?? 'shohansk/shohan-site';
    const branch = env('GITHUB_BRANCH') ?? 'main';
    return githubStorage(token, repo, branch);
  }
  if (import.meta.env.PROD) throw new Error('Live editing is off: set GITHUB_TOKEN in Vercel to save from the live site.');
  return localStorage(process.cwd());
}
