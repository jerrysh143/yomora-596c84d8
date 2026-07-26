import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, ShoppingBag, MapPin, Heart, Star, Crown, LogOut } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — YOMORA" },
      { name: "description", content: "Manage your YOMORA orders, addresses and membership." },
      { property: "og:title", content: "My Account — YOMORA" },
      { property: "og:description", content: "Your YOMORA dashboard." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState("dashboard");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav({ to: "/auth" });
      else setEmail(data.session.user.email ?? "");
    });
  }, [nav]);
  const menu = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["orders", "My Orders", ShoppingBag],
    ["addresses", "My Addresses", MapPin],
    ["wishlist", "My Wishlist", Heart],
    ["reviews", "My Reviews", Star],
    ["membership", "Black Signature Membership", Crown],
    ["details", "Account Details", LayoutDashboard],
  ] as const;

  const orders = [
    { id: "YOM1234", d: "12 May 2024", s: "Delivered", a: 1888 },
    { id: "YOM1187", d: "28 Apr 2024", s: "Delivered", a: 2499 },
    { id: "YOM1056", d: "10 Apr 2024", s: "Delivered", a: 999 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1400px] py-10">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <aside className="border border-border p-5 h-max">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gold text-onyx font-display text-xl">{(email?.[0] ?? "Y").toUpperCase()}</div>
              <div>
                <div className="font-display text-sm">Welcome</div>
                <div className="text-xs text-muted-foreground truncate max-w-[160px]">{email}</div>
              </div>
            </div>
            <ul className="mt-6 space-y-1 text-sm">
              {menu.map(([k, l, I]) => (
                <li key={k}>
                  <button onClick={() => setTab(k)} className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left ${tab === k ? "bg-gold text-onyx" : "hover:bg-secondary/60"}`}>
                    <I className="h-4 w-4" /> {l}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </li>
            </ul>
          </aside>

          <div>
            <h1 className="font-display text-4xl">Dashboard</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { k: 3, l: "Orders" },
                { k: 2, l: "Wishlist" },
                { k: 1, l: "Reviews" },
                { k: "Black", l: "Member" },
              ].map((s) => (
                <div key={s.l} className="border border-border p-6 text-center">
                  <div className="font-display text-3xl text-gold">{s.k}</div>
                  <div className="mt-1 text-[11px] tracking-[0.24em] text-muted-foreground">{s.l.toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 border border-border">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="text-xs font-semibold tracking-[0.24em] text-gold">RECENT ORDERS</h2>
                <Link to="/track-order" className="text-xs tracking-[0.2em] text-muted-foreground hover:text-gold">VIEW ALL</Link>
              </div>
              <ul className="divide-y divide-border text-sm">
                {orders.map((o) => (
                  <li key={o.id} className="grid grid-cols-4 items-center px-5 py-3">
                    <span className="text-gold">Order #{o.id}</span>
                    <span className="text-muted-foreground">{o.d}</span>
                    <span>{o.s}</span>
                    <span className="text-right">₹{o.a.toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}