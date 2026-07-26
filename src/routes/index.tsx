import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, PencilLine, Check } from "lucide-react";
import { Heart } from "lucide-react";
import heroImg from "@/assets/hero-jewelry.jpg";
import legacyImg from "@/assets/legacy-showroom.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ReelsSection } from "@/components/reels-section";
import { formatINR, productImage } from "@/lib/products";
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
  const hero = content.hero;
  const trust = content.trust_bar;
  const legacy = content.legacy;
  const catsSection = content.categories_section;
  const featuredSection = content.featured_section;
  const ctaStrip = content.cta_strip;
  const featured = products.slice(0, 4);
  const { items: wishItems } = useWishlist();
  const wishSet = new Set(wishItems.map((w) => w.id));
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-onyx text-cream">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            width={1600}
            height={1200}
            alt="925 sterling silver diamond jewellery on dark textured stone"
            className="h-full w-full object-cover object-right opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-onyx via-onyx/85 to-transparent md:from-onyx md:via-onyx/70" />
        </div>

        <div className="container-x relative mx-auto max-w-[1400px] py-20 md:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{hero.eyebrow}</p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] text-cream sm:text-6xl lg:text-7xl">
              {hero.title_line_1}<br />{hero.title_line_2}
            </h1>
            <div className="mt-5 flex items-center gap-3">
              <span className="h-px w-16 bg-gold" />
              <span className="text-gold">✦</span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/75">{hero.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                hash={hero.primary_cta_hash || undefined}
                className="group inline-flex items-center gap-3 bg-gold px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-onyx transition-colors hover:bg-gold-soft"
              >
                {hero.primary_cta_label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/products"
                hash={hero.secondary_cta_hash || undefined}
                className="inline-flex items-center gap-3 border border-gold/70 px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-gold/10"
              >
                {hero.secondary_cta_label}
              </Link>
            </div>

            <Link
              to="/products"
              className="mt-6 flex max-w-md items-center gap-4 border border-gold/40 bg-onyx/40 px-5 py-4 backdrop-blur transition-colors hover:border-gold/70"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center border border-gold/60 text-gold">
                <PencilLine className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold tracking-[0.22em] text-gold">{hero.custom_card_title}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-cream/70">{hero.custom_card_body}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gold" />
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-t border-white/5 bg-onyx text-cream">
        <div className="container-x mx-auto grid max-w-[1400px] grid-cols-2 gap-y-6 py-8 md:grid-cols-5">
          {trust.items.map((t, i) => (
            <TrustItem key={i} icon={<SiteIcon name={t.icon} className="h-6 w-6" />} title={t.title} body={t.body} />
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-secondary/40">
        <div className="container-x mx-auto max-w-[1400px] py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{catsSection.eyebrow}</p>
              <h2 className="mt-3 font-display text-4xl text-foreground">{catsSection.title}</h2>
            </div>
            <Link to="/products" className="hidden text-[11px] font-semibold tracking-[0.22em] text-foreground hover:text-gold md:inline-flex">VIEW ALL →</Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => {
              const p = products.find((x) => x.category === c.slug);
              const img = p ? productImage(p) : "";
              return (
                <Link key={c.slug} to="/products" hash={c.slug} className="group relative block overflow-hidden bg-onyx">
                  <img src={img} width={900} height={900} loading="lazy" alt={c.label} className="h-72 w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-onyx/85 via-onyx/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 text-cream">
                    <span className="font-display text-xl">{c.label}</span>
                    <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-background">
        <div className="container-x mx-auto max-w-[1400px] py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{featuredSection.eyebrow}</p>
              <h2 className="mt-3 font-display text-4xl text-foreground">{featuredSection.title}</h2>
            </div>
            <Link to="/products" className="hidden text-[11px] font-semibold tracking-[0.22em] text-foreground hover:text-gold md:inline-flex">SHOP ALL →</Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group block">
                <div className="relative overflow-hidden bg-secondary/40">
                  <img src={productImage(p)} width={900} height={900} loading="lazy" alt={p.name} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {p.is_new && (
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
            alt="Nehalbhai Devika Jewellers showroom"
            className="h-full w-full object-cover"
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{legacy.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-foreground md:text-5xl">
              {legacy.title_line_1}<br />{legacy.title_line_2}
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
        <section id="subscription" className="bg-secondary/40">
          <div className="container-x mx-auto max-w-[1400px] py-20">
            <div className="text-center">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">MEMBERSHIP</p>
              <h2 className="mt-3 font-display text-4xl text-foreground md:text-5xl">Join the YOMORA Privilege</h2>
              <div className="mx-auto mt-4 h-px w-20 bg-gold" />
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                One plan. Every piece. Zero making charges — always.
              </p>
            </div>

            <div className={`mx-auto mt-12 grid gap-6 ${activePlans.length === 1 ? "max-w-lg" : "max-w-[1200px] md:grid-cols-2 lg:grid-cols-3"}`}>
              {activePlans.map((plan) => (
                <div key={plan.id} className="border border-gold/40 bg-onyx text-cream shadow-[0_20px_60px_-30px_rgba(212,175,55,0.5)]">
                  <div className="flex items-center justify-between border-b border-gold/20 px-8 py-5">
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-gold">
                      <Sparkles className="h-3.5 w-3.5" /> EXCLUSIVE PLAN
                    </span>
                    <span className="text-[10px] tracking-[0.22em] text-cream/60">925 SILVER</span>
                  </div>
                  <div className="px-8 py-8 text-center">
                    <h3 className="font-display text-3xl text-cream">{plan.name}</h3>
                    <p className="mt-2 text-sm text-cream/70">{plan.tagline}</p>
                    <div className="mt-6 flex items-baseline justify-center gap-2">
                      <span className="font-display text-5xl text-gold">{formatINR(plan.price)}</span>
                      <span className="text-xs uppercase tracking-[0.22em] text-cream/60">{plan.duration_label}</span>
                    </div>
                    <ul className="mt-8 grid gap-3 text-left">
                      {plan.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-sm text-cream/85">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/products"
                      className="mt-8 inline-flex w-full items-center justify-center gap-3 bg-gold px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft"
                    >
                      {plan.cta_label.toUpperCase()} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <p className="mt-4 text-[10px] tracking-[0.22em] text-cream/50">
                      CANCEL ANYTIME · APPLIES ACROSS THE FULL CATALOGUE
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CUSTOM PIECE CTA — soft close before footer */}
      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] grid items-center gap-6 py-14 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="font-display text-3xl md:text-4xl">{ctaStrip.title}</h3>
            <p className="mt-2 max-w-xl text-sm text-cream/70">{ctaStrip.body}</p>
          </div>
          <Link to="/products" className="inline-flex items-center gap-3 bg-gold px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft">
            {ctaStrip.button_label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function TrustItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-center gap-3 px-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center border border-gold/50 text-gold">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold tracking-[0.2em] text-gold">{title}</div>
        <div className="mt-0.5 text-[11px] text-cream/70">{body}</div>
      </div>
    </div>
  );
}
