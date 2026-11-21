import { collection, config, fields, singleton } from '@keystatic/core';

const text = (label: string, multiline = false) => fields.text({ label, multiline });
const order = fields.integer({ label: 'Order on page', defaultValue: 1 });

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'shohan / admin' },
    navigation: {
      Site: ['profile', 'vaylo'],
      Content: ['capabilities', 'projects', 'experience', 'posts'],
    },
  },
  singletons: {
    profile: singleton({
      label: 'Profile & hero',
      path: 'src/content/site/profile',
      schema: {
        name: text('Full name'),
        firstName: text('First line of name'),
        lastName: text('Second line of name (accent colour)'),
        role: text('Role'),
        company: text('Company'),
        location: text('Location'),
        intro: text('Hero intro', true),
        openToWork: fields.checkbox({ label: 'Show "open to new opportunities" badge', defaultValue: true }),
        accent: text('Accent colour (hex)'),
        languages: fields.array(text('Language'), { label: 'Languages (terminal card)', itemLabel: (p) => p.value }),
        commits: fields.array(text('Commit message'), { label: 'git log lines (terminal card)', itemLabel: (p) => p.value }),
        stats: fields.array(
          fields.object({ value: text('Big value'), label: text('Caption'), url: fields.url({ label: 'Link (optional)' }) }),
          { label: 'Stats strip', itemLabel: (p) => `${p.fields.value.value} — ${p.fields.label.value}` },
        ),
        certification: fields.object(
          { name: text('Certificate name'), short: text('Short code'), date: text('Date'), url: fields.url({ label: 'Credly / verify link' }) },
          { label: 'Certification' },
        ),
        email: text('Email'),
        github: fields.url({ label: 'GitHub URL' }),
        linkedin: fields.url({ label: 'LinkedIn URL' }),
        cv: fields.file({ label: 'CV (PDF)', directory: 'public/cv', publicPath: '/cv/' }),
        contactHeadline: text('Contact headline'),
        contactBlurb: text('Contact text', true),
      },
    }),
    vaylo: singleton({
      label: 'Day job (Vaylo)',
      path: 'src/content/site/vaylo',
      schema: {
        heading: text('Heading'),
        intro: text('Intro', true),
        modules: fields.array(
          fields.object({ name: text('Module'), detail: text('Detail'), builtByMe: fields.checkbox({ label: 'Built by me' }) }),
          { label: 'System map modules', itemLabel: (p) => p.fields.name.value },
        ),
        stack: fields.array(text('Tag'), { label: 'Stack tags', itemLabel: (p) => p.value }),
        feature: fields.object(
          {
            title: text('Title'),
            body: text('Body', true),
            bullets: fields.array(text('Bullet'), { label: 'Bullets', itemLabel: (p) => p.value }),
            url: fields.url({ label: 'Live URL' }),
            cardAmount: text('Card amount'),
            cardGreeting: text('Card greeting'),
          },
          { label: 'Featured feature (gift cards)' },
        ),
      },
    }),
  },
  collections: {
    capabilities: collection({
      label: 'What I can build',
      slugField: 'title',
      path: 'src/content/capabilities/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        order,
        icon: fields.select({
          label: 'Icon',
          defaultValue: 'server',
          options: ['server', 'card', 'cloud', 'chart', 'desktop', 'code'].map((v) => ({ label: v, value: v })),
        }),
        color: text('Icon colour (hex)'),
        description: text('Description', true),
        tools: text('Tools line'),
      },
    }),
    projects: collection({
      label: 'Pet projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        order,
        size: fields.select({
          label: 'Card size',
          defaultValue: 'medium',
          options: [
            { label: 'Featured (full width)', value: 'featured' },
            { label: 'Medium (with screenshot)', value: 'medium' },
            { label: 'Small (text only)', value: 'small' },
          ],
        }),
        kind: text('Kind (e.g. macOS app)'),
        stack: text('Stack line'),
        summary: text('Summary', true),
        bullets: fields.array(text('Bullet'), { label: 'Bullets (featured only)', itemLabel: (p) => p.value }),
        image: fields.image({ label: 'Screenshot', directory: 'public/images/projects', publicPath: '/images/projects/' }),
        secondaryImage: fields.image({ label: 'Extra image (featured only)', directory: 'public/images/projects', publicPath: '/images/projects/' }),
        url: fields.url({ label: 'Link (live site or repo)' }),
        linkLabel: text('Link label (e.g. github ↗)'),
      },
    }),
    experience: collection({
      label: 'Experience & certs',
      slugField: 'title',
      path: 'src/content/experience/*',
      schema: {
        title: fields.slug({ name: { label: 'Title · Organisation' } }),
        order,
        period: text('Period'),
        description: text('Description', true),
        url: fields.url({ label: 'Link (optional)' }),
        dot: fields.select({
          label: 'Dot style',
          defaultValue: 'blue',
          options: [
            { label: 'Accent (current)', value: 'accent' },
            { label: 'Blue', value: 'blue' },
            { label: 'Gold', value: 'gold' },
            { label: 'Grey', value: 'grey' },
          ],
        }),
      },
    }),
    posts: collection({
      label: 'Blog posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Published', validation: { isRequired: true } }),
        summary: text('Summary', true),
        draft: fields.checkbox({ label: 'Draft (hidden)', defaultValue: true }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
  },
});
