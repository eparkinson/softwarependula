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
```

Hugo version is pinned to **0.79.1** in the `Dockerfile` and used by the GitHub Actions workflows. In practice the workflows install Ubuntu's packaged Hugo (0.123.7 at the time of writing), and the `blueprint` theme is checked against both 0.92.2 and 0.123.7.

## Architecture

### Content model

- `content/post/` — blog posts (one file per post, TOML front matter with `+++` delimiters is common).
- `content/about.md` — About page.
- `archetypes/default.md` — template used by `hugo new`.

### Draft convention (non-standard)

Drafts in `content/post/` use the filename suffix `.md.draft` (e.g. `aisoccer.md.draft`) rather than Hugo's `draft: true` front matter. Files ending in `.md.draft` are ignored by Hugo because they don't have the `.md` extension. To publish a draft, rename it to `.md`. Do **not** convert these to `draft: true` — the site relies on the extension-based convention.

### Theme

The site uses `themes/blueprint/`, a theme written for this blog (set by `theme = "blueprint"` in `config.toml`). It is ours to edit:

- `layouts/_default/baseof.html` — page shell: a blue band holding the header and the page title, then one reading column.
- `layouts/index.html` — home page: the site title and tagline, then every post, newest first. The three newest show their `description`.
- `layouts/_default/single.html` — posts and pages. Posts get a number, date and reading time above the title, a series box, a contents list on long posts, older/newer links and comments.
- `layouts/_default/{list,term,terms}.html`, `layouts/404.html` — post list, a tag's posts, the tag list, not-found page.
- `layouts/partials/` — `head.html`, `social.html` (sharing metadata), `site-header.html`, `site-footer.html`, `post-row.html`, `post-number.html`, `series.html`, `comments.html`, `theme-script.html` (the light/dark switch).
- `static/css/blueprint.css` — all styles. Colours are CSS variables with light and dark values; the header switch sets `data-theme` on `<html>`.
- `static/fonts/` — Archivo and JetBrains Mono, self-hosted (both under the SIL Open Font License).

`themes/hugo-dusk/` is the previous third-party dark theme, kept so the old look can be restored by setting `theme = "hugo-dusk"` and removing `noClasses = false`.

Root-level `layouts/shortcodes/video.html` embeds a self-hosted MP4: `{{< video src="/videos/<folder>/<file>.mp4" caption="..." >}}`. Posts currently embed videos with Hugo's `youtube` shortcode instead.

The news digest section and the warm-editorial theme redesign were experiments. They were removed from `main` on 2026-10-11 and are kept on the `experimental-redesign-news` branch.

### Post front matter the theme reads

- `description` — one line, shown on the home page for the newest posts and used as the page's description when a link is shared. Give every post one.
- `collection = "Name"` — posts that share a value are listed together in a series box, oldest first. (Do not call this key `series`: Hugo's built-in templates treat that as a taxonomy.)
- `toc = true` / `toc = false` — force the contents list on or off. Without it, posts over 1,500 words with three or more headings get one.
- Posts use `#` for section headings and `##` below that. The theme styles them as section and sub-section headings, smaller than the post title.

### Search engines

- Each page has one `<h1>`, its title in the blue band. `layouts/_default/_markup/render-heading.html` renders headings in the text one level down, so a post's `#` sections come out as `<h2>`.
- `partials/head.html` sets the page title, the description (front matter `description`, else the opening words, else a line that fits the kind of page), the canonical URL and the share image. `partials/structured-data.html` adds JSON-LD: `BlogPosting` on posts, `WebSite` on the home page.
- The staging build is kept out of search results: when the base URL contains `//staging.`, every page gets `noindex, nofollow` and `robots.txt` omits the sitemap line. The live build has neither restriction and lists `sitemap.xml`. The not-found page is always `noindex`.
- Images written in Markdown are lazy-loaded (`render-image.html`). Give every image alt text: `![what it shows](/images/...)`.
- Both deploy workflows check out the full git history so that `--enableGitInfo` gives each page its own last-modified date, used in the sitemap and the structured data.
- Code blocks: give every fence a language (`python`, `shell`, `console` for terminal sessions with a prompt and output, `ini`, `yaml`, `java`, ...) so it is coloured.

### Share cards

`python3 tools/share-cards.py` writes `static/images/og/<post file name>.png` for every post and `site.png` for everything else (needs Chromium or Chrome). The theme finds a post's card by file name. Run it after adding a post or changing a title, and commit the PNGs.

### Config

`config.toml` is the single Hugo configuration. Notable settings: theme `blueprint`, `params.tagline` (the line under the site title), `params.comments` (`"disqus"`, `"utterances"` or `"none"`; utterances also needs the utterances GitHub app installed on `params.commentsRepo`), `markup.highlight.noClasses = false` (code is coloured by the theme's CSS), `markup.tableOfContents` levels 1 to 2, Disqus shortname `software-pendula`, tag taxonomy, and a fixed top menu (Posts / Tags). `paginate` and `theme_colors` are only used by the old theme.

### Tests

`__tests__/site.test.js` is the only test file. It is a post-build validator: it reads `./public/` with Cheerio and asserts that `index.html` and a `404` page exist, that internal `href`/`src` links resolve to a real file in `public/`, that inline scripts don't contain error patterns, and that every page has a `<title>`. It will throw "Public directory not found" if you haven't run `hugo` first. When tests fail, the build artefact is the source of truth — inspect `./public/` directly.

## Deployment

Two workflows in `.github/workflows/`:

- **Staging** (`aws-deploy-staging.yml`): auto-triggered on push to `main`. Builds with `--baseURL "https://staging.softwarependula.net"`, syncs to `s3://staging.softwarependula.net`, and invalidates CloudFront distribution `E3TETIEU2CNJME`.
- **Live** (`aws-deploy-live.yml`): **manual only** (`workflow_dispatch`, e.g. `gh workflow run aws-deploy-live.yml --ref main`). Builds with the default `baseURL` from `config.toml` and syncs to `s3://www.softwarependula.net`, the bucket the live site is served from, after first keeping a copy in `s3://bz-build-repository/live/www.softwarependula.net`. CloudFront in front of the live bucket does not cache, so changes show at once and there is no invalidation step. (Until 2026-10-11 the workflow only wrote the build-repository copy, so running it did not change the site.)

Both workflows `sudo apt-get install hugo` (Ubuntu's packaged Hugo, which may not be exactly 0.79.1) rather than pinning a version. The `Dockerfile` is the version-pinned path.

### Infrastructure

`.aws/` contains Terraform state and configuration for the AWS infrastructure (S3 buckets, CloudFront, etc.). State files are gitignored (`.aws/terraform.tfstate*`) — do not commit them if they reappear.

## Conventions

- Post front matter uses TOML (`+++` delimiters) historically; the `hugo new` archetype generates YAML (`---`). Either works; match the surrounding file's style when editing an existing post.
- Do not commit `public/`, `node_modules/`, `package-lock.json`, `hugo` binary tarballs, or anything matching `**/secret*` — all are gitignored.
