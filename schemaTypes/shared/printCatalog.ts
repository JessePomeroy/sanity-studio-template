/**
 * Studio-facing compatibility facade for the shared print catalog package.
 *
 * Schema files keep importing from `schemaTypes/shared/printCatalog`, while
 * the paper, size, frame, canvas, dropdown, and wholesale data now come from
 * `@jessepomeroy/print-catalog`.
 */
export * from "@jessepomeroy/print-catalog";
