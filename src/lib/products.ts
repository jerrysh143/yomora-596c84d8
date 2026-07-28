import ringImg from "@/assets/product-ring.jpg";
import necklaceImg from "@/assets/product-necklace.jpg";
import earringsImg from "@/assets/product-earrings.jpg";
import braceletImg from "@/assets/product-bracelet.jpg";

export type Category = string;

export type CategoryRow = { slug: string; label: string; sort_order: number };

export type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
  tagline: string;
  description: string;
  image_url: string | null;
  is_new: boolean;
  created_at?: string | null;
};

const CATEGORY_FALLBACK: Record<string, string> = {
  rings: ringImg,
  earrings: earringsImg,
  neckwear: necklaceImg,
  bracelets: braceletImg,
};

export const productImage = (p: Pick<Product, "image_url" | "category">) =>
  p.image_url || CATEGORY_FALLBACK[p.category] || ringImg;

export const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

// A product is treated as "new" when the admin flagged it, OR when it was
// created within the last 7 days (auto-tag for a week).
export const NEW_WINDOW_DAYS = 7;
export const isProductNew = (p: Pick<Product, "is_new" | "created_at">) => {
  if (p.is_new) return true;
  if (!p.created_at) return false;
  const created = new Date(p.created_at).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};