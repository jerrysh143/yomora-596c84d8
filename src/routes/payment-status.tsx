import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Clock3, LockKeyhole, ShieldCheck, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { cart } from "@/lib/cart";
import { getPaymentStatusFn } from "@/lib/payments.functions";

const searchSchema = z.object({ order: z.string().uuid().catch("") });
type PaymentState = "checking" | "pending" | "completed" | "failed" | "cancelled" | "error";

export const Route = createFileRoute("/payment-status")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Payment Status — YOMORA" }] }),
  component: PaymentStatusPage,
});

function PaymentStatusPage() {
  const { order } = Route.useSearch();
  const getPaymentStatus = useServerFn(getPaymentStatusFn);
  const [state, setState] = useState<PaymentState>("checking");

  const refresh = async () => {
    if (!order) return setState("error");
    setState("checking");
    try {
      const result = await getPaymentStatus({ data: { order_id: order } });
      const nextState: PaymentState = ["pending", "completed", "failed", "cancelled"].includes(result.status)
        ? result.status as PaymentState
        : "error";
      setState(nextState);
      if (result.status === "completed") cart.clear();
    } catch {
      setState("error");
    }
  };

  useEffect(() => { void refresh(); }, [order]);

  const completed = state === "completed";
  const pending = state === "checking" || state === "pending";
  const title = completed ? "Payment received" : pending ? "Confirming your payment" : "Payment not completed";
  const message = completed
    ? "Your payment has been verified securely. We will prepare your YOMORA order shortly."
    : pending
      ? "PhonePe is still confirming this transaction. Please wait a moment and check again."
      : state === "error"
        ? "We could not check this payment. Sign in with the account used at checkout and try again."
        : "No amount was charged successfully. Your cart is unchanged, so you can return to checkout and try again.";

  return <div className="min-h-screen bg-background">
    <SiteHeader />
    <main className="container-x mx-auto flex max-w-[900px] justify-center py-20">
      <section className="relative w-full max-w-xl overflow-hidden border border-gold/40 bg-card p-8 text-center shadow-[0_24px_70px_rgba(20,15,10,0.10)] sm:p-12">
        <div className="absolute inset-x-0 top-0 h-1 bg-gold" />
        {completed
          ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          : pending
            ? <Clock3 className="mx-auto h-12 w-12 animate-pulse text-gold" />
            : <XCircle className="mx-auto h-12 w-12 text-destructive" />}
        <p className="mt-6 text-[11px] font-semibold tracking-[0.24em] text-gold">YOMORA SECURE PAYMENT</p>
        <h1 className="mt-2 font-display text-4xl">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
        {order && <p className="mt-5 break-all font-mono text-xs text-muted-foreground">Order {order}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 border-y border-border py-3 text-[9px] font-semibold tracking-[0.14em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> VERIFIED WITH PHONEPE</span>
          <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-gold" /> PAYMENT DATA NOT STORED</span>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {pending && <button type="button" onClick={() => void refresh()} className="bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-onyx">CHECK AGAIN</button>}
          {completed
            ? <Link to="/account" className="bg-onyx px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-cream">VIEW MY ORDERS</Link>
            : !pending && <Link to="/checkout" className="bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-onyx">RETURN TO CHECKOUT</Link>}
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
