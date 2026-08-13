import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getInvoiceOrderFn, type OrderItem } from "@/lib/orders.functions";
import { formatINR } from "@/lib/products";
import { GSTIN, GST_RATE, includedGst } from "@/lib/tax";

export const Route = createFileRoute("/_authenticated/invoice/$id")({
  head: () => ({ meta: [{ title: "Invoice — YOMORA" }, { name: "robots", content: "noindex" }] }),
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getInvoice = useServerFn(getInvoiceOrderFn);
  const invoiceQuery = useQuery({ queryKey: ["invoice", id], queryFn: () => getInvoice({ data: { id } }) });
  if (invoiceQuery.isLoading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading invoice…</div>;
  if (invoiceQuery.isError || !invoiceQuery.data) return <div className="grid min-h-screen place-items-center gap-4"><p className="text-sm text-muted-foreground">This invoice is unavailable.</p><button onClick={() => navigate({ to: "/account" })} className="text-xs text-gold">← BACK TO ACCOUNT</button></div>;

  const order = invoiceQuery.data;
  const details = order.invoice_details ?? {};
  const items = (order.items as OrderItem[]) ?? [];
  const subtotal = order.subtotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = order.discount_amount || details.discount || 0;
  const taxRate = details.tax_rate ?? GST_RATE;
  const tax = includedGst(order.total, taxRate);
  const invoiceNumber = details.invoice_number || `YM-${order.id.slice(0, 8).toUpperCase()}`;
  const sellerName = details.seller_name || "YOMORA";

  return <div className="min-h-screen bg-[#f7f2eb] text-[#1d1815]">
    <style>{`@media print { header, footer, .invoice-actions { display:none !important; } .invoice-shell { max-width:none !important; padding:0 !important; } body { background:#fff !important; } }`}</style>
    <SiteHeader />
    <main className="invoice-shell mx-auto max-w-[980px] px-4 py-10 md:py-14">
      <div className="invoice-actions mb-6 flex flex-wrap justify-between gap-3"><Link to="/account" className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[#5f4b36] hover:text-[#b88442]"><ArrowLeft className="h-4 w-4" /> MY ACCOUNT</Link><div className="flex gap-2"><button onClick={() => window.print()} className="inline-flex items-center gap-2 border border-[#b88442] px-4 py-2 text-[11px] font-semibold tracking-[0.18em] hover:bg-[#ead4b0]"><Printer className="h-4 w-4" /> PRINT</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-[#1d1815] px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-white"><Download className="h-4 w-4" /> DOWNLOAD PDF</button></div></div>
      <section className="border border-[#d8cfc3] bg-white p-7 shadow-sm md:p-12">
        <div className="flex flex-wrap items-start justify-between gap-8 border-b border-[#ded6cc] pb-8"><div><img src="/yomora-logo.png" alt={sellerName} className="h-16 w-auto max-w-[260px] object-contain object-left" /><p className="mt-3 text-[10px] font-semibold tracking-[0.26em] text-[#665b50]">BY NEHALBHAI DEVIKA JEWELLERS</p><p className="mt-3 text-xs font-semibold text-[#665b50]">GSTIN: {GSTIN}</p>{details.seller_address && <p className="mt-5 max-w-xs whitespace-pre-wrap text-xs leading-relaxed text-[#665b50]">{details.seller_address}</p>}{details.seller_phone && <p className="mt-2 text-xs text-[#665b50]">{details.seller_phone}</p>}</div><div className="text-right"><p className="font-display text-4xl text-[#1d1815]">INVOICE</p><dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-xs"><dt className="text-[#665b50]">Invoice no.</dt><dd className="font-medium">{invoiceNumber}</dd><dt className="text-[#665b50]">Invoice date</dt><dd>{new Date(order.created_at).toLocaleDateString("en-IN")}</dd><dt className="text-[#665b50]">Order no.</dt><dd>#{order.id.slice(0, 8).toUpperCase()}</dd></dl></div></div>
        <div className="grid gap-8 py-8 md:grid-cols-2"><div><p className="text-[10px] font-semibold tracking-[0.22em] text-[#a87335]">BILL TO</p><p className="mt-3 font-medium">{order.customer_name}</p><p className="mt-1 text-sm text-[#665b50]">{order.customer_email}</p>{order.customer_phone && <p className="mt-1 text-sm text-[#665b50]">{order.customer_phone}</p>}</div><div><p className="text-[10px] font-semibold tracking-[0.22em] text-[#a87335]">SHIP TO</p><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#665b50]">{order.shipping_address || "—"}</p></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-[#eee7de] text-[10px] tracking-[0.16em] text-[#5d5146]"><tr><th className="px-4 py-3 font-semibold">DESCRIPTION</th><th className="px-4 py-3 text-right font-semibold">UNIT PRICE</th><th className="px-4 py-3 text-right font-semibold">QTY</th><th className="px-4 py-3 text-right font-semibold">TOTAL</th></tr></thead><tbody>{items.map((item, index) => <tr key={`${item.id}-${index}`} className="border-b border-[#eee8e1]"><td className="px-4 py-4 font-medium">{item.name}</td><td className="px-4 py-4 text-right text-[#665b50]">{formatINR(item.price)}</td><td className="px-4 py-4 text-right text-[#665b50]">{item.quantity}</td><td className="px-4 py-4 text-right">{formatINR(item.price * item.quantity)}</td></tr>)}</tbody></table></div>
        <div className="mt-7 ml-auto max-w-sm text-sm"><div className="flex justify-between py-2 text-[#665b50]"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>{discount > 0 && <div className="flex justify-between py-2 text-[#665b50]"><span>{order.coupon_code ? `Coupon (${order.coupon_code})` : "Discount"}</span><span>− {formatINR(discount)}</span></div>}<div className="flex justify-between py-2 text-[#665b50]"><span>Included GST ({taxRate}%)</span><span>{formatINR(tax)}</span></div><div className="mt-2 flex justify-between border-t-2 border-[#1d1815] pt-3 font-display text-xl"><span>TOTAL</span><span>{formatINR(order.total)}</span></div></div>
        <div className="mt-12 grid gap-7 border-t border-[#ded6cc] pt-7 md:grid-cols-2"><div>{details.bank_details && <><p className="text-[10px] font-semibold tracking-[0.22em] text-[#a87335]">BANK DETAILS</p><p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-[#665b50]">{details.bank_details}</p></>}</div><div className="text-left md:text-right"><p className="text-[10px] font-semibold tracking-[0.22em] text-[#a87335]">THANK YOU</p><p className="mt-3 text-sm text-[#665b50]">{details.thank_you_note || "Thank you for choosing YOMORA."}</p>{details.notes && <p className="mt-3 whitespace-pre-wrap text-xs text-[#665b50]">{details.notes}</p>}</div></div>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
