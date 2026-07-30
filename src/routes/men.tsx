import { createFileRoute } from "@tanstack/react-router";
import { AudienceCollection } from "@/components/audience-collection";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import { CollectionPageSkeleton } from "@/components/product-grid-skeleton";

export const Route = createFileRoute("/men")({
  head: () => ({
    meta: [
      { title: "Men's 925 Silver Jewellery — YOMORA" },
      { name: "description", content: "Bold hallmarked 925 sterling silver rings, chains and bracelets crafted for men." },
      { property: "og:title", content: "Men's Collection — YOMORA" },
      { property: "og:description", content: "Hallmarked 925 sterling silver jewellery crafted for men." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
  },
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: CollectionPageSkeleton,
  component: () => (
    <AudienceCollection
      audience="men"
      title="Jewellery for Men"
      intro="Bold, hand-finished 925 sterling silver — hallmarked and built for everyday wear."
    />
  ),
});