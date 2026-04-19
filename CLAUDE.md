# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Software Pendula is a personal blog (https://www.softwarependula.net) built as a Hugo static site, served from AWS S3 + CloudFront. The site is a content repository, not a Go project — there is no Hugo source here. The root `README.md` is the upstream Hugo README and is **not** relevant to working on this repo; `agents.md` is the authoritative project description.

## Commands

```bash
# Local dev server with live reload (draft posts won't appear — see "Drafts" below)
hugo server

# Production build (output goes to ./public/). This MUST run before `npm test`.
hugo --minify --enableGitInfo

# Jest tests (validates the built ./public/ — broken links, missing titles, bad <script> src, etc.)
npm test

# Full validate: build then run Jest
npm run test:all

# Run a single test file / test name
npx jest __tests__/site.test.js
npx jest -t "should not have broken internal links"

# Create new content
hugo new post/my-new-post.md
hugo new news/YYYYMM/YYYY-MM-DD.md
```

Hugo version is pinned to **0.79.1** in the `Dockerfile` and used by the GitHub Actions workflows. Newer Hugo versions may break the build or the `hugo-dusk` theme — match this version when reproducing CI behaviour locally.

## Architecture

### Content model

- `content/post/` — blog posts (one file per post, TOML front matter with `+++` delimiters is common).
- `content/news/YYYYMM/YYYY-MM-DD.md` — daily news digest entries, grouped into month folders. Each month folder has an `_index.md` that makes it a Hugo section.
- `content/about.md` — About page.
- `archetypes/default.md` — template used by `hugo new`.

### Draft convention (non-standard)

Drafts in `content/post/` use the filename suffix `.md.draft` (e.g. `aisoccer.md.draft`) rather than Hugo's `draft: true` front matter. Files ending in `.md.draft` are ignored by Hugo because they don't have the `.md` extension. To publish a draft, rename it to `.md`. Do **not** convert these to `draft: true` — the site relies on the extension-based convention.

### Theme and layout overrides

The theme `themes/hugo-dusk/` is a vendored third-party theme. Customizations live in the repo root and override the theme by Hugo's lookup order:

- `layouts/news/{list,single}.html` — custom news section layout (archive sidebar, "latest digest" on `/news/` landing page, month-grouped listings). This overrides the theme's default section templates.
- `static/css/news-layout.css`, `static/js/news-cards.js` — assets consumed by the news layout.
- `static/` — other site-wide static assets (images, papers PDFs).

When changing news-section styling or behaviour, edit files under `layouts/news/` and `static/` — do not edit the theme directly.

### Config

`config.toml` is the single Hugo configuration. Notable settings: `paginate = 3`, theme `hugo-dusk` with `theme_colors = "default-dark"`, Chroma syntax highlighting with `fruity` style, Disqus shortname `software-pendula`, tag taxonomy, and a fixed top menu (Posts / News / Tags).

### Tests

`__tests__/site.test.js` is the only test file. It is a post-build validator: it reads `./public/` with Cheerio and asserts that `index.html` and a `404` page exist, that internal `href`/`src` links resolve to a real file in `public/`, that inline scripts don't contain error patterns, and that every page has a `<title>`. It will throw "Public directory not found" if you haven't run `hugo` first. When tests fail, the build artefact is the source of truth — inspect `./public/` directly.

## Deployment

Two workflows in `.github/workflows/`:

- **Staging** (`aws-deploy-staging.yml`): auto-triggered on push to `main`. Builds with `--baseURL "https://staging.softwarependula.net"`, syncs to `s3://staging.softwarependula.net`, and invalidates CloudFront distribution `E3TETIEU2CNJME`.
- **Live** (`aws-deploy-live.yml`): **manual only** (`workflow_dispatch`). Builds with the default `baseURL` from `config.toml` and syncs to `s3://bz-build-repository/live/www.softwarependula.net`. Does not invalidate CloudFront — expect a cache delay after promoting.

Both workflows `sudo apt-get install hugo` (Ubuntu's packaged Hugo, which may not be exactly 0.79.1) rather than pinning a version. The `Dockerfile` is the version-pinned path.

### Infrastructure

`.aws/` contains Terraform state and configuration for the AWS infrastructure (S3 buckets, CloudFront, etc.). State files are gitignored (`.aws/terraform.tfstate*`) — do not commit them if they reappear.

## Conventions

- News digest entries follow a consistent structure: H2 category headers (e.g. `## AI News`, `## International News`) with H3 stories and a `**Sources:**` list. The custom layout wraps these H2s with a `news-category-header` div via regex — preserve that heading shape when editing.
- Post front matter uses TOML (`+++` delimiters) historically; the `hugo new` archetype generates YAML (`---`). Either works; match the surrounding file's style when editing an existing post.
- Do not commit `public/`, `node_modules/`, `package-lock.json`, `hugo` binary tarballs, or anything matching `**/secret*` — all are gitignored.
