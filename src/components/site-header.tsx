import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Heart, LogOut, Menu, X, ChevronRight, Crown, Gem, PackageSearch } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
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
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);
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
      <div className="mx-auto grid h-[68px] max-w-[1760px] grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:h-[78px] sm:px-8 lg:px-14">
          <div className="flex items-center justify-self-start gap-3 text-[11px] font-semibold tracking-[0.08em] md:gap-5">
            <button type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="grid h-10 w-10 place-items-center transition-colors hover:text-gold"><Menu className="h-6 w-6" strokeWidth={1.6} /></button>
            <span className="hidden whitespace-nowrap md:inline">INR <span className="mx-2 text-white/40">|</span> EN</span>
            <span className="hidden h-5 w-px bg-white/35 md:block" />
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="hidden p-1 transition-colors hover:text-gold md:block"><Search className="h-6 w-6" strokeWidth={1.6} /></button>
          </div>

          <Link to="/" className="flex min-w-0 shrink items-center justify-self-center" aria-label={`${header.brand_name} home`}>
            <img src="/yomora-logo.png" width={1800} height={390} alt={`${header.brand_name} - ${header.brand_tagline}`} className="h-9 w-auto max-w-[175px] object-contain sm:h-12 sm:max-w-[240px] xl:h-14 xl:max-w-[285px]" />
          </Link>

          <div className="flex shrink-0 items-center justify-self-end gap-0.5 text-white/90 sm:gap-1">
          <button aria-label="Search" onClick={() => setSearchOpen(true)} className="flex h-10 items-center p-1.5 transition-colors hover:text-gold md:hidden"><Search className="h-5 w-5" /></button>
          <Link
            to={signedIn ? "/account" : "/auth"}
            aria-label={signedIn ? "My account" : "Sign in"}
            title={signedIn ? "My account" : "Sign in"}
            className="hidden h-10 items-center p-1.5 transition-colors hover:text-gold sm:p-2 md:flex"
          >
            <User className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.6} />
          </Link>
          <Link to="/wishlist" aria-label={`Wishlist (${wishlistCount} items)`} className="relative hidden h-10 items-center gap-1 p-1.5 transition-colors hover:text-gold sm:p-2 md:flex">
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

      <nav className="hidden h-[58px] items-center justify-center gap-7 border-t border-white/10 text-sm font-semibold tracking-[0.02em] md:flex lg:gap-10" aria-label="Main navigation">
        <Link to="/products" className="transition-colors hover:text-gold">New In</Link>
        <Link to="/products" className="transition-colors hover:text-gold">Jewellery</Link>
        <Link to="/products" className="transition-colors hover:text-gold">Collections</Link>
        <Link to="/membership" className="transition-colors hover:text-gold">Black Membership</Link>
        <Link to="/custom-jewellery" className="hidden transition-colors hover:text-gold lg:inline">Custom Jewellery</Link>
        <Link to="/about" className="transition-colors hover:text-gold">About Us</Link>
      </nav>

    </header>

    {menuOpen && (
      <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Site menu">
        <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
        <aside className="relative flex h-full w-[88%] max-w-[410px] flex-col overflow-y-auto bg-onyx text-cream shadow-2xl">
          <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
            <Link to="/" onClick={() => setMenuOpen(false)} aria-label="YOMORA home">
              <img src="/yomora-logo.png" width={1800} height={390} alt="YOMORA" className="h-10 w-auto max-w-[210px] object-contain" />
            </Link>
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="grid h-11 w-11 place-items-center transition-colors hover:text-gold">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-3 border-b border-white/10">
            <Link to={signedIn ? "/account" : "/auth"} onClick={() => setMenuOpen(false)} className="grid min-h-24 place-items-center border-r border-white/10 px-2 py-4 text-center transition-colors hover:bg-white/5 hover:text-gold">
              <span><User className="mx-auto h-6 w-6" strokeWidth={1.5} /><span className="mt-2 block text-[10px] font-semibold tracking-[0.12em]">{signedIn ? "ACCOUNT" : "SIGN IN"}</span></span>
            </Link>
            <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="grid min-h-24 place-items-center border-r border-white/10 px-2 py-4 text-center transition-colors hover:bg-white/5 hover:text-gold">
              <span><Heart className="mx-auto h-6 w-6" strokeWidth={1.5} /><span className="mt-2 block text-[10px] font-semibold tracking-[0.12em]">WISHLIST ({wishlistCount})</span></span>
            </Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)} className="grid min-h-24 place-items-center px-2 py-4 text-center transition-colors hover:bg-white/5 hover:text-gold">
              <span><ShoppingBag className="mx-auto h-6 w-6" strokeWidth={1.5} /><span className="mt-2 block text-[10px] font-semibold tracking-[0.12em]">CART ({count})</span></span>
            </Link>
          </div>

          <nav className="flex-1 px-5 py-5" aria-label="Menu navigation">
            <DrawerLink to="/products" label="New In" icon={<Gem className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <DrawerLink to="/products" label="Shop All Jewellery" icon={<ShoppingBag className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <DrawerLink to="/membership" label="Black Signature Membership" icon={<Crown className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <DrawerLink to="/custom-jewellery" label="Custom Jewellery" icon={<Gem className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <DrawerLink to="/track-order" label="Track Your Order" icon={<PackageSearch className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <DrawerLink to="/about" label="About YOMORA" icon={<User className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <DrawerLink to="/contact" label="Contact Us" icon={<ChevronRight className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
          </nav>

          <div className="border-t border-white/10 px-5 py-5 text-xs text-white/55">
            <p className="font-semibold tracking-[0.12em] text-gold">YOMORA CARE</p>
            <p className="mt-2 leading-relaxed">Certified 925 silver • Secure payments • Easy returns</p>
            {signedIn && (
              <button type="button" onClick={async () => { const { error } = await supabase.auth.signOut(); if (!error) window.location.assign("/"); }} className="mt-4 inline-flex items-center gap-2 text-cream hover:text-gold">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
          </div>
        </aside>
      </div>
    )}
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function DrawerLink({ to, label, icon, onClick }: { to: "/products" | "/membership" | "/custom-jewellery" | "/track-order" | "/about" | "/contact"; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-4 border-b border-white/10 py-4 transition-colors hover:text-gold">
      <span className="shrink-0 text-gold">{icon}</span>
      <span className="flex-1 text-sm font-medium tracking-[0.03em]">{label}</span>
      <ChevronRight className="h-4 w-4 text-white/45" />
    </Link>
  );
}
