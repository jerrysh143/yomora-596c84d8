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