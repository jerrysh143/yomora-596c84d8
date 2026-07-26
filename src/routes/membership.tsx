import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
        <div className="container-x mx-auto max-w-[1400px] grid gap-10 py-16 md:grid-cols-2">
          <div>
            <h1 className="font-display text-5xl leading-tight md:text-6xl">
              BLACK SIGNATURE<br />MEMBERSHIP
            </h1>
            <p className="mt-4 text-sm text-cream/70">One Membership. Exclusive Privileges.</p>
            {plans[0] && (
              <>
                <p className="mt-8 font-display text-4xl text-gold">
                  {formatINR(plans[0].price)} <span className="text-lg text-cream/60">/ Year</span>
                </p>
                <p className="mt-2 text-xs text-cream/60">or Get Free with ₹25,000 Shopping</p>
                <button className="mt-8 bg-gold px-8 py-3 text-[11px] font-semibold tracking-[0.28em] text-onyx">JOIN NOW</button>
              </>
            )}
          </div>
          <div className="grid place-items-center">
            <div className="grid aspect-[1.6/1] w-full max-w-sm place-items-center border border-gold/40 bg-gradient-to-br from-black to-onyx p-8">
              <div className="text-center">
                <div className="font-display text-3xl tracking-[0.2em] text-gold">YOMORA</div>
                <div className="mt-2 text-[11px] tracking-[0.3em] text-cream/70">BLACK SIGNATURE</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-x mx-auto max-w-[1400px] py-12">
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