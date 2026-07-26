import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Percent, Sparkles, Headphones, Gift, Truck, Crown } from "lucide-react";
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
  const benefits = [
    { icon: Percent, t: "15% OFF", d: "On All Products" },
    { icon: Sparkles, t: "EARLY ACCESS", d: "To New Collections" },
    { icon: Headphones, t: "PRIORITY", d: "Customer Support" },
    { icon: Gift, t: "SPECIAL OFFERS", d: "& Rewards" },
    { icon: Truck, t: "FREE SHIPPING", d: "On All Orders" },
    { icon: Crown, t: "BIRTHDAY", d: "Special Gift" },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] py-16 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">MEMBERSHIP</p>
              <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
                BLACK SIGNATURE<br />MEMBERSHIP
              </h1>
              <p className="mt-4 text-sm text-cream/70">
                {primary?.tagline || "One Membership. Exclusive Privileges."}
              </p>
              {primary && (
                <>
                  <p className="mt-8 font-display text-4xl text-gold">
                    {formatINR(primary.price)}{" "}
                    <span className="text-lg text-cream/60">/ {primary.duration_label || "Year"}</span>
                  </p>
                  <p className="mt-2 text-xs text-cream/60">or Get Free with ₹25,000 Shopping</p>
                  <Link
                    to="/contact"
                    className="mt-8 inline-flex items-center gap-3 bg-gold px-8 py-3 text-[11px] font-semibold tracking-[0.28em] text-onyx hover:bg-gold-soft"
                  >
                    {(primary.cta_label || "JOIN NOW").toUpperCase()}
                  </Link>
                </>
              )}
            </div>
            <div className="grid place-items-center">
              <div className="relative grid aspect-[1.6/1] w-full max-w-sm place-items-center border border-gold/40 bg-gradient-to-br from-black to-onyx p-8 shadow-[0_30px_80px_-30px_rgba(212,175,55,0.5)]">
                <div className="absolute inset-3 border border-gold/20" />
                <div className="relative text-center">
                  <div className="font-display text-3xl tracking-[0.2em] text-gold">YOMORA</div>
                  <div className="mt-2 text-[11px] tracking-[0.3em] text-cream/70">BLACK SIGNATURE</div>
                </div>
                <Sparkles className="absolute right-4 top-4 h-4 w-4 text-gold/70" />
              </div>
            </div>
          </div>

          <div className="mt-14 border-t border-white/10 pt-12">
            <p className="text-center text-[11px] font-semibold tracking-[0.3em] text-gold">MEMBER BENEFITS</p>
            <div className="mt-10 grid gap-8 sm:grid-cols-3 md:grid-cols-6">
              {benefits.map((b) => (
                <div key={b.t} className="text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/60 text-gold">
                    <b.icon className="h-5 w-5" strokeWidth={1.2} />
                  </div>
                  <div className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-cream">{b.t}</div>
                  <div className="mt-1 text-[11px] text-cream/60">{b.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}