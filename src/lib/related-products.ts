import type { Product } from "@/lib/products";

export function relatedProductsFor(product: Product, products: Product[], limit = 5): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .filter((p) => product.audience === "unisex" || p.audience === product.audience || p.audience === "unisex")
    .filter((p) => p.price >= product.price * 0.6 && p.price <= product.price * 1.4)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, limit);
}
