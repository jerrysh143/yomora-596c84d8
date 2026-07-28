import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatINR, productImage, isProductNew, type Category } from "@/lib/products";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import { useWishlist, wishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Shop All — YOMORA 925 Sterling Silver Jewellery" },
      { name: "description", content: "Browse rings, earrings, neckwear and bracelets in 925 hallmarked sterling silver." },
      { property: "og:title", content: "Shop All — YOMORA" },
      { property: "og:description", content: "925 hallmarked sterling silver jewellery for every occasion." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
  },
  component: ProductsPage,
});

type Filter = Category | "all";

function ProductsPage() {
  const { data: PRODUCTS } = useSuspenseQuery(productsQuery());
  const { data: CATEGORIES } = useSuspenseQuery(categoriesQuery());
  const { items: wishItems } = useWishlist();
  const wishSet = new Set(wishItems.map((w) => w.id));
  const [filter, setFilter] = useState<Filter>("all");
  const [onlyNew, setOnlyNew] = useState(false);

  // Sync from URL hash (set by header links: #rings, #new, etc.)
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "new") { setOnlyNew(true); setFilter("all"); }
      else if (CATEGORIES.some((c) => c.slug === h)) { setFilter(h as Category); setOnlyNew(false); }
      else { setFilter("all"); setOnlyNew(false); }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [CATEGORIES]);

  const items = useMemo(() => {
    let list = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
    if (onlyNew) list = list.filter((p) => isProductNew(p));
    return list;
  }, [filter, onlyNew, PRODUCTS]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    ...CATEGORIES.map((c) => ({ key: c.slug as Filter, label: c.label })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] py-14">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">THE COLLECTION</p>
          <h1 className="mt-3 font-display text-5xl">Shop All Jewellery</h1>
          <p className="mt-3 max-w-xl text-sm text-cream/70">Hand-finished 925 sterling silver, hallmarked and made to be worn every day.</p>
        </div>
      </section>

      <section className="container-x mx-auto max-w-[1400px] py-10">
        <h2 className="sr-only">Product listing</h2>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`border px-4 py-2 text-[11px] font-semibold tracking-[0.2em] transition-colors ${
                  filter === f.key
                    ? "border-gold bg-gold text-onyx"
                    : "border-border text-foreground hover:border-gold hover:text-gold"
                }`}
              >
                {f.label.toUpperCase()}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} className="accent-[color:var(--gold)]" />
            New arrivals only
          </label>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group block">
              <div className="relative overflow-hidden bg-secondary/40">
              <img src={productImage(p)} width={900} height={900} loading="lazy" alt={`${p.name} — 925 sterling silver ${p.category}`} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {isProductNew(p) && <span className="absolute left-3 top-3 bg-gold px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-onyx">NEW</span>}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    wishlist.toggle({ id: p.id, name: p.name, price: p.price, image: productImage(p), category: p.category });
                  }}
                  aria-label={wishSet.has(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-onyx hover:bg-gold"
                >
                  <Heart className={`h-4 w-4 ${wishSet.has(p.id) ? "fill-current text-gold" : ""}`} />
                </button>
              </div>
              <div className="pt-4">
                <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{formatINR(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>

        {items.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">No pieces in this category yet.</p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}