import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImageDown, Loader2, Plus, Trash2 } from "lucide-react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { canOptimizeImageUrl, optimizeImageUrl, type ImageOptimizationResult } from "@/lib/image-optimizer";
import { updateProductImagesFn } from "@/lib/products.functions";
import { productsQuery } from "@/lib/products.queries";
import { siteContentQuery } from "@/lib/site-content.queries";
import { updateSiteContentFn } from "@/lib/site-content.functions";
import {
  ICON_CHOICES,
  SITE_CONTENT_DEFAULTS,
  SOCIAL_PLATFORMS,
  type IconName,
  type SocialPlatform,
  type SiteContentKey,
  type SiteContentMap,
} from "@/lib/site-content.defaults";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold";

type OptimizationProgress = {
  done: number;
  total: number;
  optimized: number;
  skipped: number;
  failed: number;
  bytesSaved: number;
};

function collectContentImageUrls(value: unknown, urls: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectContentImageUrls(item, urls));
    return;
  }
  if (!value || typeof value !== "object") return;

  Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
    if (key === "image_url" && typeof child === "string" && canOptimizeImageUrl(child)) urls.add(child);
    else collectContentImageUrls(child, urls);
  });
}

function replaceContentImageUrls(value: unknown, results: Map<string, ImageOptimizationResult>): unknown {
  if (Array.isArray(value)) return value.map((item) => replaceContentImageUrls(item, results));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => {
      if (key === "image_url" && typeof child === "string") {
        const result = results.get(child);
        return [key, result?.status === "optimized" ? result.url : child];
      }
      return [key, replaceContentImageUrls(child, results)];
    }),
  );
}

function formatSavedBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: IconName) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as IconName)} className={inputCls}>
      {ICON_CHOICES.map((i) => (
        <option key={i} value={i}>{i}</option>
      ))}
    </select>
  );
}

function SectionCard<T>({
  title,
  description,
  value,
  onSave,
  saving,
  render,
}: {
  title: string;
  description?: string;
  value: T;
  onSave: (v: T) => void;
  saving: boolean;
  render: (state: T, set: (patch: Partial<T> | ((prev: T) => T)) => void) => React.ReactNode;
}) {
  const [draft, setDraft] = useState<T>(value);
  useEffect(() => setDraft(value), [value]);
  const set = (patch: Partial<T> | ((prev: T) => T)) => {
    setDraft((prev) => (typeof patch === "function" ? (patch as (p: T) => T)(prev) : { ...prev, ...patch }));
  };
  return (
    <details className="group border border-border bg-background">
      <summary className="cursor-pointer list-none border-b border-transparent px-5 py-4 hover:bg-secondary/40 group-open:border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground group-open:hidden">EDIT ↓</span>
          <span className="hidden text-[10px] tracking-[0.2em] text-muted-foreground group-open:inline">CLOSE ↑</span>
        </div>
      </summary>
      <form
        onSubmit={(e) => { e.preventDefault(); onSave(draft); }}
        className="grid gap-4 p-5"
      >
        {render(draft, set)}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold-soft disabled:opacity-60"
          >
            {saving ? "SAVING…" : "SAVE"}
          </button>
        </div>
      </form>
    </details>
  );
}

