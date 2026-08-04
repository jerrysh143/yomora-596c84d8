import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { trackOrderFn, type OrderStatus } from "@/lib/orders.functions";

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
  const trackOrder = useServerFn(trackOrderFn);
  const [tracking, setTracking] = useState(false);
  const [result, setResult] = useState<{ id: string; status: OrderStatus; created_at: string; updated_at: string } | null>(null);
  const { data } = useQuery(siteContentQuery());
  const c = data?.page_track_order ?? SITE_CONTENT_DEFAULTS.page_track_order;
  const steps = result ? orderSteps(result.status, result.created_at, result.updated_at) : [];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1100px] py-12">
        <h1 className="font-display text-4xl">{c.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (tracking) return;
            const form = new FormData(e.currentTarget);
            setTracking(true);
            setResult(null);
            try {
              const order = await trackOrder({ data: { order_id: String(form.get("order_id") ?? ""), customer_email: String(form.get("customer_email") ?? "") } });
              setResult(order as { id: string; status: OrderStatus; created_at: string; updated_at: string });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to track this order");
            } finally {
              setTracking(false);
            }
          }} className="space-y-4 border border-border p-6">
            <label className="block">
              <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">{c.order_id_label}</span>
              <input name="order_id" required placeholder="Enter your complete Order ID" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">{c.email_label}</span>
              <input name="customer_email" required type="email" placeholder="Enter your Email" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
            </label>
            <button disabled={tracking} className="flex w-full items-center justify-center gap-2 bg-gold py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx disabled:opacity-50">{tracking && <Loader2 className="h-4 w-4 animate-spin" />}{tracking ? "TRACKING…" : c.button_label}</button>
            <p className="pt-2 text-xs text-muted-foreground">{c.help_text}</p>
          </form>
          <div className="border border-border p-6">
            {result ? (
              <>
              <p className="mb-5 text-xs text-muted-foreground">Order #{result.id.slice(0, 8).toUpperCase()}</p>
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
              </>
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

function orderSteps(status: OrderStatus, createdAt: string, updatedAt: string) {
  const created = new Date(createdAt).toLocaleString("en-IN");
  const updated = new Date(updatedAt).toLocaleString("en-IN");
  if (status === "cancelled") return [
    { t: "Order Confirmed", d: created, done: true },
    { t: "Order Cancelled", d: updated, done: true },
  ];
  return [
    { t: "Order Confirmed", d: created, done: true },
    { t: "Order Processing", d: status === "pending" ? "In progress" : updated, done: true },
    { t: "Completed", d: status === "completed" ? updated : "Waiting for fulfilment", done: status === "completed" },
  ];
}
