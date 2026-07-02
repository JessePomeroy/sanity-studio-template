/**
 * Per-client studio configuration.
 *
 * This is the ONE file to edit when cloning this repo for a new photographer
 * client. Everything photographer-specific lives here so the schemas, desk
 * structure, custom components, and customization stack stay shared across
 * every client studio.
 *
 * For new client setup, see README.md → "Cloning for a new client".
 */

export const clientConfig = {
  // ─── Sanity project ─────────────────────────────────────────────
  /** Sanity project ID — find in https://sanity.io/manage */
  projectId: "YOUR_SANITY_PROJECT_ID",
  /** Dataset name — usually "production" */
  dataset: "production",

  // ─── Studio branding ────────────────────────────────────────────
  /** Title shown in the studio's top-left and browser tab */
  studioTitle: "Studio",
  /** Heading shown on the dashboard home pane */
  dashboardHeading: "Studio",
  /** Subtitle shown under the dashboard heading */
  dashboardSubtitle: "Welcome back. Here's your overview.",

  // ─── Studio deployment ──────────────────────────────────────────
  /**
   * App ID for the deployed studio. Pinning this here makes
   * `sanity deploy` non-interactive (important for CI / agent sessions).
   * For a brand-new client studio, leave this empty on the first deploy
   * and Sanity will prompt you to pick or create one — then paste it here.
   */
  appId: "",

  // ─── Live photographer site ─────────────────────────────────────
  /** Public photographer site URL (used in dashboard quick-actions) */
  liveSiteUrl: "https://example.com",
  /** Admin dashboard URL (used in dashboard quick-actions) */
  adminDashboardUrl: "https://example.com/admin",

  // ─── Optional content modules ───────────────────────────────────
  /**
   * Enable client-specific content pages without forking the shared schema set.
   * Keep defaults off for the base photographer template; turn these on in
   * client studios that need the corresponding frontend routes.
   */
  enabledSchemas: {
    homepage: false,
    modelingPage: false,
  },
} as const;

export type ClientConfig = typeof clientConfig;
