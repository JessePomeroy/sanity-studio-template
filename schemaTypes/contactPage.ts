/**
 * Contact Page Schema (Singleton)
 *
 * Configuration for the contact page — heading, intro text, email,
 * booking settings.
 *
 * Used on: /about (contact section), /contact
 */

import { EnvelopeIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { seoFields } from "./shared/seoFields";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact & Booking",
  type: "document",
  icon: EnvelopeIcon,

  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],

  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "Get in Touch",
    }),

    defineField({
      name: "intro",
      title: "Intro Text",
      type: "array",
      of: [{ type: "block" }],
      description: "Shown above the contact form",
    }),

    defineField({
      name: "email",
      title: "Contact Email",
      type: "string",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "phone",
      title: "Phone (optional)",
      type: "string",
    }),

    defineField({
      name: "bookingEnabled",
      title: "Enable Booking",
      type: "boolean",
      initialValue: false,
      description: "Show booking types and scheduling options",
    }),

    defineField({
      name: "bookingUrl",
      title: "Booking URL",
      type: "url",
      description: "Link to Cal.com or other scheduling tool",
      hidden: ({ parent }) => !parent?.bookingEnabled,
    }),

    defineField({
      name: "bookingTypes",
      title: "Session Types",
      type: "array",
      hidden: ({ parent }) => !parent?.bookingEnabled,
      of: [
        {
          type: "object",
          fields: [
            {
              name: "name",
              title: "Session Name",
              type: "string",
              validation: (rule: any) => rule.required(),
            },
            {
              name: "duration",
              title: "Duration",
              type: "string",
              description: 'e.g., "1 hour", "2-3 hours"',
            },
            {
              name: "startingPrice",
              title: "Starting Price",
              type: "number",
            },
            {
              name: "description",
              title: "Description",
              type: "text",
              rows: 2,
            },
          ],
          preview: {
            select: { name: "name", price: "startingPrice" },
            prepare({ name, price }: { name?: string; price?: number }) {
              return {
                title: name ?? "Session",
                subtitle: price ? `From $${price}` : undefined,
              };
            },
          },
        },
      ],
    }),

    ...seoFields,
  ],

  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title ?? "Contact & Booking" };
    },
  },
});
