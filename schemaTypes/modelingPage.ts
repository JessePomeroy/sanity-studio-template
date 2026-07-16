import { ImagesIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";
import { seoFields } from "./shared/seoFields";

export const modelingPage = defineType({
  name: "modelingPage",
  title: "Modeling & Acting",
  type: "document",
  icon: ImagesIcon,

  groups: [
    { name: "content", title: "Content", default: true },
    { name: "galleries", title: "Galleries" },
    { name: "seo", title: "SEO" },
  ],

  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      group: "content",
      initialValue: "digital headshots",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 3,
      group: "content",
      description: "Optional short text shown near the gallery title.",
    }),

    defineField({
      name: "galleries",
      title: "Modeling Galleries",
      type: "array",
      group: "galleries",
      description:
        "Add one gallery per modeling/acting category. The first visible gallery is used as the initial page view.",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Gallery Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "slug",
              title: "Slug",
              type: "slug",
              description: "Used for deep links later. Generate from the gallery title.",
              options: { source: "title", maxLength: 96 },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 2,
            }),
            defineField({
              name: "images",
              title: "Images",
              type: "array",
              description:
                "Add 1–10 headshots. The site frontend responsively composes the ordered set.",
              of: [
                {
                  type: "image",
                  options: { hotspot: true },
                  fields: [
                    defineField({
                      name: "alt",
                      title: "Alternative text",
                      type: "string",
                      description: "Describe the image for screen readers.",
                    }),
                  ],
                },
              ],
              options: { layout: "grid" },
              validation: (rule) => rule.required().min(1).max(10),
            }),
            defineField({
              name: "isVisible",
              title: "Visible on Site",
              type: "boolean",
              initialValue: true,
            }),
          ],
          preview: {
            select: {
              title: "title",
              media: "images.0.asset",
              images: "images",
              isVisible: "isVisible",
            },
            prepare({ title, media, images, isVisible }) {
              const count = Array.isArray(images) ? images.length : 0;
              const status = isVisible === false ? "Hidden" : "Visible";
              return {
                title,
                subtitle: `${count} image${count === 1 ? "" : "s"} · ${status}`,
                media,
              };
            },
          },
        }),
      ],
      initialValue: [
        { title: "Fashion Editorial", slug: { current: "fashion-editorial" }, isVisible: true },
        { title: "Comp Card Digitals", slug: { current: "comp-card-digitals" }, isVisible: true },
        { title: "Commercial", slug: { current: "commercial" }, isVisible: true },
      ],
      validation: (rule) => rule.required().min(1),
    }),

    ...seoFields,
  ],

  preview: {
    prepare() {
      return { title: "Modeling & Acting" };
    },
  },
});
