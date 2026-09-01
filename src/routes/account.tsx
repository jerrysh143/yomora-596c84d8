import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, ShoppingBag, MapPin, Heart, Star, Crown, LogOut, UserRound, Plus, Trash2, Save, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { listMyOrdersFn, type Order } from "@/lib/orders.functions";
import { formatINR } from "@/lib/products";
import { useWishlist, wishlist } from "@/lib/wishlist";
import { listMyReviewsFn, type ProductReview } from "@/lib/reviews.functions";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — YOMORA" },
      { name: "description", content: "Manage your YOMORA orders, addresses, wishlist and membership." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Address = {
  id: string;
  label: string;
  value: string;
  full_name?: string;
  house_number?: string;
  address_line?: string;
  pincode?: string;
  city?: string;
  state?: string;
};
type AddressDraft = { full_name: string; house_number: string; address_line: string; pincode: string; city: string; state: string };
type Profile = { full_name: string; phone: string; addresses: Address[]; marketing_opt_in: boolean };

const emptyProfile: Profile = { full_name: "", phone: "", addresses: [], marketing_opt_in: false };
const emptyAddress: AddressDraft = { full_name: "", house_number: "", address_line: "", pincode: "", city: "", state: "" };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusLabel(status: Order["status"]) {
  return status === "completed" ? "Delivered" : status === "cancelled" ? "Cancelled" : "Pending";
}

function AccountPage() {
  const nav = useNavigate();
  const listMyOrders = useServerFn(listMyOrdersFn);
  const listMyReviews = useServerFn(listMyReviewsFn);
  const { items: wishlistItems } = useWishlist();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [tab, setTab] = useState<"dashboard" | "orders" | "addresses" | "wishlist" | "reviews" | "details">("dashboard");
  const [saving, setSaving] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressDraft>(emptyAddress);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        nav({ to: "/auth", search: { redirect: "/account" }, replace: true });
        return;
      }
      if (!active) return;
      const metadata = data.session.user.user_metadata ?? {};
      const savedAddresses = Array.isArray(metadata.addresses)
        ? metadata.addresses.filter((address: unknown): address is Address =>
            !!address && typeof address === "object" && typeof (address as Address).id === "string" && typeof (address as Address).value === "string",
          )
        : [];
      setEmail(data.session.user.email ?? "");
      setProfile({
        full_name: typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : "",
        phone: typeof metadata.phone === "string" ? metadata.phone : "",
        addresses: savedAddresses,
        marketing_opt_in: metadata.marketing_opt_in === true,
      });
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) nav({ to: "/auth", search: { redirect: "/account" }, replace: true });
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [nav]);

  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders(),
    enabled: !!email,
    refetchInterval: 15_000,
  });
  const orders = ordersQuery.data ?? [];
  const latestOrders = orders.slice(0, 3);
  const reviewsQuery = useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => listMyReviews(),
    enabled: !!email,
  });
  const reviews = reviewsQuery.data ?? [];

  const memberLabel = useMemo(() => "Black Signature", []);

  const saveProfile = async (next: Profile = profile) => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: next.full_name.trim(), phone: next.phone.trim(), addresses: next.addresses, marketing_opt_in: next.marketing_opt_in },
    });
    setSaving(false);
    if (error) { toast.error(error.message); return false; }
    setProfile(next);
    toast.success("Account details saved");
    return true;
  };

  const addAddress = async () => {
    const fields = Object.fromEntries(Object.entries(newAddress).map(([key, value]) => [key, value.trim()])) as AddressDraft;
    if (!fields.full_name || !fields.house_number || !fields.address_line || !/^\d{6}$/.test(fields.pincode) || !fields.city || !fields.state) {
      toast.error("Complete all address fields and enter a valid 6-digit pincode");
      return;
    }
    const value = [fields.full_name, fields.house_number, fields.address_line, fields.city, fields.state, fields.pincode].join(", ");
    const nextAddress: Address = { id: crypto.randomUUID(), label: `Address ${profile.addresses.length + 1}`, value, ...fields };
    const next = { ...profile, addresses: [...profile.addresses, nextAddress] };
    if (await saveProfile(next)) setNewAddress(emptyAddress);
  };

  const removeAddress = (id: string) => saveProfile({ ...profile, addresses: profile.addresses.filter((address) => address.id !== id) });

  const menu = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["orders", "My Orders", ShoppingBag],
    ["addresses", "My Addresses", MapPin],
    ["wishlist", "My Wishlist", Heart],
    ["reviews", "My Reviews", Star],
    ["membership", "Black Signature Membership", Crown],
    ["details", "Account Details", UserRound],
  ] as const;

  const signOut = async () => { await supabase.auth.signOut(); nav({ to: "/" }); };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1400px] py-10">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <aside className="border border-border p-5 h-max">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gold text-onyx font-display text-xl">{(profile.full_name?.[0] || email?.[0] || "Y").toUpperCase()}</div>
              <div className="min-w-0"><div className="font-display text-sm">Welcome{profile.full_name ? `, ${profile.full_name}` : ""}</div><div className="text-xs text-muted-foreground truncate max-w-[160px]">{email}</div></div>
            </div>
            <ul className="mt-6 space-y-1 text-sm">
              {menu.map(([key, label, Icon]) => <li key={key}>{key === "membership" ? <Link to="/membership-dashboard" className="flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-secondary/60"><Icon className="h-4 w-4" /> {label}</Link> : <button onClick={() => setTab(key)} className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left ${tab === key ? "bg-gold text-onyx" : "hover:bg-secondary/60"}`}><Icon className="h-4 w-4" /> {label}</button>}</li>)}
              <li><button onClick={signOut} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Logout</button></li>
            </ul>
          </aside>
          <main>
            {tab === "dashboard" && <Dashboard orders={latestOrders} orderCount={orders.length} wishlistCount={wishlistItems.length} reviewCount={reviews.length} memberLabel={memberLabel} setTab={setTab} />}
            {tab === "orders" && <Orders orders={orders} loading={ordersQuery.isLoading} />}
            {tab === "addresses" && <Addresses addresses={profile.addresses} newAddress={newAddress} setNewAddress={setNewAddress} addAddress={addAddress} removeAddress={removeAddress} saving={saving} />}
            {tab === "wishlist" && <Wishlist items={wishlistItems} />}
            {tab === "reviews" && <MyReviews reviews={reviews} loading={reviewsQuery.isLoading} />}
            {tab === "details" && <Details profile={profile} setProfile={setProfile} save={() => saveProfile()} saving={saving} email={email} />}
          </main>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Dashboard({ orders, orderCount, wishlistCount, reviewCount, memberLabel, setTab }: { orders: Order[]; orderCount: number; wishlistCount: number; reviewCount: number; memberLabel: string; setTab: (tab: "orders" | "wishlist") => void }) {
  return <><h1 className="font-display text-4xl">Dashboard</h1><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat value={orderCount} label="Orders" /><Stat value={wishlistCount} label="Wishlist" /><Stat value={reviewCount} label="Reviews" /><Stat value="Black" label="Member" /></div><div className="mt-10 border border-border"><div className="flex items-center justify-between border-b border-border px-5 py-3"><h2 className="text-xs font-semibold tracking-[0.24em] text-gold">RECENT ORDERS</h2><button onClick={() => setTab("orders")} className="text-xs tracking-[0.2em] text-muted-foreground hover:text-gold">VIEW ALL</button></div>{orders.length ? <OrderRows orders={orders} /> : <div className="p-6 text-sm text-muted-foreground">No orders yet. Your placed orders will appear here automatically.</div>}</div><p className="mt-5 text-xs text-muted-foreground">{memberLabel} membership details are available from the left menu.</p></>;
}

function Stat({ value, label }: { value: string | number; label: string }) { return <div className="border border-border p-6 text-center"><div className="font-display text-3xl text-gold">{value}</div><div className="mt-1 text-[11px] tracking-[0.24em] text-muted-foreground">{label.toUpperCase()}</div></div>; }
function OrderRows({ orders }: { orders: Order[] }) {
  const [copiedId, setCopiedId] = useState("");
  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedId(orderId);
      toast.success("Order ID copied");
      window.setTimeout(() => setCopiedId((current) => current === orderId ? "" : current), 1800);
    } catch {
      toast.error("Unable to copy. Select the Order ID and copy it manually.");
    }
  };
  return <ul className="divide-y divide-border text-sm">{orders.map((order) => <li key={order.id} className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center"><span className="text-gold">Order #{order.id.slice(0, 8).toUpperCase()}</span><span className="text-muted-foreground">{formatDate(order.created_at)}</span><span>{statusLabel(order.status)}</span><span className="flex items-center gap-3 sm:justify-end"><span>{formatINR(order.total)}</span><Link to="/invoice/$id" params={{ id: order.id }} className="text-[10px] font-semibold tracking-[0.16em] text-gold hover:text-foreground">INVOICE</Link></span>{order.payment_status && <div className="flex flex-wrap items-center gap-2 sm:col-span-4"><span className="text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">PAYMENT</span><span className={`px-2 py-1 text-[9px] font-semibold tracking-[0.13em] ${order.payment_status === "completed" ? "bg-gold text-onyx" : order.payment_status === "rejected" ? "bg-destructive/10 text-destructive" : "border border-gold/50 text-gold"}`}>{order.payment_status === "proof_submitted" ? "UNDER VERIFICATION" : order.payment_status.toUpperCase()}</span>{order.payment_verification_code && <code className="text-[10px] text-muted-foreground">{order.payment_verification_code}</code>}</div>}<div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 border-t border-border/60 pt-3 sm:col-span-4"><span className="text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">FULL ORDER ID</span><code className="min-w-0 break-all text-[11px] text-foreground">{order.id}</code><button type="button" onClick={() => void copyOrderId(order.id)} className="inline-flex items-center gap-1 border border-gold/60 px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.12em] text-gold hover:bg-gold hover:text-onyx" aria-label={`Copy Order ID ${order.id}`}>{copiedId === order.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copiedId === order.id ? "COPIED" : "COPY ORDER ID"}</button><Link to="/track-order" className="px-2 py-1.5 text-[9px] font-semibold tracking-[0.12em] text-gold hover:text-foreground">TRACK ORDER →</Link></div>{order.status === "completed" && <div className="flex flex-wrap gap-2 sm:col-span-4">{order.items.map((item) => <Link key={item.id} to="/products/$category" params={{ category: item.id }} hash="reviews" className="border border-gold/50 px-3 py-1.5 text-[9px] font-semibold tracking-[0.14em] text-gold hover:bg-gold hover:text-onyx">REVIEW {item.name.toUpperCase()}</Link>)}</div>}</li>)}</ul>;
}
function Orders({ orders, loading }: { orders: Order[]; loading: boolean }) { return <><h1 className="font-display text-4xl">My Orders</h1><div className="mt-6 border border-border">{loading ? <div className="p-6 text-sm text-muted-foreground">Loading your orders…</div> : orders.length ? <OrderRows orders={orders} /> : <div className="p-6 text-sm text-muted-foreground">No orders found for this account.</div>}</div></>; }
function MyReviews({ reviews, loading }: { reviews: ProductReview[]; loading: boolean }) { return <><h1 className="font-display text-4xl">My Reviews</h1><div className="mt-6 grid gap-4">{loading ? <p className="border border-border p-6 text-sm text-muted-foreground">Loading your reviews…</p> : reviews.length ? reviews.map((review) => <article key={review.id} className="border border-border p-5"><div className="flex flex-wrap items-center justify-between gap-3"><Link to="/products/$category" params={{ category: review.product_id }} hash="reviews" className="text-xs font-semibold tracking-[0.16em] text-gold hover:text-foreground">VIEW PRODUCT</Link><span className="flex text-gold">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-current" : "opacity-25"}`} />)}</span></div><p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{review.comment}</p>{review.media_urls.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto">{review.media_urls.map((url) => /\.(mp4|webm|mov)(?:\?|$)/i.test(url) ? <video key={url} src={url} controls preload="metadata" className="h-24 w-24 shrink-0 bg-onyx object-cover" /> : <img key={url} src={url} alt="Your product review" loading="lazy" className="h-24 w-24 shrink-0 object-cover" />)}</div>}<time className="mt-3 block text-[10px] tracking-[0.14em] text-muted-foreground">{formatDate(review.created_at)}</time></article>) : <p className="border border-border p-6 text-sm text-muted-foreground">You have not submitted a review yet. Review buttons appear under delivered orders.</p>}</div></>; }
function Addresses({ addresses, newAddress, setNewAddress, addAddress, removeAddress, saving }: { addresses: Address[]; newAddress: AddressDraft; setNewAddress: React.Dispatch<React.SetStateAction<AddressDraft>>; addAddress: () => void; removeAddress: (id: string) => void; saving: boolean }) {
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (newAddress.pincode.length !== 6) { setPincodeStatus("idle"); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPincodeStatus("loading");
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${newAddress.pincode}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Pincode lookup failed");
        const payload = await response.json() as Array<{ Status?: string; PostOffice?: Array<{ District?: string; State?: string }> }>;
        const office = payload?.[0]?.PostOffice?.[0];
        if (payload?.[0]?.Status !== "Success" || !office?.District || !office?.State) throw new Error("Pincode not found");
        setNewAddress((current) => ({ ...current, city: office.District ?? current.city, state: office.State ?? current.state }));
        setPincodeStatus("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPincodeStatus("error");
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [newAddress.pincode, setNewAddress]);

  const field = (key: keyof AddressDraft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={key === "address_line" ? "block md:col-span-2" : "block"}>
      <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</span>
      <input
        {...props}
        required
        value={newAddress[key]}
        onChange={(event) => setNewAddress((current) => ({ ...current, [key]: key === "pincode" ? event.target.value.replace(/\D/g, "").slice(0, 6) : event.target.value }))}
        className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
    </label>
  );

  return <>
    <h1 className="font-display text-4xl">My Addresses</h1>
    <div className="mt-6 grid gap-3">
      {addresses.length ? addresses.map((address) => <div key={address.id} className="flex items-start justify-between gap-4 border border-border p-5"><div><p className="text-xs tracking-[0.18em] text-gold">{address.label.toUpperCase()}</p><p className="mt-2 whitespace-pre-wrap text-sm">{address.value}</p></div><button aria-label={`Delete ${address.label}`} onClick={() => removeAddress(address.id)} className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>) : <p className="text-sm text-muted-foreground">No saved addresses yet.</p>}
    </div>
    <div className="mt-6 border border-border p-5">
      <p className="text-xs tracking-[0.18em] text-muted-foreground">ADD A NEW ADDRESS</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {field("full_name", "Full name", { autoComplete: "name" })}
        <div>
          {field("pincode", "Pincode", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6, pattern: "[0-9]{6}" })}
          <p className={`mt-1 text-[10px] ${pincodeStatus === "error" ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
            {pincodeStatus === "loading" && "Finding city and state…"}
            {pincodeStatus === "success" && "City and state filled automatically."}
            {pincodeStatus === "error" && "Pincode not found. Enter city and state manually."}
          </p>
        </div>
        {field("house_number", "House / Apartment number", { autoComplete: "address-line1" })}
        {field("address_line", "Address line", { autoComplete: "street-address" })}
        {field("city", "City", { autoComplete: "address-level2" })}
        {field("state", "State", { autoComplete: "address-level1" })}
      </div>
      <button disabled={saving} onClick={addAddress} className="mt-5 inline-flex items-center gap-2 bg-onyx px-5 py-3 text-[11px] tracking-[0.2em] text-cream disabled:opacity-50"><Plus className="h-4 w-4" /> {saving ? "SAVING…" : "SAVE ADDRESS"}</button>
    </div>
  </>;
}

function Wishlist({ items }: { items: { id: string; name: string; price: number; image: string }[] }) {
  return <><h1 className="font-display text-4xl">My Wishlist</h1><div className="mt-6 grid gap-4 sm:grid-cols-2">{items.length ? items.map((item) => <article key={item.id} className="flex items-start gap-4 border border-border p-3 transition-colors hover:border-gold"><Link to="/products/$category" params={{ category: item.id }} className="shrink-0"><img src={item.image} alt={item.name} width={80} height={80} loading="lazy" decoding="async" className="h-20 w-20 object-cover" /></Link><div className="min-w-0 flex-1"><Link to="/products/$category" params={{ category: item.id }} className="font-display text-lg hover:text-gold">{item.name}</Link><p className="mt-1 text-sm text-gold">{formatINR(item.price)}</p></div><button type="button" onClick={() => { wishlist.remove(item.id); toast.success(`${item.name} removed from wishlist`); }} aria-label={`Remove ${item.name} from wishlist`} title="Remove from wishlist" className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="h-4 w-4" /></button></article>) : <p className="text-sm text-muted-foreground">Your wishlist is empty.</p>}</div></>;
}
function Details({ profile, setProfile, save, saving, email }: { profile: Profile; setProfile: (profile: Profile) => void; save: () => void; saving: boolean; email: string }) { return <><h1 className="font-display text-4xl">Account Details</h1><div className="mt-6 grid max-w-xl gap-4 border border-border p-6"><label className="grid gap-2 text-xs tracking-[0.18em] text-muted-foreground">FULL NAME<input value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} className="border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label><label className="grid gap-2 text-xs tracking-[0.18em] text-muted-foreground">EMAIL<input value={email} disabled className="border border-border bg-secondary/40 px-3 py-2.5 text-sm text-muted-foreground" /></label><label className="grid gap-2 text-xs tracking-[0.18em] text-muted-foreground">PHONE NUMBER<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className="border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" /></label><label className="flex items-start gap-3 border border-border p-4 text-xs text-muted-foreground"><input type="checkbox" checked={profile.marketing_opt_in} onChange={(event) => setProfile({ ...profile, marketing_opt_in: event.target.checked })} className="mt-0.5" /><span><b className="block text-foreground">Future updates: {profile.marketing_opt_in ? "Active" : "Inactive"}</b><span className="mt-1 block">Receive YOMORA product launches, offers and membership updates by email or phone.</span></span></label><button disabled={saving} onClick={save} className="inline-flex w-fit items-center gap-2 bg-onyx px-5 py-3 text-[11px] tracking-[0.2em] text-cream disabled:opacity-50"><Save className="h-4 w-4" /> SAVE CHANGES</button></div></>; }
