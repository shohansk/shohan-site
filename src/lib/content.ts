import fs from 'node:fs';
import path from 'node:path';
import Markdoc from '@markdoc/markdoc';
import { decode } from '../cms/codec';
import { sectionById, type Section } from '../cms/schema';

type Any = Record<string, any>;
type Item = { slug: string; entry: Any };

const root = process.cwd();
const section = (id: string) => sectionById(id) as Section;

function readSingleton(id: string): Any {
  const s = section(id);
  return decode(s, fs.readFileSync(path.join(root, s.path), 'utf8'));
}

function readCollection(id: string): Item[] {
  const s = section(id);
  const dir = path.join(root, s.path);
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(ya?ml|md)$/.test(f))
    .map((f) => ({ slug: f.replace(/\.[^.]+$/, ''), entry: decode(s, fs.readFileSync(path.join(dir, f), 'utf8')) }))
    .sort((a, b) => (a.entry.order ?? 0) - (b.entry.order ?? 0));
}

export function loadSite() {
  return {
    profile: readSingleton('profile'),
    vaylo: readSingleton('vaylo'),
    capabilities: readCollection('capabilities'),
    projects: readCollection('projects'),
    experience: readCollection('experience'),
    posts: loadPosts(),
  };
}

export const loadProfile = () => readSingleton('profile');

export function loadPosts(): Item[] {
  return readCollection('posts')
    .filter((p) => !p.entry.draft)
    .sort((a, b) => String(b.entry.date).localeCompare(String(a.entry.date)));
}

export function renderPost(slug: string) {
  const post = readCollection('posts').find((p) => p.slug === slug);
  if (!post) throw new Error(`Post not found: ${slug}`);
  const html = Markdoc.renderers.html(Markdoc.transform(Markdoc.parse(String(post.entry.body ?? ''))));
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return { post: post.entry, html, minutes: Math.max(1, Math.round(words / 220)) };
}
