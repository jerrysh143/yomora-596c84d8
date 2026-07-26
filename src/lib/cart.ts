import { useEffect, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  variant?: string;
};

const KEY = "yomora_cart_v1";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:change"));
}

export const cart = {
  get: read,
  add(item: Omit<CartItem, "qty"> & { qty?: number }) {
    const items = read();
    const key = item.id + (item.variant ?? "");
    const existing = items.find((i) => i.id + (i.variant ?? "") === key);
    if (existing) existing.qty += item.qty ?? 1;
    else items.push({ ...item, qty: item.qty ?? 1 });
    write(items);
  },
  update(id: string, qty: number) {
    const items = read()
      .map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
      .filter((i) => i.qty > 0);
    write(items);
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  clear() {
    write([]);
  },
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const on = () => setItems(read());
    window.addEventListener("cart:change", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("cart:change", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  return { items, subtotal, count };
}