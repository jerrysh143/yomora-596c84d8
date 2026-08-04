import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Heart, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
import { SiteIcon } from "@/lib/site-icons";
import { SocialLinks } from "@/components/social-links";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { SearchOverlay } from "@/components/search-overlay";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = headerRef.current?.offsetHeight ?? 0;
      if (h) setHeaderH(h);
      setStuck(window.scrollY > h);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const { data: siteContent } = useQuery(siteContentQuery());
  const header = siteContent?.header ?? SITE_CONTENT_DEFAULTS.header;
  const headerNav = siteContent?.header_nav ?? SITE_CONTENT_DEFAULTS.header_nav;
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const nav: { label: string; to: string; hash: string }[] = [
    ...headerNav.items.map((i) => ({ label: i.label, to: i.to || "/products", hash: i.hash || "" })),
  ];

  return (
    <>
      {stuck && <div style={{ height: headerH }} aria-hidden />}
    <header
      ref={headerRef}
      className={
        stuck
          ? "fixed inset-x-0 top-0 z-50 w-full animate-in slide-in-from-top-4 bg-onyx/95 text-cream shadow-lg backdrop-blur supports-[backdrop-filter]:bg-onyx/85"
          : "relative z-50 w-full bg-onyx text-cream"
      }
    >
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
      <div className="container-x mx-auto max-w-[1400px] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 lg:grid-cols-[auto_1fr_auto] lg:gap-6 lg:py-5">
        <Link to="/" className="flex min-w-0 flex-col leading-none">
          <span className="truncate font-display text-2xl tracking-[0.18em] text-gold sm:text-3xl">{header.brand_name}</span>
          <span className="mt-1 truncate text-[9px] tracking-[0.24em] text-cream/60 sm:text-[10px] sm:tracking-[0.28em]">{header.brand_tagline}</span>
        </Link>

        <nav className="hidden items-center justify-center gap-6 text-xs font-medium tracking-[0.18em] lg:flex xl:gap-8">
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

        <div className="flex shrink-0 items-center gap-1 text-cream/85 sm:gap-2 lg:gap-3">
          <SocialLinks placement="header" className="mr-1 hidden xl:flex" iconClassName="h-4 w-4" />
          <button aria-label="Search" onClick={() => setSearchOpen(true)} className="rounded-full p-1.5 hover:text-gold sm:p-2"><Search className="h-5 w-5" /></button>
          <Link to="/wishlist" aria-label="Wishlist" className="relative rounded-full p-1.5 hover:text-gold sm:p-2">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-semibold text-onyx">{wishlistCount}</span>
            )}
          </Link>
          <Link
            to={signedIn ? "/account" : "/auth"}
            aria-label={signedIn ? "My account" : "Sign in"}
            title={signedIn ? "My account" : "Sign in"}
            className="rounded-full p-1.5 hover:text-gold sm:p-2"
          >
            <User className="h-5 w-5" />
          </Link>
          {signedIn && (
            <button
              type="button"
              aria-label="Logout"
              title="Logout"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (!error) window.location.assign("/");
              }}
              className="rounded-full p-1.5 hover:text-gold sm:p-2"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
          <Link to="/cart" aria-label="Cart" className="relative rounded-full p-1.5 hover:text-gold sm:p-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-semibold text-onyx">{count}</span>
          </Link>
        </div>
      </div>

    </header>
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
