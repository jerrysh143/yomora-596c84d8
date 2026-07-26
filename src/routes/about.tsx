import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — YOMORA 925 Sterling Silver" },
      { name: "description", content: "A legacy of trust since 1994 — the story behind YOMORA by Nehalbhai Devika Jewellers." },
      { property: "og:title", content: "Our Story — YOMORA" },
      { property: "og:description", content: "A legacy of trust since 1994." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1400px] py-16">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">OUR STORY</p>
        <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">A Legacy Built on Trust</h1>
        <div className="mt-10 grid gap-12 md:grid-cols-2">
          <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
            <p>It all began in 1994 when Late Shri Nehalbhai Devjibhai and Smt. Devikaben Nehalbhai laid the foundation of trust, purity and craftsmanship.</p>
            <p>For over 32 years, we have earned the trust of thousands of families. Now, we bring this legacy to the digital world with premium 925 silver jewellery under YOMORA.</p>
            <p>Every piece we make is a promise — of hallmarked purity, timeless design and the warmth of a family business that has always put its customers first.</p>
          </div>
          <div className="bg-secondary/40 aspect-[4/3]" />
        </div>
        <div className="mt-16 grid grid-cols-2 gap-6 border-y border-border py-10 md:grid-cols-4">
          {[
            { k: "32+", v: "Years of Legacy" },
            { k: "1000+", v: "Happy Customers Daily" },
            { k: "5★", v: "Customer Rating" },
            { k: "100%", v: "Hallmarked Purity" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="font-display text-4xl text-gold">{s.k}</div>
              <div className="mt-2 text-[11px] tracking-[0.24em] text-muted-foreground">{s.v.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <h2 className="font-display text-3xl">Our Flagship Store</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] bg-secondary/40" />
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}