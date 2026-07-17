import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Plus, Pencil, Trash2, Package, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, formatINR, productImage, type Category, type Product } from "@/lib/products";
import { productsQuery } from "@/lib/products.queries";
import {
  checkIsAdminFn,
  deleteProductFn,
  upsertProductFn,
} from "@/lib/products.functions";

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

  const { data: adminInfo, isLoading: checkingAdmin } = useQuery({
    queryKey: ["me", "isAdmin"],
    queryFn: () => checkAdmin(),
  });

  const { data: products = [] } = useQuery(productsQuery());

  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

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
      setForm(emptyForm);
    }
  };
  const close = () => {
    setEditing(null);
    setCreating(false);
  };
  const isOpen = editing !== null || creating;

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
            <h1 className="mt-2 font-display text-4xl">Manage products</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} pieces in the catalog.
            </p>
          </div>
          <button
            onClick={() => open(null)}
            className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft"
          >
            <Plus className="h-4 w-4" /> NEW PRODUCT
          </button>
        </div>

        <div className="mt-8 grid gap-8">
          {CATEGORIES.map((c) => {
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
                  {CATEGORIES.map((c) => (
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
