import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Phone, Mail, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SocialLinks } from "@/components/social-links";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { createInquiryFn } from "@/lib/inquiries.functions";

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
  const [sending, setSending] = useState(false);
  const createInquiry = useServerFn(createInquiryFn);
  const { data } = useQuery(siteContentQuery());
  const c = data?.page_contact ?? SITE_CONTENT_DEFAULTS.page_contact;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1200px] py-12">
        <h1 className="font-display text-5xl">{c.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.subtitle}</p>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <Info icon={Phone} title="PHONE" lines={c.phone_lines} />
            <Info icon={Mail} title="EMAIL" lines={[c.email]} />
            <Info icon={MapPin} title="ADDRESS" lines={c.address_lines} />
            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-gold">FOLLOW US</p>
              <SocialLinks placement="footer" className="mt-3" />
            </div>
          </div>
          <form onSubmit={async (e) => { e.preventDefault(); if (sending) return; const form = e.currentTarget; const values = new FormData(form); setSending(true); setSent(false); try { await createInquiry({ data: { inquiry_type: "contact", name: String(values.get("name") ?? ""), email: String(values.get("email") ?? ""), phone: String(values.get("phone") ?? ""), message: String(values.get("message") ?? "") } }); setSent(true); form.reset(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to send your message"); } finally { setSending(false); } }} className="space-y-4 border border-border p-6">
            <Field label="Name"><input name="name" required placeholder="Enter your name" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></Field>
            <Field label="Email"><input name="email" required type="email" placeholder="Enter your email" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></Field>
            <Field label="Phone"><input name="phone" required placeholder="Enter your phone number" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></Field>
            <Field label="Message"><textarea name="message" required rows={5} placeholder="How can we help you?" className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></Field>
            <button disabled={sending} className="w-full bg-gold py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx disabled:opacity-50">{sending ? "SENDING…" : c.form_button_label}</button>
            {sent && <p className="text-xs text-gold">{c.form_success_message}</p>}
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
