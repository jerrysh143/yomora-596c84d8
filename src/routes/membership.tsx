import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Banknote, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { subscriptionPlansQuery } from "@/lib/subscription.queries";
import { formatINR } from "@/lib/products";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { getIcon } from "@/lib/icon-map";

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
  const { data: content } = useQuery(siteContentQuery());
  const m = content?.page_membership ?? SITE_CONTENT_DEFAULTS.page_membership;
  const activePlans = plans.filter((p) => p.is_active);
  const primary = activePlans[0];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] px-4 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-semibold tracking-[0.32em] text-cream/60">{m.eyebrow}</p>
              <h1 className="mt-3 font-display text-4xl leading-[1.05] text-cream md:text-6xl">
                {m.title_line_1}
              </h1>
              <p className="mt-2 font-display text-2xl tracking-[0.35em] text-gold md:text-3xl">
                {m.title_line_2}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3 md:justify-start">
                <span className="h-px w-10 bg-gold/60" />
                <span className="text-gold">✦</span>
                <span className="h-px w-10 bg-gold/60" />
              </div>
              <p className="mt-4 text-[11px] font-semibold tracking-[0.42em] text-cream/70">
                {(primary?.tagline || m.tagline_fallback).toUpperCase()}
              </p>
            </div>

            {primary && (
              <div className="border border-gold/30 bg-black/40 p-6 md:p-8">
                <p className="text-center text-[11px] font-semibold tracking-[0.3em] text-gold">
                  {m.unlock_title}
                </p>
                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/60 text-gold">
                      <Banknote className="h-5 w-5" strokeWidth={1.2} />
                    </div>
                    <div className="mt-3 font-display text-xl text-gold">{m.pay_label} {formatINR(primary.price)}</div>
                    <div className="mt-1 text-[11px] text-cream/60">{m.pay_note}</div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-gold/60 text-[10px] font-semibold tracking-[0.2em] text-gold">
                    {m.or_label}
                  </div>
                  <div className="text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/60 text-gold">
                      <ShoppingBag className="h-5 w-5" strokeWidth={1.2} />
                    </div>
                    <div className="mt-3 font-display text-xl text-gold">{m.shop_amount_label}</div>
                    <div className="mt-1 text-[11px] text-cream/60">{m.shop_note}</div>
                  </div>
                </div>
                <p className="mt-6 text-center text-[11px] text-cream/60">{m.validity_note}</p>
              </div>
            )}
          </div>

          <div className="mt-14 grid place-items-center">
            <div className="relative aspect-[1.6/1] w-full max-w-md">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a] shadow-[0_40px_100px_-30px_rgba(212,175,55,0.55)]" />
              <div className="absolute inset-3 rounded-lg border border-gold/40" />
              <div className="absolute inset-5 rounded-md border border-gold/15" />
              <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="font-display text-4xl tracking-[0.22em] text-gold md:text-5xl">{m.card_title}</div>
                <div className="mt-1 text-[9px] tracking-[0.32em] text-cream/60">{m.card_subtitle}</div>
                <div className="mt-6 h-px w-24 bg-gold/50" />
                <div className="mt-5 font-display text-2xl tracking-[0.22em] text-cream md:text-3xl">
                  {m.card_line_1}
                </div>
                <div className="mt-1 text-[10px] tracking-[0.34em] text-gold">{m.card_line_2}</div>
                <div className="mt-4 text-[9px] tracking-[0.3em] text-cream/50">{m.card_line_3}</div>
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
                {m.privileges_title}
              </p>
              <span className="text-gold/60">✦</span>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              {m.privileges.map((b, i) => {
                const Icon = getIcon(b.icon);
                return (
                  <div key={b.title + i} className="text-center">
                    <div className="mx-auto grid h-11 w-11 place-items-center text-gold">
                      <Icon className="h-6 w-6" strokeWidth={1.2} />
                    </div>
                    <div className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-cream">{b.title.replace(/15%/gi, "25%")}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-cream/60">{b.description.replace(/15%/gi, "25%")}</div>
                  </div>
                );
              })}
            </div>
            <p className="mt-12 text-center text-[10px] tracking-[0.34em] text-cream/50">{m.privileges_footer}</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
