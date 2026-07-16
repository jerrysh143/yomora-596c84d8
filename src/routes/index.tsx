import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, Gem, Hammer, Truck, ShieldCheck, PencilLine, Check } from "lucide-react";
import heroImg from "@/assets/hero-jewelry.jpg";
import legacyImg from "@/assets/legacy-showroom.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PRODUCTS, CATEGORIES, formatINR } from "@/lib/products";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const featured = PRODUCTS.slice(0, 4);
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
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">PREMIUM 925 STERLING SILVER JEWELLERY</p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] text-cream sm:text-6xl lg:text-7xl">
              Timeless Elegance,<br />Crafted for Every You
            </h1>
            <div className="mt-5 flex items-center gap-3">
              <span className="h-px w-16 bg-gold" />
              <span className="text-gold">✦</span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/75">
              Discover beautifully designed 925 Sterling Silver jewellery, crafted to complement every moment of your life. From everyday wear to unforgettable occasions.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="group inline-flex items-center gap-3 bg-gold px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-onyx transition-colors hover:bg-gold-soft"
              >
                SHOP COLLECTION
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/products"
                hash="new"
                className="inline-flex items-center gap-3 border border-gold/70 px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-gold/10"
              >
                NEW ARRIVALS
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
                <div className="text-[11px] font-semibold tracking-[0.22em] text-gold">MODIFIED 925 SILVER JEWELLERY</div>
                <p className="mt-1 text-[11px] leading-relaxed text-cream/70">
                  We also create custom &amp; modified 925 silver jewellery as per your style and requirements.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-gold" />
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-t border-white/5 bg-onyx text-cream">
        <div className="container-x mx-auto grid max-w-[1400px] grid-cols-2 gap-y-6 py-8 md:grid-cols-5">
          <TrustItem icon={<Award className="h-6 w-6" />} title="32+ YEARS OF TRUST" body="Trusted Jewellery Legacy Since 1994" />
          <TrustItem icon={<Gem className="h-6 w-6" />} title="GENUINE 925 SILVER" body="Hallmarked & Quality Assured" />
          <TrustItem icon={<Hammer className="h-6 w-6" />} title="EXPERT CRAFTSMANSHIP" body="Fine Detailing, Superior Finish" />
          <TrustItem icon={<Truck className="h-6 w-6" />} title="PAN INDIA DELIVERY" body="Fast, Secure & Reliable" />
          <TrustItem icon={<ShieldCheck className="h-6 w-6" />} title="SECURE PAYMENTS" body="100% Safe & Protected" />
        </div>
      </section>

      {/* LEGACY */}
      <section className="bg-background">
        <div className="container-x mx-auto grid max-w-[1400px] items-center gap-10 py-20 md:grid-cols-[1fr_1.1fr_0.9fr]">
          <img
            src={legacyImg}
            width={1200}
            height={900}
            loading="lazy"
            alt="Nehalbhai Devika Jewellers showroom"
            className="h-full w-full object-cover"
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">OUR LEGACY</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-foreground md:text-5xl">
              A Legacy of Trust.<br />A Future of Luxury.
            </h2>
            <div className="mt-4 h-px w-20 bg-gold" />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              For over 32 years, Nehalbhai Devika Jewellers has been a name of trust, quality and timeless relationships. YOMORA is our premium silver jewellery brand, bringing that legacy to the modern world.
            </p>
          </div>
          <ul className="space-y-3 border-l border-gold/40 pl-6 md:pl-8">
            {[
              "Genuine 925 Hallmarked Silver",
              "Trendy & Timeless Designs",
              "Modified & Custom Jewellery",
              "Premium Packaging",
              "Loved by Thousands of Customers",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-foreground">
                <Check className="h-4 w-4 text-gold" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-secondary/40">
        <div className="container-x mx-auto max-w-[1400px] py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">SHOP BY CATEGORY</p>
              <h2 className="mt-3 font-display text-4xl text-foreground">Explore Our Collections</h2>
            </div>
            <Link to="/products" className="hidden text-[11px] font-semibold tracking-[0.22em] text-foreground hover:text-gold md:inline-flex">VIEW ALL →</Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => {
              const p = PRODUCTS.find((x) => x.category === c.slug)!;
              return (
                <Link key={c.slug} to="/products" hash={c.slug} className="group relative block overflow-hidden bg-onyx">
                  <img src={p.image} width={900} height={900} loading="lazy" alt={c.label} className="h-72 w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
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
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">FEATURED</p>
              <h2 className="mt-3 font-display text-4xl text-foreground">Signature Pieces</h2>
            </div>
            <Link to="/products" className="hidden text-[11px] font-semibold tracking-[0.22em] text-foreground hover:text-gold md:inline-flex">SHOP ALL →</Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group block">
                <div className="relative overflow-hidden bg-secondary/40">
                  <img src={p.image} width={900} height={900} loading="lazy" alt={p.name} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {p.isNew && (
                    <span className="absolute left-3 top-3 bg-gold px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-onyx">NEW</span>
                  )}
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

      {/* CTA STRIP */}
      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] grid items-center gap-6 py-14 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="font-display text-3xl md:text-4xl">Custom &amp; Modified 925 Silver Jewellery</h3>
            <p className="mt-2 max-w-xl text-sm text-cream/70">Have something in mind? Our karigars craft made-to-order pieces to your exact specifications.</p>
          </div>
          <Link to="/products" className="inline-flex items-center gap-3 bg-gold px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft">
            REQUEST A CUSTOM PIECE <ArrowRight className="h-4 w-4" />
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
