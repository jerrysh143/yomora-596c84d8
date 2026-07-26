import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Minus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — YOMORA" },
      { name: "description", content: "Answers to common questions about 925 silver, sizing, shipping and returns." },
      { property: "og:title", content: "FAQ — YOMORA" },
      { property: "og:description", content: "Frequently asked questions about YOMORA." },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  const { data } = useQuery(siteContentQuery());
  const c = data?.page_faq ?? SITE_CONTENT_DEFAULTS.page_faq;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1200px] py-12">
        <h1 className="font-display text-4xl md:text-5xl">{c.title}</h1>
        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-border border-y border-border">
            {c.items.map((f, i) => (
              <li key={f.question + i}>
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between py-5 text-left">
                  <span className="font-display text-lg">{f.question}</span>
                  {open === i ? <Minus className="h-4 w-4 text-gold" /> : <Plus className="h-4 w-4 text-gold" />}
                </button>
                {open === i && <p className="pb-5 text-sm text-muted-foreground">{f.answer}</p>}
              </li>
            ))}
          </ul>
          <aside className="border border-border p-6 text-center h-max">
            <p className="font-display text-2xl">{c.aside_title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.aside_body}</p>
            <a href="/contact" className="mt-5 inline-block bg-onyx px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-cream">{c.aside_button_label}</a>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}