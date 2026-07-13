# AGENTS.md — sanity-studio-template

Template Sanity Studio for the photographer SaaS platform. Clone this repo for each new photographer client.

---

## Stack

- **CMS:** Sanity Studio v3 (see `package.json` for the installed version)
- **Plugins:** `@sanity/orderable-document-list`, `@sanity/vision`, `@sanity/presentation`, `sanity-plugin-documents-pane`, `sanity-plugin-media`
- **Linting:** Biome and ESLint (check); Biome (format)
- **Config:** All client-specific values in `client.config.ts`

---

## Schema Types

| Type | Purpose | Notes |
|---|---|---|
| `gallery` | Photo galleries | Orderable, SEO, visibility toggle, featured flag |
| `product` | Shop products (non-print) | Postcards, tapestries, digital, merchandise |
| `lumaProductV2` | Print products | Paper × size variant matrix, inline margin display |
| `lumaPrintSetV2` | Print bundles/sets | N images per set, per-paper pricing |
| `printCollection` | Hierarchical print groupings | Orderable, supports nesting via parent ref |
| `coupon` | Discount codes | Tracks usage counts |
| `about` | About page (singleton) | Bio, portrait, social links, SEO |
| `contactPage` | Contact & booking (singleton) | Booking form config, session types |
| `siteSettings` | Global site config (singleton) | Artist name, title, social links, SEO |
| `post` | Blog posts | 5 template types with conditional fields |
| `author` | Blog authors | |
| `category` | Blog categories | |
| `blockContent` | Portable Text definition | |

---

## Desk Structure

```
Studio
├── Dashboard          — Custom React component with stats + quick actions
├── Needs Attention    — QA control tower (stale drafts, missing pricing, etc.)
├── ── Content ──
│   ├── Galleries      — Orderable list
│   ├── About          — Singleton
│   └── Contact & Booking — Singleton
├── ── Shop ──
│   ├── Prints         — lumaProductV2
│   ├── Print Sets     — lumaPrintSetV2
│   ├── Print Collections — Orderable
│   ├── Categories     — postcards, tapestries, digital, merchandise
│   └── Coupons
├── ── Blog ──
│   ├── Posts / Authors / Categories
└── ── Settings ──
    └── Site Settings  — Singleton
```

---

## Critical Rules

### Schema changes ripple to the frontend
When modifying schema types, check the frontend's GROQ queries. Field renames or removals are breaking changes.

### Orderable types need `orderRank`
`gallery`, `printCollection`, `lumaPrintSetV2` use `@sanity/orderable-document-list` — new orderable types need `orderRankField`.

### Singleton types need desk structure + action filter
Add new singletons to `SINGLETON_TYPES` in `sanity.config.ts` AND create a desk structure entry.
Existing deployments may store `about`, `contactPage`, and `siteSettings` under
generated document IDs. Keep those desk entries on document lists until every
downstream's published documents, drafts, and references have been inventoried
and an explicit fixed-ID migration has been backed up and verified. Never switch
an existing singleton to a literal `documentId` as a source-only cleanup.

### Client runtime config stays centralized
All photographer-specific runtime values live in `client.config.ts`. Package
identity and Sanity deployment metadata also change during initial bootstrap.
Schemas, components, actions, and desk structure remain shared and must flow
from this template through focused downstream sync commits.

### Private package installs need npm auth
This template consumes private `@jessepomeroy/*` packages from GitHub Packages.
The repo-level `.npmrc` maps the scope only; never commit a token. Before a
fresh local `pnpm install`, run:

```bash
pnpm config set --location user //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"
```

Hosted CI must never persist a literal token in npm config. GitHub Actions must
use `actions/setup-node` with `registry-url`, which writes a
`${NODE_AUTH_TOKEN}` placeholder, and expose the ephemeral token only on the
single repository-controlled install step. The pinned checkout action receives
the token transiently but does not persist its credentials. Copy
`.github/workflows/studio-ci.yml`; do not carry the token into
project-controlled checks or later steps.

### Private-package CI needs a provider trust boundary

This repository is public, so package access must not be granted to ordinary
fork-triggered workflows. Configure GitHub **Workflow Execution Protections**
as **Active**, permitting only the exact `JessePomeroy` actor and only the
`pull_request` event. Then add the repository under the private package's
**Manage Actions access** with **Read**, never Write or Admin, and prove the
hosted check on a Jesse-owned PR. If Workflow Execution Protections are not
available, do not grant package access; hosted installation must remain
fail-closed.

The shared `.github/workflows/studio-ci.yml` is defense in depth: it checks the
event actor, rerun actor, head repository, and PR author; uses only SHA-pinned
GitHub actions; verifies the exact security-fixed package-manager pin before
credential exposure; prevents repository `.corepack.env` overrides; disables
caches and persisted checkout credentials; and exposes the ephemeral repository
token to repository-controlled commands only during a frozen install with
lifecycle scripts and `.pnpmfile.cjs` hooks disabled. The pinned checkout action
receives it transiently without persisting credentials. The provider policy is
the actual boundary because pull-request code can edit its own workflow.

