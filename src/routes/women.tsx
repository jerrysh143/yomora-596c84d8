import { createFileRoute } from "@tanstack/react-router";
import { AudienceCollection } from "@/components/audience-collection";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";

export const Route = createFileRoute("/women")({
  head: () => ({
    meta: [
      { title: "Women's 925 Silver Jewellery — YOMORA" },
      { name: "description", content: "Elegant hallmarked 925 sterling silver earrings, neckwear and rings for women." },
      { property: "og:title", content: "Women's Collection — YOMORA" },
      { property: "og:description", content: "Elegant hallmarked 925 sterling silver jewellery for women." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
  },
  component: () => (
    <AudienceCollection
      audience="women"
      title="Jewellery for Women"
      intro="Delicate silhouettes in hallmarked 925 sterling silver, finished by hand."
    />
  ),
});