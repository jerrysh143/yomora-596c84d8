import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { SocialLinks } from "@/components/social-links";
import { createInquiryFn } from "@/lib/inquiries.functions";

export function SiteFooter() {
  const [joining, setJoining] = useState(false);
  const createInquiry = useServerFn(createInquiryFn);
  const { data: siteContent } = useQuery(siteContentQuery());
  const f = siteContent?.footer ?? SITE_CONTENT_DEFAULTS.footer;
  return (
    <footer className="bg-onyx text-cream/80">
      <div className="container-x mx-auto max-w-[1400px] grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl tracking-[0.18em] text-gold">YOMORA</div>
          <p className="mt-3 text-xs leading-relaxed text-cream/60">{f.brand_blurb}</p>
          <SocialLinks placement="footer" className="mt-4" />
        </div>
        <FooterCol title="Shop" links={f.shop_links} />
        <FooterCol title="Help" links={f.help_links} />
        <div>
          <div className="text-xs font-semibold tracking-[0.24em] text-gold">{f.newsletter_title}</div>
          <p className="mt-3 text-xs text-cream/60">{f.newsletter_body}</p>
          <form onSubmit={async (event) => { event.preventDefault(); if (joining) return; const form = event.currentTarget; const email = String(new FormData(form).get("email") ?? ""); setJoining(true); try { const result = await createInquiry({ data: { inquiry_type: "newsletter", email, name: "", phone: "", message: "" } }); toast.success(result.already ? "You are already subscribed" : "Thank you for joining YOMORA updates"); form.reset(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to subscribe"); } finally { setJoining(false); } }} className="mt-4 flex overflow-hidden rounded-sm border border-white/15">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              name="email"
              required
              type="email"
              aria-label="Email address"
              placeholder="Email address"
              className="flex-1 bg-transparent px-3 py-2 text-xs outline-none placeholder:text-cream/70"
            />
            <button disabled={joining} type="submit" className="bg-gold px-4 text-[11px] font-semibold tracking-[0.18em] text-onyx hover:bg-gold-soft disabled:opacity-50">{joining ? "JOINING…" : "JOIN"}</button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-[11px] tracking-[0.14em] text-cream/50">
        {f.copyright.replace(/^©\s*/, `© ${new Date().getFullYear()} `)}
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-[0.24em] text-gold">{title.toUpperCase()}</div>
      <ul className="mt-3 space-y-2 text-xs text-cream/70">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="hover:text-gold">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
