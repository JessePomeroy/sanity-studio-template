import { defineArrayMember, defineField, defineType } from "sanity";
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
      name: "heading",
      title: "Page Heading",
      type: "string",
      initialValue: "about",
      description: "Small page title shown at the top of the public about page.",
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
      name: "plainBio",
      title: "Plain Bio Paragraphs",
      type: "text",
      rows: 5,
      group: "content",
      description:
        "Optional plain-text bio used by layouts that do not render portable text. Separate paragraphs with a blank line.",
    }),

    defineField({
      name: "sections",
      title: "About Sections",
      type: "array",
      group: "content",
      description: "Structured bullet sections such as background, experience, practice, current.",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Section Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "items",
              title: "Bullet Items",
              type: "array",
              of: [{ type: "string" }],
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: {
            select: { title: "title", items: "items" },
            prepare({ title, items }: { title?: string; items?: string[] }) {
              const count = Array.isArray(items) ? items.length : 0;
              return {
                title: title ?? "Section",
                subtitle: `${count} item${count === 1 ? "" : "s"}`,
              };
            },
          },
        }),
      ],
    }),

    defineField({
      name: "highlights",
      title: "Highlights",
      type: "array",
      group: "content",
      description: "Short label/value facts shown below the about sections.",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "value" },
          },
        }),
      ],
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
