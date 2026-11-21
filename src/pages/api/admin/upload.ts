import type { APIRoute } from 'astro';
import { isAuthed, json } from '../../../cms/auth';
import { getStorage } from '../../../cms/storage';

export const prerender = false;

const DIRS = new Set(['public/images/projects', 'public/cv']);
const TYPES = /^(image\/(png|jpe?g|webp|gif|svg\+xml|avif)|application\/pdf)$/;
const MAX_BYTES = 8 * 1024 * 1024;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthed(cookies)) return json({ error: 'Not signed in.' }, 401);
  const form = await request.formData();
  const file = form.get('file');
  const dir = String(form.get('dir') ?? '');
  if (!(file instanceof File) || !DIRS.has(dir)) return json({ error: 'Bad upload.' }, 400);
  if (!TYPES.test(file.type)) return json({ error: 'Only images and PDFs are allowed.' }, 400);
  if (file.size > MAX_BYTES) return json({ error: 'File is larger than 8 MB.' }, 400);

  const dot = file.name.lastIndexOf('.');
  const base = (dot > 0 ? file.name.slice(0, dot) : file.name).toLowerCase().replace(/[^\w-]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'file';
  const ext = (dot > 0 ? file.name.slice(dot + 1) : 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = `${base}.${ext}`;
  await getStorage().write(`${dir}/${name}`, Buffer.from(await file.arrayBuffer()), `content: upload ${name}`);
  return json({ path: `/${dir.replace(/^public\//, '')}/${name}` });
};
