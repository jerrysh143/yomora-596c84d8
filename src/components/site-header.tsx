import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery } from "@/lib/categories.queries";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { SiteIcon } from "@/lib/site-icons";
import { SocialLinks } from "@/components/social-links";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: siteContent } = useQuery(siteContentQuery());
  const header = siteContent?.header ?? SITE_CONTENT_DEFAULTS.header;
  const headerNav = siteContent?.header_nav ?? SITE_CONTENT_DEFAULTS.header_nav;
  const nav: { label: string; to: string; hash: string }[] = [
    ...(headerNav.include_categories
      ? categories.map((c) => ({ label: c.label.toUpperCase(), to: "/products", hash: c.slug }))
      : []),
    ...headerNav.items.map((i) => ({ label: i.label, to: i.to || "/products", hash: i.hash || "" })),
  ];

  return (
    <header className="w-full bg-onyx text-cream">
      {/* Utility strip */}
      <div className="border-b border-white/5">
        <div className="container-x mx-auto max-w-[1400px] flex flex-wrap items-center justify-center gap-x-8 gap-y-1 py-2 text-[11px] tracking-wide text-cream/80">
          {header.announcements.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <SiteIcon name={a.icon} className="h-3.5 w-3.5 text-gold" /> {a.text}
            </span>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <div className="container-x mx-auto max-w-[1400px] grid grid-cols-[auto_1fr_auto] items-center gap-6 py-5">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-3xl tracking-[0.18em] text-gold">{header.brand_name}</span>
          <span className="mt-1 text-[10px] tracking-[0.28em] text-cream/60">{header.brand_tagline}</span>
        </Link>

        <nav className="hidden items-center justify-center gap-8 text-xs font-medium tracking-[0.18em] lg:flex">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              hash={n.hash || undefined}
              className="text-cream/85 transition-colors hover:text-gold"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-cream/85">
          <SocialLinks placement="header" className="mr-1 hidden sm:flex" iconClassName="h-4 w-4" />
          <button aria-label="Search" className="rounded-full p-2 hover:text-gold"><Search className="h-5 w-5" /></button>
          <Link
            to={signedIn ? "/admin" : "/auth"}
            aria-label={signedIn ? "Admin dashboard" : "Sign in"}
            className="rounded-full p-2 hover:text-gold"
          >
            <User className="h-5 w-5" />
          </Link>
          <button aria-label="Cart" className="relative rounded-full p-2 hover:text-gold">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-semibold text-onyx">0</span>
          </button>
          <button aria-label="Menu" onClick={() => setOpen((v) => !v)} className="rounded-full p-2 hover:text-gold lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 lg:hidden">
          <nav className="container-x mx-auto flex flex-col gap-1 py-3 text-sm">
            {nav.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                hash={n.hash || undefined}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 tracking-[0.16em] text-cream/85 hover:bg-white/5 hover:text-gold"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}