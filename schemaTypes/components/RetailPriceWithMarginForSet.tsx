/**
 * Custom field component for `retailPrice` on a Shop V2 print set variant.
 *
 * Sibling to `RetailPriceWithMargin` for `lumaProductV2`, but tailored to
 * print sets where ONE retail price represents the entire bundle of N
 * printable images. The wholesale cost shown is `per-print cost × image
 * count`, and the take-home calculation reflects the full bundle.
 *
 * Reads from two places via `useFormValue`:
 *   - The parent variant object (`paper`, `size`) — same path-slice trick
 *     as `RetailPriceWithMargin`
 *   - The root document's `images` array — gets length to multiply wholesale
 *
 * Reuses `computeFeeBreakdown` from `RetailPriceWithMargin` so Stripe + platform
 * fee math stays in one place.
 *
 * Wired up via `components: { field: RetailPriceWithMarginForSet }` in the
 * `lumaPrintSetV2` schema.
 */

import { buildMarginSummary } from "@jessepomeroy/print-catalog/pricing";
import { Stack, Text } from "@sanity/ui";
import type { FieldProps } from "sanity";
import { useFormValue } from "sanity";
import { getWholesaleCost } from "../shared/printCatalog";
import { FEE_CONFIG, type VariantContext } from "./RetailPriceWithMargin";

export function RetailPriceWithMarginForSet(props: FieldProps) {
  // Read the parent variant (one path segment up from the retailPrice field).
  const parentPath = props.path.slice(0, -1);
  const variant = useFormValue(parentPath) as VariantContext | undefined;

  // Read the document-level images array to know how many prints are in the set.
  const images = useFormValue(["images"]) as Array<unknown> | undefined;
  const imageCount = Array.isArray(images) ? images.length : 0;

  const perPrintCost =
    variant?.paper && variant?.size ? getWholesaleCost(variant.paper, variant.size) : null;
  const totalWholesale = perPrintCost !== null ? perPrintCost * imageCount : null;

  const retailRaw = (props as { value?: unknown }).value;
  const retail = typeof retailRaw === "number" ? retailRaw : 0;

  let summary: string;
  if (!variant?.paper || !variant?.size) {
    summary = "Pick a paper and size to see wholesale cost.";
  } else if (perPrintCost === null) {
    summary = "Wholesale cost not yet in catalog for this paper × size.";
  } else if (imageCount === 0) {
    summary = `Per-print wholesale: $${perPrintCost.toFixed(2)} · add images above to see set cost.`;
  } else if (totalWholesale === null) {
    // Defensive — should never hit since perPrintCost !== null implies totalWholesale !== null
    summary = "Wholesale cost unavailable.";
  } else {
    summary = buildMarginSummary({
      retail,
      wholesale: totalWholesale,
      feeConfig: FEE_CONFIG,
      wholesaleLabel: `Wholesale: $${totalWholesale.toFixed(2)} ($${perPrintCost.toFixed(2)} × ${imageCount} prints)`,
      lossLabel: "for set",
    });
  }

  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Text size={1} muted>
        {summary}
      </Text>
    </Stack>
  );
}
