import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
};

const KEY = "yomora_wishlist_v1";

let currentUserId: string | null = null;
let syncing = false;

function requireAuth(): boolean {
  if (currentUserId) return true;
  if (typeof window !== "undefined") {
    toast.error("Please sign in to save items to your wishlist", {
      action: {
        label: "Sign in",
        onClick: () => {
          const redirect = window.location.pathname + window.location.search;
          window.location.href = `/auth?redirect=${encodeURIComponent(redirect)}`;
        },
      },
    });
  }
  return false;
}

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

function rowsToItems(rows: any[]): WishlistItem[] {
  return rows.map((r) => ({
    id: r.product_id,
    name: r.name,
    price: Number(r.price),
    image: r.image,
    category: r.category ?? undefined,
  }));
}

async function pullFromServer(userId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id, name, price, image, category, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return rowsToItems(data ?? []);
}

async function pushToServer(userId: string, item: WishlistItem) {
  await supabase.from("wishlist_items").upsert(
    {
      user_id: userId,
      product_id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category ?? null,
    },
    { onConflict: "user_id,product_id" },
  );
}

async function removeFromServer(userId: string, productId: string) {
  await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
}

async function clearOnServer(userId: string) {
  await supabase.from("wishlist_items").delete().eq("user_id", userId);
}

/**
 * Merge local (guest) wishlist into the signed-in user's server wishlist,
 * then replace the local mirror with the merged set.
 */
async function syncOnSignIn(userId: string) {
  if (syncing) return;
  syncing = true;
  try {
    const local = read();
    const remote = await pullFromServer(userId);
    const remoteIds = new Set(remote.map((i) => i.id));
    const toPush = local.filter((i) => !remoteIds.has(i.id));
    if (toPush.length > 0) {
      await supabase.from("wishlist_items").upsert(
        toPush.map((item) => ({
          user_id: userId,
          product_id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category ?? null,
        })),
        { onConflict: "user_id,product_id" },
      );
    }
    const merged = await pullFromServer(userId);
    write(merged);
  } finally {
    syncing = false;
  }
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    const uid = data.session?.user?.id ?? null;
    currentUserId = uid;
    if (uid) syncOnSignIn(uid).catch(() => {});
  });

  supabase.auth.onAuthStateChange((event, session) => {
    const uid = session?.user?.id ?? null;
    if (event === "SIGNED_IN" && uid) {
      currentUserId = uid;
      syncOnSignIn(uid).catch(() => {});
    } else if (event === "SIGNED_OUT") {
      currentUserId = null;
      write([]);
    } else if (event === "USER_UPDATED" && uid) {
      currentUserId = uid;
    }
  });
}

export const wishlist = {
  get: read,
  has(id: string) {
    return read().some((i) => i.id === id);
  },
  add(item: WishlistItem) {
    if (!requireAuth()) return;
    const items = read();
    if (items.some((i) => i.id === item.id)) return;
    items.push(item);
    write(items);
    if (currentUserId) pushToServer(currentUserId, item).catch(() => {});
  },
  remove(id: string) {
    if (!requireAuth()) return;
    write(read().filter((i) => i.id !== id));
    if (currentUserId) removeFromServer(currentUserId, id).catch(() => {});
  },
  toggle(item: WishlistItem) {
    if (!requireAuth()) return;
    if (this.has(item.id)) this.remove(item.id);
    else this.add(item);
  },
  clear() {
    if (!requireAuth()) return;
    write([]);
    if (currentUserId) clearOnServer(currentUserId).catch(() => {});
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