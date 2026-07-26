import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order — YOMORA" },
      { name: "description", content: "Track the status of your YOMORA order in real time." },
      { property: "og:title", content: "Track Your Order — YOMORA" },
      { property: "og:description", content: "Track your YOMORA order." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const [shown, setShown] = useState(false);
  const { data } = useQuery(siteContentQuery());
  const c = data?.page_track_order ?? SITE_CONTENT_DEFAULTS.page_track_order;
  const steps = [
    { t: "Order Confirmed", d: "10 May 2024, 10:30 AM", done: true },
    { t: "Order Processing", d: "10 May 2024, 11:15 AM", done: true },
    { t: "Shipped", d: "11 May 2024, 09:40 AM", done: true },
    { t: "Out for Delivery", d: "12 May 2024, 10:20 AM", done: true },
    { t: "Delivered", d: "12 May 2024, 03:30 PM", done: true },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1100px] py-12">
        <h1 className="font-display text-4xl">{c.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <form onSubmit={(e) => { e.preventDefault(); setShown(true); }} className="space-y-4 border border-border p-6">
            <label className="block">
              <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">{c.order_id_label}</span>
              <input required placeholder="Enter your Order ID" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">{c.email_label}</span>
              <input required type="email" placeholder="Enter your Email" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
            </label>
            <button className="w-full bg-gold py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx">{c.button_label}</button>
            <p className="pt-2 text-xs text-muted-foreground">{c.help_text}</p>
          </form>
          <div className="border border-border p-6">
            {shown ? (
              <ol className="space-y-6">
                {steps.map((s, i) => (
                  <li key={s.t} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`grid h-8 w-8 place-items-center rounded-full ${s.done ? "bg-gold text-onyx" : "border border-border text-muted-foreground"}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      {i < steps.length - 1 && <div className="h-10 w-px bg-border" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{s.t}</div>
                      <div className="text-xs text-muted-foreground">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">{c.empty_message}</p>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}