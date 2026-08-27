import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ExternalLink, Loader2, MapPin, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { type OrderStatus } from "@/lib/orders.functions";
import { trackShipmentFn } from "@/lib/shipments.functions";

type TrackingResult = Awaited<ReturnType<typeof trackShipmentFn>>;

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
  const trackOrder = useServerFn(trackShipmentFn);
  const [tracking, setTracking] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [formError, setFormError] = useState("");
  const { data } = useQuery(siteContentQuery());
  const c = data?.page_track_order ?? SITE_CONTENT_DEFAULTS.page_track_order;
  const steps = result && !result.shipment ? orderSteps(result.order.status as OrderStatus, result.order.created_at, result.order.updated_at) : [];
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
            const orderId = String(form.get("order_id") ?? "").trim();
            const customerEmail = String(form.get("customer_email") ?? "").trim();
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
              setFormError("Please enter the complete Order ID from your confirmation email.");
              return;
            }
            setTracking(true);
            setResult(null);
            setFormError("");
            try {
              const order = await trackOrder({ data: { order_id: orderId, customer_email: customerEmail } });
              setResult(order);
            } catch (error) {
              const message = friendlyTrackingError(error);
              setFormError(message);
              toast.error(message);
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
            {formError && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</p>}
            <p className="pt-2 text-xs text-muted-foreground">{c.help_text}</p>
          </form>
          <div className="border border-border p-6">
            {result ? (
              <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
                <div><p className="text-[10px] font-semibold tracking-[0.22em] text-gold">YOMORA DELIVERY</p><p className="mt-1 text-xs text-muted-foreground">Order #{result.order.id.slice(0, 8).toUpperCase()}</p></div>
                {result.shipment?.awbCode && <div className="text-right"><p className="text-[10px] tracking-[0.18em] text-muted-foreground">AWB</p><p className="font-mono text-xs">{result.shipment.awbCode}</p></div>}
              </div>
              {result.shipment ? <>
                <div className="mb-6 grid gap-3 bg-onyx p-5 text-cream sm:grid-cols-2">
                  <div><p className="text-[10px] tracking-[0.2em] text-gold">CURRENT STATUS</p><p className="mt-1 font-display text-2xl capitalize">{result.shipment.status.replaceAll("_", " ")}</p></div>
                  <div className="sm:text-right"><p className="text-[10px] tracking-[0.2em] text-gold">COURIER</p><p className="mt-1 text-sm">{result.shipment.carrierName || "Courier assignment in progress"}</p></div>
                </div>
                <ol className="space-y-0">
                  {(result.shipment.activities.length ? result.shipment.activities : [{ activity: "Shipment created", date: result.order.updated_at, location: "YOMORA" }]).map((activity, i, all) => (
                    <li key={`${activity.date}-${i}`} className="flex gap-4">
                      <div className="flex flex-col items-center"><div className="grid h-9 w-9 place-items-center rounded-full bg-gold text-onyx">{i === 0 ? <PackageCheck className="h-4 w-4" /> : <Truck className="h-4 w-4" />}</div>{i < all.length - 1 && <div className="h-12 w-px bg-gold/35" />}</div>
                      <div className="pb-6"><div className="text-sm font-semibold capitalize">{activity.activity.toLowerCase()}</div><div className="mt-1 text-xs text-muted-foreground">{activity.date ? new Date(activity.date.replace(" ", "T")).toLocaleString("en-IN") : ""}</div>{activity.location && <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {activity.location}</div>}</div>
                    </li>
                  ))}
                </ol>
                {result.shipment.estimatedDeliveryDate && <p className="mt-2 border-t border-border pt-4 text-xs text-muted-foreground">Estimated delivery: <span className="font-semibold text-foreground">{new Date(result.shipment.estimatedDeliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></p>}
                {result.shipment.trackingUrl && <a href={result.shipment.trackingUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 border border-gold px-4 py-2.5 text-[10px] font-semibold tracking-[0.18em] text-gold hover:bg-gold hover:text-onyx">OPEN COURIER TRACKING <ExternalLink className="h-3.5 w-3.5" /></a>}
              </> : <>
                <p className="mb-5 text-sm text-muted-foreground">Your order is confirmed. Courier tracking will appear here as soon as the shipment is created.</p>
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
              </>}
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

function friendlyTrackingError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/order_id|uuid|complete order id|invalid_format/i.test(message)) {
    return "Please enter the complete Order ID from your confirmation email.";
  }
  if (/customer_email|email/i.test(message) && /invalid|valid|format/i.test(message)) {
    return "Please enter a valid email address.";
  }
  if (/no order matches/i.test(message)) {
    return "We couldn't find an order matching that Order ID and email address.";
  }
  return "We couldn't track this order right now. Please try again shortly.";
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
