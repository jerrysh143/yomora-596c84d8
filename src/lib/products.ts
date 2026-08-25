import ringImg from "@/assets/product-ring.jpg";
import necklaceImg from "@/assets/product-necklace.jpg";
import earringsImg from "@/assets/product-earrings.jpg";
import braceletImg from "@/assets/product-bracelet.jpg";

export type Category = string;

export type CategoryRow = { slug: string; label: string; sort_order: number };

export type Audience = "men" | "women" | "kids" | "unisex";

export const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "kids", label: "Kids" },
  { value: "unisex", label: "Unisex / All" },
];

export type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
  audience: Audience;
  tagline: string;
  description: string;
  image_url: string | null;
  gallery_urls: string[];
  is_new: boolean;
  sold_out: boolean;
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

/** All unique images for a product, main image first. */
export const productGallery = (p: Pick<Product, "image_url" | "category" | "gallery_urls">) =>
  Array.from(new Set([productImage(p), ...(p.gallery_urls ?? [])].filter(Boolean)));

// Accepts: empty (cleared), an uploaded relative path (/api/public/img/...),
// or an absolute http(s) URL.
export const isValidImageUrl = (value: string) =>
  value === "" || value.startsWith("/") || /^https?:\/\/\S+$/.test(value);

export const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

// Every product is treated as "new" only during its first seven days.
// The legacy admin flag must never keep the badge visible beyond this window.
export const NEW_WINDOW_DAYS = 7;
export const isProductNew = (p: Pick<Product, "is_new" | "created_at">) => {
  if (!p.created_at) return false;
  const created = new Date(p.created_at).getTime();
  if (Number.isNaN(created)) return false;
  const age = Date.now() - created;
  return age >= 0 && age < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

// Remove "CATEGORY: X" suffix that may leak from admin data entry
export const cleanProductName = (name: string): string => {
  return name.replace(/\s+CATEGORY:\s*[A-Za-z]+$/i, "").trim();
};
