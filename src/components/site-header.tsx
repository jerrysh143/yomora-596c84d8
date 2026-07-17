import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Menu, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { CATEGORIES } from "@/lib/products";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const nav = [
    ...CATEGORIES.map((c) => ({ label: c.label.toUpperCase(), hash: c.slug })),
    { label: "COLLECTIONS", hash: "" },
    { label: "NEW ARRIVALS", hash: "new" },
  ];

  return (
    <header className="w-full bg-onyx text-cream">
      {/* Utility strip */}
      <div className="border-b border-white/5">
        <div className="container-x mx-auto max-w-[1400px] flex flex-wrap items-center justify-center gap-x-8 gap-y-1 py-2 text-[11px] tracking-wide text-cream/80">
          <span className="inline-flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-gold" /> Free Shipping Across India</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> 925 Hallmarked Silver</span>
          <span className="inline-flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5 text-gold" /> Easy 7-Day Returns</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="container-x mx-auto max-w-[1400px] grid grid-cols-[auto_1fr_auto] items-center gap-6 py-5">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-3xl tracking-[0.18em] text-gold">YOMORA</span>
          <span className="mt-1 text-[10px] tracking-[0.28em] text-cream/60">BY NEHALBHAI DEVIKA JEWELLERS</span>
        </Link>

        <nav className="hidden items-center justify-center gap-8 text-xs font-medium tracking-[0.18em] lg:flex">
          {nav.map((n) => (
            <Link
              key={n.label}
              to="/products"
              hash={n.hash || undefined}
              className="text-cream/85 transition-colors hover:text-gold"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-cream/85">
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
                to="/products"
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