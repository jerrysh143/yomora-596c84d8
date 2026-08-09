import { SiteHeader } from "@/components/site-header";

/** Placeholder grid that mirrors the real product grid so layout never jumps while data loads. */
function ProductGridSkeleton({ count = 10, className = "" }: { count?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 xl:grid-cols-5 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square w-full bg-secondary/50" />
          <div className="pt-4">
            <div className="h-4 w-3/4 rounded bg-secondary/60" />
            <div className="mt-2 h-3 w-1/2 rounded bg-secondary/50" />
            <div className="mt-3 h-3 w-1/3 rounded bg-secondary/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-page placeholder used as a route pendingComponent for collection pages. */
export function CollectionPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-onyx text-cream">
        <div className="container-x mx-auto max-w-[1400px] py-12 md:py-14">
          <div className="h-3 w-32 animate-pulse rounded bg-cream/20" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-cream/15" />
          <div className="mt-4 h-3 w-full max-w-xl animate-pulse rounded bg-cream/10" />
        </div>
      </section>
      <section className="container-x mx-auto max-w-[1400px] py-10">
        <div className="flex flex-wrap gap-2 border-b border-border pb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse bg-secondary/50" />
          ))}
        </div>
        <ProductGridSkeleton className="mt-8" />
      </section>
    </div>
  );
}
