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
5. Before relying on hosted CI, activate the exact provider boundary described
   under [GitHub Packages auth](#github-packages-auth), grant the new repository
   Read-only package access, and prove a Jesse-owned pull request.
6. Deploy:
   ```bash
   pnpm config set --location user //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"
   pnpm install
   pnpm sanity deploy
   ```
   Sanity will prompt for a studio hostname and assign a new `appId`. Copy
   that `appId` into `client.config.ts` so future deploys are non-interactive.

The clone starts from the template's schemas, desk customization, components,
actions, dependencies, lockfile, scripts, and validation tooling. Later shared
changes are not inherited automatically: land them in this template first, then
sync the focused commits into downstream Studios. Only `client.config.ts`, the
package `name`, deployment values, and client documentation are downstream-owned.
From the standard sibling-repository layout, verify that shared files match with:

```bash
pnpm check:downstream-sync
```

Pass downstream repository paths after `--` when using another layout.

Optional content modules such as `homepage` and `modelingPage` are included in
the template, but disabled by default. Enable them only when the client
frontend has matching routes and GROQ queries.

The `about`, `contactPage`, and `siteSettings` desk entries intentionally open
document lists. Existing client datasets may use generated IDs for those
documents. Do not replace the lists with literal document IDs unless every
affected client's published documents, drafts, and references are inventoried
and migrated through an explicit, backed-up content operation.

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

Hosted CI must never write the literal token into persistent npm config. The
shared GitHub Actions workflow uses `actions/setup-node` with `registry-url` to
write a `${NODE_AUTH_TOKEN}` placeholder, then exposes the ephemeral repository
token only to its repository-controlled install step. The pinned checkout
action receives the token transiently but does not persist its credentials.
Copy that workflow pattern for another hosted environment; do not carry the
token into project-controlled checks or later steps.

The Studio repositories are public. Roll out hosted access in this order:

1. Configure GitHub **Workflow Execution Protections** as **Active**, allowing
   only the exact `JessePomeroy` actor and only the `pull_request` event.
2. Grant the repository **Read**, never Write or Admin, under the private
   package's **Manage Actions access**.
3. Prove the hosted check on a Jesse-owned branch and pull request.

If Workflow Execution Protections are unavailable, do not grant package access;
hosted installation must remain fail-closed. External and Dependabot changes
are reviewed and then restaged on a Jesse-owned branch; their workflows must
not receive package access. The shared Studio CI workflow uses the ephemeral
repository token in repository-controlled commands only for a frozen install
with lifecycle scripts and `.pnpmfile.cjs` hooks disabled. Its pinned checkout
action receives the token transiently without persisting credentials. The
workflow disables repository `.corepack.env` overrides, verifies the
security-fixed package-manager pin before credential exposure, pins every action
to a full commit SHA, and does not cache or upload private package files.

Rollback starts by revoking the package's repository Read grant. Only then
disable or revert the workflow or Workflow Execution Protection; never leave
package access active while weakening the provider policy.

`pnpm sanity deploy` builds from the current checkout, so a local deploy only
needs the local auth setup before `pnpm install`. A hosted deploy that installs
dependencies first must use the same placeholder-and-scoped-environment pattern
as the shared workflow.

## Local development

```bash
pnpm install
pnpm dev          # localhost:3333
pnpm build        # build studio bundle
pnpm lint         # Biome and ESLint checks
pnpm format       # biome format --write
pnpm sanity deploy   # deploy to sanity.studio (uses pinned appId)
```

## Downstream instances

- `../angelsrest-studio`
- `../reflecting-pool-studio`

Shared schemas, desk structure, actions, components, dependencies, lockfile,
scripts, and tooling land here first. Sync the resulting commits downstream; do
not maintain parallel fixes independently in each client Studio.
