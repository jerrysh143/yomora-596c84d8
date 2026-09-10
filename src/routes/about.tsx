import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — YOMORA 925 Sterling Silver" },
      {
        name: "description",
        content:
          "A legacy of trust since 1994 — the story behind YOMORA by Nehalbhai Devika Jewellers.",
      },
      { property: "og:title", content: "Our Story — YOMORA" },
      { property: "og:description", content: "A legacy of trust since 1994." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useQuery(siteContentQuery());
  const c = data?.page_about ?? SITE_CONTENT_DEFAULTS.page_about;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1400px] py-16">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{c.eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">{c.title}</h1>
        <div className="mt-10 grid gap-12 md:grid-cols-2">
          <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
            {c.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="flex aspect-[4/3] items-center justify-center border border-gold/25 bg-onyx p-10 text-center text-cream">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.28em] text-gold">OUR HOME</p>
              <p className="mt-4 font-display text-4xl">Ahmedabad, Gujarat</p>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-cream/65">
                Family jewellers serving customers across India with hallmarked 925 sterling silver.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-6 border-y border-border py-10 md:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl text-gold">{s.value}</div>
              <div className="mt-2 text-[11px] tracking-[0.24em] text-muted-foreground">
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
