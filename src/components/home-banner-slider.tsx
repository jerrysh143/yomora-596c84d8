import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageBannersContent } from "@/lib/site-content.defaults";

type Props = {
  banners: HomepageBannersContent;
  fallbackImage: string;
  fallbackLink: string;
};

export function HomeBannerSlider({ banners, fallbackImage, fallbackLink }: Props) {
  const slides = banners.slides.length
    ? banners.slides
    : [{ image_url: "", link: "", alt: "Made only for you — custom 925 silver jewellery" }];
  const hasMultipleSlides = slides.length > 1;
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive((current) => Math.min(current, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (!hasMultipleSlides) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [hasMultipleSlides, slides.length]);

  const previous = () => setActive((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setActive((current) => (current + 1) % slides.length);

  return (
    <section className="bg-onyx" aria-label="Homepage promotions">
      <div className="group relative aspect-[2000/469] overflow-hidden">
        {slides.map((slide, index) => {
          const requestedLink = slide.link.trim();
          const link = /^(https?:\/\/|\/|#)/i.test(requestedLink) ? requestedLink : fallbackLink;
          const external = /^https?:\/\//i.test(link);
          return (
            <a
              key={`${slide.image_url}-${index}`}
              href={link}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={slide.alt || "Open promotion"}
              aria-hidden={index !== active}
              tabIndex={index === active ? 0 : -1}
              className={`absolute inset-0 block transition-opacity duration-700 ease-out focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold ${index === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <img
                src={slide.image_url || fallbackImage}
                alt={slide.alt || "Homepage promotion"}
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                decoding="async"
              />
            </a>
          );
        })}

        {hasMultipleSlides && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label="Previous banner"
              className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-cream/40 bg-onyx/55 text-cream opacity-0 backdrop-blur-sm transition-opacity hover:bg-onyx/80 focus-visible:opacity-100 group-hover:opacity-100 sm:left-5 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next banner"
              className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-cream/40 bg-onyx/55 text-cream opacity-0 backdrop-blur-sm transition-opacity hover:bg-onyx/80 focus-visible:opacity-100 group-hover:opacity-100 sm:right-5 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.image_url}-dot-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show banner ${index + 1}`}
                  aria-current={index === active ? "true" : undefined}
                  className={`h-1.5 rounded-full transition-all ${index === active ? "w-6 bg-gold" : "w-1.5 bg-cream/70 hover:bg-cream"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
