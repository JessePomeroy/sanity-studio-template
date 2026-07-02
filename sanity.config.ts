/**
 * Sanity Studio Configuration
 *
 * This file configures the Sanity Studio:
 * - Project connection (projectId, dataset)
 * - Plugins (structure tool, vision tool)
 * - Custom desk structure (sidebar organization)
 * - Schema types
 *
 * Deploy changes with: npx sanity deploy
 */

import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import DocumentsPane from "sanity-plugin-documents-pane";
import { media } from "sanity-plugin-media";
import { clientConfig } from "./client.config";
import { schemaTypes } from "./schemaTypes";
import { MarkBackInStockAction } from "./schemaTypes/actions/MarkBackInStockAction";
import { MarkSoldOutAction } from "./schemaTypes/actions/MarkSoldOutAction";
import { PRODUCT_CATEGORIES } from "./schemaTypes/shared/categoryOptions";
import { DashboardHome } from "./src/components/DashboardHome";
import { EmptyState } from "./src/components/EmptyState";

// Singleton document IDs — ensures only one of each exists
const SINGLETON_TYPES = new Set(["siteSettings", "about", "contactPage"]);
const SINGLETON_ACTIONS = new Set(["publish", "discardChanges", "restore"]);

// Document types that get stock-toggle actions (Mark sold out / Mark back in stock)
const STOCK_ACTION_TYPES = new Set(["lumaProductV2", "lumaPrintSetV2"]);

// Document types that get a "Used in" back-reference tab showing every
// document that references the current one. Uses sanity-plugin-documents-pane.
const TYPES_WITH_BACK_REFS = new Set([
  "gallery",
  "lumaProductV2",
  "lumaPrintSetV2",
  "printCollection",
]);

