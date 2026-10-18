import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Banknote, Check, Heart } from "lucide-react";
import legacyImg from "@/assets/legacy-showroom.jpg";
// Real Aurelia ring on-hand product photo (served from the store media bucket).
const heroImg = "https://media.yomora.in/site-images/2d8fc8ea-8d93-4400-9e67-9b33d702679e.jpg";
import customImg from "@/assets/custom-jewellery-banner-wide.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ReelsSection } from "@/components/reels-section";
import { WhatsappIcon, whatsappHref } from "@/components/whatsapp-button";
import { formatINR, productImage, isProductNew } from "@/lib/products";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import { subscriptionPlansQuery } from "@/lib/subscription.queries";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SiteIcon } from "@/lib/site-icons";
import { useWishlist, wishlist } from "@/lib/wishlist";
import { MEMBERSHIP_HEADLINE, membershipBenefitText } from "@/lib/brand-config";
import type { IconName } from "@/lib/site-content.defaults";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
    context.queryClient.ensureQueryData(subscriptionPlansQuery());
    context.queryClient.ensureQueryData(siteContentQuery());
  },
  component: Index,
});

const HOME_CATEGORY_SLUGS = ["rings", "earrings", "neckwear", "bracelets", "chains", "anklets"];
const CATEGORY_NOTES: Record<string, string> = {
  rings: "Solitaires to couple sets",
  earrings: "Studs and jhumkas",
  neckwear: "Pendants and sets",
  bracelets: "Cuffs, bangles and panja",
  chains: "Box, rope and herringbone",
  anklets: "Payal and toe rings",
};
const OCCASIONS = [
  { slug: "mangalsutra", title: "Wedding and festive", body: "Mangalsutra, necklace sets and jhumkas", big: true },
  { slug: "couplerings", title: "Couple and anniversary", body: "Matching ring sets" },
  { slug: "rakhi", title: "Rakhi", body: "Silver blessing rakhis" },
  { slug: "rings", title: "Everyday", body: "Light rings for daily wear" },
  { slug: "watches", title: "Heritage watches", body: "Oxidised and floral dials" },
];
const GIFT_BUDGETS = [
  { budget: 1000, note: "Pendants, studs and rakhis" },
  { budget: 2500, note: "Rings, chains and couple sets" },
  { budget: 10000, note: "Bracelets, chains and jhumkas" },
];

