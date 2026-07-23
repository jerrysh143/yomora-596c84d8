import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Plus, Pencil, Trash2, Package, ExternalLink, Tag, ShoppingBag, Check, RotateCcw, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, productImage, type Category, type CategoryRow, type Product } from "@/lib/products";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import {
  checkIsAdminFn,
  deleteProductFn,
  upsertProductFn,
} from "@/lib/products.functions";
import { upsertCategoryFn, deleteCategoryFn } from "@/lib/categories.functions";
import {
  listOrdersFn,
  updateOrderStatusFn,
  deleteOrderFn,
  type OrderStatus,
  type OrderItem,
} from "@/lib/orders.functions";
import { updateSubscriptionPlanFn, type SubscriptionPlan } from "@/lib/subscription.functions";
import { subscriptionPlanQuery } from "@/lib/subscription.queries";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — YOMORA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type FormState = {
  id: string;
  name: string;
  price: string;
  category: Category;
  tagline: string;
  description: string;
  image_url: string;
  is_new: boolean;
};

const emptyForm: FormState = {
  id: "",
  name: "",
  price: "",
  category: "rings",
  tagline: "",
  description: "",
  image_url: "",
  is_new: false,
};

function AdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const checkAdmin = useServerFn(checkIsAdminFn);
  const upsert = useServerFn(upsertProductFn);
  const del = useServerFn(deleteProductFn);
  const upsertCat = useServerFn(upsertCategoryFn);
  const delCat = useServerFn(deleteCategoryFn);
  const listOrders = useServerFn(listOrdersFn);
  const updateOrder = useServerFn(updateOrderStatusFn);
  const removeOrder = useServerFn(deleteOrderFn);
  const savePlan = useServerFn(updateSubscriptionPlanFn);

  const { data: adminInfo, isLoading: checkingAdmin } = useQuery({
    queryKey: ["me", "isAdmin"],
    queryFn: () => checkAdmin(),
  });

  const { data: products = [] } = useQuery(productsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
    enabled: !!adminInfo?.isAdmin,
  });
  const { data: plan } = useQuery(subscriptionPlanQuery());

  const [tab, setTab] = useState<"products" | "categories" | "orders" | "subscription">("products");
  const [orderFilter, setOrderFilter] = useState<OrderStatus>("pending");

  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [catEditing, setCatEditing] = useState<CategoryRow | null>(null);
  const [catCreating, setCatCreating] = useState(false);
  const [catForm, setCatForm] = useState({ slug: "", label: "", sort_order: "0" });

  const open = (p: Product | null) => {
    if (p) {
      setEditing(p);
      setCreating(false);
      setForm({
        id: p.id,
        name: p.name,
        price: String(p.price),
        category: p.category,
        tagline: p.tagline,
        description: p.description,
        image_url: p.image_url ?? "",
        is_new: p.is_new,
      });
    } else {
      setEditing(null);
      setCreating(true);
      setForm({ ...emptyForm, category: (categories[0]?.slug ?? "") });
    }
  };
  const close = () => {
    setEditing(null);
    setCreating(false);
  };
  const isOpen = editing !== null || creating;

  const openCat = (c: CategoryRow | null) => {
    if (c) {
      setCatEditing(c);
      setCatCreating(false);
      setCatForm({ slug: c.slug, label: c.label, sort_order: String(c.sort_order) });
    } else {
      setCatEditing(null);
      setCatCreating(true);
      setCatForm({ slug: "", label: "", sort_order: String(categories.length + 1) });
    }
  };
  const closeCat = () => { setCatEditing(null); setCatCreating(false); };
  const catOpen = catEditing !== null || catCreating;

  const saveMut = useMutation({
    mutationFn: (data: Product & { image_url: string | null }) =>
      upsert({ data }),
    onSuccess: () => {
      toast.success("Product saved");
      qc.invalidateQueries({ queryKey: ["products"] });
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveCatMut = useMutation({
    mutationFn: (data: { slug: string; label: string; sort_order: number }) =>
      upsertCat({ data }),
    onSuccess: () => {
      toast.success("Category saved");
      qc.invalidateQueries({ queryKey: ["categories"] });
      closeCat();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delCatMut = useMutation({
    mutationFn: (slug: string) => delCat({ data: { slug } }),
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orderStatusMut = useMutation({
    mutationFn: (v: { id: string; status: OrderStatus }) => updateOrder({ data: v }),
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orderDeleteMut = useMutation({
    mutationFn: (id: string) => removeOrder({ data: { id } }),
    onSuccess: () => {
      toast.success("Order deleted");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [planForm, setPlanForm] = useState<{
    name: string;
    tagline: string;
    price: string;
    duration_label: string;
    benefits: string;
    cta_label: string;
    is_active: boolean;
  } | null>(null);

  const planLoaded = plan?.id ?? null;
  const activePlanId = planForm && plan ? plan.id : null;
  if (plan && planForm === null) {
    setPlanForm({
      name: plan.name,
      tagline: plan.tagline,
      price: String(plan.price),
      duration_label: plan.duration_label,
      benefits: (plan.benefits ?? []).join("\n"),
      cta_label: plan.cta_label,
      is_active: plan.is_active,
    });
  }
  void planLoaded;
  void activePlanId;

  const planMut = useMutation({
    mutationFn: (data: Parameters<typeof savePlan>[0]["data"]) => savePlan({ data }),
    onSuccess: () => {
      toast.success("Subscription plan saved");
      qc.invalidateQueries({ queryKey: ["subscription_plan"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !planForm) return;
    const price = Number(planForm.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Price must be a positive number");
      return;
    }
    planMut.mutate({
      id: plan.id,
      name: planForm.name.trim(),
      tagline: planForm.tagline.trim(),
      price,
      duration_label: planForm.duration_label.trim(),
      benefits: planForm.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
      cta_label: planForm.cta_label.trim(),
      is_active: planForm.is_active,
    });
  };

  const filteredOrders = useMemo(
    () => orders.filter((o) => o.status === orderFilter),
    [orders, orderFilter],
  );
  const orderCounts = useMemo(() => ({
    pending: orders.filter((o) => o.status === "pending").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  }), [orders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Price must be a positive number");
      return;
    }
    saveMut.mutate({
      id: form.id.trim(),
      name: form.name.trim(),
      price,
      category: form.category,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim() || null,
      is_new: form.is_new,
    });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const grouped = useMemo(() => {
    const map = new Map<Category, Product[]>();
    for (const p of products) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, [products]);

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sort = Number(catForm.sort_order);
    if (!Number.isFinite(sort) || sort < 0) {
      toast.error("Sort order must be a positive number");
      return;
    }
    saveCatMut.mutate({
      slug: catForm.slug.trim().toLowerCase(),
      label: catForm.label.trim(),
      sort_order: sort,
    });
  };

  if (checkingAdmin) {
    return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading dashboard…</div>;
  }

  if (!adminInfo?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar onSignOut={signOut} />
        <div className="container-x mx-auto grid max-w-2xl gap-4 py-20">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">ACCESS PENDING</p>
          <h1 className="font-display text-4xl">Admin role required</h1>
          <p className="text-sm text-muted-foreground">
            You're signed in, but this account doesn't have the admin role yet. Ask the store owner to
            grant it, or promote your own account by running the SQL below in the backend once, then reload:
          </p>
          <pre className="overflow-x-auto rounded border border-border bg-secondary/40 p-4 text-xs">
{`insert into public.user_roles (user_id, role)
values ('${adminInfo?.userId ?? "YOUR_USER_ID"}', 'admin')
on conflict do nothing;`}
          </pre>
          <Link to="/" className="text-xs text-gold hover:underline">← Back to storefront</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar onSignOut={signOut} />

      <section className="container-x mx-auto max-w-[1400px] py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">DASHBOARD</p>
            <h1 className="mt-2 font-display text-4xl">
              {tab === "products" ? "Manage products" : tab === "categories" ? "Manage categories" : tab === "orders" ? "Manage orders" : "Manage subscription"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "products"
                ? `${products.length} pieces in the catalog.`
                : tab === "categories"
                ? `${categories.length} categories.`
                : tab === "orders"
                ? `${orderCounts.pending} pending · ${orderCounts.completed} completed`
                : plan ? (plan.is_active ? "Live on the storefront." : "Currently hidden from the storefront.") : "Loading plan…"}
            </p>
          </div>
          {tab !== "orders" && tab !== "subscription" && (
            <button
              onClick={() => (tab === "products" ? open(null) : openCat(null))}
              className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft"
            >
              <Plus className="h-4 w-4" /> {tab === "products" ? "NEW PRODUCT" : "NEW CATEGORY"}
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-2 border-b border-border">
          {([
            { k: "products" as const, label: "PRODUCTS", icon: Package },
            { k: "categories" as const, label: "CATEGORIES", icon: Tag },
            { k: "orders" as const, label: "ORDERS", icon: ShoppingBag },
            { k: "subscription" as const, label: "SUBSCRIPTION", icon: Sparkles },
          ]).map((t) => {
            const Icon = t.icon;
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-[11px] font-semibold tracking-[0.24em] transition-colors ${
                  active ? "border-b-2 border-gold text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "categories" && (
          <div className="mt-8 grid gap-2">
            {categories.length === 0 && (
              <p className="py-8 text-sm text-muted-foreground">No categories yet. Add your first one.</p>
            )}
            {categories.map((c) => {
              const count = products.filter((p) => p.category === c.slug).length;
              return (
                <div key={c.slug} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 border border-border p-3">
                  <span className="grid h-10 w-10 place-items-center border border-border text-xs text-muted-foreground">
                    {c.sort_order}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-lg text-foreground">{c.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">/{c.slug}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{count} product{count === 1 ? "" : "s"}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openCat(c)} className="rounded p-2 text-muted-foreground hover:text-gold" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete category "${c.label}"?`)) delCatMut.mutate(c.slug); }}
                      className="rounded p-2 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "products" && (
        <div className="mt-8 grid gap-8">
          {categories.map((c) => {
            const items = grouped.get(c.slug) ?? [];
            return (
              <div key={c.slug}>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h2 className="font-display text-xl">{c.label}</h2>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">No products in this category yet.</p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {items.map((p) => (
                      <div key={p.id} className="grid grid-cols-[80px_1fr_auto] items-center gap-4 border border-border p-3">
                        <img src={productImage(p)} alt={p.name} className="h-20 w-20 object-cover" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-lg text-foreground">{p.name}</span>
                            {p.is_new && <span className="bg-gold px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.2em] text-onyx">NEW</span>}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{p.tagline || "—"}</div>
                          <div className="mt-1 text-sm font-semibold text-foreground">{formatINR(p.price)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to="/products/$id" params={{ id: p.id }} className="rounded p-2 text-muted-foreground hover:text-gold" title="View">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button onClick={() => open(p)} className="rounded p-2 text-muted-foreground hover:text-gold" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete "${p.name}"?`)) delMut.mutate(p.id); }}
                            className="rounded p-2 text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {tab === "orders" && (
        <div className="mt-8 grid gap-4">
          <div className="flex flex-wrap gap-2">
            {([
              { k: "pending" as const, label: "Pending", count: orderCounts.pending },
              { k: "completed" as const, label: "Completed", count: orderCounts.completed },
              { k: "cancelled" as const, label: "Cancelled", count: orderCounts.cancelled },
            ]).map((f) => {
              const active = orderFilter === f.k;
              return (
                <button
                  key={f.k}
                  onClick={() => setOrderFilter(f.k)}
                  className={`inline-flex items-center gap-2 border px-4 py-2 text-[11px] font-semibold tracking-[0.24em] transition-colors ${
                    active
                      ? "border-gold bg-gold text-onyx"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {f.label.toUpperCase()}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-onyx text-gold" : "bg-secondary/40"}`}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredOrders.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No {orderFilter} orders.
            </p>
          ) : (
            <div className="grid gap-3">
              {filteredOrders.map((o) => {
                const items = (o.items as OrderItem[]) ?? [];
                return (
                  <div key={o.id} className="grid gap-3 border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg text-foreground">{o.customer_name}</span>
                          <StatusBadge status={o.status} />
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {o.customer_email}
                          {o.customer_phone ? ` · ${o.customer_phone}` : ""}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">{formatINR(o.total)}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {items.reduce((s, i) => s + i.quantity, 0)} item(s)
                        </div>
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="grid gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
                        {items.map((i, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{i.name} × {i.quantity}</span>
                            <span>{formatINR(i.price * i.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {o.shipping_address && (
                      <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                        <span className="text-[10px] tracking-[0.2em] text-foreground/70">SHIP TO</span>
                        <div className="mt-1 whitespace-pre-wrap">{o.shipping_address}</div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                      {o.status !== "pending" && (
                        <button
                          onClick={() => orderStatusMut.mutate({ id: o.id, status: "pending" })}
                          className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] font-semibold tracking-[0.24em] hover:border-foreground"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> REOPEN
                        </button>
                      )}
                      {o.status !== "completed" && (
                        <button
                          onClick={() => orderStatusMut.mutate({ id: o.id, status: "completed" })}
                          className="inline-flex items-center gap-1.5 bg-gold px-3 py-2 text-[10px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft"
                        >
                          <Check className="h-3.5 w-3.5" /> MARK COMPLETED
                        </button>
                      )}
                      {o.status !== "cancelled" && (
                        <button
                          onClick={() => orderStatusMut.mutate({ id: o.id, status: "cancelled" })}
                          className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] font-semibold tracking-[0.24em] hover:border-destructive hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" /> CANCEL
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm("Delete this order permanently?")) orderDeleteMut.mutate(o.id); }}
                        className="rounded p-2 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={close}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto border border-border bg-background p-6"
          >
            <h2 className="font-display text-2xl">{editing ? "Edit product" : "New product"}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug (ID)">
                <input
                  required
                  disabled={!!editing}
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="e.g. rose-solitaire"
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                />
              </Field>
              <Field label="Name">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold" />
              </Field>
              <Field label="Price (INR)">
                <input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                />
              </Field>
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tagline">
                <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold" />
              </Field>
              <Field label="Image URL (paste a hosted image link)">
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://…"
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="accent-[color:var(--gold)]" />
              Mark as New Arrival
            </label>

            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={close} className="border border-border px-5 py-2.5 text-[11px] font-semibold tracking-[0.24em] hover:border-foreground">
                CANCEL
              </button>
              <button
                type="submit"
                disabled={saveMut.isPending}
                className="bg-onyx px-5 py-2.5 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-onyx/90 disabled:opacity-50"
              >
                {saveMut.isPending ? "SAVING…" : "SAVE"}
              </button>
            </div>
          </form>
        </div>
      )}

      {catOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={closeCat}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCatSubmit}
            className="grid w-full max-w-md gap-4 border border-border bg-background p-6"
          >
            <h2 className="font-display text-2xl">{catEditing ? "Edit category" : "New category"}</h2>
            <Field label="Slug (URL id)">
              <input
                required
                disabled={!!catEditing}
                value={catForm.slug}
                onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                placeholder="e.g. pendants"
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
              />
            </Field>
            <Field label="Label">
              <input
                required
                value={catForm.label}
                onChange={(e) => setCatForm({ ...catForm, label: e.target.value })}
                placeholder="Pendants"
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
              />
            </Field>
            <Field label="Sort order">
              <input
                required
                type="number"
                min={0}
                value={catForm.sort_order}
                onChange={(e) => setCatForm({ ...catForm, sort_order: e.target.value })}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
              />
            </Field>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={closeCat} className="border border-border px-5 py-2.5 text-[11px] font-semibold tracking-[0.24em] hover:border-foreground">
                CANCEL
              </button>
              <button
                type="submit"
                disabled={saveCatMut.isPending}
                className="bg-onyx px-5 py-2.5 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-onyx/90 disabled:opacity-50"
              >
                {saveCatMut.isPending ? "SAVING…" : "SAVE"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function TopBar({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="border-b border-border bg-onyx text-cream">
      <div className="container-x mx-auto flex max-w-[1400px] items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gold" />
          <span className="font-display text-xl tracking-[0.18em] text-gold">YOMORA</span>
          <span className="text-[10px] tracking-[0.28em] text-cream/60">ADMIN</span>
        </Link>
        <button onClick={onSignOut} className="inline-flex items-center gap-2 text-xs tracking-[0.18em] text-cream/85 hover:text-gold">
          <LogOut className="h-4 w-4" /> SIGN OUT
        </button>
      </div>
    </header>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    pending: "bg-gold text-onyx",
    completed: "bg-emerald-600 text-white",
    cancelled: "bg-destructive text-destructive-foreground",
  };
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.2em] ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
