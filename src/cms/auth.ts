import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';
import { env } from './env';

const COOKIE = 'admin_session';
const MAX_AGE = 60 * 60 * 24 * 7;


function secret() {
  const s = env('SESSION_SECRET') ?? env('ADMIN_PASSWORD');
  if (!s) throw new Error('ADMIN_PASSWORD is not set');
  return s;
}

const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('hex');

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export const isConfigured = () => Boolean(env('ADMIN_PASSWORD'));

export function checkPassword(password: string) {
  const expected = env('ADMIN_PASSWORD');
  return Boolean(expected) && safeEqual(password, expected!);
}

export function startSession(cookies: AstroCookies) {
  const expires = String(Date.now() + MAX_AGE * 1000);
  cookies.set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    sameSite: 'strict',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: MAX_AGE,
  });
}

export const endSession = (cookies: AstroCookies) => cookies.delete(COOKIE, { path: '/' });

export function isAuthed(cookies: AstroCookies) {
  if (!isConfigured()) return false;
  const raw = cookies.get(COOKIE)?.value;
  if (!raw) return false;
  const [expires, sig] = raw.split('.');
  return Boolean(sig) && safeEqual(sig, sign(expires)) && Number(expires) > Date.now();
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
