import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Truck, RotateCcw, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PRODUCTS, formatINR, getProduct } from "@/lib/products";

export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — YOMORA" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.product;
    return {
      meta: [
        { title: `${p.name} — YOMORA` },
        { name: "description", content: p.description },
        { property: "og:title", content: `${p.name} — YOMORA` },
        { property: "og:description", content: p.description },
        { property: "og:image", content: p.image },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-x mx-auto max-w-[900px] py-32 text-center">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">404</p>
        <h1 className="mt-3 font-display text-4xl">Piece not found</h1>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 text-sm text-gold hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to collection
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-x mx-auto max-w-[900px] py-32 text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-6 bg-gold px-5 py-2.5 text-[11px] font-semibold tracking-[0.24em] text-onyx">TRY AGAIN</button>
      </div>
      <SiteFooter />
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="container-x mx-auto max-w-[1400px] py-10">
        <Link to="/products" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground hover:text-gold">
          <ArrowLeft className="h-3.5 w-3.5" /> BACK TO COLLECTION
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div className="bg-secondary/40">
            <img src={product.image} width={900} height={900} alt={product.name} className="aspect-square w-full object-cover" />
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{product.category.toUpperCase()}</p>
            <h1 className="mt-3 font-display text-5xl leading-tight text-foreground">{product.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{product.tagline}</p>
            <div className="mt-6 h-px w-16 bg-gold" />
            <p className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{formatINR(product.price)}</p>
            <p className="mt-2 text-xs text-muted-foreground">MRP inclusive of all taxes.</p>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="bg-onyx px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-onyx/90">ADD TO BAG</button>
              <button className="border border-gold px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-onyx hover:bg-gold hover:text-onyx">BUY NOW</button>
            </div>

            <ul className="mt-8 grid gap-2 border-t border-border pt-6 text-sm text-foreground">
              {["925 Hallmarked Sterling Silver", "Hand-finished by master karigars", "Comes in premium YOMORA packaging"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" /> {t}</li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-3 gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Free shipping</span>
              <span className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-gold" /> 7-day returns</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> Secure checkout</span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-3xl text-foreground">You may also love</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group block">
                  <div className="overflow-hidden bg-secondary/40">
                    <img src={p.image} width={900} height={900} loading="lazy" alt={p.name} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <h3 className="mt-3 font-display text-lg text-foreground">{p.name}</h3>
                  <p className="mt-1 text-sm text-foreground">{formatINR(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}