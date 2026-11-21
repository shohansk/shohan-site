import YAML from 'yaml';
import type { Section } from './schema';

export type Entry = Record<string, unknown>;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function decode(section: Section, text: string): Entry {
  if (section.format === 'markdown') {
    const m = text.match(FRONTMATTER);
    if (!m) return { body: text };
    return { ...(YAML.parse(m[1]) ?? {}), body: m[2].trim() };
  }
  return (YAML.parse(text) ?? {}) as Entry;
}

export function encode(section: Section, entry: Entry): string {
  if (section.format === 'markdown') {
    const { body = '', ...meta } = entry;
    return `---\n${YAML.stringify(meta).trim()}\n---\n\n${String(body).trim()}\n`;
  }
  return YAML.stringify(entry, { lineWidth: 0 });
}
