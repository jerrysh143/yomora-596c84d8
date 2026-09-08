import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  CircleAlert,
  Clock3,
  CreditCard,
  ExternalLink,
  Home,
  Loader2,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { trackShipmentFn } from "@/lib/shipments.functions";
import { isValidOrderReference } from "@/lib/order-reference";

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
  const journey = result ? buildOrderJourney(result) : null;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1100px] py-12">
        <h1 className="font-display text-4xl">{c.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[340px_minmax(0,1fr)]">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (tracking) return;
              const form = new FormData(e.currentTarget);
              const orderId = String(form.get("order_id") ?? "").trim();
              const customerEmail = String(form.get("customer_email") ?? "").trim();
              if (!isValidOrderReference(orderId)) {
                setFormError("Enter your short order number, for example YM-3A7F91C2.");
                return;
              }
              setTracking(true);
              setResult(null);
              setFormError("");
              try {
                const order = await trackOrder({
                  data: { order_id: orderId, customer_email: customerEmail },
                });
                setResult(order);
              } catch (error) {
                const message = friendlyTrackingError(error);
                setFormError(message);
                toast.error(message);
              } finally {
                setTracking(false);
              }
            }}
            className="space-y-4 border border-border p-6"
          >
            <label className="block">
              <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">
                {c.order_id_label}
              </span>
              <input
                name="order_id"
                required
                placeholder="Example: YM-3A7F91C2"
                className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">
                {c.email_label}
              </span>
              <input
                name="customer_email"
                required
                type="email"
                placeholder="Enter your Email"
                className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <button
              disabled={tracking}
              className="flex w-full items-center justify-center gap-2 bg-gold py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx disabled:opacity-50"
            >
              {tracking && <Loader2 className="h-4 w-4 animate-spin" />}
              {tracking ? "TRACKING…" : c.button_label}
            </button>
            {formError && (
              <p
                role="alert"
                className="border border-gold/45 bg-onyx px-3 py-2.5 text-sm text-cream"
              >
                {formError}
              </p>
            )}
            <p className="pt-2 text-xs text-muted-foreground">{c.help_text}</p>
          </form>
          <div className="border border-border p-6">
            {result && journey ? (
              <>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.22em] text-gold">
                      YOMORA DELIVERY JOURNEY
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Order #{result.order.orderNumber}
                    </p>
                  </div>
                  {result.shipment?.awbCode && (
                    <div className="text-right">
                      <p className="text-[10px] tracking-[0.18em] text-muted-foreground">AWB</p>
                      <p className="font-mono text-xs">{result.shipment.awbCode}</p>
                    </div>
                  )}
                </div>

                <div className="mb-7 grid gap-3 bg-onyx p-5 text-cream sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-gold">CURRENT STATUS</p>
                    <p className="mt-1 font-display text-2xl">{journey.currentLabel}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[10px] tracking-[0.2em] text-gold">COURIER</p>
                    <p className="mt-1 text-sm">
                      {result.shipment?.carrierName || "Courier assignment in progress"}
                    </p>
                  </div>
                </div>

                {journey.exception && (
                  <div className="mb-6 flex gap-3 border border-gold/50 bg-gold/10 p-4">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="text-sm font-semibold">Delivery needs attention</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {journey.exception}
                      </p>
                    </div>
                  </div>
                )}

                <ol>
                  {journey.steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <li key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`grid h-9 w-9 place-items-center rounded-full ${step.state === "complete" ? "bg-gold text-onyx" : step.state === "current" ? "border-2 border-gold bg-gold/10 text-gold" : "border border-border text-muted-foreground"}`}
                          >
                            {step.state === "complete" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          {index < journey.steps.length - 1 && (
                            <div
                              className={`min-h-10 flex-1 w-px ${step.state === "complete" ? "bg-gold/55" : "bg-border"}`}
                            />
                          )}
                        </div>
                        <div className="pb-6">
                          <div
                            className={`text-sm font-semibold ${step.state === "pending" ? "text-muted-foreground" : "text-foreground"}`}
                          >
                            {step.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {step.description}
                          </div>
                          {step.date && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock3 className="h-3 w-3" /> {formatTrackingDate(step.date)}
                            </div>
                          )}
                          {step.location && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {step.location}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {result.shipment?.estimatedDeliveryDate && (
                  <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                    Estimated delivery:{" "}
                    <span className="font-semibold text-foreground">
                      {new Date(result.shipment.estimatedDeliveryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}

                {!!result.shipment?.activities.length && (
                  <details className="mt-5 border border-border p-4">
                    <summary className="cursor-pointer text-[11px] font-semibold tracking-[0.18em] text-gold">
                      VIEW ALL COURIER SCANS ({result.shipment.activities.length})
                    </summary>
                    <ol className="mt-4 space-y-4 border-l border-gold/35 pl-4">
                      {sortActivities(result.shipment.activities).map((activity, index) => (
                        <li key={`${activity.date}-${activity.activity}-${index}`}>
                          <p className="text-xs font-semibold capitalize">
                            {activity.activity.toLowerCase()}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatTrackingDate(activity.date)}
                            {activity.location ? ` · ${activity.location}` : ""}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}

                {result.shipment?.trackingUrl && (
                  <a
                    href={result.shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 border border-gold px-4 py-2.5 text-[10px] font-semibold tracking-[0.18em] text-gold hover:bg-gold hover:text-onyx"
                  >
                    OPEN COURIER TRACKING <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
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
  if (/order_id|uuid|order number|invalid_format/i.test(message)) {
    return "Please enter your short order number, for example YM-3A7F91C2.";
  }
  if (/customer_email|email/i.test(message) && /invalid|valid|format/i.test(message)) {
    return "Please enter a valid email address.";
  }
  if (/no order matches/i.test(message)) {
    return "We couldn't find an order matching that order number and email address.";
  }
  return "We couldn't track this order right now. Please try again shortly.";
}

type ShipmentActivity = NonNullable<TrackingResult["shipment"]>["activities"][number];
type JourneyState = "complete" | "current" | "pending";
type JourneyStep = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  state: JourneyState;
  date?: string | null;
  location?: string;
};

function normalized(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replaceAll("_", " ").replace(/\s+/g, " ").trim();
}

function activityMatching(activities: ShipmentActivity[], pattern: RegExp) {
  return sortActivities(activities).find((activity) => pattern.test(normalized(activity.activity)));
}

function buildOrderJourney(result: TrackingResult) {
  const shipment = result.shipment;
  const activities = shipment?.activities ?? [];
  const trackingText = normalized(
    [shipment?.status, shipment?.subStatus, ...activities.map((item) => item.activity)].join(" "),
  );
  const matches = (pattern: RegExp) => pattern.test(trackingText);
  const activity = (pattern: RegExp) => activityMatching(activities, pattern);
  const cod = shipment?.paymentMethod === "COD";
  const paymentComplete = cod || result.payment?.status === "completed";

  const delivered = !!shipment?.deliveredAt || matches(/\bdelivered\b|delivery completed/);
  const outForDelivery = delivered || matches(/out for delivery|ofd\b/);
  const destinationHub =
    outForDelivery ||
    matches(/destination hub|destination center|delivery (hub|centre|center)|nearest hub/);
  const inTransit = destinationHub || matches(/in transit|line haul|departed|shipped|moving to/);
  const pickedUp = inTransit || matches(/picked up|pickup done|shipment picked|handed over/);
  const pickupScheduled =
    pickedUp || matches(/pickup scheduled|pickup booked|pickup assigned|ready for pickup/);
  const shipmentCreated =
    pickupScheduled ||
    !!shipment?.awbCode ||
    matches(/ready to ship|manifested|shipment created|packed/);

  let currentIndex = 1;
  if (paymentComplete) currentIndex = 2;
  if (shipmentCreated) currentIndex = 3;
  if (pickupScheduled) currentIndex = 4;
  if (pickedUp) currentIndex = 5;
  if (inTransit) currentIndex = 6;
  if (destinationHub) currentIndex = 7;
  if (outForDelivery) currentIndex = 8;
  if (delivered) currentIndex = 9;

  const stateFor = (index: number): JourneyState => {
    if (delivered || index < currentIndex) return "complete";
    if (index === currentIndex) return "current";
    return "pending";
  };
  const milestone = (pattern: RegExp) => activity(pattern);
  const paymentDate = result.payment?.paidAt || result.payment?.verifiedAt;
  const packedEvent = milestone(/packed|ready to ship|manifested|shipment created/);
  const pickupScheduledEvent = milestone(
    /pickup scheduled|pickup booked|pickup assigned|ready for pickup/,
  );
  const pickedUpEvent = milestone(/picked up|pickup done|shipment picked|handed over/);
  const transitEvent = milestone(/in transit|line haul|departed|shipped|moving to/);
  const destinationEvent = milestone(
    /destination hub|destination center|delivery (hub|centre|center)|nearest hub/,
  );
  const outEvent = milestone(/out for delivery|ofd\b/);
  const deliveredEvent = milestone(/\bdelivered\b|delivery completed/);

  const steps: JourneyStep[] = [
    {
      key: "placed",
      title: "Order placed",
      description: "Your YOMORA order has been received.",
      icon: PackageCheck,
      state: "complete",
      date: result.order.created_at,
      location: "YOMORA",
    },
    {
      key: "payment",
      title: cod ? "Cash on delivery selected" : "Payment verified",
      description: cod
        ? "Payment will be collected when the parcel arrives."
        : paymentComplete
          ? "Your QR payment was confirmed by YOMORA Admin."
          : result.payment?.status === "proof_submitted"
            ? "Payment proof is under verification."
            : "Waiting for payment proof and verification.",
      icon: CreditCard,
      state: stateFor(1),
      date: cod ? result.order.created_at : paymentDate,
    },
    {
      key: "accepted",
      title: "Order accepted and processing",
      description: paymentComplete
        ? "The jewellery is being prepared for dispatch."
        : "Begins after payment confirmation.",
      icon: Clock3,
      state: stateFor(2),
      date: paymentDate,
    },
    {
      key: "packed",
      title: "Packed and shipment created",
      description: shipmentCreated
        ? "Securely packed and an AWB has been assigned."
        : "Waiting for packing and courier assignment.",
      icon: Package,
      state: stateFor(3),
      date: packedEvent?.date || (shipmentCreated ? shipment?.createdAt : null),
      location: packedEvent?.location,
    },
    {
      key: "pickup-scheduled",
      title: "Courier pickup scheduled",
      description: pickupScheduled
        ? "The courier pickup has been arranged."
        : "Pickup details will appear after packing.",
      icon: Clock3,
      state: stateFor(4),
      date: pickupScheduledEvent?.date,
      location: pickupScheduledEvent?.location,
    },
    {
      key: "picked-up",
      title: "Picked up by courier",
      description: pickedUp
        ? "The parcel is now with the delivery partner."
        : "Waiting for courier collection.",
      icon: Truck,
      state: stateFor(5),
      date: pickedUpEvent?.date,
      location: pickedUpEvent?.location,
    },
    {
      key: "transit",
      title: "In transit",
      description: inTransit
        ? "The parcel is moving through the courier network."
        : "Journey updates will appear after pickup.",
      icon: Navigation,
      state: stateFor(6),
      date: transitEvent?.date,
      location: transitEvent?.location,
    },
    {
      key: "destination",
      title: "Reached destination hub",
      description: destinationHub
        ? "The parcel has reached your local delivery area."
        : "Waiting to reach the destination delivery hub.",
      icon: Warehouse,
      state: stateFor(7),
      date: destinationEvent?.date,
      location: destinationEvent?.location,
    },
    {
      key: "out",
      title: "Out for delivery",
      description: outForDelivery
        ? "The courier is delivering your parcel today."
        : "The courier will update this when delivery starts.",
      icon: Truck,
      state: stateFor(8),
      date: outEvent?.date,
      location: outEvent?.location,
    },
    {
      key: "delivered",
      title: "Delivered",
      description: delivered
        ? "Your YOMORA order has been delivered."
        : "Final delivery confirmation will appear here.",
      icon: Home,
      state: stateFor(9),
      date: shipment?.deliveredAt || deliveredEvent?.date,
      location: deliveredEvent?.location,
    },
  ];

  const exceptionPattern =
    /cancelled|canceled|rto\b|return to origin|failed|undelivered|ndr\b|exception|lost|damaged|delayed/;
  const exceptionEvent = activity(exceptionPattern);
  const cancelled = result.order.status === "cancelled";
  const exception = cancelled
    ? `This order was cancelled on ${formatTrackingDate(result.order.updated_at)}.`
    : matches(exceptionPattern)
      ? `${exceptionEvent?.activity || shipment?.subStatus || shipment?.status || "The courier reported an exception."}${exceptionEvent?.location ? ` · ${exceptionEvent.location}` : ""}`
      : null;
  const currentStep = steps[currentIndex];
  return {
    steps,
    exception,
    currentLabel: cancelled
      ? "Order cancelled"
      : exception
        ? normalized(shipment?.subStatus || shipment?.status || "Delivery exception").replace(
            /\b\w/g,
            (letter) => letter.toUpperCase(),
          )
        : currentStep.title,
  };
}

function trackingDateValue(value: string) {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortActivities(activities: ShipmentActivity[]) {
  return [...activities].sort(
    (left, right) => trackingDateValue(right.date) - trackingDateValue(left.date),
  );
}

function formatTrackingDate(value: string | null | undefined) {
  if (!value) return "Update time unavailable";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN");
}