Do not allow external contributors or Dependabot to execute this workflow.
Review those changes, then restage accepted changes on a `JessePomeroy`-owned
branch and PR. Do not add `push`, `pull_request_target`, dispatch, scheduled, or
other package-bearing workflow events without a separate security review.
Rollback in the opposite trust order: revoke the package's repository Read
grant first, then disable or revert the workflow or Workflow Execution
Protection. Never leave package access active while weakening the provider
policy.

---

## Commands

```bash
pnpm dev          # Run Studio locally (localhost:3333)
pnpm build        # Build Studio for deployment
pnpm lint         # Run Biome and ESLint checks
pnpm format       # Run Biome format
pnpm sanity deploy   # Deploy Studio to sanity.io
```

---

## Cloning for a new client

Agent checklist when standing up a new client studio from this template:

1. **Create the new repo** — use GitHub's "Use this template" button, or:
   ```bash
   git clone git@github.com:jessepomeroy/sanity-studio-template.git <client>-studio
   cd <client>-studio
   rm -rf .git && git init
   gh repo create jessepomeroy/<client>-studio --public --source=. --push
   ```
2. **Create the Sanity project** at https://sanity.io/manage. Note the `projectId` and dataset name (usually `production`).
3. **Edit `client.config.ts`** — the only per-client file:
   - `projectId`, `dataset`
   - `studioTitle`, `dashboardHeading`, `dashboardSubtitle`
   - `liveSiteUrl`, `adminDashboardUrl`
   - `enabledSchemas` for optional content modules the client frontend supports
   - `appId` — leave empty for first deploy
4. **Edit `package.json` `name`** to match the new repo.
5. **Hosted package boundary** — activate exact-actor, pull-request-only Workflow Execution Protections; grant the new repository Read-only package access; and prove a Jesse-owned pull request. If the provider control is unavailable, do not grant package access.
6. **First deploy** — authenticate GitHub Packages, then run `pnpm install && pnpm sanity deploy`. Sanity prompts for a studio hostname and returns an `appId`; paste it into `client.config.ts` so subsequent deploys are non-interactive.
7. **CORS** — add the spoke site's localhost + prod origins via the Sanity manage UI (or the Sanity MCP `add_cors_origin` tool).
8. **Tokens** — issue per-environment tokens (see "Tokens" below) and store them in the spoke site / CI, not in this repo.

Do NOT modify schemas, desk structure, or custom components in a client studio — those live in the template and need to flow back upstream. If a client needs a divergent schema, that's a signal to lift the change into the template (gated on a `client.config.ts` flag if optional).

---

## Tokens

The studio itself authenticates interactively (`sanity login`) and does not need a token checked in. Tokens are issued per-project at sanity.io/manage → API → Tokens for downstream consumers:

| Token | Role | Used by | Notes |
|---|---|---|---|
| Read | Viewer | Spoke site runtime (`reflecting-pool` etc.) | Reads published content. Skip if dataset is public and only published content is needed. |
| Read+drafts | Viewer + draft access | Spoke site preview / draft mode | Required for Presentation tool's draft-mode toggle. |
| Deploy | Deploy Studio | CI running `sanity deploy` non-interactively | Set as `SANITY_AUTH_TOKEN` in CI secrets. |
| Editor | Editor | MCP scripts, migrations, seed data | Only issue when writes are actually needed. Treat as a privileged credential. |

---

## Platform Context

This studio is the template for the photographer CRM platform:
- **reflecting-pool** = Maggie's SvelteKit client spoke
- **sanity-studio-template** = Sanity CMS template (this repo)
- **reflecting-pool-studio** = Maggie's instance, cloned from this template
- **@jessepomeroy/admin** = shared admin dashboard package
- **Convex** = operational backend (orders, CRM, messages, notifications)

## Downstream sync

- `../angelsrest-studio` and `../reflecting-pool-studio` are downstream
  instances.
- Shared schema, desk, component, action, or dependency changes land here
  first, then sync downstream as focused commits.
- Downstream-only changes should be limited to `client.config.ts`, package
  identity, deployment metadata, and genuinely client-specific optional-module
  flags.
- Within `package.json`, only `name` is downstream-owned. Package-manager and
  engine pins, dependencies, scripts other than template-only sync commands,
  overrides, and lint/tooling configuration remain shared. The lockfile and
  shared tooling files must also flow from the template.
- Environment values remain deployment-owned, but the variable-name contract
  documented in `.env.example` is shared and must stay synchronized.
- Verify the template first, then run the same checks in every affected
  downstream Studio.
- Run `pnpm check:downstream-sync` from the template after syncing. Pass explicit
  downstream paths after `--` when the repositories are not standard siblings.
