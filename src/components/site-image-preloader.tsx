import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/products.queries";
import { siteContentQuery } from "@/lib/site-content.queries";

export const CRITICAL_IMAGES_READY_EVENT = "yomora:critical-images-ready";

const CRITICAL_PRODUCT_COUNT = 12;
const CRITICAL_CONCURRENCY = 6;
const BACKGROUND_CONCURRENCY = 3;
const IMAGE_TIMEOUT_MS = 8_000;

function uniqueUrls(urls: Array<string | null | undefined>) {
  return [...new Set(urls.filter((url): url is string => !!url && !url.startsWith("data:")))];
}

function preloadImage(url: string, priority: "high" | "low") {
  return new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve();
    };
    const timeout = window.setTimeout(finish, IMAGE_TIMEOUT_MS);
    image.decoding = "async";
    image.fetchPriority = priority;
    image.onload = finish;
    image.onerror = finish;
    image.src = url;
    if (image.complete) finish();
  });
}

async function preloadInBatches(urls: string[], concurrency: number, priority: "high" | "low") {
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++];
      await preloadImage(url, priority);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
}

/** Warms the browser's HTTP image cache once, without rendering hidden image elements. */
export function SiteImagePreloader() {
  const { data: products = [], isFetched: productsFetched } = useQuery(productsQuery());
  const { data: content } = useQuery(siteContentQuery());

  useEffect(() => {
    if (!content || !productsFetched) return;
    let cancelled = false;

    const homepageUrls = uniqueUrls([
      ...content.homepage_banners.slides.map((slide) => slide.image_url),
      content.legacy.image_url,
      "/yomora-logo.png",
      "/yomora-option-3-symbol.png",
    ]);
    const productMainUrls = uniqueUrls(products.map((product) => product.image_url));
    const criticalUrls = uniqueUrls([...homepageUrls, ...productMainUrls.slice(0, CRITICAL_PRODUCT_COUNT)]);
    const backgroundUrls = uniqueUrls([
      ...productMainUrls.slice(CRITICAL_PRODUCT_COUNT),
      ...products.flatMap((product) => product.gallery_urls),
    ]).filter((url) => !criticalUrls.includes(url));

    void preloadInBatches(criticalUrls, CRITICAL_CONCURRENCY, "high").then(() => {
      if (cancelled) return;
      window.dispatchEvent(new Event(CRITICAL_IMAGES_READY_EVENT));

      const warmRemaining = () => {
        if (!cancelled) void preloadInBatches(backgroundUrls, BACKGROUND_CONCURRENCY, "low");
      };
      const requestIdle = (
        window as Window & {
          requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        }
      ).requestIdleCallback;
      if (requestIdle) requestIdle(warmRemaining, { timeout: 1_500 });
      else globalThis.setTimeout(warmRemaining, 250);
    });

    return () => {
      cancelled = true;
    };
  }, [content, products, productsFetched]);

  return null;
}
