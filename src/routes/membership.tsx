import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Percent, Headphones, Gift, Rocket, Cake, BadgeCheck, Gem, Banknote, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { subscriptionPlansQuery } from "@/lib/subscription.queries";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "Black Signature Membership — YOMORA" },
      { name: "description", content: "Exclusive privileges, priority service and rewards with YOMORA Black Signature." },
      { property: "og:title", content: "Black Signature Membership — YOMORA" },
      { property: "og:description", content: "One membership. Exclusive privileges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MembershipPage,
});

function MembershipPage() {
  const { data: plans = [] } = useQuery(subscriptionPlansQuery());
  const activePlans = plans.filter((p) => p.is_active);
  const primary = activePlans[0];
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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] px-4 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-semibold tracking-[0.32em] text-cream/60">YOMORA</p>
              <h1 className="mt-3 font-display text-4xl leading-[1.05] text-cream md:text-6xl">
                BLACK SIGNATURE
              </h1>
              <p className="mt-2 font-display text-2xl tracking-[0.35em] text-gold md:text-3xl">
                MEMBERSHIP
              </p>
              <div className="mt-5 flex items-center justify-center gap-3 md:justify-start">
                <span className="h-px w-10 bg-gold/60" />
                <span className="text-gold">✦</span>
                <span className="h-px w-10 bg-gold/60" />
              </div>
              <p className="mt-4 text-[11px] font-semibold tracking-[0.42em] text-cream/70">
                {(primary?.tagline || "Exclusive. Rewarded. Always.").toUpperCase()}
              </p>
            </div>

            {primary && (
              <div className="border border-gold/30 bg-black/40 p-6 md:p-8">
                <p className="text-center text-[11px] font-semibold tracking-[0.3em] text-gold">
                  HOW TO UNLOCK YOUR MEMBERSHIP
                </p>
                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/60 text-gold">
                      <Banknote className="h-5 w-5" strokeWidth={1.2} />
                    </div>
                    <div className="mt-3 font-display text-xl text-gold">PAY {formatINR(primary.price)}</div>
                    <div className="mt-1 text-[11px] text-cream/60">
                      one-time membership fee (non-refundable)
                    </div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-gold/60 text-[10px] font-semibold tracking-[0.2em] text-gold">
                    OR
                  </div>
                  <div className="text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/60 text-gold">
                      <ShoppingBag className="h-5 w-5" strokeWidth={1.2} />
                    </div>
                    <div className="mt-3 font-display text-xl text-gold">SHOP FOR ₹25,000</div>
                    <div className="mt-1 text-[11px] text-cream/60">
                      or more in a single transaction
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-center text-[11px] text-cream/60">
                  Your membership is valid for 1 {(primary.duration_label || "Year").toLowerCase()} from the date of activation.
                </p>
              </div>
            )}
          </div>

          <div className="mt-14 grid place-items-center">
            <div className="relative aspect-[1.6/1] w-full max-w-md">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] shadow-[0_40px_100px_-30px_rgba(212,175,55,0.55)]" />
              <div className="absolute inset-3 rounded-lg border border-gold/40" />
              <div className="absolute inset-5 rounded-md border border-gold/15" />
              <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="font-display text-4xl tracking-[0.22em] text-gold md:text-5xl">YOMORA</div>
                <div className="mt-1 text-[9px] tracking-[0.32em] text-cream/60">
                  BY NEHALBHAI DEVIKA JEWELLERS
                </div>
                <div className="mt-6 h-px w-24 bg-gold/50" />
                <div className="mt-5 font-display text-2xl tracking-[0.22em] text-cream md:text-3xl">
                  BLACK SIGNATURE
                </div>
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
            {primary && (
              <Link
                to="/contact"
                className="mt-10 inline-flex items-center gap-3 bg-gold px-10 py-3.5 text-[11px] font-semibold tracking-[0.32em] text-onyx hover:bg-gold-soft"
              >
                {(primary.cta_label || "JOIN NOW").toUpperCase()}
              </Link>
            )}
          </div>

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
      </section>
      <SiteFooter />
    </div>
  );
}