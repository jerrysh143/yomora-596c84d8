import { useEffect, useState } from "react";

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
};

const KEY = "yomora_wishlist_v1";

function read(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: WishlistItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("wishlist:change"));
}

export const wishlist = {
  get: read,
  has(id: string) {
    return read().some((i) => i.id === id);
  },
  add(item: WishlistItem) {
    const items = read();
    if (items.some((i) => i.id === item.id)) return;
    items.push(item);
    write(items);
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  toggle(item: WishlistItem) {
    if (this.has(item.id)) this.remove(item.id);
    else this.add(item);
  },
  clear() {
    write([]);
  },
};

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  useEffect(() => {
    setItems(read());
    const on = () => setItems(read());
    window.addEventListener("wishlist:change", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("wishlist:change", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return { items, count: items.length };
}