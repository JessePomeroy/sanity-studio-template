/**
 * LumaPrints Product (Shop V2)
 *
 * Replacement for the legacy `product` schema. Each `lumaProductV2` doc is
 * one photo sold across multiple paper × size variants. Each variant has
 * its own retail price + enabled toggle, and Sanity Studio shows wholesale
 * cost + computed margin inline next to the retail price input via the
 * `RetailPriceWithMargin` custom field component.
 *
 * Currently scoped to Fine Art Paper variants. Canvas, framed FAP, and
 * bordered prints (Sharp-composited) will be added in follow-up audit #23
 * PRs as additional variant types or sibling product schemas.
 *
 * The legacy `product` schema still handles non-print products (postcards,
 * tapestries, digital, merchandise). Print products are fully on V2.
 *
 * TODO (follow-up PR): replace the manual variants array with a matrix UI
 * (rows = papers, columns = sizes) that auto-populates all 48 combinations
 * and lets the photographer toggle/edit prices in a single grid view.
 */

import { defineArrayMember, defineField, defineType } from "sanity";
import { RetailPriceWithMargin } from "./components/RetailPriceWithMargin";
import { canvasSizeValidation } from "./shared/canvasValidation";
import {
  getPaperBySlug,
  getSizeBySlug,
  PAPER_DROPDOWN_OPTIONS,
  SIZE_DROPDOWN_OPTIONS,
} from "./shared/printCatalog";

export const lumaProductV2 = defineType({
  name: "lumaProductV2",
  title: "Print Product (V2)",
  type: "document",

  groups: [
    { name: "content", title: "Content", default: true },
    { name: "pricing", title: "Pricing" },
    { name: "settings", title: "Settings" },
  ],

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      description:
        "URL path for this page — auto-generated from the title. Only edit if you need a custom URL.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "image",
      title: "Photo",
      description: "The photograph that gets printed. This is the file LumaPrints prints from.",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alternative text" }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      group: "content",
      description: "Shown on the product detail page. Story behind the photo, location, etc.",
    }),

    defineField({
      name: "variants",
      title: "Variants",
      group: "pricing",
      description:
        "Each variant is one paper + size combo. Add the variants you want to sell, set retail prices, and toggle enabled. Wholesale cost and margin display next to each price field.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "lumaProductVariant",
          fields: [
            defineField({
              name: "paper",
              title: "Paper",
              type: "string",
              options: { list: PAPER_DROPDOWN_OPTIONS },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "size",
              title: "Size",
              type: "string",
              options: { list: SIZE_DROPDOWN_OPTIONS },
              validation: (rule) => rule.required().custom(canvasSizeValidation),
            }),
            defineField({
              name: "retailPrice",
              title: "Retail Price (USD)",
              type: "number",
              validation: (rule) => rule.required().positive(),
              components: { field: RetailPriceWithMargin },
            }),
            defineField({
              name: "enabled",
              title: "Enabled",
              type: "boolean",
              initialValue: true,
              description: "Uncheck to hide this variant from the shop without deleting it.",
            }),
          ],
          preview: {
            select: {
              paper: "paper",
              size: "size",
              retailPrice: "retailPrice",
              enabled: "enabled",
            },
            prepare({ paper, size, retailPrice, enabled }) {
              const paperDef = paper ? getPaperBySlug(paper) : null;
              const sizeDef = size ? getSizeBySlug(size) : null;
              const label = `${paperDef?.name ?? paper ?? "?"} ${sizeDef?.label ?? size ?? "?"}`;
              const price = typeof retailPrice === "number" ? `$${retailPrice}` : "no price";
              return {
                title: label,
                subtitle: `${price}${enabled === false ? " · disabled" : ""}`,
              };
            },
          },
        }),
      ],
    }),

    defineField({
      name: "bordersEnabled",
      title: "Offer Border Option",
      type: "boolean",
      group: "settings",
      initialValue: true,
      description:
        'When on, customers can choose a white border (0.25", 0.5", or 1") on this print.',
    }),

    defineField({
      name: "framedEnabled",
      title: "Offer Framed Option",
      type: "boolean",
      group: "settings",
      initialValue: false,
      description:
        'When on, customers can choose a frame (0.875" or 1.25" in black/white/oak). Includes a 0.25" border and 2" white mat.',
    }),

    defineField({
      name: "frameMarkupMultiplier",
      title: "Frame Markup Multiplier",
      type: "number",
      group: "settings",
      initialValue: 2,
      description: "Frame price = wholesale cost × this multiplier. Default 2× (100% markup).",
      hidden: ({ parent }) => !parent?.framedEnabled,
      validation: (rule) => rule.min(1).positive(),
    }),

    defineField({
      name: "inStock",
      title: "In Stock",
      type: "boolean",
      group: "settings",
      initialValue: true,
      description:
        "Uncheck to show 'Sold Out' on the site. Use the Mark Sold Out action for a one-click version.",
    }),

    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "settings",
      initialValue: false,
      description: "Highlight this product on the homepage or shop page?",
    }),
  ],

  preview: {
    select: {
      title: "title",
      media: "image",
      variants: "variants",
      inStock: "inStock",
    },
    prepare({ title, media, variants, inStock }) {
      const list = Array.isArray(variants) ? variants : [];
      const total = list.length;
      const enabled = list.filter((v: any) => v?.enabled !== false).length;
      const variantText =
        total === 0
          ? "No variants"
          : enabled === total
            ? `${total} variant${total === 1 ? "" : "s"}`
            : `${enabled}/${total} variants enabled`;
      const parts = [variantText];
      if (inStock === false) parts.push("sold out");
      return { title, media, subtitle: parts.join(" · ") };
    },
  },
});
