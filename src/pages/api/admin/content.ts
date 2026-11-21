import type { APIRoute } from 'astro';
import { isAuthed, json } from '../../../cms/auth';
import { decode, encode, type Entry } from '../../../cms/codec';
import { fileExt, sectionById, sections, slugify, type Section } from '../../../cms/schema';
import { getStorage, type Storage } from '../../../cms/storage';

export const prerender = false;

const unauthorized = () => json({ error: 'Not signed in.' }, 401);

async function readCollection(store: Storage, s: Section) {
  const files = (await store.list(s.path)).filter((f) => f.endsWith(fileExt(s)));
  const items = await Promise.all(
    files.map(async (f) => ({ slug: f.slice(0, -fileExt(s).length), entry: decode(s, (await store.read(`${s.path}/${f}`)) ?? '') })),
  );
  return items.sort((a, b) => Number(a.entry.order ?? 0) - Number(b.entry.order ?? 0));
}

function clean(s: Section, entry: Entry): Entry {
  const out: Entry = {};
  if (s.kind === 'collection') out.order = Number(entry.order ?? 1);
  for (const f of s.fields) if (entry[f.key] !== undefined) out[f.key] = entry[f.key];
  return out;
}

const guard = (handler: APIRoute): APIRoute => async (ctx) => {
  try {
    return await handler(ctx);
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
};

export const GET: APIRoute = guard(async ({ cookies }) => {
  if (!isAuthed(cookies)) return unauthorized();
  const store = getStorage();
  const data: Record<string, unknown> = {};
  await Promise.all(
    sections.map(async (s) => {
      data[s.id] = s.kind === 'singleton' ? decode(s, (await store.read(s.path)) ?? '') : await readCollection(store, s);
    }),
  );
  return json({ mode: store.mode, data });
});

export const PUT: APIRoute = guard(async ({ request, cookies }) => {
  if (!isAuthed(cookies)) return unauthorized();
  const body = (await request.json()) as { section: string; slug?: string; entry: Entry };
  const s = sectionById(body.section);
  if (!s) return json({ error: 'Unknown section.' }, 400);
  const store = getStorage();
  const entry = clean(s, body.entry);

  if (s.kind === 'singleton') {
    await store.write(s.path, encode(s, entry), `content: update ${s.label}`);
    return json({ ok: true });
  }

  let slug = body.slug;
  if (!slug) {
    const existing = await readCollection(store, s);
    const taken = new Set(existing.map((e) => e.slug));
    const base = slugify(String(entry.title ?? 'item'));
    slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
    entry.order = Math.max(0, ...existing.map((e) => Number(e.entry.order ?? 0))) + 1;
  }
  if (!/^[\w-]+$/.test(slug)) return json({ error: 'Bad slug.' }, 400);
  await store.write(`${s.path}/${slug}${fileExt(s)}`, encode(s, entry), `content: ${body.slug ? 'update' : 'add'} ${s.label} "${entry.title}"`);
  return json({ ok: true, slug, entry });
});

export const PATCH: APIRoute = guard(async ({ request, cookies }) => {
  if (!isAuthed(cookies)) return unauthorized();
  const { section, items } = (await request.json()) as { section: string; items: { slug: string; entry: Entry }[] };
  const s = sectionById(section);
  if (!s || s.kind !== 'collection' || !Array.isArray(items) || items.some((i) => !/^[\w-]+$/.test(i.slug))) return json({ error: 'Bad request.' }, 400);
  const files = items.map((i) => ({ path: `${s.path}/${i.slug}${fileExt(s)}`, data: encode(s, clean(s, i.entry)) }));
  await getStorage().writeMany(files, `content: reorder ${s.label}`);
  return json({ ok: true });
});

export const DELETE: APIRoute = guard(async ({ request, cookies }) => {
  if (!isAuthed(cookies)) return unauthorized();
  const { section, slug } = (await request.json()) as { section: string; slug: string };
  const s = sectionById(section);
  if (!s || s.kind !== 'collection' || !/^[\w-]+$/.test(slug)) return json({ error: 'Bad request.' }, 400);
  await getStorage().remove(`${s.path}/${slug}${fileExt(s)}`, `content: delete ${s.label} "${slug}"`);
  return json({ ok: true });
});
