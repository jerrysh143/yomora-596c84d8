import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, Search, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatINR, isProductNew, productImage, type Audience } from "@/lib/products";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import { useWishlist, wishlist } from "@/lib/wishlist";

export function AudienceCollection({
  audience,
  title,
  intro,
}: {
  audience: Audience;
  title: string;
  intro: string;
}) {
  const { data: PRODUCTS } = useSuspenseQuery(productsQuery());
  const { data: CATEGORIES } = useSuspenseQuery(categoriesQuery());
  const { items: wishItems } = useWishlist();
  const wishSet = new Set(wishItems.map((w) => w.id));
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");

  const scoped = useMemo(
    () => PRODUCTS.filter((p) => p.audience === audience || p.audience === "unisex"),
    [PRODUCTS, audience],
  );
  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return scoped.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!term) return true;
      return [p.name, p.tagline, p.description, p.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [scoped, cat, q]);
  const cats = CATEGORIES.filter((c) => scoped.some((p) => p.category === c.slug));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] py-12 md:py-14">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">THE COLLECTION</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm text-cream/70">{intro}</p>
        </div>
      </section>

      <section className="container-x mx-auto max-w-[1400px] py-10">
        <h2 className="sr-only">Product listing</h2>
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={`Search ${title}`}
            placeholder="Search this collection…"
            className="w-full border border-border bg-background py-3 pl-11 pr-11 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-gold"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-gold"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border pb-6">
            {[{ slug: "all", label: "All" }, ...cats].map((c) => (
              <button
                key={c.slug}
                onClick={() => setCat(c.slug)}
                className={`border px-4 py-2 text-[11px] font-semibold tracking-[0.2em] transition-colors ${
                  cat === c.slug
                    ? "border-gold bg-gold text-onyx"
                    : "border-border text-foreground hover:border-gold hover:text-gold"
                }`}
              >
                {c.label.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl text-foreground">
              {q.trim() ? `No results for “${q.trim()}”` : "Nothing here yet"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {q.trim() ? "Try a different name, style or category." : "New pieces are added every week."}
            </p>
            <Link to="/products" className="mt-6 inline-block bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.28em] text-onyx hover:bg-gold/90">
              SHOP ALL
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {items.map((p) => (
              <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group block">
                <div className="relative overflow-hidden bg-secondary/40">
                  <img
                    src={productImage(p)}
                    width={900}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    alt={`${p.name} — 925 sterling silver ${p.category}`}
                    className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {isProductNew(p) && (
                    <span className="absolute left-3 top-3 bg-gold px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-onyx">NEW</span>
                  )}
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
                <h3 className="mt-3 text-sm text-foreground">{p.name}</h3>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatINR(p.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
