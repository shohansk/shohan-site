import type { APIRoute } from 'astro';
import { checkPassword, endSession, isAuthed, isConfigured, json, startSession } from '../../../cms/auth';
import { getStorage } from '../../../cms/storage';

export const prerender = false;

const storageMode = () => {
  try {
    return getStorage().mode;
  } catch {
    return 'readonly';
  }
};

export const GET: APIRoute = ({ cookies }) =>
  json({ authed: isAuthed(cookies), configured: isConfigured(), mode: storageMode() });

export const POST: APIRoute = async ({ request, cookies }) => {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!isConfigured()) return json({ error: 'ADMIN_PASSWORD is not set on the server.' }, 500);
  if (!password || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: 'Wrong password.' }, 401);
  }
  startSession(cookies);
  return json({ authed: true });
};

export const DELETE: APIRoute = ({ cookies }) => {
  endSession(cookies);
  return json({ authed: false });
};
