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
- **Custom actions** — Mark Sold Out / Mark Back In Stock for products
- **Singleton enforcement** for site settings, about, and contact page
- **Orderable lists** for galleries and print collections
- **Presentation tool** wired with draft mode toggle for visual editing
- **Back-reference tabs** on galleries, products, and collections

## Cloning for a new client

The only file you should need to edit is **`client.config.ts`** at the repo
root. Everything photographer-specific is sourced from there.

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
   - `appId` → leave empty until first deploy
4. Edit `package.json` `name` field to match the new repo.
5. Deploy:
   ```bash
   pnpm install
   pnpm sanity deploy
   ```
   Sanity will prompt for a studio hostname and assign a new `appId`. Copy
   that `appId` into `client.config.ts` so future deploys are non-interactive.

**All schemas, desk customization, custom components, and actions are
inherited automatically.**

## Environment variables (optional)

Create a `.env` file to override default fee calculations for client studios
using Stripe Connect:

```
SANITY_STUDIO_PLATFORM_FEE_PCT=5
SANITY_STUDIO_STRIPE_FEE_PCT=2.9
SANITY_STUDIO_STRIPE_FEE_FIXED_CENTS=30
```

Defaults: 0% platform fee, 2.9% + $0.30 Stripe fee.

## Local development

```bash
pnpm install
pnpm dev          # localhost:3333
pnpm build        # build studio bundle
pnpm lint         # biome check
pnpm format       # biome format --write
pnpm sanity deploy   # deploy to sanity.studio (uses pinned appId)
```
