import { defineField, defineType } from "sanity";
import { seoFields } from "./shared/seoFields";

export const about = defineType({
  name: "about",
  title: "About",
  type: "document",

  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],

  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "title",
      title: "Title/Role",
      type: "string",
      description: 'e.g., "Photographer" or "Multidisciplinary Artist"',
    }),

    defineField({
      name: "portrait",
      title: "Portrait",
      type: "image",
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: "shortBio",
      title: "Short Bio",
      type: "text",
      rows: 3,
      description: "Brief intro, 2-3 sentences",
    }),

    defineField({
      name: "fullBio",
      title: "Full Bio",
      type: "array",
      of: [{ type: "block" }],
      description: "Longer bio with formatting (optional)",
    }),

    defineField({
      name: "social",
      title: "Social Links",
      type: "object",
      fields: [
        {
          name: "instagram",
          title: "Instagram URL",
          type: "url",
        },
        {
          name: "twitter",
          title: "Twitter URL",
          type: "url",
        },
        {
          name: "email",
          title: "Email",
          type: "string",
          description: "Contact email address",
        },
      ],
    }),

    ...seoFields,
  ],

  preview: {
    select: {
      title: "name",
      media: "portrait",
    },
  },
});
