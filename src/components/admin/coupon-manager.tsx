import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/products";
import {
  createCouponFn,
  deleteCouponFn,
  listCouponsFn,
  updateCouponFn,
  type Coupon,
  type DiscountType,
} from "@/lib/coupons.functions";

type CouponForm = {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string;
  minimum_order: string;
  maximum_discount: string;
  member_only: boolean;
  usage_limit: string;
  per_customer_limit: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};

const emptyForm: CouponForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "10",
  minimum_order: "0",
  maximum_discount: "",
  member_only: false,
  usage_limit: "",
  per_customer_limit: "1",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

const fieldClass = "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold";
const toLocalInput = (value: string | null) => value ? new Date(value).toISOString().slice(0, 16) : "";
const toIso = (value: string) => value ? new Date(value).toISOString() : null;

export function CouponManager() {
  const queryClient = useQueryClient();
  const listCoupons = useServerFn(listCouponsFn);
  const createCoupon = useServerFn(createCouponFn);
  const updateCoupon = useServerFn(updateCouponFn);
  const deleteCoupon = useServerFn(deleteCouponFn);
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => listCoupons(),
  });
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };
  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const startEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      minimum_order: String(coupon.minimum_order),
      maximum_discount: coupon.maximum_discount == null ? "" : String(coupon.maximum_discount),
      member_only: coupon.member_only,
      usage_limit: coupon.usage_limit == null ? "" : String(coupon.usage_limit),
      per_customer_limit: String(coupon.per_customer_limit),
      starts_at: toLocalInput(coupon.starts_at),
      expires_at: toLocalInput(coupon.expires_at),
      is_active: coupon.is_active,
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        minimum_order: Number(form.minimum_order || 0),
        maximum_discount: form.maximum_discount ? Number(form.maximum_discount) : null,
        member_only: form.member_only,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        per_customer_limit: Number(form.per_customer_limit || 1),
        starts_at: toIso(form.starts_at),
        expires_at: toIso(form.expires_at),
        is_active: form.is_active,
      };
      return editing
        ? updateCoupon({ data: { id: editing.id, coupon: payload } })
        : createCoupon({ data: payload });
    },
    onSuccess: () => {
      toast.success(editing ? "Coupon updated" : "Coupon created");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      close();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon({ data: { id } }),
    onSuccess: () => {
      toast.success("Coupon deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Create public offers or exclusive coupons for active YOMORA members.
        </p>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-onyx hover:bg-gold-soft"
        >
          <Plus className="h-4 w-4" /> NEW COUPON
        </button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading coupons…</p>
      ) : coupons.length === 0 ? (
        <div className="border border-dashed border-border p-10 text-center">
          <TicketPercent className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-3 font-display text-xl">No coupons yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create the first checkout offer for your customers.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {coupons.map((coupon) => (
            <article key={coupon.id} className="grid gap-4 border border-border p-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-base font-semibold tracking-[0.12em] text-gold">{coupon.code}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-semibold tracking-[0.16em] ${coupon.is_active ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    {coupon.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                  {coupon.member_only && (
                    <span className="inline-flex items-center gap-1 bg-onyx px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] text-gold">
                      <Crown className="h-3 w-3" /> MEMBERS ONLY
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{coupon.description || "No description"}</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold">
                  {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `${formatINR(coupon.discount_value)} OFF`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Minimum {formatINR(coupon.minimum_order)}
                  {coupon.maximum_discount ? ` · Max ${formatINR(coupon.maximum_discount)}` : ""}
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>{coupon.times_used}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""} uses</p>
                <p className="mt-1">{coupon.per_customer_limit} use{coupon.per_customer_limit === 1 ? "" : "s"} per customer</p>
                {coupon.expires_at && <p className="mt-1">Ends {new Date(coupon.expires_at).toLocaleDateString()}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => startEdit(coupon)} className="p-2 text-muted-foreground hover:text-gold" title="Edit coupon">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => confirm(`Delete coupon ${coupon.code}?`) && deleteMutation.mutate(coupon.id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                  title="Delete coupon"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" onClick={close}>
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-border bg-background p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.24em] text-gold">CHECKOUT OFFER</p>
                <h2 className="mt-1 font-display text-2xl">{editing ? "Edit coupon" : "Create coupon"}</h2>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
              </label>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Coupon code">
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="YOMORA10" className={fieldClass} />
              </Field>
              <Field label="Offer type">
                <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as DiscountType })} className={fieldClass}>
                  <option value="percentage">Percentage discount</option>
                  <option value="fixed">Fixed amount discount</option>
                </select>
              </Field>
              <Field label={form.discount_type === "percentage" ? "Discount percentage" : "Discount amount (INR)"}>
                <input required type="number" min="1" max={form.discount_type === "percentage" ? "100" : undefined} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className={fieldClass} />
              </Field>
              <Field label="Minimum order (INR)">
                <input required type="number" min="0" value={form.minimum_order} onChange={(e) => setForm({ ...form, minimum_order: e.target.value })} className={fieldClass} />
              </Field>
              {form.discount_type === "percentage" && (
                <Field label="Maximum discount (optional)">
                  <input type="number" min="1" value={form.maximum_discount} onChange={(e) => setForm({ ...form, maximum_discount: e.target.value })} placeholder="No maximum" className={fieldClass} />
                </Field>
              )}
              <Field label="Total usage limit (optional)">
                <input type="number" min="1" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" className={fieldClass} />
              </Field>
              <Field label="Uses per customer">
                <input required type="number" min="1" value={form.per_customer_limit} onChange={(e) => setForm({ ...form, per_customer_limit: e.target.value })} className={fieldClass} />
              </Field>
              <Field label="Starts at (optional)">
                <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={fieldClass} />
              </Field>
              <Field label="Expires at (optional)">
                <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={fieldClass} />
              </Field>
              <label className="flex items-center gap-3 border border-gold/40 bg-gold/5 p-4 sm:col-span-2">
                <input type="checkbox" checked={form.member_only} onChange={(e) => setForm({ ...form, member_only: e.target.checked })} />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold"><Crown className="h-4 w-4 text-gold" /> Membership users only</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Only signed-in customers with an active, unexpired membership can use this code.</span>
                </span>
              </label>
              <Field label="Customer-facing description" className="sm:col-span-2">
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Black Signature member offer" className={fieldClass} />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={close} className="border border-border px-5 py-3 text-[11px] font-semibold tracking-[0.2em]">CANCEL</button>
              <button type="submit" disabled={saveMutation.isPending} className="bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-onyx disabled:opacity-50">
                {saveMutation.isPending ? "SAVING…" : editing ? "SAVE COUPON" : "CREATE COUPON"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-[10px] tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</span>
      {children}
    </label>
  );
}
