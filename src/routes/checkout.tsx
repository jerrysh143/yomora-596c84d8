import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { cart, useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";
import { createOrderFn } from "@/lib/orders.functions";
import { validateCouponFn } from "@/lib/coupons.functions";
import { supabase } from "@/integrations/supabase/client";
import { getMyMembershipFn } from "@/lib/memberships.functions";
import { subscriptionPlansQuery } from "@/lib/subscription.queries";
import { GST_RATE, formatTaxINR, inclusiveTaxBreakdown } from "@/lib/tax";

const COMPLIMENTARY_MEMBERSHIP_THRESHOLD = 25_000;

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — YOMORA" },
      { name: "description", content: "Complete your YOMORA order — secure checkout." },
      { property: "og:title", content: "Checkout — YOMORA" },
      { property: "og:description", content: "Secure checkout." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const createOrder = useServerFn(createOrderFn);
  const validateCoupon = useServerFn(validateCouponFn);
  const getMyMembership = useServerFn(getMyMembershipFn);
  const [pay, setPay] = useState("upi");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [authReady, setAuthReady] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    description: string;
    memberOnly: boolean;
    subtotal: number;
    discount: number;
  } | null>(null);
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["checkout", "membership"],
    queryFn: () => getMyMembership(),
    enabled: authReady,
  });
  const { data: membershipPlans = [] } = useQuery(subscriptionPlansQuery());
  const activeMembershipPlan = membershipPlans.find((plan) => plan.is_active);
  const hasActiveMembership = membership?.status === "active" &&
    (!membership.expires_at || new Date(membership.expires_at).getTime() > Date.now());
  const currentCoupon = appliedCoupon?.subtotal === subtotal ? appliedCoupon : null;
  const discount = currentCoupon?.discount ?? 0;
  const total = subtotal - discount;
  const tax = inclusiveTaxBreakdown(subtotal, discount);
  const qualifiesForMembership = total >= COMPLIMENTARY_MEMBERSHIP_THRESHOLD;
  const membershipRemaining = Math.max(0, COMPLIMENTARY_MEMBERSHIP_THRESHOLD - total);

  useEffect(() => {
    let active = true;
    const applySession = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!session) {
        navigate({ to: "/auth", search: { redirect: "/checkout" }, replace: true });
        return;
      }
      if (!active) return;
      const metadata = session.user.user_metadata ?? {};
      const addresses = Array.isArray(metadata.addresses) ? metadata.addresses : [];
      const firstAddress = addresses.find((address: unknown) => !!address && typeof address === "object" && typeof (address as { value?: unknown }).value === "string") as { value?: string } | undefined;
      setCustomerEmail(session.user.email ?? "");
      setCustomerName(typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : "");
      setCustomerPhone(typeof metadata.phone === "string" ? metadata.phone : "");
      setAddressLine(firstAddress?.value ?? "");
      setAuthReady(true);
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [navigate]);

  useEffect(() => {
    if (pincode.length !== 6) {
      setPincodeStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPincodeStatus("loading");
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Pincode lookup failed");
        const payload = await response.json() as Array<{
          Status?: string;
          PostOffice?: Array<{ District?: string; State?: string }>;
        }>;
        const office = payload?.[0]?.PostOffice?.[0];
        if (payload?.[0]?.Status !== "Success" || !office?.District || !office?.State) {
          throw new Error("Pincode not found");
        }
        setCity(office.District);
        setState(office.State);
        setPincodeStatus("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPincodeStatus("error");
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [pincode]);

  if (!authReady) {
    return <div className="min-h-screen bg-background"><SiteHeader /><div className="container-x mx-auto max-w-[1400px] py-24 text-sm text-muted-foreground">Checking your YOMORA account…</div><SiteFooter /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1400px] py-12">
        <h1 className="font-display text-4xl">Checkout</h1>
        {orderId ? (
          <div className="mt-8 max-w-2xl border border-gold bg-gold/10 p-8">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-gold">ORDER RECEIVED</p>
            <h2 className="mt-2 font-display text-3xl">Thank you for shopping with YOMORA.</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Your order has been saved and is now visible in YOMORA Admin.
            </p>
            <p className="mt-5 text-sm">
              Order number: <span className="font-mono font-semibold text-gold">{orderId}</span>
            </p>
            <Link to="/products" className="mt-6 inline-block bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-onyx">
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (items.length === 0 || submitting) return;
            const form = new FormData(e.currentTarget);
            setSubmitting(true);
            try {
              const order = await createOrder({
                data: {
                  customer_name: String(form.get("customer_name") ?? ""),
                  customer_email: String(form.get("customer_email") ?? ""),
                  customer_phone: String(form.get("customer_phone") ?? ""),
                  shipping_address: [
                    form.get("address_line"),
                    form.get("city"),
                    form.get("state"),
                    form.get("pincode"),
                  ]
                    .map((value) => String(value ?? "").trim())
                    .filter(Boolean)
                    .join(", "),
                  payment_method: pay as "upi" | "card" | "netbank" | "cod",
                  coupon_code: currentCoupon?.code,
                  items: items.map((item) => ({ id: item.id, quantity: item.qty })),
                },
              });
              cart.clear();
              setOrderId(order.id);
              toast.success("Order placed successfully");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to place order");
            } finally {
              setSubmitting(false);
            }
          }}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="space-y-8">
            <fieldset className="border border-border p-6">
              <legend className="px-2 text-xs font-semibold tracking-[0.24em] text-gold">1. CONTACT INFORMATION</legend>
              <div className="grid gap-4">
                <Input
                  name="customer_email"
                  label="Email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  readOnly
                />
                <Input name="customer_phone" label="Phone" required placeholder="+91 98765 43210" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
              </div>
            </fieldset>
            <fieldset className="border border-border p-6">
              <legend className="px-2 text-xs font-semibold tracking-[0.24em] text-gold">2. SHIPPING ADDRESS</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="customer_name" label="Full name" required value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                <div>
                  <Input
                    name="pincode"
                    label="Pincode"
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={pincode}
                    onChange={(event) => {
                      setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setPincodeStatus("idle");
                    }}
                  />
                  <p className={`mt-1 text-[10px] ${pincodeStatus === "error" ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
                    {pincodeStatus === "loading" && "Finding city and state…"}
                    {pincodeStatus === "success" && "City and state filled automatically."}
                    {pincodeStatus === "error" && "Pincode not found. Please enter city and state manually."}
                  </p>
                </div>
                <Input name="address_line" label="Address line" required className="md:col-span-2" value={addressLine} onChange={(event) => setAddressLine(event.target.value)} />
                <Input name="city" label="City" required autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} />
                <Input name="state" label="State" required autoComplete="address-level1" value={state} onChange={(event) => setState(event.target.value)} />
              </div>
            </fieldset>
            <fieldset className="border border-border p-6">
              <legend className="px-2 text-xs font-semibold tracking-[0.24em] text-gold">3. PAYMENT METHOD</legend>
              <div className="space-y-3 text-sm">
                {[
                  ["upi", "UPI / Google Pay / PhonePe"],
                  ["card", "Credit / Debit Card"],
                  ["netbank", "Net Banking"],
                  ["cod", "Cash on Delivery"],
                ].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-3 border border-border px-4 py-3">
                    <input type="radio" name="pay" value={v} checked={pay === v} onChange={() => setPay(v)} />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <aside className="border border-border p-6 h-max">
            <h2 className="text-xs font-semibold tracking-[0.28em] text-gold">ORDER SUMMARY</h2>
            <div className="mt-4 space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3">
                  <img src={i.image} alt="" width={48} height={48} loading="lazy" decoding="async" className="h-12 w-12 object-cover" />
                  <div className="flex-1 text-sm">
                    <div className="font-display">{i.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {i.qty}</div>
                  </div>
                  <div className="text-sm">{formatINR(i.price * i.qty)}</div>
                  <button
                    type="button"
                    onClick={() => {
                      cart.remove(i.id);
                      if (appliedCoupon) setAppliedCoupon(null);
                      toast.success(`${i.name} removed`);
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-destructive"
                    title={`Remove ${i.name}`}
                    aria-label={`Remove ${i.name} from order`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground">No items in cart. <Link to="/products" className="text-gold">Shop now</Link></p>}
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <Row k="Product Amount (before GST)" v={formatTaxINR(tax.productAmount)} />
              {discount > 0 && <Row k={`Discount (${currentCoupon?.code})`} v={`− ${formatTaxINR(tax.discountAmount)}`} />}
              <Row k="Taxable Amount" v={formatTaxINR(tax.taxableAmount)} bold />
              <Row k={`GST @ ${GST_RATE}%`} v={formatTaxINR(tax.gstAmount)} />
              <Row k="Shipping" v="FREE" />
              <div className="my-3 h-px bg-border" />
              <Row k="Invoice Total" v={formatTaxINR(tax.invoiceTotal)} bold />
            </dl>
            {!membershipLoading && !hasActiveMembership && <div className={`mt-5 border p-4 ${qualifiesForMembership ? "border-gold bg-gold/10" : "border-border bg-secondary/20"}`}>
              <div className="flex gap-3">
                <Crown className={`mt-0.5 h-5 w-5 shrink-0 ${qualifiesForMembership ? "text-gold" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-gold">
                    {qualifiesForMembership ? "COMPLIMENTARY MEMBERSHIP INCLUDED" : "ADD BLACK SIGNATURE MEMBERSHIP"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {qualifiesForMembership
                      ? "Your one-year membership will activate when this order is completed."
                      : activeMembershipPlan
                        ? `Join for ${formatINR(activeMembershipPlan.price)} and receive member privileges for ${activeMembershipPlan.duration_label || "one year"}. Or add ${formatINR(membershipRemaining)} more to this order to unlock membership complimentary.`
                        : `Add ${formatINR(membershipRemaining)} more to this order to unlock a complimentary one-year membership.`}
                  </p>
                  {!qualifiesForMembership && (
                    <Link to="/membership-dashboard" className="mt-3 inline-flex border border-gold px-3 py-2 text-[10px] font-semibold tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-onyx">
                      {activeMembershipPlan ? `GET MEMBERSHIP · ${formatINR(activeMembershipPlan.price)}` : "VIEW MEMBERSHIP"}
                    </Link>
                  )}
                </div>
              </div>
            </div>}
            <div className="mt-5 border-t border-border pt-5">
              <label className="block text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
                COUPON CODE
              </label>
              {currentCoupon ? (
                <div className="mt-2 border border-gold bg-gold/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-gold">{currentCoupon.code} APPLIED</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {currentCoupon.description || `You save ${formatINR(currentCoupon.discount)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
                      className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground hover:text-foreground"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex">
                  <input
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    maxLength={40}
                    className="min-w-0 flex-1 border border-border bg-background px-3 py-2.5 text-sm uppercase outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    disabled={!couponInput.trim() || items.length === 0 || validatingCoupon}
                    onClick={async () => {
                      setValidatingCoupon(true);
                      try {
                        const result = await validateCoupon({
                          data: {
                            code: couponInput,
                            items: items.map((item) => ({ id: item.id, quantity: item.qty })),
                            ...(customerEmail.trim() ? { customer_email: customerEmail.trim() } : {}),
                          },
                        });
                        setAppliedCoupon(result);
                        setCouponInput(result.code);
                        toast.success(`Coupon applied. You save ${formatINR(result.discount)}`);
                      } catch (error) {
                        setAppliedCoupon(null);
                        toast.error(error instanceof Error ? error.message : "Unable to apply coupon");
                      } finally {
                        setValidatingCoupon(false);
                      }
                    }}
                    className="border border-l-0 border-gold bg-gold px-4 text-[10px] font-semibold tracking-[0.18em] text-onyx disabled:opacity-40"
                  >
                    {validatingCoupon ? "CHECKING…" : "APPLY"}
                  </button>
                </div>
              )}
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Membership offers require an active membership and a signed-in account.
              </p>
            </div>
            <button disabled={items.length === 0 || submitting} className="mt-6 w-full bg-gold py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx disabled:opacity-40">
              {submitting ? "PLACING ORDER…" : "PLACE ORDER"}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Your order is saved securely and will appear in YOMORA Admin.</p>
          </aside>
        </form>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Input({ label, className = "", ...rest }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</span>
      <input {...rest} className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
    </label>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex items-center justify-between ${bold ? "text-base font-semibold" : ""}`}><dt>{k}</dt><dd>{v}</dd></div>;
}
