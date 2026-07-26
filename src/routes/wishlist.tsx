import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useWishlist, wishlist } from "@/lib/wishlist";
import { cart } from "@/lib/cart";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — YOMORA" },
      { name: "description", content: "Your saved 925 sterling silver pieces at YOMORA." },
      { property: "og:title", content: "Wishlist — YOMORA" },
      { property: "og:description", content: "Your saved 925 sterling silver pieces at YOMORA." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { items, count } = useWishlist();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] py-14">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">SAVED FOR LATER</p>
          <h1 className="mt-3 font-display text-5xl">Your Wishlist</h1>
          <p className="mt-3 max-w-xl text-sm text-cream/70">
            {count === 0
              ? "Nothing saved yet. Tap the heart on any piece to add it here."
              : `${count} piece${count > 1 ? "s" : ""} saved.`}
          </p>
        </div>
      </section>

      <section className="container-x mx-auto max-w-[1400px] py-12">
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <Heart className="mx-auto h-12 w-12 text-gold" />
            <p className="mt-6 text-sm text-muted-foreground">Your wishlist is empty.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-3 bg-gold px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft"
            >
              EXPLORE COLLECTION <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <div key={p.id} className="group block">
                <Link to="/products/$id" params={{ id: p.id }} className="relative block overflow-hidden bg-secondary/40">
                  <img
                    src={p.image}
                    width={900}
                    height={900}
                    loading="lazy"
                    alt={p.name}
                    className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      wishlist.remove(p.id);
                    }}
                    aria-label="Remove from wishlist"
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-onyx hover:bg-gold"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Link>
                <div className="pt-4">
                  <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-foreground">{formatINR(p.price)}</p>
                  <button
                    onClick={() =>
                      cart.add({ id: p.id, name: p.name, price: p.price, image: p.image })
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-onyx px-4 py-2.5 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-onyx hover:text-cream"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}