import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { productsQuery } from "@/lib/products.queries";
import { categoriesQuery } from "@/lib/categories.queries";
import { formatINR, productImage } from "@/lib/products";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { data: products = [] } = useQuery({ ...productsQuery(), enabled: open });
  const { data: categories = [] } = useQuery({ ...categoriesQuery(), enabled: open });

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return [];
    return products
      .filter((p) =>
        [p.name, p.category, p.audience, p.tagline]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      )
      .slice(0, 8);
  }, [products, term]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-onyx/80 backdrop-blur-sm" />
      <div className="relative mx-auto mt-24 w-[92%] max-w-2xl rounded-2xl border border-gold/25 bg-onyx p-5 text-cream shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <Search className="h-5 w-5 text-gold" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jewellery, categories…"
            className="w-full bg-transparent text-base outline-none placeholder:text-cream/40"
          />
          <button aria-label="Close" onClick={onClose} className="rounded-full p-1 hover:text-gold">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto pt-4">
          {!term && (
            <div>
              <p className="text-[11px] tracking-[0.22em] text-cream/50">BROWSE BY CATEGORY</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/products"
                    hash={c.slug}
                    onClick={onClose}
                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs tracking-wide hover:border-gold hover:text-gold"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {term && results.length === 0 && (
            <p className="py-6 text-center text-sm text-cream/60">No products match “{q}”.</p>
          )}

          {results.map((p) => (
            <Link
              key={p.id}
              to="/products/$category"
              params={{ category: p.id }}
              onClick={onClose}
              className="flex items-center gap-4 rounded-xl px-2 py-2.5 hover:bg-white/5"
            >
              <img src={productImage(p)} width={48} height={48} alt={p.name} className="h-12 w-12 rounded-lg object-cover" loading="lazy" decoding="async" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{p.name}</span>
                <span className="block text-[11px] uppercase tracking-wide text-cream/50">{p.category}</span>
              </span>
              <span className="text-sm text-gold">{formatINR(p.price)}</span>
            </Link>
          ))}

          {term && results.length > 0 && (
            <Link to="/products" onClick={onClose} className="mt-3 block text-center text-xs tracking-[0.2em] text-gold hover:underline">
              VIEW ALL PRODUCTS
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
