import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { getIcon } from "@/lib/icon-map";

export const Route = createFileRoute("/custom-jewellery")({
  head: () => ({
    meta: [
      { title: "Custom Jewellery — YOMORA" },
      { name: "description", content: "Personalized 925 silver jewellery designed and crafted to your requirements." },
      { property: "og:title", content: "Custom Jewellery — YOMORA" },
      { property: "og:description", content: "Made just for you — personalized 925 silver jewellery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomJewelleryPage,
});

function CustomJewelleryPage() {
  const [sent, setSent] = useState(false);
  const { data } = useQuery(siteContentQuery());
  const c = data?.page_custom ?? SITE_CONTENT_DEFAULTS.page_custom;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] grid gap-10 py-16 md:grid-cols-2">
          <div>
            <h1 className="font-display text-5xl md:text-6xl">{c.hero_title}</h1>
            <p className="mt-3 font-display text-2xl text-gold">{c.hero_subtitle}</p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-cream/70">{c.hero_description}</p>
            <ul className="mt-6 space-y-2 text-sm text-cream/85">
              {c.features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="aspect-[4/3] bg-white/5" />
        </div>
      </section>

      <section className="container-x mx-auto max-w-[1400px] py-16">
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{c.steps_eyebrow}</p>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-4">
          {c.steps.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <div key={s.title + i} className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold text-gold">
                  <Icon className="h-6 w-6" strokeWidth={1.2} />
                </div>
                <div className="mt-4 text-xs font-semibold tracking-[0.2em]">{`${String(i + 1).padStart(2, "0")}. ${s.title}`}</div>
                <div className="mt-2 text-xs text-muted-foreground">{s.description}</div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="mx-auto mt-16 grid max-w-2xl gap-4 border border-border p-8"
        >
          <h2 className="font-display text-2xl">{c.form_title}</h2>
          <input required placeholder="Your name" className="border border-border bg-background px-3 py-2.5 text-sm outline-none" />
          <input required type="email" placeholder="Email" className="border border-border bg-background px-3 py-2.5 text-sm outline-none" />
          <input required placeholder="Phone" className="border border-border bg-background px-3 py-2.5 text-sm outline-none" />
          <textarea required placeholder="Describe the piece you have in mind" rows={5} className="border border-border bg-background px-3 py-2.5 text-sm outline-none" />
          <button className="bg-gold px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx">{c.form_button_label}</button>
          {sent && <p className="text-xs text-gold">{c.form_success_message}</p>}
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}