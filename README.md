# Photographer Sanity Studio — Template

A customized Sanity Studio designed as the content layer for a photographer
SaaS. Clone this repo for each new photographer client — edit one file and
deploy.

## What lives here

- **Photographer schemas** — galleries, products, print collections,
  LumaPrints v2 print products, LumaPrints v2 print sets, blog posts,
  coupons, site settings, about, contact page
- **Customized desk structure** — Dashboard, Needs Attention (QA control
  tower), Content, Shop, Blog, Settings
- **Custom dashboard pane** with stats + quick action links
- **Custom field components** — `RetailPriceWithMargin` (inline cost +
  margin display on `lumaProductV2` variants)
- **Shared print catalog dependency** — paper, size, canvas, frame, and
  wholesale pricing data comes from `@jessepomeroy/print-catalog`
- **Custom actions** — Mark Sold Out / Mark Back In Stock for products
- **Singleton enforcement** for site settings, about, and contact page
- **Orderable lists** for galleries and print collections
- **Presentation tool** wired with draft mode toggle for visual editing
- **Back-reference tabs** on galleries, products, and collections

## Cloning for a new client

Client runtime configuration belongs in **`client.config.ts`** at the repo
root. Initial bootstrap also changes the package name and Sanity deployment
metadata; shared schemas, components, actions, and desk structure do not fork.

1. Clone this repo and create a fresh repo:
   ```bash
   git clone git@github.com:jessepomeroy/sanity-studio-template.git clientname-studio
   cd clientname-studio
   rm -rf .git && git init
   git remote add origin git@github.com:jessepomeroy/clientname-studio.git
   ```
2. Create a Sanity project for the client at https://sanity.io/manage and
   note the new `projectId`.
3. Edit `client.config.ts`:
   - `projectId` → new project ID
   - `dataset` → usually `production`
   - `studioTitle` / `dashboardHeading` / `dashboardSubtitle` → client branding
   - `liveSiteUrl` / `adminDashboardUrl` → client's deployed URLs
   - `enabledSchemas` → optional content modules the client site actually uses
   - `appId` → leave empty until first deploy
4. Edit `package.json` `name` field to match the new repo.
5. Deploy:
   ```bash
   pnpm config set --location user //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"
   pnpm install
   pnpm sanity deploy
   ```
   Sanity will prompt for a studio hostname and assign a new `appId`. Copy
   that `appId` into `client.config.ts` so future deploys are non-interactive.

The clone starts from the template's schemas, desk customization, components,
and actions. Later shared changes are not inherited automatically: land them in
this template first, then sync the focused commits into downstream Studios.
From the standard sibling-repository layout, verify that shared files match with:

```bash
pnpm check:downstream-sync
```

Pass downstream repository paths after `--` when using another layout.

Optional content modules such as `homepage` and `modelingPage` are included in
the template, but disabled by default. Enable them only when the client
frontend has matching routes and GROQ queries.

## Environment variables (optional)

Create a `.env.local` file to override default fee calculations for client studios
using Stripe Connect:

```
SANITY_STUDIO_PLATFORM_FEE_PCT=0.05
SANITY_STUDIO_STRIPE_FEE_PCT=0.029
SANITY_STUDIO_STRIPE_FEE_FIXED_CENTS=30
```

Use decimal rates, not whole percentages. Defaults: 0% platform fee,
2.9% + $0.30 Stripe fee.

## GitHub Packages auth

This template consumes private `@jessepomeroy/*` packages from GitHub
Packages. The repo-level `.npmrc` maps the package scope to the GitHub
registry, but it does not and should not contain a token.

Before running `pnpm install` in a fresh local environment, write a GitHub
Packages token with `read:packages` access into your user npm config:

```bash
pnpm config set --location user //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"
```

For CI or another hosted install, setting `NODE_AUTH_TOKEN` alone is not
enough. The install command must write that token into npm config before
dependency installation:

```bash
pnpm config set --location user //npm.pkg.github.com/:_authToken "$NODE_AUTH_TOKEN" && pnpm install --frozen-lockfile
```

`pnpm sanity deploy` builds from the current checkout, so a local deploy only
needs the local auth setup before `pnpm install`. If a hosted deploy installs
dependencies first, run the hosted config command above before that install.

## Local development

```bash
pnpm install
pnpm dev          # localhost:3333
pnpm build        # build studio bundle
pnpm lint         # biome check
pnpm format       # biome format --write
pnpm sanity deploy   # deploy to sanity.studio (uses pinned appId)
```

## Downstream instances

- `../angelsrest-studio`
- `../reflecting-pool-studio`

Shared schemas, desk structure, actions, and components land here first. Sync
the resulting commits downstream; do not maintain parallel fixes independently
in each client Studio.
