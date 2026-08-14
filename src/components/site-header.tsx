import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Heart, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";
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
          ? "fixed inset-x-0 top-0 z-50 w-full animate-in slide-in-from-top-4 bg-onyx text-cream"
          : "relative z-50 w-full bg-onyx text-cream"
      }
    >
      {/* Main nav */}
      <div className="px-3 py-2.5 sm:px-5 sm:py-3 lg:px-8">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/10 bg-onyx px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] sm:gap-4 sm:px-4 lg:gap-5 lg:px-5">
          <Link to="/" className="flex min-w-0 self-center items-center" aria-label={`${header.brand_name} home`}>
            <img src="/yomora-option-3-symbol.png" alt="" className="h-10 w-auto object-contain sm:hidden" />
            <img src="/yomora-logo.png" alt={`${header.brand_name} - ${header.brand_tagline}`} className="hidden h-12 w-auto max-w-[230px] object-contain sm:block xl:h-14 xl:max-w-[260px]" />
          </Link>

          <div className="flex shrink-0 items-center gap-0 text-cream/80 sm:gap-0.5">
          <SocialLinks placement="header" className="mr-1 hidden 2xl:flex" iconClassName="h-4 w-4" />
          <button aria-label="Search" onClick={() => setSearchOpen(true)} className="rounded-full p-1.5 transition-colors hover:bg-white/5 hover:text-gold sm:p-2"><Search className="h-[18px] w-[18px] sm:h-5 sm:w-5" /></button>
          <Link to="/wishlist" aria-label="Wishlist" className="relative rounded-full p-1.5 transition-colors hover:bg-white/5 hover:text-gold sm:p-2">
            <Heart className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-semibold text-onyx">{wishlistCount}</span>
            )}
          </Link>
          <Link
            to={signedIn ? "/account" : "/auth"}
            aria-label={signedIn ? "My account" : "Sign in"}
            title={signedIn ? "My account" : "Sign in"}
            className="rounded-full p-1.5 transition-colors hover:bg-white/5 hover:text-gold sm:p-2"
          >
            <User className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
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
              className="rounded-full p-1.5 transition-colors hover:bg-white/5 hover:text-gold sm:p-2"
            >
              <LogOut className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
            </button>
          )}
          <Link to="/cart" aria-label="Cart" className="relative rounded-full p-1.5 transition-colors hover:bg-white/5 hover:text-gold sm:p-2">
            <ShoppingBag className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-semibold text-onyx">{count}</span>
          </Link>
          </div>
        </div>
      </div>

    </header>
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
