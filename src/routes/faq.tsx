import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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

const FAQS = [
  { q: "What is 925 Sterling Silver?", a: "925 Sterling Silver is an alloy containing 92.5% pure silver — the international standard for high-quality silver jewellery." },
  { q: "How do I know my ring size?", a: "You can measure the inner diameter of a well-fitting ring or request our free ring sizer." },
  { q: "Do you offer Cash on Delivery?", a: "Yes, Cash on Delivery is available on all orders across India." },
  { q: "How long does shipping take?", a: "Orders are dispatched within 24 hours and delivered in 3–7 business days depending on location." },
  { q: "What is your return policy?", a: "We offer easy 7-day returns on all purchases in original condition." },
  { q: "Can I customize my jewellery?", a: "Yes — visit our Custom Jewellery page and share your design with us." },
  { q: "How do I care for my silver jewellery?", a: "Store in an airtight pouch, avoid perfumes and polish gently with a soft cloth." },
];

function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1200px] py-12">
        <h1 className="font-display text-4xl md:text-5xl">Frequently Asked Questions</h1>
        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-border border-y border-border">
            {FAQS.map((f, i) => (
              <li key={f.q}>
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between py-5 text-left">
                  <span className="font-display text-lg">{f.q}</span>
                  {open === i ? <Minus className="h-4 w-4 text-gold" /> : <Plus className="h-4 w-4 text-gold" />}
                </button>
                {open === i && <p className="pb-5 text-sm text-muted-foreground">{f.a}</p>}
              </li>
            ))}
          </ul>
          <aside className="border border-border p-6 text-center h-max">
            <p className="font-display text-2xl">Still have questions?</p>
            <p className="mt-2 text-sm text-muted-foreground">We're here to help!</p>
            <a href="/contact" className="mt-5 inline-block bg-onyx px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-cream">CONTACT US</a>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}