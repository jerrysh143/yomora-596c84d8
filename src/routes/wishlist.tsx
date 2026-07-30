import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, Gem, Gift, Minus, Plus, X, Eye } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useWishlist, wishlist, type WishlistItem } from "@/lib/wishlist";
import { cart } from "@/lib/cart";
import { formatINR } from "@/lib/products";
import { toast } from "sonner";

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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">SAVED FOR LATER</p>
              <h1 className="mt-3 font-display text-5xl">Your Wishlist</h1>
              <p className="mt-3 max-w-xl text-sm text-cream/70">
                {count === 0
                  ? "Nothing saved yet. Tap the heart on any piece to add it here."
                  : `${count} piece${count > 1 ? "s" : ""} saved.`}
              </p>
            </div>
            {count > 0 && (
              <button
                onClick={() => {
                  if (confirm("Remove all items from your wishlist?")) {
                    wishlist.clear();
                    toast.success("Wishlist cleared");
                  }
                }}
                className="inline-flex items-center gap-2 border border-cream/30 px-4 py-2.5 text-[11px] font-semibold tracking-[0.24em] text-cream/80 hover:border-gold hover:text-gold"
              >
                <Trash2 className="h-3.5 w-3.5" /> CLEAR ALL
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="container-x mx-auto max-w-[1400px] py-12">
        {items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {items.map((p) => (
              <WishlistCard key={p.id} item={p} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const [qty, setQty] = useState(1);

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(99, q + 1));

  const addToCart = () => {
    cart.add({ id: item.id, name: item.name, price: item.price, image: item.image, qty });
    toast.success(`Added ${qty} × ${item.name} to cart`);
  };

  const moveToCart = () => {
    cart.add({ id: item.id, name: item.name, price: item.price, image: item.image, qty });
    wishlist.remove(item.id);
    toast.success(`Moved ${item.name} to cart`);
  };

  return (
    <div className="group flex flex-col">
      <div className="relative overflow-hidden bg-secondary/40">
        <Link to="/products/$id" params={{ id: item.id }} className="block">
          <img
            src={item.image}
            width={900}
            height={900}
            loading="lazy"
            decoding="async"
            alt={item.name}
            className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        <button
          onClick={() => {
            wishlist.remove(item.id);
            toast.success("Removed from wishlist");
          }}
          aria-label="Remove from wishlist"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-onyx shadow-sm hover:bg-gold"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <Link
          to="/products/$id"
          params={{ id: item.id }}
          className="font-display text-lg text-foreground transition-colors hover:text-gold"
        >
          {item.name}
        </Link>
        <p className="mt-1 text-sm font-semibold text-foreground">{formatINR(item.price)}</p>
        <Link
          to="/products/$id"
          params={{ id: item.id }}
          className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-gold hover:text-onyx"
        >
          <Eye className="h-3 w-3" /> VIEW DETAILS
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-center border border-border">
            <button
              onClick={dec}
              aria-label="Decrease quantity"
              className="grid h-9 w-9 place-items-center text-foreground hover:bg-secondary disabled:opacity-40"
              disabled={qty <= 1}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span
              aria-live="polite"
              className="min-w-8 text-center text-sm font-semibold tabular-nums"
            >
              {qty}
            </span>
            <button
              onClick={inc}
              aria-label="Increase quantity"
              className="grid h-9 w-9 place-items-center text-foreground hover:bg-secondary disabled:opacity-40"
              disabled={qty >= 99}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Total <span className="font-semibold text-foreground">{formatINR(item.price * qty)}</span>
          </p>
        </div>

        <div className="mt-3 grid gap-2">
          <button
            onClick={addToCart}
            className="inline-flex items-center justify-center gap-2 bg-onyx px-4 py-2.5 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-onyx/90"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> ADD TO CART
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={moveToCart}
              className="inline-flex items-center justify-center gap-2 border border-onyx px-3 py-2 text-[10px] font-semibold tracking-[0.22em] text-onyx hover:bg-onyx hover:text-cream"
            >
              <ArrowRight className="h-3.5 w-3.5" /> MOVE
            </button>
            <button
              onClick={() => {
                wishlist.remove(item.id);
                toast.success("Removed from wishlist");
              }}
              className="inline-flex items-center justify-center gap-2 border border-border px-3 py-2 text-[10px] font-semibold tracking-[0.22em] text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> REMOVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyWishlist() {
  const shortcuts: { to: string; label: string; icon: typeof Gem }[] = [
    { to: "/products", label: "Shop all jewellery", icon: Gem },
    { to: "/custom-jewellery", label: "Design a custom piece", icon: Sparkles },
    { to: "/membership", label: "Join YOMORA Privilege", icon: Gift },
  ];

  return (
    <div className="mx-auto max-w-3xl py-10 sm:py-16">
      <div className="relative overflow-hidden border border-gold/30 bg-gradient-to-b from-secondary/40 to-background px-6 py-14 text-center sm:px-14 sm:py-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full border border-gold/40 bg-background shadow-[0_0_40px_-10px_hsl(var(--gold)/0.6)]">
          <Heart className="h-9 w-9 text-gold" />
        </div>

        <p className="relative mt-8 text-[11px] font-semibold tracking-[0.28em] text-gold">
          A COLLECTION OF ONE
        </p>
        <h2 className="relative mt-3 font-display text-3xl sm:text-4xl text-foreground">
          Your wishlist is waiting to shine
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Tap the heart on any piece you love and we'll keep it safe here — ready when you are.
        </p>

        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/products"
            className="inline-flex items-center gap-3 bg-gold px-7 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-onyx transition-colors hover:bg-gold-soft"
          >
            EXPLORE COLLECTION <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-3 text-[11px] font-semibold tracking-[0.24em] text-foreground/80 hover:text-gold"
          >
            BACK TO HOME
          </Link>
        </div>

        <div className="relative mt-12 grid gap-3 sm:grid-cols-3">
          {shortcuts.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 border border-border/60 bg-background/60 px-4 py-3 text-left transition-colors hover:border-gold/60 hover:bg-secondary/40"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-gold group-hover:bg-gold group-hover:text-onyx">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium tracking-wide text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
