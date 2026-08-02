import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import {
  Heart,
  Percent,
  Headphones,
  Gift,
  Truck,
  Crown,
  Rocket,
  Cake,
  BadgeCheck,
  Gem,
  Banknote,
  ShoppingBag,
} from "lucide-react";
import legacyImg from "@/assets/legacy-showroom.jpg";
import customJewelleryBanner from "@/assets/custom-jewellery-banner.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ReelsSection } from "@/components/reels-section";
import { formatINR, productImage, isProductNew } from "@/lib/products";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import { subscriptionPlansQuery } from "@/lib/subscription.queries";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SiteIcon } from "@/lib/site-icons";
import { Sparkles } from "lucide-react";
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
  const catsSection = content.categories_section;
  const assurance = content.assurance_bar;
  const featuredSection = content.featured_section;
  const ctaStrip = content.cta_strip;
  // 3 products per category, in category order; categories without products are skipped
  const featured = CATEGORIES.flatMap((c) => products.filter((p) => p.category === c.slug).slice(0, 3));
  const { items: wishItems } = useWishlist();
  const wishSet = new Set(wishItems.map((w) => w.id));
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* CUSTOM PIECE BANNER */}
      <section className="bg-onyx">
        <a
          href={`https://wa.me/${(ctaStrip.whatsapp_number || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(ctaStrip.whatsapp_message || "")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Request a custom jewellery piece on WhatsApp"
          className="group block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
        >
          <img
            src={customJewelleryBanner}
            alt="Made only for you — custom 925 silver jewellery"
            className="h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
          />
        </a>
      </section>

      {/* CATEGORIES */}
      <section className="bg-secondary/40">
        <div className="container-x mx-auto max-w-[1400px] py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{catsSection.eyebrow}</p>
              <h2 className="mt-3 font-display text-4xl text-foreground">{catsSection.title}</h2>
            </div>
            <Link
              to="/products"
              className="hidden text-[11px] font-semibold tracking-[0.22em] text-foreground hover:text-gold md:inline-flex"
            >
              VIEW ALL →
            </Link>
          </div>

          {/* Shop by audience */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { to: "/men" as const, label: "Shop for Him" },
              { to: "/women" as const, label: "Shop for Her" },
              { to: "/kids" as const, label: "Shop for Kids" },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group relative flex items-center justify-between overflow-hidden border border-gold/25 bg-onyx px-7 py-7 text-cream transition-all duration-500 hover:border-gold/60 hover:shadow-[0_18px_40px_-22px_color-mix(in_oklab,var(--color-gold)_70%,transparent)]"
              >
                <span className="pointer-events-none absolute inset-[6px] border border-gold/15 transition-colors duration-500 group-hover:border-gold/35" />
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent,color-mix(in_oklab,var(--color-gold)_18%,transparent),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
                <span className="relative font-display text-base uppercase tracking-[0.26em] text-gold transition-[letter-spacing] duration-500 group-hover:tracking-[0.3em] sm:text-lg">
                  {a.label}
                </span>
                <span className="relative flex items-center">
                  <span className="mr-0 h-px w-0 bg-gold/70 transition-all duration-500 group-hover:mr-3 group-hover:w-7" />
                  <ArrowRight
                    className="h-4 w-4 text-gold transition-transform duration-500 group-hover:translate-x-1"
                    strokeWidth={1.25}
                  />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <div
              id="category-rail"
              className="-mx-4 flex touch-pan-x snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 sm:mx-0 sm:gap-6 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
            >
              {CATEGORIES.map((c) => {
                const p = products.find((x) => x.category === c.slug);
                const img = p ? productImage(p) : "";
                return (
                  <Link
                    key={c.slug}
                    to="/products"
                    hash={c.slug}
                    className="group w-[42%] shrink-0 snap-start text-center sm:w-[30%] md:w-[22%] lg:w-[16%]"
                  >
                    <div className="relative mx-auto aspect-square w-[86%] rounded-full p-[3px] ring-1 ring-gold/50 transition-shadow duration-500 group-hover:shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--color-gold)_65%,transparent)]">
                      <div className="h-full w-full overflow-hidden rounded-full border border-gold/30 bg-secondary/40">
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
                    </div>
                    <span className="mx-auto mt-4 block text-gold/70">✦</span>
                    <span className="mt-2 block font-display text-base uppercase tracking-[0.18em] text-foreground transition-colors group-hover:text-gold sm:text-lg">
                      {c.label}
                    </span>
                    <span className="mt-2 hidden items-center justify-center gap-2 whitespace-nowrap text-[11px] tracking-[0.14em] text-muted-foreground transition-colors group-hover:text-gold sm:inline-flex">
                      View the collection
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 hidden items-center justify-center gap-3 md:flex">
              <button
                type="button"
                aria-label="Scroll categories left"
                onClick={() => {
                  const el = document.getElementById("category-rail");
                  el?.scrollBy({ left: -el.clientWidth * 0.8, behavior: "smooth" });
                }}
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-foreground hover:border-gold hover:text-gold"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                aria-label="Scroll categories right"
                onClick={() => {
                  const el = document.getElementById("category-rail");
                  el?.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
                }}
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-foreground hover:border-gold hover:text-gold"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {assurance.enabled && assurance.items.length > 0 ? (
        <section className="bg-onyx text-cream">
          <div className="container-x mx-auto max-w-[1400px] py-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {assurance.items.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-gold/25 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-gold)_6%,transparent),transparent)] px-5 py-5 transition-colors hover:border-gold/50"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-gold/30 text-gold">
                    <SiteIcon name={it.icon} className="h-7 w-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold tracking-[0.02em] text-cream sm:text-base">
                      {it.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-cream/60 sm:text-sm">{it.subtitle}</span>
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
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{featuredSection.eyebrow}</p>
              <h2 className="mt-3 font-display text-4xl text-foreground">{featuredSection.title}</h2>
            </div>
            <Link
              to="/products"
              className="hidden text-[11px] font-semibold tracking-[0.22em] text-foreground hover:text-gold md:inline-flex"
            >
              SHOP ALL →
            </Link>
          </div>

          <div className="fade-in-grid mt-10 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 xl:grid-cols-5">
            {featured.map((p) => (
              <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group block">
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
                <div className="pt-4">
                  <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
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
    { icon: Percent, t: "15% OFF", d: "on everything you order for 1 year" },
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