export function SiteContentEditor() {
  const qc = useQueryClient();
  const { data: content = SITE_CONTENT_DEFAULTS } = useQuery(siteContentQuery());
  const { data: products = [] } = useQuery(productsQuery());
  const save = useServerFn(updateSiteContentFn);
  const updateProductImages = useServerFn(updateProductImagesFn);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState<OptimizationProgress | null>(null);

  const mut = useMutation({
    mutationFn: (v: { key: SiteContentKey; data: unknown }) => save({ data: v }),
    onSuccess: () => {
      toast.success("Content saved");
      qc.invalidateQueries({ queryKey: ["site_content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savingKey = mut.isPending ? (mut.variables?.key as SiteContentKey | undefined) : undefined;
  const isSaving = (k: SiteContentKey) => savingKey === k;
  const persist = <K extends SiteContentKey>(key: K, data: SiteContentMap[K]) =>
    mut.mutate({ key, data });

  async function optimizeAllImages() {
    const urls = new Set<string>();
    collectContentImageUrls(content, urls);
    products.forEach((product) => {
      if (product.image_url && canOptimizeImageUrl(product.image_url)) urls.add(product.image_url);
      product.gallery_urls.forEach((url) => {
        if (canOptimizeImageUrl(url)) urls.add(url);
      });
    });

    if (!urls.size) {
      toast.info("No uploaded images found to optimize");
      return;
    }
    if (!window.confirm(`Optimize ${urls.size} unique images now? Originals will be kept for recovery.`)) return;

    setOptimizing(true);
    let progress: OptimizationProgress = {
      done: 0,
      total: urls.size,
      optimized: 0,
      skipped: 0,
      failed: 0,
      bytesSaved: 0,
    };
    setOptimizationProgress(progress);

    try {
      const results = new Map<string, ImageOptimizationResult>();
      for (const url of urls) {
        const result = await optimizeImageUrl(url);
        results.set(url, result);
        progress = {
          ...progress,
          done: progress.done + 1,
          optimized: progress.optimized + (result.status === "optimized" ? 1 : 0),
          skipped: progress.skipped + (result.status === "skipped" ? 1 : 0),
          failed: progress.failed + (result.status === "failed" ? 1 : 0),
          bytesSaved:
            progress.bytesSaved +
            (result.status === "optimized" ? result.beforeBytes - result.afterBytes : 0),
        };
        setOptimizationProgress(progress);
      }

      for (const product of products) {
        const mainResult = product.image_url ? results.get(product.image_url) : undefined;
        const imageUrl = mainResult?.status === "optimized" ? mainResult.url : product.image_url;
        const galleryUrls = product.gallery_urls.map((url) => {
          const result = results.get(url);
          return result?.status === "optimized" ? result.url : url;
        });
        const changed = imageUrl !== product.image_url || galleryUrls.some((url, i) => url !== product.gallery_urls[i]);
        if (changed) {
          await updateProductImages({
            data: { id: product.id, image_url: imageUrl, gallery_urls: galleryUrls },
          });
        }
      }

      for (const key of Object.keys(content) as SiteContentKey[]) {
        const current = content[key];
        const updated = replaceContentImageUrls(current, results) as SiteContentMap[typeof key];
        if (JSON.stringify(updated) !== JSON.stringify(current)) await save({ data: { key, data: updated } });
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["products"] }),
        qc.invalidateQueries({ queryKey: ["site_content"] }),
      ]);
      toast.success(
        `Optimized ${progress.optimized}, skipped ${progress.skipped}, failed ${progress.failed}. Saved ${formatSavedBytes(progress.bytesSaved)}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not finish image optimization");
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <div className="mt-8 grid gap-3">
      <p className="text-sm text-muted-foreground">
        Edit every section of the storefront — header, hero, trust bar, story, section titles, CTA strip and footer. Changes go live immediately.
      </p>

      <div className="border border-gold/35 bg-gold/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg">Image optimization</h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Compress product, gallery and site-content images to lightweight WebP files. Already optimized images are skipped, and original files are retained.
            </p>
          </div>
          <button
            type="button"
            disabled={optimizing}
            onClick={() => void optimizeAllImages()}
            className="inline-flex shrink-0 items-center justify-center gap-2 bg-gold px-5 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-onyx hover:bg-gold-soft disabled:cursor-wait disabled:opacity-60"
          >
            {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
            {optimizing ? "OPTIMIZING…" : "OPTIMIZE ALL IMAGES"}
          </button>
        </div>
        {optimizationProgress && (
          <div className="mt-4" aria-live="polite">
            <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>{optimizationProgress.done} of {optimizationProgress.total} processed</span>
              <span>
                {optimizationProgress.optimized} optimized · {optimizationProgress.skipped} skipped · {optimizationProgress.failed} failed
              </span>
            </div>
            <div className="h-1.5 overflow-hidden bg-border">
              <div
                className="h-full bg-gold transition-[width] duration-300"
                style={{ width: `${optimizationProgress.total ? (optimizationProgress.done / optimizationProgress.total) * 100 : 0}%` }}
              />
            </div>
            {optimizationProgress.done === optimizationProgress.total && (
              <p className="mt-2 text-xs text-muted-foreground">Space and transfer saved: {formatSavedBytes(optimizationProgress.bytesSaved)}</p>
            )}
          </div>
        )}
      </div>

      {/* HEADER */}
      <SectionCard
        title="Header"
        description="Top announcement strip and brand mark."
        value={content.header}
        saving={isSaving("header")}
        onSave={(v) => persist("header", v)}
        render={(s, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand name"><input className={inputCls} value={s.brand_name} onChange={(e) => set({ brand_name: e.target.value })} /></Field>
              <Field label="Brand tagline"><input className={inputCls} value={s.brand_tagline} onChange={(e) => set({ brand_tagline: e.target.value })} /></Field>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">ANNOUNCEMENTS</span>
                <button type="button" onClick={() => set((p) => ({ ...p, announcements: [...p.announcements, { icon: "Sparkles" as IconName, text: "" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add</button>
              </div>
              <div className="grid gap-2">
                {s.announcements.map((a, i) => (
                  <div key={i} className="grid grid-cols-[140px_1fr_auto] gap-2">
                    <IconPicker value={a.icon} onChange={(v) => set((p) => ({ ...p, announcements: p.announcements.map((x, ix) => ix === i ? { ...x, icon: v } : x) }))} />
                    <input className={inputCls} value={a.text} onChange={(e) => set((p) => ({ ...p, announcements: p.announcements.map((x, ix) => ix === i ? { ...x, text: e.target.value } : x) }))} />
                    <button type="button" onClick={() => set((p) => ({ ...p, announcements: p.announcements.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      />

      {/* HEADER NAV */}
      <SectionCard
        title="Header menu"
        description="Main navigation links shown in the header."
        value={content.header_nav}
        saving={isSaving("header_nav")}
        onSave={(v) => persist("header_nav", v)}
        render={(s, set) => (
          <>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={s.include_categories}
                onChange={(e) => set({ include_categories: e.target.checked })}
              />
              Auto-include all categories before custom links
            </label>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">MENU ITEMS</span>
                <button type="button" onClick={() => set((p) => ({ ...p, items: [...p.items, { label: "", to: "/products", hash: "" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add link</button>
              </div>
              <div className="grid gap-2">
                {s.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                    <input className={inputCls} placeholder="LABEL" value={it.label} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, label: e.target.value } : x) }))} />
                    <input className={inputCls} placeholder="/path (e.g. /products)" value={it.to} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, to: e.target.value } : x) }))} />
                    <input className={inputCls} placeholder="anchor (optional)" value={it.hash} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, hash: e.target.value } : x) }))} />
                    <button type="button" onClick={() => set((p) => ({ ...p, items: p.items.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Tip: use path <code>/products</code> and an anchor like <code>rings</code> to jump straight to a category on the shop page.</p>
            </div>
          </>
        )}
      />

      {/* HERO */}
      <SectionCard
        title="Hero section"
        description="Main homepage banner."
        value={content.hero}
        saving={isSaving("hero")}
        onSave={(v) => persist("hero", v)}
        render={(s, set) => (
          <>
            <Field label="Eyebrow"><input className={inputCls} value={s.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title line 1"><input className={inputCls} value={s.title_line_1} onChange={(e) => set({ title_line_1: e.target.value })} /></Field>
              <Field label="Title line 2"><input className={inputCls} value={s.title_line_2} onChange={(e) => set({ title_line_2: e.target.value })} /></Field>
            </div>
            <Field label="Description"><textarea rows={3} className={inputCls} value={s.description} onChange={(e) => set({ description: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary button label"><input className={inputCls} value={s.primary_cta_label} onChange={(e) => set({ primary_cta_label: e.target.value })} /></Field>
              <Field label="Primary button anchor (e.g. rings)"><input className={inputCls} value={s.primary_cta_hash} onChange={(e) => set({ primary_cta_hash: e.target.value })} /></Field>
              <Field label="Secondary button label"><input className={inputCls} value={s.secondary_cta_label} onChange={(e) => set({ secondary_cta_label: e.target.value })} /></Field>
              <Field label="Secondary button anchor"><input className={inputCls} value={s.secondary_cta_hash} onChange={(e) => set({ secondary_cta_hash: e.target.value })} /></Field>
            </div>
            <Field label="Custom card title"><input className={inputCls} value={s.custom_card_title} onChange={(e) => set({ custom_card_title: e.target.value })} /></Field>
            <Field label="Custom card body"><textarea rows={2} className={inputCls} value={s.custom_card_body} onChange={(e) => set({ custom_card_body: e.target.value })} /></Field>
          </>
        )}
      />

      {/* TRUST BAR */}
      <SectionCard
        title="Trust bar"
        description="Icons + short claims shown under the hero."
        value={content.trust_bar}
        saving={isSaving("trust_bar")}
        onSave={(v) => persist("trust_bar", v)}
        render={(s, set) => (
          <div className="grid gap-3">
            {s.items.map((it, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr_1fr_auto] gap-2">
                <IconPicker value={it.icon} onChange={(v) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, icon: v } : x) }))} />
                <input className={inputCls} placeholder="Title" value={it.title} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, title: e.target.value } : x) }))} />
                <input className={inputCls} placeholder="Body" value={it.body} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, body: e.target.value } : x) }))} />
                <button type="button" onClick={() => set((p) => ({ ...p, items: p.items.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set((p) => ({ ...p, items: [...p.items, { icon: "Sparkles" as IconName, title: "", body: "" }] }))} className="inline-flex items-center gap-1 justify-self-start text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add item</button>
          </div>
        )}
      />

      {/* LEGACY */}
      <SectionCard
        title="Legacy story"
        description="'Our Legacy' section on the homepage."
        value={content.legacy}
        saving={isSaving("legacy")}
        onSave={(v) => persist("legacy", v)}
        render={(s, set) => (
          <>
            <Field label="Eyebrow"><input className={inputCls} value={s.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title line 1"><input className={inputCls} value={s.title_line_1} onChange={(e) => set({ title_line_1: e.target.value })} /></Field>
              <Field label="Title line 2"><input className={inputCls} value={s.title_line_2} onChange={(e) => set({ title_line_2: e.target.value })} /></Field>
            </div>
            <Field label="Description"><textarea rows={3} className={inputCls} value={s.description} onChange={(e) => set({ description: e.target.value })} /></Field>
            <ImageUploadField label="Image (leave blank for default)" value={s.image_url} onChange={(url) => set({ image_url: url })} />
            <Field label="Bullet points (one per line)">
              <textarea rows={5} className={inputCls} value={s.bullets.join("\n")} onChange={(e) => set({ bullets: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
            </Field>
          </>
        )}
      />

      {/* CATEGORIES SECTION */}
      <SectionCard
        title="Categories section heading"
        value={content.categories_section}
        saving={isSaving("categories_section")}
        onSave={(v) => persist("categories_section", v)}
        render={(s, set) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Eyebrow"><input className={inputCls} value={s.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
            <Field label="Title"><input className={inputCls} value={s.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          </div>
        )}
      />

      {/* FEATURED SECTION */}
      <SectionCard
        title="Assurance bar (after categories)"
        description="Gold icon cards shown right below the categories rail."
        value={content.assurance_bar}
        saving={isSaving("assurance_bar")}
        onSave={(v) => persist("assurance_bar", v)}
        render={(s, set) => (
          <div className="grid gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={s.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
              Show this section
            </label>
            {s.items.map((it, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr_1fr_auto] gap-2">
                <IconPicker value={it.icon} onChange={(v) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, icon: v } : x) }))} />
                <input className={inputCls} placeholder="Title" value={it.title} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, title: e.target.value } : x) }))} />
                <input className={inputCls} placeholder="Subtitle" value={it.subtitle} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, subtitle: e.target.value } : x) }))} />
                <button type="button" onClick={() => set((p) => ({ ...p, items: p.items.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set((p) => ({ ...p, items: [...p.items, { icon: "Sparkles" as IconName, title: "", subtitle: "" }] }))} className="inline-flex items-center gap-1 justify-self-start text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add card</button>
          </div>
        )}
      />

      {/* FEATURED SECTION */}
      <SectionCard
        title="Featured section heading"
        value={content.featured_section}
        saving={isSaving("featured_section")}
        onSave={(v) => persist("featured_section", v)}
        render={(s, set) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Eyebrow"><input className={inputCls} value={s.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
            <Field label="Title"><input className={inputCls} value={s.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          </div>
        )}
      />

      {/* CTA STRIP */}
      <SectionCard
        title="Custom-piece CTA strip"
        value={content.cta_strip}
        saving={isSaving("cta_strip")}
        onSave={(v) => persist("cta_strip", v)}
        render={(s, set) => (
          <>
            <Field label="Title"><input className={inputCls} value={s.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Body"><textarea rows={2} className={inputCls} value={s.body} onChange={(e) => set({ body: e.target.value })} /></Field>
            <Field label="Button label"><input className={inputCls} value={s.button_label} onChange={(e) => set({ button_label: e.target.value })} /></Field>
            <Field label="WhatsApp number (with country code, digits only)"><input className={inputCls} placeholder="919000000000" value={s.whatsapp_number} onChange={(e) => set({ whatsapp_number: e.target.value })} /></Field>
            <Field label="Prefilled WhatsApp message"><textarea rows={2} className={inputCls} value={s.whatsapp_message} onChange={(e) => set({ whatsapp_message: e.target.value })} /></Field>
          </>
        )}
      />

      <SectionCard
        title="Homepage banner slider"
        description="Upload wide banners (recommended 2000 × 469), set where each banner opens, and add more banners when needed. Slider controls appear only when you have two or more banners."
        value={content.homepage_banners}
        saving={isSaving("homepage_banners")}
        onSave={(v) => persist("homepage_banners", v)}
        render={(s, set) => (
          <div className="grid gap-5">
            {s.slides.map((slide, i) => (
              <div key={i} className="grid gap-3 border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground">BANNER {i + 1}</span>
                  {s.slides.length > 1 && (
                    <button type="button" onClick={() => set((p) => ({ ...p, slides: p.slides.filter((_, ix) => ix !== i) }))} className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                  )}
                </div>
                <ImageUploadField label="Banner image" value={slide.image_url} onChange={(url) => set((p) => ({ ...p, slides: p.slides.map((x, ix) => ix === i ? { ...x, image_url: url } : x) }))} />
                <Field label="Destination link (e.g. /products, /custom-jewellery, or https://...) "><input className={inputCls} placeholder="/products" value={slide.link} onChange={(e) => set((p) => ({ ...p, slides: p.slides.map((x, ix) => ix === i ? { ...x, link: e.target.value } : x) }))} /></Field>
                <Field label="Image description (for accessibility)"><input className={inputCls} placeholder="New arrivals in 925 silver" value={slide.alt} onChange={(e) => set((p) => ({ ...p, slides: p.slides.map((x, ix) => ix === i ? { ...x, alt: e.target.value } : x) }))} /></Field>
              </div>
            ))}
            <button type="button" onClick={() => set((p) => ({ ...p, slides: [...p.slides, { image_url: "", link: "/products", alt: "" }] }))} className="inline-flex items-center gap-1 justify-self-start text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add banner</button>
          </div>
        )}
      />

      {/* FOOTER */}
      <SectionCard
        title="Footer"
        description="Brand blurb, link columns, newsletter and copyright."
        value={content.footer}
        saving={isSaving("footer")}
        onSave={(v) => persist("footer", v)}
        render={(s, set) => (
          <>
            <Field label="Brand blurb"><textarea rows={2} className={inputCls} value={s.brand_blurb} onChange={(e) => set({ brand_blurb: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.2em] text-muted-foreground">SHOP LINKS</span>
                  <button type="button" onClick={() => set((p) => ({ ...p, shop_links: [...p.shop_links, { label: "", to: "/products" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add</button>
                </div>
                <div className="grid gap-2">
                  {s.shop_links.map((l, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input className={inputCls} placeholder="Label" value={l.label} onChange={(e) => set((p) => ({ ...p, shop_links: p.shop_links.map((x, ix) => ix === i ? { ...x, label: e.target.value } : x) }))} />
                      <input className={inputCls} placeholder="/path" value={l.to} onChange={(e) => set((p) => ({ ...p, shop_links: p.shop_links.map((x, ix) => ix === i ? { ...x, to: e.target.value } : x) }))} />
                      <button type="button" onClick={() => set((p) => ({ ...p, shop_links: p.shop_links.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.2em] text-muted-foreground">HELP LINKS</span>
                  <button type="button" onClick={() => set((p) => ({ ...p, help_links: [...p.help_links, { label: "", to: "/products" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add</button>
                </div>
                <div className="grid gap-2">
                  {s.help_links.map((l, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input className={inputCls} placeholder="Label" value={l.label} onChange={(e) => set((p) => ({ ...p, help_links: p.help_links.map((x, ix) => ix === i ? { ...x, label: e.target.value } : x) }))} />
                      <input className={inputCls} placeholder="/path" value={l.to} onChange={(e) => set((p) => ({ ...p, help_links: p.help_links.map((x, ix) => ix === i ? { ...x, to: e.target.value } : x) }))} />
                      <button type="button" onClick={() => set((p) => ({ ...p, help_links: p.help_links.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Newsletter title"><input className={inputCls} value={s.newsletter_title} onChange={(e) => set({ newsletter_title: e.target.value })} /></Field>
              <Field label="Newsletter body"><input className={inputCls} value={s.newsletter_body} onChange={(e) => set({ newsletter_body: e.target.value })} /></Field>
            </div>
            <Field label="Copyright (year auto-inserted after ©)"><input className={inputCls} value={s.copyright} onChange={(e) => set({ copyright: e.target.value })} /></Field>
          </>
        )}
      />

      {/* REELS */}
      <SectionCard
        title="Instagram Reels section"
        description="Homepage grid of embedded Reels. Paste public Reel or post URLs."
        value={content.reels}
        saving={isSaving("reels")}
        onSave={(v) => persist("reels", v)}
        render={(s, set) => (
          <>
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={s.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
              Show Reels section on homepage
            </label>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={s.autoplay} onChange={(e) => set({ autoplay: e.target.checked })} />
                Autoplay reels when visible
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={s.loop} onChange={(e) => set({ loop: e.target.checked })} />
                Loop reels continuously
              </label>
            </div>
            <Field label="Eyebrow"><input className={inputCls} value={s.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
            <Field label="Title"><input className={inputCls} value={s.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Description"><textarea rows={2} className={inputCls} value={s.description} onChange={(e) => set({ description: e.target.value })} /></Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">REEL LINKS</span>
                <button type="button" onClick={() => set((p) => ({ ...p, items: [...p.items, { url: "", caption: "" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add Reel</button>
              </div>
              <div className="grid gap-2">
                {s.items.map((r, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_auto] gap-2">
                    <input className={inputCls} placeholder="https://www.instagram.com/reel/xxxxxx/" value={r.url} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, url: e.target.value } : x) }))} />
                    <input className={inputCls} placeholder="Optional caption" value={r.caption} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, caption: e.target.value } : x) }))} />
                    <button type="button" onClick={() => set((p) => ({ ...p, items: p.items.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Paste the full URL of a public Reel, post or video (e.g. <code>https://www.instagram.com/reel/ABC123/</code>). Private accounts won't render.
              </p>
            </div>
          </>
        )}
      />

      {/* SOCIAL */}
      <SectionCard
        title="Social media & Follow buttons"
        description="Icons and follow buttons shown in the header, footer and Reels section."
        value={content.social}
        saving={isSaving("social")}
        onSave={(v) => persist("social", v)}
        render={(s, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Public handle (e.g. @yomora)"><input className={inputCls} value={s.handle} onChange={(e) => set({ handle: e.target.value })} /></Field>
              <Field label="Follow button label"><input className={inputCls} value={s.cta_label} onChange={(e) => set({ cta_label: e.target.value })} /></Field>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={s.show_in_header} onChange={(e) => set({ show_in_header: e.target.checked })} />
                Show icons in header
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={s.show_in_footer} onChange={(e) => set({ show_in_footer: e.target.checked })} />
                Show icons in footer
              </label>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">SOCIAL ACCOUNTS</span>
                <button type="button" onClick={() => set((p) => ({ ...p, items: [...p.items, { platform: "Instagram" as SocialPlatform, url: "", label: "" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add account</button>
              </div>
              <div className="grid gap-2">
                {s.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[140px_2fr_1fr_auto] gap-2">
                    <select className={inputCls} value={it.platform} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, platform: e.target.value as SocialPlatform } : x) }))}>
                      {SOCIAL_PLATFORMS.map((pf) => <option key={pf} value={pf}>{pf}</option>)}
                    </select>
                    <input className={inputCls} placeholder="https://…" value={it.url} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, url: e.target.value } : x) }))} />
                    <input className={inputCls} placeholder="Label (optional)" value={it.label} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, label: e.target.value } : x) }))} />
                    <button type="button" onClick={() => set((p) => ({ ...p, items: p.items.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      />

      {/* ABOUT PAGE */}
      <SectionCard
        title="About page"
        description="Story, stats and store title on /about."
        value={content.page_about}
        saving={isSaving("page_about")}
        onSave={(v) => persist("page_about", v)}
        render={(s, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Eyebrow"><input className={inputCls} value={s.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
              <Field label="Title"><input className={inputCls} value={s.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            </div>
            <Field label="Story paragraphs (one per line, blank line separates)">
              <textarea rows={8} className={inputCls} value={s.paragraphs.join("\n\n")} onChange={(e) => set({ paragraphs: e.target.value.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean) })} />
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">STATS</span>
                <button type="button" onClick={() => set((p) => ({ ...p, stats: [...p.stats, { value: "", label: "" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add</button>
              </div>
              <div className="grid gap-2">
                {s.stats.map((st, i) => (
                  <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                    <input className={inputCls} placeholder="Value" value={st.value} onChange={(e) => set((p) => ({ ...p, stats: p.stats.map((x, ix) => ix === i ? { ...x, value: e.target.value } : x) }))} />
                    <input className={inputCls} placeholder="Label" value={st.label} onChange={(e) => set((p) => ({ ...p, stats: p.stats.map((x, ix) => ix === i ? { ...x, label: e.target.value } : x) }))} />
                    <button type="button" onClick={() => set((p) => ({ ...p, stats: p.stats.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <Field label="Store section title"><input className={inputCls} value={s.store_title} onChange={(e) => set({ store_title: e.target.value })} /></Field>
          </>
        )}
      />

      {/* CUSTOM JEWELLERY PAGE */}
      <SectionCard
        title="Custom jewellery page"
        description="Hero, steps and enquiry form on /custom-jewellery."
        value={content.page_custom}
        saving={isSaving("page_custom")}
        onSave={(v) => persist("page_custom", v)}
        render={(s, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hero title"><input className={inputCls} value={s.hero_title} onChange={(e) => set({ hero_title: e.target.value })} /></Field>
              <Field label="Hero subtitle"><input className={inputCls} value={s.hero_subtitle} onChange={(e) => set({ hero_subtitle: e.target.value })} /></Field>
            </div>
            <Field label="Hero description"><textarea rows={3} className={inputCls} value={s.hero_description} onChange={(e) => set({ hero_description: e.target.value })} /></Field>
            <Field label="Feature bullets (one per line)">
              <textarea rows={4} className={inputCls} value={s.features.join("\n")} onChange={(e) => set({ features: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Steps eyebrow"><input className={inputCls} value={s.steps_eyebrow} onChange={(e) => set({ steps_eyebrow: e.target.value })} /></Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">STEPS</span>
                <button type="button" onClick={() => set((p) => ({ ...p, steps: [...p.steps, { icon: "Sparkles" as IconName, title: "", description: "" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add</button>
              </div>
              <div className="grid gap-2">
                {s.steps.map((st, i) => (
                  <div key={i} className="grid grid-cols-[140px_1fr_2fr_auto] gap-2">
                    <IconPicker value={st.icon} onChange={(v) => set((p) => ({ ...p, steps: p.steps.map((x, ix) => ix === i ? { ...x, icon: v } : x) }))} />
                    <input className={inputCls} placeholder="Title" value={st.title} onChange={(e) => set((p) => ({ ...p, steps: p.steps.map((x, ix) => ix === i ? { ...x, title: e.target.value } : x) }))} />
                    <input className={inputCls} placeholder="Description" value={st.description} onChange={(e) => set((p) => ({ ...p, steps: p.steps.map((x, ix) => ix === i ? { ...x, description: e.target.value } : x) }))} />
                    <button type="button" onClick={() => set((p) => ({ ...p, steps: p.steps.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Form title"><input className={inputCls} value={s.form_title} onChange={(e) => set({ form_title: e.target.value })} /></Field>
              <Field label="Button label"><input className={inputCls} value={s.form_button_label} onChange={(e) => set({ form_button_label: e.target.value })} /></Field>
            </div>
            <Field label="Success message"><input className={inputCls} value={s.form_success_message} onChange={(e) => set({ form_success_message: e.target.value })} /></Field>
          </>
        )}
      />

      {/* CONTACT PAGE */}
      <SectionCard
        title="Contact page"
        description="Contact info and form labels on /contact."
        value={content.page_contact}
        saving={isSaving("page_contact")}
        onSave={(v) => persist("page_contact", v)}
        render={(s, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title"><input className={inputCls} value={s.title} onChange={(e) => set({ title: e.target.value })} /></Field>
              <Field label="Subtitle"><input className={inputCls} value={s.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
            </div>
            <Field label="Phone lines (one per line)">
              <textarea rows={3} className={inputCls} value={s.phone_lines.join("\n")} onChange={(e) => set({ phone_lines: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Email"><input className={inputCls} value={s.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="Address lines (one per line)">
              <textarea rows={4} className={inputCls} value={s.address_lines.join("\n")} onChange={(e) => set({ address_lines: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button label"><input className={inputCls} value={s.form_button_label} onChange={(e) => set({ form_button_label: e.target.value })} /></Field>
              <Field label="Success message"><input className={inputCls} value={s.form_success_message} onChange={(e) => set({ form_success_message: e.target.value })} /></Field>
            </div>
          </>
        )}
      />

      {/* FAQ PAGE */}
      <SectionCard
        title="FAQ page"
        description="Questions, answers and help card on /faq."
        value={content.page_faq}
        saving={isSaving("page_faq")}
        onSave={(v) => persist("page_faq", v)}
        render={(s, set) => (
          <>
            <Field label="Page title"><input className={inputCls} value={s.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">QUESTIONS</span>
                <button type="button" onClick={() => set((p) => ({ ...p, items: [...p.items, { question: "", answer: "" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add</button>
              </div>
              <div className="grid gap-3">
                {s.items.map((it, i) => (
                  <div key={i} className="grid gap-2 border border-border p-3">
                    <input className={inputCls} placeholder="Question" value={it.question} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, question: e.target.value } : x) }))} />
                    <textarea rows={2} className={inputCls} placeholder="Answer" value={it.answer} onChange={(e) => set((p) => ({ ...p, items: p.items.map((x, ix) => ix === i ? { ...x, answer: e.target.value } : x) }))} />
                    <button type="button" onClick={() => set((p) => ({ ...p, items: p.items.filter((_, ix) => ix !== i) }))} className="justify-self-end text-xs text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Aside title"><input className={inputCls} value={s.aside_title} onChange={(e) => set({ aside_title: e.target.value })} /></Field>
              <Field label="Aside body"><input className={inputCls} value={s.aside_body} onChange={(e) => set({ aside_body: e.target.value })} /></Field>
              <Field label="Aside button"><input className={inputCls} value={s.aside_button_label} onChange={(e) => set({ aside_button_label: e.target.value })} /></Field>
            </div>
          </>
        )}
      />

      {/* MEMBERSHIP PAGE */}
      <SectionCard
        title="Membership page"
        description="Copy on /membership (uses your subscription plan for pricing)."
        value={content.page_membership}
        saving={isSaving("page_membership")}
        onSave={(v) => persist("page_membership", v)}
        render={(s, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Eyebrow"><input className={inputCls} value={s.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
              <Field label="Title line 1"><input className={inputCls} value={s.title_line_1} onChange={(e) => set({ title_line_1: e.target.value })} /></Field>
              <Field label="Title line 2"><input className={inputCls} value={s.title_line_2} onChange={(e) => set({ title_line_2: e.target.value })} /></Field>
            </div>
            <Field label="Tagline fallback"><input className={inputCls} value={s.tagline_fallback} onChange={(e) => set({ tagline_fallback: e.target.value })} /></Field>
            <Field label="Unlock box title"><input className={inputCls} value={s.unlock_title} onChange={(e) => set({ unlock_title: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Pay label"><input className={inputCls} value={s.pay_label} onChange={(e) => set({ pay_label: e.target.value })} /></Field>
              <Field label="Pay note"><input className={inputCls} value={s.pay_note} onChange={(e) => set({ pay_note: e.target.value })} /></Field>
              <Field label="Or label"><input className={inputCls} value={s.or_label} onChange={(e) => set({ or_label: e.target.value })} /></Field>
              <Field label="Shop amount label"><input className={inputCls} value={s.shop_amount_label} onChange={(e) => set({ shop_amount_label: e.target.value })} /></Field>
              <Field label="Shop note"><input className={inputCls} value={s.shop_note} onChange={(e) => set({ shop_note: e.target.value })} /></Field>
              <Field label="Validity note"><input className={inputCls} value={s.validity_note} onChange={(e) => set({ validity_note: e.target.value })} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Card title"><input className={inputCls} value={s.card_title} onChange={(e) => set({ card_title: e.target.value })} /></Field>
              <Field label="Card subtitle"><input className={inputCls} value={s.card_subtitle} onChange={(e) => set({ card_subtitle: e.target.value })} /></Field>
              <Field label="Card line 1"><input className={inputCls} value={s.card_line_1} onChange={(e) => set({ card_line_1: e.target.value })} /></Field>
              <Field label="Card line 2"><input className={inputCls} value={s.card_line_2} onChange={(e) => set({ card_line_2: e.target.value })} /></Field>
              <Field label="Card line 3"><input className={inputCls} value={s.card_line_3} onChange={(e) => set({ card_line_3: e.target.value })} /></Field>
            </div>
            <Field label="Privileges section title"><input className={inputCls} value={s.privileges_title} onChange={(e) => set({ privileges_title: e.target.value })} /></Field>
            <Field label="Privileges footer"><input className={inputCls} value={s.privileges_footer} onChange={(e) => set({ privileges_footer: e.target.value })} /></Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">PRIVILEGES</span>
                <button type="button" onClick={() => set((p) => ({ ...p, privileges: [...p.privileges, { icon: "Sparkles" as IconName, title: "", description: "" }] }))} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="h-3 w-3" /> Add</button>
              </div>
              <div className="grid gap-2">
                {s.privileges.map((pr, i) => (
                  <div key={i} className="grid grid-cols-[140px_1fr_2fr_auto] gap-2">
                    <IconPicker value={pr.icon} onChange={(v) => set((p) => ({ ...p, privileges: p.privileges.map((x, ix) => ix === i ? { ...x, icon: v } : x) }))} />
                    <input className={inputCls} placeholder="Title" value={pr.title} onChange={(e) => set((p) => ({ ...p, privileges: p.privileges.map((x, ix) => ix === i ? { ...x, title: e.target.value } : x) }))} />
                    <input className={inputCls} placeholder="Description" value={pr.description} onChange={(e) => set((p) => ({ ...p, privileges: p.privileges.map((x, ix) => ix === i ? { ...x, description: e.target.value } : x) }))} />
                    <button type="button" onClick={() => set((p) => ({ ...p, privileges: p.privileges.filter((_, ix) => ix !== i) }))} className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      />

      {/* TRACK ORDER PAGE */}
      <SectionCard
        title="Track order page"
        description="Copy shown on /track-order."
        value={content.page_track_order}
        saving={isSaving("page_track_order")}
        onSave={(v) => persist("page_track_order", v)}
        render={(s, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title"><input className={inputCls} value={s.title} onChange={(e) => set({ title: e.target.value })} /></Field>
              <Field label="Description"><input className={inputCls} value={s.description} onChange={(e) => set({ description: e.target.value })} /></Field>
              <Field label="Order ID label"><input className={inputCls} value={s.order_id_label} onChange={(e) => set({ order_id_label: e.target.value })} /></Field>
              <Field label="Email label"><input className={inputCls} value={s.email_label} onChange={(e) => set({ email_label: e.target.value })} /></Field>
              <Field label="Button label"><input className={inputCls} value={s.button_label} onChange={(e) => set({ button_label: e.target.value })} /></Field>
              <Field label="Help text"><input className={inputCls} value={s.help_text} onChange={(e) => set({ help_text: e.target.value })} /></Field>
            </div>
            <Field label="Empty state message"><input className={inputCls} value={s.empty_message} onChange={(e) => set({ empty_message: e.target.value })} /></Field>
          </>
        )}
      />
    </div>
  );
}
