# shohan-site

My personal site: Astro 7 + Keystatic CMS, deployed on Vercel.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:4321  ·  admin: http://localhost:4321/keystatic
pnpm build
```

Node 22.23.0 works with the pinned versions (Astro 7.4.0, @astrojs/react 7.1.0). Newer @astrojs/react needs Node ≥ 22.23.4.

## Editing content

Everything on the page comes from `src/content/`, and the admin at `/keystatic` edits those files:

| Admin section | File(s) |
|---|---|
| Profile & hero (name, intro, stats, AWS cert, links, CV) | `src/content/site/profile.yaml` |
| Day job (Vaylo map + gift card feature) | `src/content/site/vaylo.yaml` |
| What I can build | `src/content/capabilities/*.yaml` |
| Pet projects (screenshots go to `public/images/projects/`) | `src/content/projects/*.yaml` |
| Experience & certs | `src/content/experience/*.yaml` |
| Blog posts (untick **Draft** to publish) | `src/content/posts/*.mdoc` |

There is **no password**. Keystatic doesn't have its own user accounts:

- **Now (local mode):** the admin only works on your machine (`pnpm dev`). Saving writes the files; then commit and push, and Vercel rebuilds the site.
- **Later (GitHub mode):** to edit on the live site, switch `storage` in `keystatic.config.ts` to `{ kind: 'github', repo: 'shohansk/shohan-site' }` and follow Keystatic's GitHub app setup. You then sign in at `/keystatic` with your GitHub account, and only people with write access to the repo can save. Each save becomes a commit.

## Deploy

```bash
bunx vercel@latest deploy --prod
```
