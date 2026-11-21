import { createReader } from '@keystatic/core/reader';
import Markdoc from '@markdoc/markdoc';
import config from '../../keystatic.config';

export const reader = createReader(process.cwd(), config);

const byOrder = <T extends { entry: { order: number | null } }>(items: T[]) =>
  items.sort((a, b) => (a.entry.order ?? 0) - (b.entry.order ?? 0));

export async function loadSite() {
  const [profile, vaylo, capabilities, projects, experience, posts] = await Promise.all([
    reader.singletons.profile.readOrThrow(),
    reader.singletons.vaylo.readOrThrow(),
    reader.collections.capabilities.all(),
    reader.collections.projects.all(),
    reader.collections.experience.all(),
    loadPosts(),
  ]);
  return {
    profile,
    vaylo,
    capabilities: byOrder(capabilities),
    projects: byOrder(projects),
    experience: byOrder(experience),
    posts,
  };
}

export async function loadPosts() {
  const posts = await reader.collections.posts.all();
  return posts
    .filter((p) => !p.entry.draft)
    .sort((a, b) => b.entry.date.localeCompare(a.entry.date));
}

export async function renderPost(slug: string) {
  const post = await reader.collections.posts.readOrThrow(slug);
  const { node } = await post.content();
  const html = Markdoc.renderers.html(Markdoc.transform(node));
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return { post, html, minutes: Math.max(1, Math.round(words / 220)) };
}
