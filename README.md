# shohan-site

My personal site: Astro 7 with its own admin at `/admin`, deployed on Vercel.

## Run it

```bash
pnpm install
cp .env.example .env   # then set ADMIN_PASSWORD
pnpm dev               # site: http://localhost:4321 · admin: http://localhost:4321/admin
pnpm build
```

Node 22.23.0 works with the pinned versions (Astro 7.4.0, @astrojs/react 7.1.0).

## The admin (`/admin`)

Sign in with `ADMIN_PASSWORD`. Every section of the page can be edited, added, deleted, reordered and given images or a CV, with a live preview. ⌘S / Ctrl+S saves.

Where a save goes depends on the environment:

| Where | Setting | Save does |
|---|---|---|
| Your Mac (`pnpm dev`) | no `GITHUB_TOKEN` | writes the files in `src/content/` and `public/`; commit and push yourself |
| Live site, any computer | `GITHUB_TOKEN` set in Vercel | commits the change to `shohansk/shohan-site`; Vercel rebuilds in ~1 min |

### Turning on editing from any computer (one-time)

1. Push this repo to GitHub (`shohansk/shohan-site`).
2. In Vercel → project **shohan-site** → Settings → Git, connect the repo, so every commit redeploys.
3. Create a GitHub fine-grained token: github.com → Settings → Developer settings → Fine-grained tokens → only repository `shohansk/shohan-site`, permission **Contents: Read and write**.
4. In Vercel → Settings → Environment Variables (Production), add `ADMIN_PASSWORD`, `SESSION_SECRET` (`openssl rand -hex 32`) and `GITHUB_TOKEN`. Redeploy.
5. Open `https://shohan-site.vercel.app/admin` from anywhere and sign in.

To change the password, change `ADMIN_PASSWORD` in Vercel (and `.env` locally) and redeploy. Changing `SESSION_SECRET` signs everyone out.

## Content files

| Admin section | File(s) |
|---|---|
| Hero & profile | `src/content/site/profile.yaml` |
| Day job (Vaylo) | `src/content/site/vaylo.yaml` |
| What I can build | `src/content/capabilities/*.yaml` |
| Pet projects | `src/content/projects/*.yaml` (images in `public/images/projects/`) |
| Experience & certs | `src/content/experience/*.yaml` |
| Blog posts | `src/content/posts/*.md` |
