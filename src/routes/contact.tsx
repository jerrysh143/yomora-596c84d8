import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SocialLinks } from "@/components/social-links";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — YOMORA" },
      { name: "description", content: "Get in touch with the YOMORA team for support, custom orders and enquiries." },
      { property: "og:title", content: "Contact Us — YOMORA" },
      { property: "og:description", content: "We're here to help." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1200px] py-12">
        <h1 className="font-display text-5xl">Get in Touch</h1>
        <p className="mt-2 text-sm text-muted-foreground">We're here to help you.</p>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <Info icon={Phone} title="PHONE" lines={["+91 98765 43210", "Mon – Sat: 10:00 AM – 7:00 PM"]} />
            <Info icon={Mail} title="EMAIL" lines={["support@yomora.in"]} />
            <Info icon={MapPin} title="ADDRESS" lines={["YOMORA by Nehalbhai Devika Jewellers,", "122, NR Road, Andheri West,", "Mumbai, Maharashtra – 400058"]} />
            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-gold">FOLLOW US</p>
              <SocialLinks placement="footer" className="mt-3" />
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4 border border-border p-6">
            <Field label="Name"><input required placeholder="Enter your name" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></Field>
            <Field label="Email"><input required type="email" placeholder="Enter your email" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></Field>
            <Field label="Phone"><input required placeholder="Enter your phone number" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></Field>
            <Field label="Message"><textarea required rows={5} placeholder="How can we help you?" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></Field>
            <button className="w-full bg-gold py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx">SEND MESSAGE</button>
            {sent && <p className="text-xs text-gold">Thank you — we'll be in touch shortly.</p>}
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Info({ icon: Icon, title, lines }: { icon: React.ComponentType<{ className?: string }>; title: string; lines: string[] }) {
  return (
    <div className="flex gap-4">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-gold text-gold"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-[11px] font-semibold tracking-[0.24em] text-gold">{title}</div>
        {lines.map((l) => <div key={l} className="text-sm text-muted-foreground">{l}</div>)}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</span>{children}</label>;
}