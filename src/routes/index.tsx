import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import {
  Heart,
  Percent,
  Headphones,
  Gift,
  Rocket,
  Cake,
  BadgeCheck,
  Gem,
  Banknote,
  ShoppingBag,
} from "lucide-react";
import legacyImg from "@/assets/legacy-showroom.jpg";
import { HomeBannerSlider } from "@/components/home-banner-slider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ReelsSection } from "@/components/reels-section";
import { formatINR, productImage, isProductNew } from "@/lib/products";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import { subscriptionPlansQuery } from "@/lib/subscription.queries";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SiteIcon } from "@/lib/site-icons";
import { useWishlist, wishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
    context.queryClient.ensureQueryData(subscriptionPlansQuery());
    context.queryClient.ensureQueryData(siteContentQuery());
  },
  component: Index,
});

function Index() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: CATEGORIES } = useSuspenseQuery(categoriesQuery());
  const { data: plans } = useSuspenseQuery(subscriptionPlansQuery());
  const activePlans = plans.filter((p) => p.is_active);
  const { data: content } = useSuspenseQuery(siteContentQuery());
  const legacy = content.legacy;
  const assurance = content.assurance_bar;
  const ctaStrip = content.cta_strip;
  // 3 products per category, in category order; categories without products are skipped
  const featured = CATEGORIES.flatMap((c) => products.filter((p) => p.category === c.slug).slice(0, 3));
  const { items: wishItems } = useWishlist();
  const wishSet = new Set(wishItems.map((w) => w.id));
  const [selectedCategory, setSelectedCategory] = useState<{
    slug: string;
    label: string;
    audiences: Array<"men" | "women">;
  } | null>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);
  const [categoryRailState, setCategoryRailState] = useState({ active: 0, pages: 1 });

  useEffect(() => {
    const rail = categoryRailRef.current;
    if (!rail) return;

    const syncRail = () => {
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      const pages = Math.max(1, Math.ceil(rail.scrollWidth / Math.max(1, rail.clientWidth)));
      const active = maxScroll > 0 ? Math.round((rail.scrollLeft / maxScroll) * (pages - 1)) : 0;
      setCategoryRailState({ active, pages });
    };

    syncRail();
    rail.addEventListener("scroll", syncRail, { passive: true });
    const observer = new ResizeObserver(syncRail);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", syncRail);
      observer.disconnect();
    };
  }, [CATEGORIES.length]);

  useEffect(() => {
    if (!selectedCategory) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCategory(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <HomeBannerSlider />

      {/* CATEGORIES */}
      <section className="overflow-hidden bg-secondary/40">
        <div className="container-x mx-auto max-w-[1600px] pb-10 pt-8 sm:pb-14 sm:pt-10">
          <div className="relative">
            <div className="mb-5 flex items-center justify-center gap-3" aria-label="Category carousel position">
              {Array.from({ length: categoryRailState.pages }).map((_, index) => (
                <span
                  key={index}
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    index === categoryRailState.active ? "w-12 bg-foreground/55" : "w-2 bg-foreground/20"
                  }`}
                />
              ))}
            </div>
            <div
              ref={categoryRailRef}
              id="category-rail"
              className="-mx-4 flex touch-pan-x snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-3 sm:mx-0 sm:gap-7 sm:px-12 lg:gap-8 lg:px-14 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
            >
              {CATEGORIES.map((c) => {
                const categoryProducts = products.filter((x) => x.category === c.slug);
                const p = categoryProducts[0];
                const img = p ? productImage(p) : "";
                const audiences: Array<"men" | "women"> = [
                  ...(categoryProducts.some((x) => x.audience === "men" || x.audience === "unisex") ? ["men" as const] : []),
                  ...(categoryProducts.some((x) => x.audience === "women" || x.audience === "unisex") ? ["women" as const] : []),
                ];
                return (
                  <button
                    type="button"
                    key={c.slug}
                    onClick={() => setSelectedCategory({ slug: c.slug, label: c.label, audiences })}
                    aria-label={`Choose who is shopping for ${c.label}`}
                    className="group w-[62%] max-w-[220px] shrink-0 snap-start text-center min-[420px]:w-[44%] sm:w-[31%] md:w-[23%] lg:w-[17%]"
                  >
                    <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-[1.75rem] border border-gold/45 bg-secondary/40 transition-all duration-500 group-hover:-translate-y-1 group-hover:border-gold group-hover:shadow-[0_20px_45px_-24px_color-mix(in_oklab,var(--color-gold)_75%,transparent)] sm:rounded-[2rem]">
                        <img
                          src={img}
                          width={600}
                          height={600}
                          loading="lazy"
                          decoding="async"
                          alt={`${c.label} — 925 sterling silver collection`}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>
                    <span className="mt-5 block text-lg font-medium tracking-[0.04em] text-foreground transition-colors group-hover:text-gold sm:text-xl">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => categoryRailRef.current?.scrollBy({ left: -categoryRailRef.current.clientWidth * 0.8, behavior: "smooth" })}
              className="absolute left-0 top-[48%] grid h-12 w-12 -translate-x-1/4 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-sm backdrop-blur transition-colors hover:border-gold hover:text-gold sm:h-14 sm:w-14 sm:-translate-x-1/3"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => categoryRailRef.current?.scrollBy({ left: categoryRailRef.current.clientWidth * 0.8, behavior: "smooth" })}
              className="absolute right-0 top-[48%] grid h-12 w-12 translate-x-1/4 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-sm backdrop-blur transition-colors hover:border-gold hover:text-gold sm:h-14 sm:w-14 sm:translate-x-1/3"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {assurance.enabled && assurance.items.length > 0 ? (
        <section className="bg-secondary/40 text-foreground">
          <div className="container-x mx-auto max-w-[1600px] pb-12 pt-2 sm:pb-16">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {assurance.items.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-gold/25 bg-background/70 px-5 py-5 transition-all hover:border-gold/55 hover:bg-background"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-gold/30 bg-background text-gold">
                    <SiteIcon name={it.icon} className="h-7 w-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold tracking-[0.02em] text-foreground sm:text-base">
                      {it.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground sm:text-sm">{it.subtitle}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FEATURED */}
      <section className="bg-background">
        <div className="container-x mx-auto max-w-[1400px] py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">CURATED FOR YOU</p>
              <h2 className="mt-3 font-display text-4xl text-foreground">The YOMORA Edit</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Handpicked 925 silver designs for moments that deserve distinction.
              </p>
            </div>
            <Link
              to="/products"
              className="hidden text-[11px] font-semibold tracking-[0.22em] text-foreground hover:text-gold md:inline-flex"
            >
              SHOP ALL →
            </Link>
          </div>

          <div className="fade-in-grid mt-10 grid grid-cols-1 gap-5 min-[400px]:grid-cols-2 min-[400px]:gap-3 sm:gap-6 md:grid-cols-4 xl:grid-cols-5">
            {featured.map((p) => (
              <Link key={p.id} to="/products/$category" params={{ category: p.id }} className="group grid grid-cols-[42%_1fr] items-center gap-2 border border-border/70 bg-secondary/20 p-2 min-[400px]:block min-[400px]:border-0 min-[400px]:bg-transparent min-[400px]:p-0">
                <div className="relative overflow-hidden bg-secondary/40">
                  <img
                    src={productImage(p)}
                    width={900}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    alt={`${p.name} — 925 sterling silver`}
                    className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {isProductNew(p) && (
                    <span className="absolute left-3 top-3 bg-gold px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-onyx">
                      NEW
                    </span>
                  )}
                  {p.sold_out && (
                    <span className="absolute inset-x-0 bottom-0 bg-onyx/85 py-2 text-center text-[10px] font-bold tracking-[0.24em] text-cream">
                      SOLD OUT
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      wishlist.toggle({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image: productImage(p),
                        category: p.category,
                      });
                    }}
                    aria-label={wishSet.has(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-onyx hover:bg-gold"
                  >
                    <Heart className={`h-4 w-4 ${wishSet.has(p.id) ? "fill-current text-gold" : ""}`} />
                  </button>
                </div>
                <div className="min-w-0 py-2 min-[400px]:py-0 min-[400px]:pt-4">
                  <h3 className="line-clamp-2 font-display text-lg text-foreground">{p.name}</h3>
                  <p className="mt-1 hidden text-xs text-muted-foreground min-[500px]:block">{p.tagline}</p>
                  <p className="mt-2 text-sm font-semibold tracking-wide text-foreground">{formatINR(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* REELS — lifestyle / social proof after products */}
      <ReelsSection />

      {/* LEGACY — brand story after customer has seen product */}
      <section className="bg-background">
        <div className="container-x mx-auto grid max-w-[1400px] items-center gap-10 py-20 md:grid-cols-[1fr_1.1fr_0.9fr]">
          <img
            src={legacy.image_url || legacyImg}
            width={1200}
            height={900}
            loading="lazy"
            decoding="async"
            alt="Nehalbhai Devika Jewellers showroom"
            className="h-full w-full object-cover"
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{legacy.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-foreground md:text-5xl">
              {legacy.title_line_1}
              <br />
              {legacy.title_line_2}
            </h2>
            <div className="mt-4 h-px w-20 bg-gold" />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{legacy.description}</p>
          </div>
          <ul className="space-y-3 border-l border-gold/40 pl-6 md:pl-8">
            {legacy.bullets.map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-foreground">
                <Check className="h-4 w-4 text-gold" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SUBSCRIPTION */}
      {activePlans.length > 0 && (
        <section id="subscription" className="bg-onyx text-cream">
          <BlackSignatureBlock
            price={activePlans[0].price}
            duration={activePlans[0].duration_label || "Year"}
            tagline={activePlans[0].tagline || "Exclusive. Rewarded. Always."}
            ctaLabel={activePlans[0].cta_label || "Join Now"}
          />
        </section>
      )}

      <SiteFooter />

      {selectedCategory && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-onyx/75 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCategory(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-audience-title"
            className="relative w-full max-w-lg border border-gold/35 bg-background p-7 text-center shadow-2xl sm:p-10"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              aria-label="Close selection"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-gold"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-[10px] font-semibold tracking-[0.3em] text-gold">SHOP {selectedCategory.label.toUpperCase()}</p>
            <h2 id="category-audience-title" className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
              {selectedCategory.audiences.length === 1
                ? `Selected for ${selectedCategory.audiences[0] === "men" ? "Him" : "Her"}`
                : "Who are you shopping for?"}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {selectedCategory.audiences.length === 1
                ? `These ${selectedCategory.label.toLowerCase()} are currently available in this collection.`
                : `Choose a collection to see ${selectedCategory.label.toLowerCase()} selected for them.`}
            </p>
            <div className={`mt-8 grid gap-3 ${selectedCategory.audiences.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-sm"}`}>
              {[
                { audience: "men" as const, eyebrow: "FOR HIM", title: "Men's Collection" },
                { audience: "women" as const, eyebrow: "FOR HER", title: "Women's Collection" },
              ].filter((choice) => selectedCategory.audiences.includes(choice.audience)).map((choice) => (
                <Link
                  key={choice.audience}
                  to="/products/$category"
                  params={{ category: selectedCategory.slug }}
                  search={{ audience: choice.audience }}
                  onClick={() => setSelectedCategory(null)}
                  className="group border border-border bg-secondary/25 px-5 py-6 text-left transition-all hover:border-gold hover:bg-gold/10"
                >
                  <span className="block text-[10px] font-semibold tracking-[0.26em] text-gold">{choice.eyebrow}</span>
                  <span className="mt-2 flex items-center justify-between font-display text-xl text-foreground">
                    {choice.title}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
            <Link
              to="/products/$category"
              params={{ category: selectedCategory.slug }}
              search={{}}
              onClick={() => setSelectedCategory(null)}
              className="mt-5 inline-flex text-[10px] font-semibold tracking-[0.2em] text-muted-foreground transition-colors hover:text-gold"
            >
              VIEW ALL {selectedCategory.label.toUpperCase()}
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}

function BlackSignatureBlock({
  price,
  duration,
  tagline,
  ctaLabel,
}: {
  price: number;
  duration: string;
  tagline: string;
  ctaLabel: string;
}) {
  const privileges = [
    { icon: Percent, t: "25% OFF", d: "on everything you order for 1 year" },
    { icon: Rocket, t: "EARLY ACCESS", d: "to new arrivals & exclusive collections" },
    { icon: Gift, t: "MEMBER-ONLY OFFERS", d: "special discounts all year long" },
    { icon: Cake, t: "BIRTHDAY SURPRISE", d: "a special treat just for you" },
    { icon: BadgeCheck, t: "PRIORITY DISPATCH", d: "faster processing & shipping" },
    { icon: Headphones, t: "DEDICATED SUPPORT", d: "priority customer assistance" },
    { icon: Gem, t: "CUSTOM JEWELLERY", d: "personalized designs crafted for you" },
  ];
  return (
    <div className="container-x mx-auto max-w-[1400px] px-4 py-16 md:py-24">
      {/* Top row: title + unlock */}
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="text-center md:text-left">
          <p className="text-[10px] font-semibold tracking-[0.32em] text-cream/60">YOMORA</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] text-cream md:text-6xl">BLACK SIGNATURE</h2>
          <p className="mt-2 font-display text-2xl tracking-[0.35em] text-gold md:text-3xl">MEMBERSHIP</p>
          <div className="mt-5 flex items-center justify-center gap-3 md:justify-start">
            <span className="h-px w-10 bg-gold/60" />
            <span className="text-gold">✦</span>
            <span className="h-px w-10 bg-gold/60" />
          </div>
          <p className="mt-4 text-[11px] font-semibold tracking-[0.42em] text-cream/70">{tagline.toUpperCase()}</p>
        </div>

        <div className="border border-gold/30 bg-black/40 p-6 md:p-8">
          <p className="text-center text-[11px] font-semibold tracking-[0.3em] text-gold">
            HOW TO UNLOCK YOUR MEMBERSHIP
          </p>
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/60 text-gold">
                <Banknote className="h-5 w-5" strokeWidth={1.2} />
              </div>
              <div className="mt-3 font-display text-xl text-gold">PAY {formatINR(price)}</div>
              <div className="mt-1 text-[11px] text-cream/60">one-time membership fee (non-refundable)</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full border border-gold/60 text-[10px] font-semibold tracking-[0.2em] text-gold">
              OR
            </div>
            <div className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/60 text-gold">
                <ShoppingBag className="h-5 w-5" strokeWidth={1.2} />
              </div>
              <div className="mt-3 font-display text-xl text-gold">SHOP FOR ₹25,000</div>
              <div className="mt-1 text-[11px] text-cream/60">or more in a single transaction</div>
            </div>
          </div>
          <p className="mt-6 text-center text-[11px] text-cream/60">
            Your membership is valid for 1 {duration.toLowerCase()} from the date of activation.
          </p>
        </div>
      </div>

      {/* Center: signature card */}
      <div className="mt-14 grid place-items-center">
        <div className="relative aspect-[1.6/1] w-full max-w-md">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] shadow-[0_40px_100px_-30px_rgba(212,175,55,0.55)]" />
          <div className="absolute inset-3 rounded-lg border border-gold/40" />
          <div className="absolute inset-5 rounded-md border border-gold/15" />
          <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
            <div className="font-display text-4xl tracking-[0.22em] text-gold md:text-5xl">YOMORA</div>
            <div className="mt-1 text-[9px] tracking-[0.32em] text-cream/60">BY NEHALBHAI DEVIKA JEWELLERS</div>
            <div className="mt-6 h-px w-24 bg-gold/50" />
            <div className="mt-5 font-display text-2xl tracking-[0.22em] text-cream md:text-3xl">BLACK SIGNATURE</div>
            <div className="mt-1 text-[10px] tracking-[0.34em] text-gold">MEMBERSHIP</div>
            <div className="mt-4 text-[9px] tracking-[0.3em] text-cream/50">EXCLUSIVE MEMBERS ONLY</div>
            <div className="mt-3 flex items-center gap-3 text-[10px] tracking-[0.28em] text-gold">
              <span>LUXURY</span>
              <span className="text-gold/40">•</span>
              <span>LEGACY</span>
              <span className="text-gold/40">•</span>
              <span>TRUST</span>
            </div>
          </div>
        </div>
        <Link
          to="/membership"
          className="mt-10 inline-flex items-center gap-3 bg-gold px-10 py-3.5 text-[11px] font-semibold tracking-[0.32em] text-onyx hover:bg-gold-soft"
        >
          {ctaLabel.toUpperCase()}
        </Link>
      </div>

      {/* Bottom: privileges */}
      <div className="mt-16 border-t border-gold/20 pt-10">
        <div className="flex items-center justify-center gap-4">
          <span className="text-gold/60">✦</span>
          <p className="text-center text-[12px] font-semibold tracking-[0.36em] text-gold">
            ONE MEMBERSHIP. ENDLESS PRIVILEGES.
          </p>
          <span className="text-gold/60">✦</span>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {privileges.map((b) => (
            <div key={b.t} className="text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center text-gold">
                <b.icon className="h-6 w-6" strokeWidth={1.2} />
              </div>
              <div className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-cream">{b.t}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-cream/60">{b.d}</div>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-[10px] tracking-[0.34em] text-cream/50">
          A PRIVILEGE RESERVED FOR THOSE WHO VALUE QUALITY, TRUST &amp; TIMELESS ELEGANCE.
        </p>
      </div>
    </div>
  );
}
