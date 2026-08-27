import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listNotifyRequestsFn } from "@/lib/notify.functions";
import { LogOut, Plus, Pencil, Trash2, Package, ExternalLink, Tag, ShoppingBag, Check, RotateCcw, X, Sparkles, LayoutTemplate, Crown, BellRing, RefreshCw, FileText, Save, MessageCircle, Users, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GalleryUploadField } from "@/components/admin/gallery-upload-field";
import { AUDIENCES, formatINR, isProductNew, isValidImageUrl, productImage, type Audience, type Category, type CategoryRow, type Product } from "@/lib/products";
import { adminProductsQuery } from "@/lib/products.queries";
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
  updateInvoiceDetailsFn,
  type OrderStatus,
  type OrderItem,
  type Order,
  type InvoiceDetails,
} from "@/lib/orders.functions";
import {
  updateSubscriptionPlanFn,
  createSubscriptionPlanFn,
  deleteSubscriptionPlanFn,
  type SubscriptionPlan,
} from "@/lib/subscription.functions";
import { subscriptionPlansQuery } from "@/lib/subscription.queries";
import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { CouponManager } from "@/components/admin/coupon-manager";
import {
  listMembershipsFn,
  updateMembershipFn,
  deleteMembershipFn,
  createMembershipFn,
  type AdminMembership,
} from "@/lib/memberships-admin.functions";
import { listCustomersFn } from "@/lib/customers-admin.functions";
import { listInquiriesFn } from "@/lib/inquiries.functions";
import { createVelocityShipmentFn } from "@/lib/shipments.functions";

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
  audience: Audience;
  tagline: string;
  description: string;
  image_url: string;
  gallery_urls: string[];
  sold_out: boolean;
};

const emptyForm: FormState = {
  id: "",
  name: "",
  price: "",
  category: "rings",
  audience: "unisex",
  tagline: "",
  description: "",
  image_url: "",
  gallery_urls: [],
  sold_out: false,
};

const invoiceInputCls = "w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold";

function whatsappNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

