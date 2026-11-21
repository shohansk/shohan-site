export type Field =
  | { key: string; label: string; type: 'text' | 'textarea' | 'url' | 'date' | 'color'; hint?: string }
  | { key: string; label: string; type: 'number' }
  | { key: string; label: string; type: 'checkbox' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'list'; hint?: string }
  | { key: string; label: string; type: 'objectList'; fields: Field[]; itemTitle: string }
  | { key: string; label: string; type: 'object'; fields: Field[] }
  | { key: string; label: string; type: 'upload'; dir: string; accept: string };

export type Section = {
  id: string;
  label: string;
  group: 'Site' | 'Content';
  kind: 'singleton' | 'collection';
  path: string;
  format: 'yaml' | 'markdown';
  fields: Field[];
  newItem?: Record<string, unknown>;
};

const opts = (...v: string[]) => v.map((x) => ({ value: x, label: x }));
const IMG_DIR = 'public/images/projects';

export const sections: Section[] = [
  {
    id: 'profile',
    label: 'Hero & profile',
    group: 'Site',
    kind: 'singleton',
    path: 'src/content/site/profile.yaml',
    format: 'yaml',
    fields: [
      { key: 'name', label: 'Full name', type: 'text' },
      { key: 'firstName', label: 'Name — first line', type: 'text' },
      { key: 'lastName', label: 'Name — second line (accent colour)', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'intro', label: 'Hero intro', type: 'textarea' },
      { key: 'openToWork', label: 'Show "open to new opportunities" badge', type: 'checkbox' },
      { key: 'accent', label: 'Accent colour', type: 'color' },
      { key: 'languages', label: 'Languages in terminal card', type: 'list' },
      { key: 'commits', label: 'git log lines in terminal card', type: 'list' },
      {
        key: 'stats',
        label: 'Stats strip',
        type: 'objectList',
        itemTitle: 'value',
        fields: [
          { key: 'value', label: 'Big value', type: 'text' },
          { key: 'label', label: 'Caption', type: 'text' },
          { key: 'url', label: 'Link (optional)', type: 'url' },
        ],
      },
      {
        key: 'certification',
        label: 'Certification',
        type: 'object',
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'short', label: 'Short code', type: 'text' },
          { key: 'date', label: 'Date', type: 'text' },
          { key: 'url', label: 'Verify link (Credly)', type: 'url' },
        ],
      },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'github', label: 'GitHub URL', type: 'url' },
      { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
      { key: 'cv', label: 'CV (PDF)', type: 'upload', dir: 'public/cv', accept: 'application/pdf' },
      { key: 'contactHeadline', label: 'Contact headline', type: 'text' },
      { key: 'contactBlurb', label: 'Contact text', type: 'textarea' },
    ],
  },
  {
    id: 'vaylo',
    label: 'Day job (Vaylo)',
    group: 'Site',
    kind: 'singleton',
    path: 'src/content/site/vaylo.yaml',
    format: 'yaml',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'intro', label: 'Intro', type: 'textarea' },
      {
        key: 'modules',
        label: 'System map modules',
        type: 'objectList',
        itemTitle: 'name',
        fields: [
          { key: 'name', label: 'Module', type: 'text' },
          { key: 'detail', label: 'Detail', type: 'text' },
          { key: 'builtByMe', label: 'Built by me', type: 'checkbox' },
        ],
      },
      { key: 'stack', label: 'Stack tags', type: 'list' },
      {
        key: 'feature',
        label: 'Featured work (gift cards)',
        type: 'object',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'body', label: 'Body', type: 'textarea' },
          { key: 'bullets', label: 'Bullets', type: 'list' },
          { key: 'url', label: 'Live URL', type: 'url' },
          { key: 'cardAmount', label: 'Card amount', type: 'text' },
          { key: 'cardGreeting', label: 'Card greeting', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'capabilities',
    label: 'What I can build',
    group: 'Content',
    kind: 'collection',
    path: 'src/content/capabilities',
    format: 'yaml',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'select', options: opts('server', 'card', 'cloud', 'chart', 'desktop', 'code') },
      { key: 'color', label: 'Icon colour', type: 'color' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'tools', label: 'Tools line', type: 'text', hint: 'e.g. django · drf · go' },
    ],
    newItem: { title: 'New capability', icon: 'server', color: '#3DDC97', description: '', tools: '' },
  },
  {
    id: 'projects',
    label: 'Pet projects',
    group: 'Content',
    kind: 'collection',
    path: 'src/content/projects',
    format: 'yaml',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'size',
        label: 'Card size',
        type: 'select',
        options: [
          { value: 'featured', label: 'Featured (full width)' },
          { value: 'medium', label: 'Medium (with screenshot)' },
          { value: 'small', label: 'Small (text only)' },
        ],
      },
      {
        key: 'screenshotStyle',
        label: 'Screenshot style (featured)',
        type: 'select',
        options: [
          { value: 'desktop', label: 'Desktop panel' },
          { value: 'phone', label: 'Two phone screens' },
        ],
      },
      { key: 'kind', label: 'Kind', type: 'text', hint: 'e.g. macOS app' },
      { key: 'stack', label: 'Stack line', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'bullets', label: 'Bullets (featured only)', type: 'list' },
      { key: 'image', label: 'Screenshot', type: 'upload', dir: IMG_DIR, accept: 'image/*' },
      { key: 'secondaryImage', label: 'Second image', type: 'upload', dir: IMG_DIR, accept: 'image/*' },
      { key: 'url', label: 'Link', type: 'url' },
      { key: 'linkLabel', label: 'Link label', type: 'text', hint: 'e.g. github ↗' },
      { key: 'secondaryUrl', label: 'Second link', type: 'url' },
      { key: 'secondaryLabel', label: 'Second link label', type: 'text' },
    ],
    newItem: { title: 'New project', size: 'small', screenshotStyle: 'desktop', kind: '', stack: '', summary: '', bullets: [], url: '', linkLabel: 'github ↗' },
  },
  {
    id: 'experience',
    label: 'Experience & certs',
    group: 'Content',
    kind: 'collection',
    path: 'src/content/experience',
    format: 'yaml',
    fields: [
      { key: 'title', label: 'Title · Organisation', type: 'text' },
      { key: 'period', label: 'Period', type: 'text', hint: 'e.g. Apr 2025 — now' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'url', label: 'Link (optional)', type: 'url' },
      { key: 'dot', label: 'Timeline dot', type: 'select', options: opts('accent', 'blue', 'gold', 'grey') },
    ],
    newItem: { title: 'New role · Company', period: '', description: '', url: '', dot: 'blue' },
  },
  {
    id: 'posts',
    label: 'Blog posts',
    group: 'Content',
    kind: 'collection',
    path: 'src/content/posts',
    format: 'markdown',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'date', label: 'Published', type: 'date' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'draft', label: 'Draft (hidden from the site)', type: 'checkbox' },
      { key: 'body', label: 'Post (Markdown)', type: 'textarea' },
    ],
    newItem: { title: 'New post', date: new Date().toISOString().slice(0, 10), summary: '', draft: true, body: '' },
  },
];

export const sectionById = (id: string) => sections.find((s) => s.id === id);

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'item';

export const fileExt = (s: Section) => (s.format === 'markdown' ? '.md' : '.yaml');
