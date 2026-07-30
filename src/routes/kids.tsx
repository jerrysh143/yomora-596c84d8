import { createFileRoute } from "@tanstack/react-router";
import { AudienceCollection } from "@/components/audience-collection";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import { CollectionPageSkeleton } from "@/components/product-grid-skeleton";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "Kids' 925 Silver Jewellery — YOMORA" },
      { name: "description", content: "Skin-friendly hallmarked 925 sterling silver jewellery made for children." },
      { property: "og:title", content: "Kids' Collection — YOMORA" },
      { property: "og:description", content: "Skin-friendly hallmarked 925 sterling silver jewellery for children." },
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
      audience="kids"
      title="Jewellery for Kids"
      intro="Lightweight, skin-friendly 925 sterling silver designed for little ones."
    />
  ),
});