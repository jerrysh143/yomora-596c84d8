import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Heart, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
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
      if (h) setHeaderH((current) => Math.max(current, h));
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
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <>
      {stuck && <div style={{ height: headerH }} aria-hidden />}
    <header
      ref={headerRef}
      className={
        stuck
          ? "fixed inset-x-0 top-0 z-50 w-full animate-in slide-in-from-top-4 border-b border-white/10 bg-onyx/95 text-cream shadow-xl backdrop-blur-xl"
          : "relative z-50 w-full border-b border-white/10 bg-onyx text-cream"
      }
    >
      <div className="mx-auto flex h-[72px] max-w-[1760px] items-center justify-between gap-2 px-4 sm:h-[78px] sm:gap-3 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr] lg:px-14">
          <div className="hidden items-center gap-6 justify-self-start text-[11px] font-semibold tracking-[0.08em] md:flex">
            <span className="whitespace-nowrap">INR <span className="mx-2 text-white/40">|</span> EN</span>
            <span className="h-5 w-px bg-white/35" />
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="p-1 transition-colors hover:text-gold"><Search className="h-6 w-6" strokeWidth={1.6} /></button>
          </div>

          <Link to="/" className="flex min-w-0 shrink items-center justify-self-center" aria-label={`${header.brand_name} home`}>
            <img src="/yomora-logo.png" alt={`${header.brand_name} - ${header.brand_tagline}`} className="h-10 w-auto max-w-[150px] object-contain sm:h-12 sm:max-w-[240px] xl:h-14 xl:max-w-[285px]" />
          </Link>

          <div className="flex shrink-0 items-center justify-self-end gap-0.5 text-white/90 sm:gap-1">
          <button aria-label="Search" onClick={() => setSearchOpen(true)} className="flex h-10 items-center p-1.5 transition-colors hover:text-gold md:hidden"><Search className="h-5 w-5" /></button>
          <Link
            to={signedIn ? "/account" : "/auth"}
            aria-label={signedIn ? "My account" : "Sign in"}
            title={signedIn ? "My account" : "Sign in"}
            className="flex h-10 items-center p-1.5 transition-colors hover:text-gold sm:p-2"
          >
            <User className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.6} />
          </Link>
          <Link to="/wishlist" aria-label={`Wishlist (${wishlistCount} items)`} className="relative flex h-10 items-center gap-1 p-1.5 transition-colors hover:text-gold sm:p-2">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.6} />
            <span className="min-w-3 text-center text-[11px] font-semibold leading-none">{wishlistCount}</span>
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
              className="hidden h-10 items-center p-1.5 transition-colors hover:text-gold xl:flex"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
          <Link to="/cart" aria-label={`Cart (${count} items)`} className="relative flex h-10 items-center gap-1 p-1.5 transition-colors hover:text-gold sm:p-2">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.6} />
            <span className="min-w-3 text-center text-[11px] font-semibold leading-none">{count}</span>
          </Link>
          </div>
      </div>

      <nav className="hidden h-[58px] items-center justify-center gap-10 border-t border-white/10 text-sm font-semibold tracking-[0.02em] md:flex" aria-label="Main navigation">
        <Link to="/products" className="transition-colors hover:text-gold">New In</Link>
        <Link to="/products" className="transition-colors hover:text-gold">Jewellery</Link>
        <Link to="/products" className="transition-colors hover:text-gold">Collections</Link>
        <Link to="/about" className="transition-colors hover:text-gold">About Us</Link>
      </nav>

    </header>
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
