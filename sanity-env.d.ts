interface ImportMetaEnv {
  readonly SANITY_STUDIO_PLATFORM_FEE_PCT?: string;
  readonly SANITY_STUDIO_STRIPE_FEE_PCT?: string;
  readonly SANITY_STUDIO_STRIPE_FEE_FIXED_CENTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
