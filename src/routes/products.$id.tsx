import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  ChevronDown,
  ChevronUp,
  Star,
  Gift,
  Award,
  Sparkles,
  ArrowRight,
  LoaderCircle,
  Share2,
} from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatINR, productImage, productGallery, isProductNew } from "@/lib/products";
import { productQuery, productsQuery } from "@/lib/products.queries";
import { cart } from "@/lib/cart";
import { wishlist, useWishlist } from "@/lib/wishlist";
import { NotifyMeForm } from "@/components/notify-me-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

const SITE_URL = "https://yomora.in";

const absoluteSiteUrl = (value: string) => {
  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return `${SITE_URL}/og-image.jpg`;
  }
};

const shareImageVersion = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
};

export const Route = createFileRoute("/products/$id")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!product) throw notFound();
    return { id: params.id, product };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) {
      return {
        meta: [
          { title: "Product — YOMORA" },
          { name: "description", content: "Handcrafted 925 sterling silver jewellery from YOMORA." },
        ],
      };
    }

    const title = `${product.name} — YOMORA`;
    const description =
      product.tagline ||
      product.description ||
      `${product.name}, handcrafted in 925 sterling silver by YOMORA.`;
    const image = absoluteSiteUrl(productImage(product));
    const canonicalUrl = `${SITE_URL}/products/${encodeURIComponent(product.id)}`;
    const shareUrl = `${canonicalUrl}?share=${shareImageVersion(image)}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: shareUrl },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:alt", content: product.name },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        { name: "twitter:image:alt", content: product.name },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
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
  const { id } = Route.useLoaderData();
  const { data: product } = useSuspenseQuery(productQuery(id));
  const { data: PRODUCTS } = useSuspenseQuery(productsQuery());
  if (!product) throw notFound();
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 5);
  const nav = useNavigate();
  const img = productImage(product);
  const gallery = productGallery(product);
  const sizes = ["6", "7", "8", "9", "10", "11", "12"];
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState("8");
  const [tab, setTab] = useState<"description" | "details" | "shipping" | "reviews">("description");
  const [cartAction, setCartAction] = useState<{
    productId: string;
    status: "idle" | "loading" | "ready";
  }>({ productId: product.id, status: "idle" });
  const cartButtonTimer = useRef<number | null>(null);
  const cartActionStatus =
    cartAction.productId === product.id ? cartAction.status : "idle";
  const add = () => cart.add({ id: product.id, name: product.name, price: product.price, image: img });

  useEffect(
    () => () => {
      if (cartButtonTimer.current !== null) window.clearTimeout(cartButtonTimer.current);
    },
    [],
  );

  const handleCartAction = () => {
    if (cartActionStatus === "ready") {
      nav({ to: "/checkout" });
      return;
    }
    if (cartActionStatus === "loading") return;

    if (cartButtonTimer.current !== null) window.clearTimeout(cartButtonTimer.current);
    add();
    setCartAction({ productId: product.id, status: "loading" });
    cartButtonTimer.current = window.setTimeout(() => {
      setCartAction({ productId: product.id, status: "ready" });
      cartButtonTimer.current = null;
    }, 5000);
  };

  const handleBuyNow = () => {
    if (cartActionStatus === "idle") add();
    if (cartButtonTimer.current !== null) {
      window.clearTimeout(cartButtonTimer.current);
      cartButtonTimer.current = null;
    }
    nav({ to: "/checkout" });
  };

  const handleShare = async () => {
    const imageVersion = shareImageVersion(absoluteSiteUrl(img));
    const productUrl = `${window.location.origin}/products/${encodeURIComponent(product.id)}?share=${imageVersion}`;
    const shareData = {
      title: `${product.name} — YOMORA`,
      text: `${product.name} · ${formatINR(product.price)} · Handcrafted 925 sterling silver jewellery from YOMORA.`,
      url: productUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Product link copied");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareData.url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      textArea.remove();
      copied ? toast.success("Product link copied") : toast.error("Unable to copy product link");
    }
  };
  const { items: wishItems } = useWishlist();
  const wished = wishItems.some((w) => w.id === product.id);
  const toggleWish = () =>
    wishlist.toggle({ id: product.id, name: product.name, price: product.price, image: img, category: product.category });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="border-b border-border/60 bg-background">
        <div className="container-x mx-auto max-w-[1400px] py-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-gold">Shop</Link>
          <span className="mx-2">/</span>
          <span className="capitalize">{product.category}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Main product */}
      <section className="container-x mx-auto max-w-[1400px] py-10">
        <div
          className={`grid gap-8 lg:gap-8 ${
            gallery.length > 1 ? "lg:grid-cols-[90px_1fr_1fr]" : "lg:grid-cols-2"
          }`}
        >
          {/* Thumbnails */}
          <div className={`order-2 lg:order-1 lg:flex-col ${gallery.length > 1 ? "flex" : "hidden"}`}>
            <button className="hidden h-8 w-full items-center justify-center text-muted-foreground hover:text-gold lg:flex">
              <ChevronUp className="h-4 w-4" />
            </button>
            <div className="flex gap-3 overflow-x-auto lg:flex-col lg:gap-3 lg:overflow-visible">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden border-2 bg-secondary/40 transition-colors ${
                    activeImg === i ? "border-gold" : "border-transparent hover:border-gold/40"
                  }`}
                >
                  <img src={src} alt="" width={160} height={160} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <button className="hidden h-8 w-full items-center justify-center text-muted-foreground hover:text-gold lg:flex">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Main image */}
          <div className="relative order-1 self-start bg-onyx lg:order-2">
            <img
              src={gallery[activeImg]}
              alt={product.name}
              width={900}
              height={900}
              fetchPriority="high"
              decoding="async"
              className={`block aspect-square w-full object-cover ${product.sold_out ? "opacity-70" : ""}`}
            />
            {product.sold_out && (
              <span className="absolute left-4 top-4 bg-onyx/90 px-3 py-1.5 text-[10px] font-bold tracking-[0.24em] text-cream">
                SOLD OUT
              </span>
            )}
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleWish}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                title={wished ? "Remove from wishlist" : "Add to wishlist"}
                className="grid h-10 w-10 place-items-center rounded-full bg-background/90 text-onyx hover:bg-gold"
              >
                <Heart className={`h-4 w-4 ${wished ? "fill-current text-gold" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share this product"
                title="Share this product"
                className="grid h-10 w-10 place-items-center rounded-full bg-background/90 text-onyx hover:bg-gold"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="order-3 min-w-0">
            <div className="flex flex-wrap gap-2">
              {isProductNew(product) && (
                <span className="bg-gold px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-onyx">NEW</span>
              )}
              {product.sold_out && (
                <span className="bg-onyx px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-cream">SOLD OUT</span>
              )}
              <span className="border border-onyx/20 px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-onyx">925 HALLMARKED</span>
            </div>

            <h1 className="mt-4 font-display text-4xl uppercase leading-tight text-foreground md:text-5xl">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">(120 Reviews)</span>
            </div>

            <p className="mt-6 text-3xl font-semibold text-foreground">{formatINR(product.price)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">{product.description || product.tagline}</p>

            {/* Trust icons inline */}
            <div className="mt-6 flex flex-wrap gap-6 border-y border-border py-4 text-xs text-foreground">
              <span className="inline-flex items-center gap-2"><Award className="h-4 w-4 text-gold" /> 925 Sterling Silver</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> Hallmarked</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold" /> Skin Friendly</span>
            </div>

            {/* Size */}
            {product.category === "rings" && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-[0.28em] text-foreground">SIZE</p>
                  <button className="text-[11px] font-semibold tracking-[0.2em] text-gold hover:underline">Size Guide</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`h-10 w-10 rounded-full border text-sm transition-colors ${
                        size === s ? "border-gold bg-gold text-onyx" : "border-border text-foreground hover:border-gold"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            {product.sold_out ? (
              <>
                <p className="mt-5 text-sm text-muted-foreground">
                  This piece is currently sold out. Leave your details and we'll alert you as soon as it's restocked.
                </p>
                <NotifyMeForm productId={product.id} />
              </>
            ) : (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={handleCartAction}
                disabled={cartActionStatus === "loading"}
                aria-busy={cartActionStatus === "loading"}
                className={`relative flex w-full items-center justify-center gap-3 overflow-hidden border px-6 py-4 text-[11px] font-bold tracking-[0.24em] transition-all duration-300 ${
                  cartActionStatus === "ready"
                    ? "border-onyx bg-onyx text-cream hover:border-gold hover:bg-onyx/90"
                    : "border-gold bg-gold text-onyx hover:bg-gold/90"
                } ${cartActionStatus === "loading" ? "cursor-wait" : "cursor-pointer"}`}
              >
                {cartActionStatus === "loading" ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span aria-live="polite">ADDING TO CART</span>
                  </>
                ) : cartActionStatus === "ready" ? (
                  <>
                    <span aria-live="polite">PROCEED TO CHECKOUT</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                ) : (
                  <span>ADD TO CART</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full border border-onyx px-6 py-4 text-[11px] font-bold tracking-[0.28em] text-onyx hover:bg-onyx hover:text-cream"
              >
                BUY NOW
              </button>
            </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-gold" /> 100% Secure Payment
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar strip */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container-x mx-auto grid max-w-[1400px] grid-cols-2 gap-6 py-6 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: Truck, t: "FREE SHIPPING", s: "On All Orders" },
            { icon: RotateCcw, t: "EASY RETURNS", s: "Within 7 Days" },
            { icon: ShieldCheck, t: "SECURE PAYMENT", s: "100% Safe & Secure" },
            { icon: Gift, t: "PREMIUM PACKAGING", s: "Perfect for Gifting" },
            { icon: Award, t: "30+ YEARS OF TRUST", s: "Since 1994" },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <Icon className="h-8 w-8 text-gold" />
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-foreground">{t}</p>
                <p className="text-xs text-muted-foreground">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs + gift box */}
      <section className="container-x mx-auto max-w-[1400px] py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <div className="flex flex-wrap gap-6 border-b border-border">
              {(["description", "details", "shipping", "reviews"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`-mb-px border-b-2 pb-3 text-[11px] font-bold uppercase tracking-[0.24em] transition-colors ${
                    tab === k ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k === "shipping" ? "Shipping & Returns" : k === "reviews" ? "Reviews (120)" : k}
                </button>
              ))}
            </div>

            <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {tab === "description" && (
                <div>
                  <p>{product.description || product.tagline}</p>
                  <ul className="mt-5 list-disc space-y-1.5 pl-5 text-foreground">
                    <li>925 Sterling Silver</li>
                    <li>Premium Finish</li>
                    <li>Oxidized Antique Detailing</li>
                    <li>Comfortable Fit</li>
                    <li>Perfect for Daily Wear & Special Occasions</li>
                  </ul>
                </div>
              )}
              {tab === "details" && (
                <ul className="space-y-2">
                  <li><b className="text-foreground">Material:</b> 925 Sterling Silver</li>
                  <li><b className="text-foreground">Finish:</b> Oxidized Antique</li>
                  <li><b className="text-foreground">Hallmark:</b> BIS Certified</li>
                </ul>
              )}
              {tab === "shipping" && (
                <p>Free shipping across India. Orders dispatched within 24-48 hours. Easy returns within 7 days of delivery — piece must be unworn and in original YOMORA packaging.</p>
              )}
              {tab === "reviews" && (
                <p>Loved by 120+ customers. Full review module coming soon.</p>
              )}
            </div>
          </div>

          {/* Gift box card */}
          <div className="relative overflow-hidden bg-onyx p-8 text-cream">
            <p className="text-sm text-cream/80">Comes with a Premium</p>
            <p className="mt-1 font-display text-2xl text-gold">YOMORA Gift Box</p>
            <div className="mt-6 aspect-[16/10] w-full bg-secondary/10">
              <img src={img} width={800} height={500} alt="Gift box" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90" />
            </div>
          </div>
        </div>
      </section>

      {/* You may also like */}
      {related.length > 0 && (
        <section className="container-x mx-auto max-w-[1400px] pb-20">
          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-gold/50" />
            <h2 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-foreground">You May Also Like</h2>
            <span className="h-px w-10 bg-gold/50" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 xl:grid-cols-5">
            {related.map((p) => (
              <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group block bg-background">
                <div className="relative overflow-hidden bg-secondary/40">
                  <img src={productImage(p)} width={600} height={600} loading="lazy" decoding="async" alt={p.name} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <button aria-label="Wishlist" onClick={(e) => e.preventDefault()} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-onyx hover:bg-gold">
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h3 className="mt-3 text-center text-sm text-foreground">{p.name}</h3>
                <p className="mt-1 text-center text-sm font-semibold text-foreground">{formatINR(p.price)}</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <div className="flex text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span>(80)</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
