/**
 * Site Settings Schema (Singleton)
 *
 * Global configuration for the site — artist name, title, social links, SEO defaults.
 * Only one document of this type should exist.
 *
 * Used on: layout, meta tags, footer
 */

import { CogIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { seoFields } from "./shared/seoFields";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: CogIcon,

  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],

  fields: [
    defineField({
      name: "artistName",
      title: "Artist Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "siteTitle",
      title: "Site Title",
      type: "string",
      description: "Shown in browser tab and search results",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      description: "Short description shown in search results",
    }),

    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
    }),

    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "platform",
              title: "Platform",
              type: "string",
              options: {
                list: [
                  { title: "Instagram", value: "instagram" },
                  { title: "Twitter / X", value: "twitter" },
                  { title: "Facebook", value: "facebook" },
                  { title: "TikTok", value: "tiktok" },
                  { title: "YouTube", value: "youtube" },
                  { title: "LinkedIn", value: "linkedin" },
                  { title: "Threads", value: "threads" },
                ],
              },
              validation: (rule: any) => rule.required(),
            },
            {
              name: "url",
              title: "URL",
              type: "url",
              validation: (rule: any) => rule.required(),
            },
          ],
          preview: {
            select: { platform: "platform", url: "url" },
            prepare({ platform, url }: { platform?: string; url?: string }) {
              return {
                title: platform ?? "Link",
                subtitle: url,
              };
            },
          },
        },
      ],
    }),

    {
      ...seoFields[0],
      title: "Default SEO",
      description: "Fallback meta tags when pages don't set their own",
      fields: [
        ...seoFields[0].fields,
        defineField({
          name: "keywords",
          title: "Keywords",
          type: "array",
          of: [{ type: "string" }],
          options: { layout: "tags" },
        }),
      ],
    },
  ],

  preview: {
    select: { title: "siteTitle" },
    prepare({ title }) {
      return { title: title ?? "Site Settings" };
    },
  },
});
