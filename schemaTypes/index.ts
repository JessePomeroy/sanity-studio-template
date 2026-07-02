/**
 * Schema Types Index
 *
 * Exports all schema types for registration in sanity.config.ts
 *
 * To add a new content type:
 * 1. Create the schema file (e.g., myType.ts)
 * 2. Import it here
 * 3. Add it to the schemaTypes array
 * 4. Run `npx sanity deploy` to update the hosted Studio
 */

import { clientConfig } from "../client.config";
import { about } from "./about";
import author from "./author";
// Default blog schemas (from template)
import blockContent from "./blockContent";
import category from "./category";
import { contactPage } from "./contactPage";
import { coupon } from "./coupon";
// Custom schemas for the photographer studio
import { gallery } from "./gallery";
import { homepage } from "./homepage";
import { lumaPrintSetV2 } from "./lumaPrintSetV2";
import { lumaProductV2 } from "./lumaProductV2";
import { modelingPage } from "./modelingPage";
import post from "./post";
import { printCollection } from "./printCollection";
import { product } from "./product";
import { siteSettings } from "./siteSettings";

const optionalSchemaTypes = [
  clientConfig.enabledSchemas.homepage ? homepage : null,
  clientConfig.enabledSchemas.modelingPage ? modelingPage : null,
].filter((schemaType) => schemaType !== null);

export const schemaTypes = [
  // === Custom Content Types ===
  ...optionalSchemaTypes,
  gallery, // Photo galleries with ordering
  printCollection, // Print collections for shop
  coupon, // Discount codes
  product, // Shop products (postcards, tapestries, digital, merchandise — prints use lumaProductV2)
  lumaProductV2, // Shop V2 print products with paper × size variant matrix and inline cost/margin
  lumaPrintSetV2, // Shop V2 print sets — N images per bundle, per-set retail prices, image-count-aware margin
  about, // About page content

  // === Singletons ===
  siteSettings, // Global site configuration
  contactPage, // Contact & booking page

  // === Blog Content Types ===
  // Ready for future blog implementation
  post, // Blog posts
  author, // Post authors
  category, // Post categories
  blockContent, // Rich text blocks for posts
];