function Index() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: CATEGORIES } = useSuspenseQuery(categoriesQuery());
  const { data: plans } = useSuspenseQuery(subscriptionPlansQuery());
  const activePlans = plans.filter((p) => p.is_active);
  const { data: content } = useSuspenseQuery(siteContentQuery());
  const legacy = content.legacy;
  const assurance = content.assurance_bar;
  const whatsappNumber = content.cta_strip?.whatsapp_number;
  const { items: wishItems } = useWishlist();
  const wishSet = new Set(wishItems.map((w) => w.id));

  const available = products.filter((p) => !p.sold_out);
  const firstImageFor = (slug: string) => {
    const p = available.find((x) => x.category === slug) ?? products.find((x) => x.category === slug);
    return p ? productImage(p) : "";
  };
  const labelFor = (slug: string) => {
    const label = CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
    return label === "Necklace" ? "Necklaces" : label;
  };
  const homeCategories = HOME_CATEGORY_SLUGS.filter((slug) =>
    products.some((p) => p.category === slug),
  );
  const occasions = OCCASIONS.filter((o) => products.some((p) => p.category === o.slug));
  // 12 products: round-robin across categories so the edit shows range, newest first.
  const featured = (() => {
    const pools = CATEGORIES.map((c) => available.filter((p) => p.category === c.slug));
    const out: typeof products = [];
    for (let round = 0; out.length < 12 && round < 12; round++) {
      for (const pool of pools) {
        if (pool[round] && out.length < 12) out.push(pool[round]);
      }
    }
    return out;
  })();
  const giftThumbs = (max: number) =>
    available.filter((p) => p.price <= max).slice(0, 2).map((p) => ({ src: productImage(p), alt: p.name }));
  const trustItems = [
    ...(assurance.enabled ? assurance.items.slice(0, 4) : []).map((it) => ({
      icon: <SiteIcon name={it.icon} className="h-6 w-6" />,
      title: it.title,
      subtitle: it.subtitle,
    })),
    { icon: <Banknote className="h-6 w-6" strokeWidth={1.4} />, title: "Cash on Delivery", subtitle: "No extra COD fee" },
  ];
  const reelFallback = available.slice(0, 4).map((p) => ({ src: productImage(p), alt: p.name }));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO — one editorial message instead of a carousel */}
      <section className="bg-secondary/70">
        <div className="mx-auto grid max-w-[1760px] md:min-h-[560px] md:grid-cols-[1.05fr_1fr] lg:min-h-[640px]">
          <div className="relative order-1 aspect-[4/3] max-h-[50svh] w-full overflow-hidden md:order-2 md:aspect-auto md:max-h-none">
            <img
              src={heroImg}
              alt="Aurelia rectangular 925 silver ring worn on the hand"
              width={1200}
              height={1200}
              fetchPriority="high"
              decoding="async"
              className="img-shimmer absolute inset-0 h-full w-full object-cover object-[50%_42%]"
            />
            <Link
              to="/products/$category"
              params={{ category: "rings" }}
              search={{ audience: undefined }}
              className="absolute bottom-3 left-3 hidden bg-background/90 px-4 py-2.5 text-xs text-foreground backdrop-blur sm:block md:bottom-6 md:left-6"
            >
              <span className="block font-display text-base">Shop rings</span>
              925 hallmarked silver →
            </Link>
          </div>
          <div className="order-2 flex flex-col justify-center px-5 pb-8 pt-5 sm:px-8 md:order-1 md:px-12 md:py-16 lg:px-20">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-gold sm:text-[11px]">
              FAMILY JEWELLERS SINCE 1994 · AHMEDABAD
            </p>
            <h1 className="mt-2 font-display text-[34px] leading-[1.05] text-foreground sm:text-5xl md:mt-5 lg:text-[68px]">
              Elegance, defined in 925 silver.
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base md:mt-5 md:text-lg">
              Timeless 925 silver jewellery made to illuminate every occasion.
              <span className="hidden sm:inline"> Hallmarked, and made by a family trusted for over 32 years.</span>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:flex md:mt-8">
              <Link
                to="/women"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap bg-onyx px-3 text-xs font-semibold tracking-[0.1em] sm:px-5 lg:px-7 sm:tracking-[0.12em] text-cream hover:bg-black"
              >
                SHOP FOR HER
              </Link>
              <Link
                to="/men"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap border border-foreground px-3 text-xs font-semibold tracking-[0.1em] sm:px-5 lg:px-7 sm:tracking-[0.12em] text-foreground hover:bg-foreground hover:text-background"
              >
                SHOP FOR HIM
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-border bg-background">
        <div className="container-x mx-auto grid max-w-[1400px] grid-cols-2 gap-x-4 gap-y-5 py-6 md:grid-cols-5 md:py-7">
          {trustItems.map((it, i) => (
            <div
              key={it.title}
              className={`flex items-center gap-3 ${i === trustItems.length - 1 ? "col-span-2 md:col-span-1" : ""}`}
            >
              <span className="text-gold">{it.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{it.title}</span>
                <span className="block text-xs text-muted-foreground">{it.subtitle}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="bg-background">
        <div className="container-x mx-auto max-w-[1400px] py-16 md:py-24">
          <SectionHead eyebrow="SHOP BY CATEGORY" title="Find your piece" linkLabel="View all" />
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-5 lg:grid-cols-6">
            {homeCategories.map((slug) => (
              <Link
                key={slug}
                to="/products/$category"
                params={{ category: slug }}
                search={{ audience: undefined }}
                className="group text-center"
              >
                <div className="img-shimmer aspect-[4/5] overflow-hidden">
                  <img
                    src={firstImageFor(slug)}
                    alt={`${labelFor(slug)} in 925 sterling silver`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-3 font-display text-lg text-foreground md:text-2xl">{labelFor(slug)}</h3>
                <p className="hidden text-xs text-muted-foreground sm:block">{CATEGORY_NOTES[slug]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY OCCASION */}
      {occasions.length > 0 && (
        <section className="bg-background">
          <div className="container-x mx-auto max-w-[1400px] pb-16 md:pb-24">
            <SectionHead eyebrow="SHOP BY OCCASION" title="For the moments that matter" />
            <div className="mt-8 grid auto-rows-[170px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:auto-rows-[260px] md:grid-cols-[1.3fr_1fr_1fr] md:gap-5">
              {occasions.map((o, i) => (
                <Link
                  key={o.slug + o.title}
                  to="/products/$category"
                  params={{ category: o.slug }}
                  search={{ audience: undefined }}
                  className={`img-shimmer group relative overflow-hidden ${i === 0 ? "col-span-2 row-span-1 md:col-span-1 md:row-span-2" : ""}`}
                >
                  <img
                    src={firstImageFor(o.slug)}
                    alt={o.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
                  <span className="absolute inset-x-4 bottom-4 text-white md:inset-x-6 md:bottom-6">
                    <span className="block font-display text-2xl leading-tight md:text-3xl">{o.title}</span>
                    <span className="mt-1 block text-xs text-white/85 md:text-sm">{o.body}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GIFTS BY BUDGET */}
      <section className="bg-secondary/70">
        <div className="container-x mx-auto max-w-[1400px] py-16 md:py-24">
          <SectionHead
            eyebrow="GIFTING"
            title="Gifts, sorted by budget"
            body="Every order arrives in a premium YOMORA gift box."
          />
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {GIFT_BUDGETS.map((g) => (
              <Link
                key={g.budget}
                to="/products"
                search={{ budget: g.budget }}
                className="flex flex-col gap-2 border border-border bg-background p-5 transition-colors hover:border-foreground md:p-7"
              >
                <span className="text-[10px] font-semibold tracking-[0.2em] text-gold">UNDER</span>
                <span className="font-display text-3xl leading-none text-foreground md:text-4xl">
                  {formatINR(g.budget)}
                </span>
                <span className="text-xs text-muted-foreground md:text-sm">{g.note}</span>
                <span className="mt-2 flex gap-2">
                  {giftThumbs(g.budget).map((t) => (
                    <span key={t.src} className="img-shimmer h-12 w-12 overflow-hidden md:h-16 md:w-16">
                      <img src={t.src} alt={t.alt} loading="lazy" className="h-full w-full object-cover" />
                    </span>
                  ))}
                </span>
              </Link>
            ))}
            <Link
              to="/custom-jewellery"
              className="flex flex-col gap-2 bg-onyx p-5 text-cream md:p-7"
            >
              <span className="text-[10px] font-semibold tracking-[0.2em] text-gold">MADE TO ORDER</span>
              <span className="font-display text-3xl leading-none md:text-4xl">Custom</span>
              <span className="text-xs text-cream/70 md:text-sm">
                Share your idea; crafted in 10–21 days after design approval
              </span>
              <span className="mt-auto pt-2 text-xs font-semibold tracking-[0.12em] text-gold">
                START A CUSTOM PIECE →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* THE YOMORA EDIT — 12 products */}
      <section className="bg-background">
        <div className="container-x mx-auto max-w-[1400px] py-16 md:py-24">
          <SectionHead
            eyebrow="CURATED FOR YOU"
            title="The YOMORA edit"
            body="Handpicked 925 silver designs for moments that deserve distinction."
            linkLabel="Shop all"
          />
          <div className="fade-in-grid mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <Link
                key={p.id}
                to="/products/$category"
                params={{ category: p.id }}
                search={{ audience: undefined }}
                className="group block"
              >
                <div className="img-shimmer relative overflow-hidden">
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
                    <span className="absolute left-3 top-3 bg-background px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-foreground">
                      NEW
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
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground hover:bg-gold"
                  >
                    <Heart className={`h-4 w-4 ${wishSet.has(p.id) ? "fill-current text-gold" : ""}`} />
                  </button>
                </div>
                <h3 className="mt-3 line-clamp-2 font-display text-lg leading-snug text-foreground">{p.name}</h3>
                <p className="mt-1 hidden line-clamp-1 text-xs text-muted-foreground sm:block">{p.tagline}</p>
                <p className="mt-1.5 text-sm font-semibold text-foreground">{formatINR(p.price)}</p>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="inline-flex h-12 items-center border border-foreground px-8 text-xs font-semibold tracking-[0.14em] text-foreground hover:bg-foreground hover:text-background"
            >
              SHOP ALL JEWELLERY
            </Link>
          </div>
        </div>
      </section>

      {/* HERITAGE STORY */}
      <section className="bg-secondary/70">
        <div className="container-x mx-auto grid max-w-[1400px] items-center gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="img-shimmer overflow-hidden">
            <img
              src={legacy.image_url || legacyImg}
              width={1200}
              height={900}
              loading="lazy"
              decoding="async"
              alt="Nehalbhai Devika Jewellers showroom"
              className="aspect-[4/3] h-full w-full object-cover md:aspect-[4/5]"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-gold">OUR STORY</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-foreground md:text-5xl">
              A legacy of trust.
              <br />A future of luxury.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
              It all began in 1994 when Late Shri Nehalbhai Devjibhai and Smt. Devikaben Nehalbhai
              laid the foundation of trust, purity and craftsmanship.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{legacy.description}</p>
            <ul className="mt-6 grid gap-2 text-sm text-foreground sm:grid-cols-2">
              {legacy.bullets.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
              {[
                ["1994", "Founded in Ahmedabad"],
                ["32+ years", "Of family legacy"],
                ["Pan-India", "Online service"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-display text-2xl text-foreground md:text-3xl">{k}</p>
                  <p className="text-xs text-muted-foreground">{v}</p>
                </div>
              ))}
            </div>
            <Link to="/about" className="mt-8 inline-block border-b border-foreground pb-0.5 text-sm font-semibold">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* MEMBERSHIP — one block, same benefits as /membership */}
      {activePlans.length > 0 && (
        <section id="subscription" className="bg-onyx text-cream">
          <MembershipBlock
            price={activePlans[0].price}
            ctaLabel={activePlans[0].cta_label || "Become a member"}
            privileges={content.page_membership.privileges}
            shopAmountLabel={content.page_membership.shop_amount_label}
            validityNote={content.page_membership.validity_note}
          />
        </section>
      )}

      {/* CUSTOM — WhatsApp first */}
      <section className="grid bg-secondary/70 md:grid-cols-2">
        <div className="px-5 py-14 sm:px-8 md:px-12 md:py-20 lg:px-20">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-gold">CUSTOM JEWELLERY</p>
          <h2 className="mt-3 font-display text-4xl text-foreground md:text-5xl">Made just for you</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Have a design in mind? We make personalised 925 silver jewellery as per your style and
            requirements.
          </p>
          <ol className="mt-6 space-y-3 text-sm text-foreground">
            {[
              "Share your design or inspiration with us on WhatsApp",
              "We send you the best quote",
              "Our experts craft it, typically 10–21 days after design approval",
              "Delivered safely to your doorstep",
            ].map((t, i) => (
              <li key={t} className="flex gap-4">
                <span className="w-6 font-display text-xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="pt-1">{t}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref(whatsappNumber || "", "Hi! I'd like to request a custom 925 silver jewellery piece.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 bg-onyx px-6 text-xs font-semibold tracking-[0.12em] text-cream hover:bg-black"
            >
              <WhatsappIcon className="h-4 w-4" /> SHARE YOUR IDEA ON WHATSAPP
            </a>
            <Link
              to="/custom-jewellery"
              className="inline-flex h-12 items-center justify-center border border-foreground px-6 text-xs font-semibold tracking-[0.12em] text-foreground"
            >
              ENQUIRY FORM
            </Link>
          </div>
        </div>
        <div className="img-shimmer relative min-h-[260px] overflow-hidden">
          <img
            src={customImg}
            alt="Custom 925 silver pendant by YOMORA"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[85%_50%]"
          />
        </div>
      </section>

      <ReelsSection fallbackImages={reelFallback} />

      <SiteFooter />
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  body,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.22em] text-gold">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl text-foreground md:text-5xl">{title}</h2>
        {body ? <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">{body}</p> : null}
      </div>
      {linkLabel ? (
        <Link to="/products" className="w-fit border-b border-foreground pb-0.5 text-sm font-semibold text-foreground">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function MembershipBlock({
  price,
  ctaLabel,
  privileges,
  shopAmountLabel,
  validityNote,
}: {
  price: number;
  ctaLabel: string;
  privileges: { icon: IconName; title: string; description: string }[];
  shopAmountLabel: string;
  validityNote: string;
}) {
  const shopAmount = shopAmountLabel.match(/₹[\d,]+/)?.[0] ?? "₹25,000";
  return (
    <div className="container-x mx-auto grid max-w-[1400px] items-center gap-10 py-16 md:grid-cols-[1.1fr_1fr] md:gap-16 md:py-24">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.22em] text-gold">YOMORA BLACK SIGNATURE MEMBERSHIP</p>
        <h2 className="mt-3 font-display text-4xl text-cream md:text-5xl">Belong to more.</h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70 md:text-base">{MEMBERSHIP_HEADLINE}.</p>
        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="border border-white/15 p-4 text-center">
            <p className="font-display text-3xl text-cream">{formatINR(price)}</p>
            <p className="text-[11px] text-cream/60">one-time fee (non-refundable)</p>
          </div>
          <span className="text-[10px] tracking-[0.2em] text-cream/50">OR</span>
          <div className="border border-white/15 p-4 text-center">
            <p className="font-display text-3xl text-cream">{shopAmount}+</p>
            <p className="text-[11px] text-cream/60">spent in a single order</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-cream/50">{validityNote}</p>
        <Link
          to="/membership"
          className="mt-7 inline-flex h-12 items-center bg-gold px-8 text-xs font-semibold tracking-[0.14em] text-onyx hover:bg-gold-soft"
        >
          {ctaLabel.toUpperCase()}
        </Link>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2">
        {privileges.map((b) => (
          <li key={b.title} className="flex gap-3">
            <SiteIcon name={b.icon} className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <span>
              <span className="block text-sm font-semibold text-cream">{sentenceCase(membershipBenefitText(b.title))}</span>
              <span className="block text-xs text-cream/60">{membershipBenefitText(b.description)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function sentenceCase(value: string) {
  const v = value.trim().toLowerCase();
  return v.charAt(0).toUpperCase() + v.slice(1);
}
