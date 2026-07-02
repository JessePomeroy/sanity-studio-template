import { HomeIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";
import { seoFields } from "./shared/seoFields";

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  icon: HomeIcon,

  groups: [
    { name: "content", title: "Content", default: true },
    { name: "navigation", title: "Navigation" },
    { name: "seo", title: "SEO" },
  ],

  fields: [
    defineField({
      name: "practiceLine",
      title: "Main Statement",
      type: "text",
      rows: 3,
      group: "content",
      description: "Large text shown beneath the homepage navigation links.",
      initialValue: "Exploring light, place, and story through photography.",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "quote",
      title: "Quote",
      type: "object",
      group: "content",
      fields: [
        defineField({
          name: "text",
          title: "Quote Text",
          type: "text",
          rows: 5,
        }),
        defineField({
          name: "attribution",
          title: "Attribution",
          type: "string",
          description: 'Example: "Thomas Merton"',
        }),
      ],
    }),

    defineField({
      name: "navLinks",
      title: "Homepage CTA Links",
      type: "array",
      group: "navigation",
      description:
        "Links shown on the homepage splash. Use site-relative paths like /about or /gallery.",
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
              name: "href",
              title: "URL",
              type: "string",
              description: "Use /about, /gallery, /shop, or a full external URL.",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "href" },
          },
        }),
      ],
      initialValue: [
        { label: "about", href: "/about" },
        { label: "photography", href: "/gallery" },
        { label: "booking", href: "/about#book" },
        { label: "shop prints", href: "/shop" },
      ],
      validation: (rule) => rule.required().min(1),
    }),

    ...seoFields,
  ],

  preview: {
    prepare() {
      return { title: "Homepage" };
    },
  },
});