function openWhatsAppInvoice(order: Order) {
  const number = whatsappNumber(order.customer_phone);
  if (!number) {
    toast.error("Add a valid customer WhatsApp number before sending the invoice");
    return;
  }

  const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;
  const message = [
    `Hello ${order.customer_name},`,
    "",
    `Your YOMORA order #${order.id.slice(0, 8).toUpperCase()} has been completed.`,
    `Order total: ${formatINR(order.total)}`,
    "",
    `View or download your invoice: ${invoiceUrl}`,
    "Please sign in using the email address used for this order.",
    "",
    "Thank you for shopping with YOMORA by Nehalbhai Devika Jewellers.",
  ].join("\n");

  window.open(
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

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
  const updateInvoice = useServerFn(updateInvoiceDetailsFn);
  const savePlan = useServerFn(updateSubscriptionPlanFn);
  const createPlan = useServerFn(createSubscriptionPlanFn);
  const removePlan = useServerFn(deleteSubscriptionPlanFn);
  const listMemberships = useServerFn(listMembershipsFn);
  const saveMembership = useServerFn(updateMembershipFn);
  const removeMembership = useServerFn(deleteMembershipFn);
  const addMembership = useServerFn(createMembershipFn);
  const listCustomers = useServerFn(listCustomersFn);
  const listInquiries = useServerFn(listInquiriesFn);
  const createVelocityShipment = useServerFn(createVelocityShipmentFn);

  const { data: adminInfo, isLoading: checkingAdmin } = useQuery({
    queryKey: ["me", "isAdmin"],
    queryFn: () => checkAdmin(),
  });

  const { data: products = [] } = useQuery(adminProductsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: orders = [], refetch: refetchOrders, isFetching: ordersRefreshing } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
    enabled: !!adminInfo?.isAdmin,
    refetchInterval: 15_000,
  });
  const { data: plans = [] } = useQuery(subscriptionPlansQuery());
  const listAlerts = useServerFn(listNotifyRequestsFn);
  const alertsQ = useQuery({
    queryKey: ["admin", "notify-requests"],
    queryFn: () => listAlerts(),
    enabled: !!adminInfo?.isAdmin,
  });
  const inquiriesQ = useQuery({
    queryKey: ["admin", "customer-inquiries"],
    queryFn: () => listInquiries(),
    enabled: !!adminInfo?.isAdmin,
  });
  const { data: memberships = [] } = useQuery({
    queryKey: ["admin", "memberships"],
    queryFn: () => listMemberships(),
    enabled: !!adminInfo?.isAdmin,
  });
  const { data: customers = [], refetch: refetchCustomers, isFetching: customersRefreshing } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => listCustomers(),
    enabled: !!adminInfo?.isAdmin,
  });

  const [tab, setTab] = useState<"products" | "categories" | "orders" | "customers" | "alerts" | "subscription" | "memberships" | "coupons" | "site">("products");
  const [orderFilter, setOrderFilter] = useState<OrderStatus>("pending");
  const [invoiceEditor, setInvoiceEditor] = useState<{ id: string; details: InvoiceDetails } | null>(null);

  // Admin session stays active until an explicit sign-out.

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
        audience: p.audience ?? "unisex",
        tagline: p.tagline,
        description: p.description,
        image_url: p.image_url ?? "",
        gallery_urls: Array.from(
          new Set([p.image_url ?? "", ...(p.gallery_urls ?? [])].filter(Boolean)),
        ),
        sold_out: !!p.sold_out,
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

  const friendlyProductError = (msg: string) => {
    if (/products_category_fkey|violates foreign key constraint/i.test(msg)) {
      return "That category no longer exists. Pick a category from the list (or create it under Categories first).";
    }
    if (/products_category_check/i.test(msg)) {
      return "This category isn't allowed by the database yet. Create it under Categories first.";
    }
    return msg;
  };

  const saveMut = useMutation({
    mutationFn: (data: Product & { image_url: string | null }) =>
      upsert({ data }),
    onSuccess: () => {
      toast.success("Product saved");
      qc.invalidateQueries({ queryKey: ["products"] });
      close();
    },
    onError: (e: Error) => toast.error(friendlyProductError(e.message)),
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

  const velocityShipmentMut = useMutation({
    mutationFn: (orderId: string) => createVelocityShipment({ data: { orderId } }),
    onSuccess: (shipment) => {
      toast.success(`Velocity shipment ready${shipment.awbCode ? ` · AWB ${shipment.awbCode}` : ""}`);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invoiceMut = useMutation({
    mutationFn: (value: { id: string; invoice_details: InvoiceDetails }) => updateInvoice({ data: value }),
    onSuccess: () => {
      toast.success("Invoice details saved");
      qc.invalidateQueries({ queryKey: ["orders"] });
      setInvoiceEditor(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  type PlanFormState = {
    name: string;
    tagline: string;
    price: string;
    duration_label: string;
    benefits: string;
    cta_label: string;
    is_active: boolean;
  };
  const emptyPlanForm: PlanFormState = {
    name: "",
    tagline: "",
    price: "",
    duration_label: "per year",
    benefits: "",
    cta_label: "Subscribe Now",
    is_active: true,
  };
  const [planEditing, setPlanEditing] = useState<SubscriptionPlan | null>(null);
  const [planCreating, setPlanCreating] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm);

  const openPlan = (p: SubscriptionPlan | null) => {
    if (p) {
      setPlanEditing(p);
      setPlanCreating(false);
      setPlanForm({
        name: p.name,
        tagline: p.tagline,
        price: String(p.price),
        duration_label: p.duration_label,
        benefits: (p.benefits ?? []).join("\n"),
        cta_label: p.cta_label,
        is_active: p.is_active,
      });
    } else {
      setPlanEditing(null);
      setPlanCreating(true);
      setPlanForm(emptyPlanForm);
    }
  };
  const closePlan = () => {
    setPlanEditing(null);
    setPlanCreating(false);
    setPlanForm(emptyPlanForm);
  };
  const isPlanOpen = !!planEditing || planCreating;

  const planCreateMut = useMutation({
    mutationFn: (data: Parameters<typeof createPlan>[0]["data"]) => createPlan({ data }),
    onSuccess: () => {
      toast.success("Plan created");
      qc.invalidateQueries({ queryKey: ["subscription_plans"] });
      closePlan();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const planUpdateMut = useMutation({
    mutationFn: (data: Parameters<typeof savePlan>[0]["data"]) => savePlan({ data }),
    onSuccess: () => {
      toast.success("Plan saved");
      qc.invalidateQueries({ queryKey: ["subscription_plans"] });
      closePlan();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const planDeleteMut = useMutation({
    mutationFn: (id: string) => removePlan({ data: { id } }),
    onSuccess: () => {
      toast.success("Plan deleted");
      qc.invalidateQueries({ queryKey: ["subscription_plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  type MembershipFormState = {
    id: string | null;
    user_email: string;
    plan_id: string;
    status: "pending" | "active" | "expired" | "cancelled";
    activated_at: string;
    expires_at: string;
    auto_renew: boolean;
    member_number: string;
    notes: string;
  };
  const emptyMembershipForm: MembershipFormState = {
    id: null,
    user_email: "",
    plan_id: "",
    status: "pending",
    activated_at: "",
    expires_at: "",
    auto_renew: false,
    member_number: "",
    notes: "",
  };
  const [memEditing, setMemEditing] = useState<AdminMembership | null>(null);
  const [memCreating, setMemCreating] = useState(false);
  const [memForm, setMemForm] = useState<MembershipFormState>(emptyMembershipForm);
  const [memSearch, setMemSearch] = useState("");
  const [memStatusFilter, setMemStatusFilter] = useState<"all" | "pending" | "active" | "expired" | "cancelled">("all");

  const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
  const toIso = (d: string) => (d ? new Date(d + "T00:00:00Z").toISOString() : null);

  const openMembership = (m: AdminMembership | null) => {
    if (m) {
      setMemEditing(m);
      setMemCreating(false);
      setMemForm({
        id: m.id,
        user_email: m.user_email ?? "",
        plan_id: m.plan_id ?? "",
        status: m.status,
        activated_at: toDateInput(m.activated_at),
        expires_at: toDateInput(m.expires_at),
        auto_renew: m.auto_renew,
        member_number: m.member_number ?? "",
        notes: m.notes ?? "",
      });
    } else {
      setMemEditing(null);
      setMemCreating(true);
      setMemForm({ ...emptyMembershipForm, plan_id: plans[0]?.id ?? "" });
    }
  };
  const closeMembership = () => { setMemEditing(null); setMemCreating(false); };
  const isMemOpen = memEditing !== null || memCreating;

  const memUpdateMut = useMutation({
    mutationFn: (data: Parameters<typeof saveMembership>[0]["data"]) => saveMembership({ data }),
    onSuccess: () => {
      toast.success("Membership updated");
      qc.invalidateQueries({ queryKey: ["admin", "memberships"] });
      closeMembership();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const memCreateMut = useMutation({
    mutationFn: (data: Parameters<typeof addMembership>[0]["data"]) => addMembership({ data }),
    onSuccess: () => {
      toast.success("Membership created");
      qc.invalidateQueries({ queryKey: ["admin", "memberships"] });
      closeMembership();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const memDeleteMut = useMutation({
    mutationFn: (id: string) => removeMembership({ data: { id } }),
    onSuccess: () => {
      toast.success("Membership deleted");
      qc.invalidateQueries({ queryKey: ["admin", "memberships"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleMembershipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shared = {
      plan_id: memForm.plan_id || null,
      status: memForm.status,
      activated_at: toIso(memForm.activated_at),
      expires_at: toIso(memForm.expires_at),
      auto_renew: memForm.auto_renew,
      member_number: memForm.member_number.trim() || null,
      notes: memForm.notes.trim() || null,
    };
    if (memEditing) {
      memUpdateMut.mutate({ id: memEditing.id, ...shared });
    } else {
      if (!memForm.user_email.trim()) {
        toast.error("Customer email is required");
        return;
      }
      memCreateMut.mutate({ user_email: memForm.user_email.trim(), ...shared });
    }
  };

  const setMembershipStatusQuick = (m: AdminMembership, status: AdminMembership["status"]) => {
    memUpdateMut.mutate({
      id: m.id,
      plan_id: m.plan_id,
      status,
      activated_at: status === "active" && !m.activated_at ? new Date().toISOString() : m.activated_at,
      expires_at: m.expires_at,
      auto_renew: m.auto_renew,
      member_number: m.member_number,
      notes: m.notes,
    });
  };

  const filteredMemberships = useMemo(() => {
    const q = memSearch.trim().toLowerCase();
    return memberships.filter((m) => {
      if (memStatusFilter !== "all" && m.status !== memStatusFilter) return false;
      if (!q) return true;
      return (
        (m.member_number ?? "").toLowerCase().includes(q) ||
        (m.user_email ?? "").toLowerCase().includes(q) ||
        m.user_id.toLowerCase().includes(q) ||
        (m.plan_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [memberships, memSearch, memStatusFilter]);

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(planForm.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Price must be a positive number");
      return;
    }
    const payload = {
      name: planForm.name.trim(),
      tagline: planForm.tagline.trim(),
      price,
      duration_label: planForm.duration_label.trim(),
      benefits: planForm.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
      cta_label: planForm.cta_label.trim(),
      is_active: planForm.is_active,
    };
    if (planEditing) {
      planUpdateMut.mutate({ id: planEditing.id, ...payload });
    } else {
      planCreateMut.mutate(payload);
    }
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
    const images = form.gallery_urls.map((u) => u.trim()).filter(Boolean);
    const imageUrl = images[0] ?? "";
    if (!isValidImageUrl(imageUrl)) {
      toast.error("Image must be an uploaded image or a valid http(s) URL");
      return;
    }
    const category = form.category?.trim();
    if (!category || !categories.some((c) => c.slug === category)) {
      toast.error("Select a valid category for this product");
      return;
    }
    if (!AUDIENCES.some((a) => a.value === form.audience)) {
      toast.error("Select who this product is for (Men, Women, Kids or Unisex)");
      return;
    }
    saveMut.mutate({
      id: form.id.trim(),
      name: form.name.trim(),
      price,
      category: category as Category,
      audience: form.audience,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      image_url: imageUrl || null,
      gallery_urls: images.slice(1),
      is_new: false,
      sold_out: form.sold_out,
    });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { admin: "1" }, replace: true });
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
              {tab === "products" ? "Manage products" : tab === "categories" ? "Manage categories" : tab === "orders" ? "Manage orders" : tab === "customers" ? "Manage customers" : tab === "subscription" ? "Manage subscription" : tab === "memberships" ? "Manage memberships" : tab === "coupons" ? "Manage coupons" : "Manage site content"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "products"
                ? `${products.length} pieces in the catalog.`
                : tab === "categories"
                ? `${categories.length} categories.`
                : tab === "orders"
                ? `${orderCounts.pending} pending · ${orderCounts.completed} completed`
                : tab === "customers"
                ? `${customers.length} registered customer${customers.length === 1 ? "" : "s"} · ${customers.filter((customer) => customer.marketing_opt_in).length} subscribed`
                : tab === "subscription"
                ? `${plans.length} plan${plans.length === 1 ? "" : "s"} · ${plans.filter((p) => p.is_active).length} live on storefront`
                : tab === "memberships"
                ? `${memberships.length} member${memberships.length === 1 ? "" : "s"} · ${memberships.filter((m) => m.status === "active").length} active`
                : tab === "coupons"
                ? "Create public and members-only checkout offers."
                : "Edit every homepage section, header and footer."}
            </p>
          </div>
          {(tab === "products" || tab === "categories" || tab === "subscription" || tab === "memberships") && (
            <button
              onClick={() => (tab === "products" ? open(null) : tab === "categories" ? openCat(null) : tab === "subscription" ? openPlan(null) : openMembership(null))}
              className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft"
            >
              <Plus className="h-4 w-4" /> {tab === "products" ? "NEW PRODUCT" : tab === "categories" ? "NEW CATEGORY" : tab === "subscription" ? "ADD PLAN" : "ADD MEMBERSHIP"}
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
          {([
            { k: "products" as const, label: "PRODUCTS", icon: Package },
            { k: "categories" as const, label: "CATEGORIES", icon: Tag },
            { k: "orders" as const, label: "ORDERS", icon: ShoppingBag },
            { k: "customers" as const, label: "CUSTOMERS", icon: Users },
            { k: "alerts" as const, label: "RESTOCK ALERTS", icon: BellRing },
            { k: "subscription" as const, label: "SUBSCRIPTION", icon: Sparkles },
            { k: "memberships" as const, label: "MEMBERSHIPS", icon: Crown },
            { k: "coupons" as const, label: "COUPONS", icon: Tag },
            { k: "site" as const, label: "SITE CONTENT", icon: LayoutTemplate },
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

        {tab === "customers" && (
          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Customer contact details, completed purchase totals and order history.</p>
              <button type="button" onClick={() => refetchCustomers()} disabled={customersRefreshing} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground hover:border-gold hover:text-gold disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${customersRefreshing ? "animate-spin" : ""}`} /> REFRESH</button>
            </div>
            <div className="overflow-x-auto border border-border">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-border bg-secondary/30 text-[10px] tracking-[0.16em] text-muted-foreground"><tr><th className="px-4 py-3">CUSTOMER</th><th className="px-4 py-3">EMAIL</th><th className="px-4 py-3">PHONE</th><th className="px-4 py-3">TOTAL PURCHASED</th><th className="px-4 py-3">ORDERS</th><th className="px-4 py-3">FUTURE UPDATES</th><th className="px-4 py-3">JOINED</th><th className="px-4 py-3">LAST LOGIN</th></tr></thead>
                <tbody className="divide-y divide-border">{customers.map((customer) => <tr key={customer.id} className="align-top"><td className="px-4 py-3"><div className="font-medium text-foreground">{customer.full_name || "Not provided"}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{customer.email_confirmed ? "Email verified" : "Email confirmation pending"}</div></td><td className="px-4 py-3 text-muted-foreground">{customer.email || "—"}</td><td className="px-4 py-3 text-muted-foreground">{customer.phone || "—"}</td><td className="px-4 py-3 font-medium text-foreground">{formatINR(customer.total_purchased)}</td><td className="px-4 py-3"><details><summary className="cursor-pointer text-xs font-semibold text-gold">{customer.order_count} ORDER{customer.order_count === 1 ? "" : "S"}</summary><div className="mt-3 w-72 space-y-2">{customer.orders.map((order) => <Link key={order.id} to="/invoice/$id" params={{ id: order.id }} target="_blank" className="flex items-center justify-between gap-3 border-b border-border pb-2 text-xs"><span>#{order.id.slice(0, 8).toUpperCase()}<span className="mt-0.5 block text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-IN")} · {order.status}</span></span><span>{formatINR(order.total)}</span></Link>)}{customer.orders.length === 0 && <span className="text-xs text-muted-foreground">No orders</span>}</div></details></td><td className="px-4 py-3"><span className={`inline-flex px-2 py-1 text-[9px] font-semibold tracking-[0.14em] ${customer.marketing_opt_in ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}>{customer.marketing_opt_in ? "ACTIVE" : "INACTIVE"}</span></td><td className="px-4 py-3 text-xs text-muted-foreground">{new Date(customer.created_at).toLocaleDateString("en-IN")}</td><td className="px-4 py-3 text-xs text-muted-foreground">{customer.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleString("en-IN") : "Never"}</td></tr>)}</tbody>
              </table>
              {customers.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No registered customers yet.</p>}
            </div>
          </div>
        )}

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
                        <img src={productImage(p)} alt={p.name} width={80} height={80} loading="lazy" decoding="async" className="h-20 w-20 object-cover" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-lg text-foreground">{p.name}</span>
                            {isProductNew(p) && <span className="bg-gold px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.2em] text-onyx">NEW</span>}
                            {p.sold_out && <span className="bg-onyx px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.2em] text-cream">SOLD OUT</span>}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{p.tagline || "—"}</div>
                          <div className="mt-1 text-sm font-semibold text-foreground">{formatINR(p.price)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to="/products/$category" params={{ category: p.id }} className="rounded p-2 text-muted-foreground hover:text-gold" title="View">
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
            <button
              type="button"
              onClick={() => refetchOrders()}
              disabled={ordersRefreshing}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 text-[11px] font-semibold tracking-[0.24em] text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${ordersRefreshing ? "animate-spin" : ""}`} /> REFRESH
            </button>
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
                        {o.coupon_code && (
                          <div className="text-[10px] font-semibold tracking-[0.12em] text-gold">
                            {o.coupon_code} · -{formatINR(o.discount_amount)}
                          </div>
                        )}
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

                    {invoiceEditor?.id === o.id && (
                      <div className="grid gap-3 border-t border-border pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.22em] text-gold">INVOICE CONTENT</p>
                            <p className="mt-1 text-xs text-muted-foreground">This information appears on the customer's downloadable invoice.</p>
                          </div>
                          <button type="button" onClick={() => setInvoiceEditor(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Invoice number"><input value={invoiceEditor.details.invoice_number ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, invoice_number: e.target.value } })} placeholder={`YM-${o.id.slice(0, 8).toUpperCase()}`} className={invoiceInputCls} /></Field>
                          <Field label="Tax rate (%)"><input type="number" min="0" max="100" value={invoiceEditor.details.tax_rate ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, tax_rate: e.target.value === "" ? undefined : Number(e.target.value) } })} className={invoiceInputCls} /></Field>
                          <Field label="Discount (₹)"><input type="number" min="0" value={invoiceEditor.details.discount ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, discount: e.target.value === "" ? undefined : Number(e.target.value) } })} className={invoiceInputCls} /></Field>
                          <Field label="Seller / brand name"><input value={invoiceEditor.details.seller_name ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, seller_name: e.target.value } })} placeholder="YOMORA" className={invoiceInputCls} /></Field>
                        </div>
                        <Field label="Seller address"><textarea rows={2} value={invoiceEditor.details.seller_address ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, seller_address: e.target.value } })} className={invoiceInputCls} /></Field>
                        <div className="grid gap-3 sm:grid-cols-2"><Field label="Seller phone"><input value={invoiceEditor.details.seller_phone ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, seller_phone: e.target.value } })} className={invoiceInputCls} /></Field><Field label="Thank-you message"><input value={invoiceEditor.details.thank_you_note ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, thank_you_note: e.target.value } })} placeholder="Thank you for choosing YOMORA." className={invoiceInputCls} /></Field></div>
                        <Field label="Bank details"><textarea rows={2} value={invoiceEditor.details.bank_details ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, bank_details: e.target.value } })} className={invoiceInputCls} /></Field>
                        <Field label="Invoice note"><textarea rows={2} value={invoiceEditor.details.notes ?? ""} onChange={(e) => setInvoiceEditor({ ...invoiceEditor, details: { ...invoiceEditor.details, notes: e.target.value } })} className={invoiceInputCls} /></Field>
                        <div><button type="button" disabled={invoiceMut.isPending} onClick={() => invoiceMut.mutate({ id: o.id, invoice_details: invoiceEditor.details })} className="inline-flex items-center gap-2 bg-gold px-4 py-2 text-[10px] font-semibold tracking-[0.2em] text-onyx disabled:opacity-50"><Save className="h-3.5 w-3.5" /> SAVE INVOICE</button></div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                      {o.status !== "cancelled" && (
                        <button
                          type="button"
                          disabled={velocityShipmentMut.isPending}
                          onClick={() => velocityShipmentMut.mutate(o.id)}
                          className="inline-flex items-center gap-1.5 border border-gold px-3 py-2 text-[10px] font-semibold tracking-[0.2em] text-gold hover:bg-gold hover:text-onyx disabled:opacity-50"
                        >
                          <Truck className="h-3.5 w-3.5" /> CREATE VELOCITY SHIPMENT
                        </button>
                      )}
                      {o.status === "completed" && (
                        <button
                          type="button"
                          onClick={() => openWhatsAppInvoice(o)}
                          className="inline-flex items-center gap-1.5 bg-[#25D366] px-3 py-2 text-[10px] font-semibold tracking-[0.2em] text-[#071b0e] hover:bg-[#20bd5a]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> SEND WHATSAPP INVOICE
                        </button>
                      )}
                      <button
                        onClick={() => setInvoiceEditor({ id: o.id, details: (o.invoice_details ?? {}) as InvoiceDetails })}
                        className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] font-semibold tracking-[0.24em] hover:border-gold hover:text-gold"
                      >
                        <FileText className="h-3.5 w-3.5" /> INVOICE DETAILS
                      </button>
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

        {tab === "site" && <SiteContentEditor />}

        {tab === "coupons" && <CouponManager />}

        {tab === "alerts" && (
          <div className="mt-8 grid gap-8">
            <div className="grid gap-2">
            <h2 className="font-display text-2xl">Customer enquiries & subscriptions</h2>
            {inquiriesQ.isLoading && <p className="py-4 text-sm text-muted-foreground">Loading customer enquiries…</p>}
            {!inquiriesQ.isLoading && (inquiriesQ.data ?? []).length === 0 && <p className="py-4 text-sm text-muted-foreground">No customer enquiries yet.</p>}
            {(inquiriesQ.data ?? []).map((inquiry) => <div key={inquiry.id} className="grid gap-2 border border-border p-3 sm:grid-cols-[1fr_auto]"><div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">{inquiry.inquiry_type.replace("_", " ")}</div><div className="mt-1 font-medium">{inquiry.name || inquiry.email}</div><div className="mt-0.5 text-xs text-muted-foreground">{[inquiry.email, inquiry.phone].filter(Boolean).join(" · ")}</div>{inquiry.message && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{inquiry.message}</p>}</div><span className="text-xs text-muted-foreground">{new Date(inquiry.created_at).toLocaleString("en-IN")}</span></div>)}
            </div>
            <div className="grid gap-2">
            <h2 className="font-display text-2xl">Restock alerts</h2>
            {alertsQ.isLoading && <p className="py-8 text-sm text-muted-foreground">Loading restock alerts…</p>}
            {!alertsQ.isLoading && (alertsQ.data ?? []).length === 0 && (
              <p className="py-8 text-sm text-muted-foreground">No restock alerts yet.</p>
            )}
            {(alertsQ.data ?? []).map((a: any) => (
              <div key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border border-border p-3">
                <div className="min-w-0">
                  <div className="font-display text-lg text-foreground">
                    {products.find((p) => p.id === a.product_id)?.name ?? a.product_id}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[a.name, a.email, a.phone].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
            </div>
          </div>
        )}
      </section>

      {tab === "memberships" && (
        <section className="container-x mx-auto max-w-[1400px] pb-16">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              value={memSearch}
              onChange={(e) => setMemSearch(e.target.value)}
              placeholder="Search member ID, email, or user ID…"
              className="min-w-[260px] flex-1 border border-border bg-background px-3 py-2 text-sm focus:border-gold"
            />
            <div className="flex flex-wrap gap-1">
              {(["all", "pending", "active", "expired", "cancelled"] as const).map((s) => {
                const count = s === "all" ? memberships.length : memberships.filter((m) => m.status === s).length;
                const active = memStatusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setMemStatusFilter(s)}
                    className={`inline-flex items-center gap-2 border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                      active ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {s} <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground/70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredMemberships.length === 0 ? (
            <div className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No memberships match.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredMemberships.map((m) => (
                <div key={m.id} className="grid gap-3 border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg text-foreground">
                          {m.member_number || "—"}
                        </span>
                        <MembershipStatusBadge status={m.status} />
                        {m.auto_renew && (
                          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] tracking-[0.2em] text-foreground/70">
                            AUTO-RENEW
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {m.user_email ?? "unknown email"} · {m.plan_name ?? "no plan"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        User {m.user_id.slice(0, 8)} · created {new Date(m.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Activated: {m.activated_at ? new Date(m.activated_at).toLocaleDateString() : "—"}</div>
                      <div>Expires: {m.expires_at ? new Date(m.expires_at).toLocaleDateString() : "—"}</div>
                    </div>
                  </div>

                  {m.notes && (
                    <div className="border-t border-border pt-3 text-xs text-muted-foreground whitespace-pre-wrap">
                      {m.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    {m.status !== "active" && (
                      <button
                        onClick={() => setMembershipStatusQuick(m, "active")}
                        className="inline-flex items-center gap-1.5 bg-gold px-3 py-2 text-[10px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft"
                      >
                        <Check className="h-3.5 w-3.5" /> ACTIVATE
                      </button>
                    )}
                    {m.status !== "expired" && (
                      <button
                        onClick={() => setMembershipStatusQuick(m, "expired")}
                        className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] font-semibold tracking-[0.24em] hover:border-foreground"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> EXPIRE
                      </button>
                    )}
                    {m.status !== "cancelled" && (
                      <button
                        onClick={() => setMembershipStatusQuick(m, "cancelled")}
                        className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] font-semibold tracking-[0.24em] hover:border-destructive hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" /> CANCEL
                      </button>
                    )}
                    <button onClick={() => openMembership(m)} className="rounded p-2 text-muted-foreground hover:text-gold" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this membership?")) memDeleteMut.mutate(m.id); }}
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
        </section>
      )}

      {isMemOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={closeMembership}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleMembershipSubmit}
            className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto border border-border bg-background p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{memEditing ? "Edit membership" : "New membership"}</h2>
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={memForm.auto_renew}
                  onChange={(e) => setMemForm({ ...memForm, auto_renew: e.target.checked })}
                />
                Auto-renew
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer email">
                <input
                  required
                  type="email"
                  disabled={!!memEditing}
                  value={memForm.user_email}
                  onChange={(e) => setMemForm({ ...memForm, user_email: e.target.value })}
                  placeholder="customer@email.com"
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold disabled:opacity-70"
                />
              </Field>
              <Field label="Member ID (member number)">
                <input
                  value={memForm.member_number}
                  onChange={(e) => setMemForm({ ...memForm, member_number: e.target.value })}
                  placeholder="YM-000123"
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                />
              </Field>
              <Field label="Plan">
                <select
                  value={memForm.plan_id}
                  onChange={(e) => setMemForm({ ...memForm, plan_id: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                >
                  <option value="">— No plan —</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={memForm.status}
                  onChange={(e) => setMemForm({ ...memForm, status: e.target.value as MembershipFormState["status"] })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
              <Field label="Activated at">
                <input
                  type="date"
                  value={memForm.activated_at}
                  onChange={(e) => setMemForm({ ...memForm, activated_at: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                />
              </Field>
              <Field label="Expires at">
                <input
                  type="date"
                  value={memForm.expires_at}
                  onChange={(e) => setMemForm({ ...memForm, expires_at: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                />
              </Field>
            </div>

            <Field label="Internal notes">
              <textarea
                rows={3}
                value={memForm.notes}
                onChange={(e) => setMemForm({ ...memForm, notes: e.target.value })}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
              />
            </Field>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeMembership} className="border border-border px-5 py-3 text-[11px] font-semibold tracking-[0.24em] hover:bg-secondary">
                CANCEL
              </button>
              <button
                type="submit"
                disabled={memCreateMut.isPending || memUpdateMut.isPending}
                className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft disabled:opacity-60"
              >
                {(memCreateMut.isPending || memUpdateMut.isPending) ? "SAVING…" : memEditing ? "SAVE MEMBERSHIP" : "CREATE MEMBERSHIP"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "subscription" && (
        <section className="container-x mx-auto max-w-5xl pb-16">
          {plans.length === 0 ? (
            <div className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No plans yet. Click <span className="font-semibold text-foreground">ADD PLAN</span> to create one.
            </div>
          ) : (
            <div className="grid gap-3">
              {plans.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg">{p.name}</h3>
                      <span className={`rounded px-2 py-0.5 text-[10px] tracking-[0.2em] ${p.is_active ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>
                        {p.is_active ? "LIVE" : "HIDDEN"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.tagline || "—"}</p>
                    <p className="mt-1 text-xs">{formatINR(p.price)} · {p.duration_label} · {p.benefits.length} benefits</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openPlan(p)} className="rounded p-2 text-muted-foreground hover:text-gold" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete plan "${p.name}"?`)) planDeleteMut.mutate(p.id); }}
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
        </section>
      )}

      {isPlanOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={closePlan}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handlePlanSubmit}
            className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto border border-border bg-background p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{planEditing ? "Edit plan" : "New plan"}</h2>
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={planForm.is_active}
                  onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                />
                Show on storefront
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plan name">
                <input required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold" />
              </Field>
              <Field label="Price (INR)">
                <input required type="number" min={0} value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold" />
              </Field>
              <Field label="Duration label">
                <input required value={planForm.duration_label} onChange={(e) => setPlanForm({ ...planForm, duration_label: e.target.value })} placeholder="per year" className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold" />
              </Field>
              <Field label="CTA button label">
                <input required value={planForm.cta_label} onChange={(e) => setPlanForm({ ...planForm, cta_label: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold" />
              </Field>
            </div>
            <Field label="Tagline">
              <input value={planForm.tagline} onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold" />
            </Field>
            <Field label="Benefits (one per line)">
              <textarea
                rows={6}
                value={planForm.benefits}
                onChange={(e) => setPlanForm({ ...planForm, benefits: e.target.value })}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closePlan} className="border border-border px-5 py-3 text-[11px] font-semibold tracking-[0.24em] hover:bg-secondary">
                CANCEL
              </button>
              <button
                type="submit"
                disabled={planCreateMut.isPending || planUpdateMut.isPending}
                className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft disabled:opacity-60"
              >
                {(planCreateMut.isPending || planUpdateMut.isPending) ? "SAVING…" : planEditing ? "SAVE PLAN" : "CREATE PLAN"}
              </button>
            </div>
          </form>
        </div>
      )}

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
              <Field label="Shop for">
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value as Audience })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tagline">
                <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold" />
              </Field>
              <GalleryUploadField
                label="Product images"
                value={form.gallery_urls}
                onChange={(urls: string[]) =>
                  setForm({ ...form, gallery_urls: urls, image_url: urls[0] ?? "" })
                }
              />
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
              <input type="checkbox" checked={form.sold_out} onChange={(e) => setForm({ ...form, sold_out: e.target.checked })} className="accent-[color:var(--gold)]" />
              Mark as Sold Out (shows a “Notify Me” button instead of Add to Cart)
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

function MembershipStatusBadge({ status }: { status: "pending" | "active" | "expired" | "cancelled" }) {
  const styles: Record<string, string> = {
    active: "bg-gold text-onyx",
    pending: "bg-secondary text-foreground",
    expired: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive text-destructive-foreground",
  };
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.2em] ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