export default defineConfig({
  name: "default",
  title: clientConfig.studioTitle,
  projectId: clientConfig.projectId,
  dataset: clientConfig.dataset,

  plugins: [
    structureTool({
      structure: (S, context) => {
        const client = context.getClient({ apiVersion: "2024-01-01" });

        // Helper: returns the empty state component or the standard list,
        // depending on whether documents of the given type exist.
        const listWithEmptyState = (
          type: string,
          title: string,
          emptyTitle: string,
          emptyDescription: string,
        ) =>
          S.listItem()
            .title(title)
            .schemaType(type)
            .child(async () => {
              const count = await client.fetch(`count(*[_type == $type])`, { type });
              if (count === 0) {
                return S.component(EmptyState)
                  .title(title)
                  .options({ title: emptyTitle, description: emptyDescription, type });
              }
              return S.documentTypeList(type)
                .title(title)
                .defaultOrdering([{ field: "_createdAt", direction: "desc" }]);
            });

        return S.list()
          .title(clientConfig.studioTitle)
          .items([
            // ═══════════════════════════════════════
            // Dashboard
            // ═══════════════════════════════════════
            S.listItem().title("Dashboard").child(S.component(DashboardHome).title("Dashboard")),

            // ═══════════════════════════════════════
            // Needs Attention — content health checks
            // (Operational triage like unanswered inquiries / unfulfilled
            // orders lives in the admin dashboard, not here. Sanity owns
            // content health; admin owns operational triage.)
            // ═══════════════════════════════════════
            S.listItem()
              .title("⚠️ Needs Attention")
              .child(
                S.list()
                  .title("Needs Attention")
                  .items([
                    S.listItem()
                      .title("Drafts older than 7 days")
                      .child(
                        S.documentList()
                          .title("Stale drafts")
                          .filter('_id in path("drafts.**") && _updatedAt < $weekAgo')
                          .params({
                            weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                          })
                          .defaultOrdering([{ field: "_updatedAt", direction: "asc" }]),
                      ),
                    S.listItem()
                      .title("Products without pricing")
                      .child(
                        S.documentList()
                          .title("Missing pricing")
                          .schemaType("product")
                          .filter('_type == "product" && !defined(price)')
                          .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
                      ),
                    S.listItem()
                      .title("Galleries without images")
                      .child(
                        S.documentList()
                          .title("Empty galleries")
                          .schemaType("gallery")
                          .filter('_type == "gallery" && (!defined(images) || count(images) == 0)')
                          .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
                      ),
                    S.listItem()
                      .title("Print products without variants")
                      .child(
                        S.documentList()
                          .title("Missing variants")
                          .schemaType("lumaProductV2")
                          .filter(
                            '_type == "lumaProductV2" && (!defined(variants) || count(variants) == 0)',
                          )
                          .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
                      ),
                  ]),
              ),

            S.divider(),

            // ═══════════════════════════════════════
            // Content
            // ═══════════════════════════════════════
            orderableDocumentListDeskItem({
              type: "gallery",
              title: "Galleries",
              S,
              context,
            }),

            // About — singleton (opens directly to the document)
            S.listItem()
              .title("About")
              .schemaType("about")
              .child(
                S.documentTypeList("about")
                  .title("About")
                  .defaultOrdering([{ field: "_createdAt", direction: "desc" }]),
              ),

            // Contact & Booking — singleton
            S.listItem()
              .title("Contact & Booking")
              .schemaType("contactPage")
              .child(
                S.documentTypeList("contactPage")
                  .title("Contact & Booking")
                  .defaultOrdering([{ field: "_createdAt", direction: "desc" }]),
              ),

            S.divider(),

            // ═══════════════════════════════════════
            // Shop
            // ═══════════════════════════════════════
            S.listItem()
              .title("Products")
              .child(
                S.list()
                  .title("Products")
                  .items([
                    S.listItem()
                      .title("Prints")
                      .schemaType("lumaProductV2")
                      .child(
                        S.documentTypeList("lumaProductV2")
                          .title("Prints")
                          .defaultOrdering([{ field: "_createdAt", direction: "desc" }]),
                      ),
                    S.listItem()
                      .title("Print Sets")
                      .schemaType("lumaPrintSetV2")
                      .child(
                        S.documentTypeList("lumaPrintSetV2")
                          .title("Print Sets")
                          .defaultOrdering([{ field: "_createdAt", direction: "desc" }]),
                      ),
                    orderableDocumentListDeskItem({
                      type: "printCollection",
                      title: "Print Collections",
                      S,
                      context,
                    }),
                    S.divider(),
                    ...PRODUCT_CATEGORIES.filter((c) => c.value !== "prints").map((c) =>
                      S.listItem()
                        .title(c.title)
                        .child(
                          S.documentList()
                            .title(c.title)
                            .schemaType("product")
                            .filter('_type == "product" && category == $category')
                            .params({ category: c.value })
                            .defaultOrdering([{ field: "orderRank", direction: "asc" }]),
                        ),
                    ),
                    S.divider(),
                    S.listItem()
                      .title("Coupons")
                      .schemaType("coupon")
                      .child(S.documentTypeList("coupon").title("Coupons")),
                  ]),
              ),

            S.divider(),

            // ═══════════════════════════════════════
            // Blog
            // ═══════════════════════════════════════
            listWithEmptyState(
              "post",
              "Posts",
              "No blog posts yet",
              "Blog posts help you share stories, behind-the-scenes content, and connect with your audience. Write your first post to get started.",
            ),
            S.listItem().title("Authors").schemaType("author").child(S.documentTypeList("author")),
            S.listItem()
              .title("Categories")
              .schemaType("category")
              .child(S.documentTypeList("category")),

            S.divider(),

            // ═══════════════════════════════════════
            // Settings
            // ═══════════════════════════════════════
            S.listItem()
              .title("Site Settings")
              .schemaType("siteSettings")
              .child(
                S.documentTypeList("siteSettings")
                  .title("Site Settings")
                  .defaultOrdering([{ field: "_createdAt", direction: "desc" }]),
              ),
          ]);
      },
      defaultDocumentNode: (S, { schemaType }) => {
        if (TYPES_WITH_BACK_REFS.has(schemaType)) {
          return S.document().views([
            S.view.form(),
            S.view
              .component(DocumentsPane)
              .options({
                query: "*[references($id)]",
                params: { id: "_id" },
                options: { perspective: "previewDrafts" },
              })
              .title("Used in"),
          ]);
        }
        return S.document().views([S.view.form()]);
      },
    }),

    presentationTool({
      previewUrl: {
        draftMode: {
          enable: "/api/draft/enable",
        },
      },
    }),

    visionTool(),
    media(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (input, context) => {
      // Singletons: limit to publish/discard/restore
      if (SINGLETON_TYPES.has(context.schemaType)) {
        return input.filter((action) => SINGLETON_ACTIONS.has(action.action ?? ""));
      }
      // V2 print products + print sets: add stock toggle actions
      if (STOCK_ACTION_TYPES.has(context.schemaType)) {
        return [...input, MarkSoldOutAction, MarkBackInStockAction];
      }
      return input;
    },
  },
});
