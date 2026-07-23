import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
  const save = useServerFn(updateSiteContentFn);

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

  return (
    <div className="mt-8 grid gap-3">
      <p className="text-sm text-muted-foreground">
        Edit every section of the storefront — header, hero, trust bar, story, section titles, CTA strip and footer. Changes go live immediately.
      </p>

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
            <Field label="Image URL (leave blank for default)"><input className={inputCls} value={s.image_url} onChange={(e) => set({ image_url: e.target.value })} placeholder="https://…" /></Field>
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
          </>
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
    </div>
  );
}