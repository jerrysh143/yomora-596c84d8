import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroMen from "@/assets/hero-men-v2.png";
import heroWomen from "@/assets/hero-women-v2.png";
import heroMembership from "@/assets/hero-membership-v2.png";

export function HomeBannerSlider() {
  const slides = [
    { image: heroMen, eyebrow: "THE MEN'S EDIT", title: "Strength, Refined", body: "Distinctive 925 silver pieces crafted for the modern man.", button: "SHOP FOR MEN", link: "/products/rings?audience=men", alt: "YOMORA men's sterling silver jewellery collection" },
    { image: heroWomen, eyebrow: "THE WOMEN'S EDIT", title: "Elegance, Defined", body: "Timeless 925 silver jewellery made to illuminate every occasion.", button: "SHOP FOR WOMEN", link: "/products?audience=women", alt: "YOMORA women's sterling silver jewellery collection" },
    { image: heroMembership, eyebrow: "YOMORA BLACK MEMBERSHIP", title: "Belong to More", body: "Private offers, member-only privileges and elevated rewards with YOMORA Black.", button: "VIEW MEMBERSHIP", link: "/membership", alt: "YOMORA Black membership" },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const previous = () => setActive((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setActive((current) => (current + 1) % slides.length);

  return (
    <section className="bg-onyx" aria-label="YOMORA collections">
      <div className="group relative h-[340px] overflow-hidden min-[840px]:h-auto min-[840px]:aspect-[2000/640]">
        {slides.map((slide, index) => (
          <a key={slide.eyebrow} href={slide.link} aria-label={slide.alt} aria-hidden={index !== active} tabIndex={index === active ? 0 : -1} className={`absolute inset-0 block transition-opacity duration-700 ease-out focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold ${index === active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <img src={slide.image} alt={slide.alt} className="h-full w-full object-cover object-[34%_center] min-[840px]:object-center" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "low"} decoding="async" />
            <span className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/35 to-black/90 sm:from-black/5 sm:via-black/15 sm:to-black/85" />
            <span className="absolute inset-y-0 right-0 flex w-[57%] flex-col justify-center pl-4 pr-16 text-cream min-[840px]:w-[52%] min-[840px]:pl-10 min-[1200px]:w-[48%] min-[1200px]:pl-16">
              <span className="text-[9px] font-semibold tracking-[0.24em] text-gold min-[840px]:text-xs min-[840px]:tracking-[0.3em]">{slide.eyebrow}</span>
              <span className="mt-3 font-display text-3xl leading-[0.95] min-[840px]:text-5xl min-[1200px]:text-7xl">{slide.title}</span>
              <span className="mt-4 max-w-lg text-xs leading-relaxed text-cream/75 min-[840px]:text-sm min-[1200px]:text-lg">{slide.body}</span>
              <span className="mt-5 w-fit border border-gold bg-gold px-4 py-2.5 text-[9px] font-semibold tracking-[0.16em] text-onyx min-[840px]:px-5 min-[840px]:text-[10px] min-[840px]:tracking-[0.18em] min-[1200px]:mt-7 min-[1200px]:px-6 min-[1200px]:py-3 min-[1200px]:text-[11px] min-[1200px]:tracking-[0.2em]">{slide.button}</span>
            </span>
          </a>
        ))}
        <button type="button" onClick={previous} aria-label="Previous banner" className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-cream/40 bg-onyx/55 text-cream opacity-0 backdrop-blur-sm transition-opacity hover:bg-onyx/80 focus-visible:opacity-100 group-hover:opacity-100 sm:left-5 sm:h-10 sm:w-10"><ChevronLeft className="h-5 w-5" /></button>
        <button type="button" onClick={next} aria-label="Next banner" className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-cream/40 bg-onyx/55 text-cream opacity-0 backdrop-blur-sm transition-opacity hover:bg-onyx/80 focus-visible:opacity-100 group-hover:opacity-100 sm:right-5 sm:h-10 sm:w-10"><ChevronRight className="h-5 w-5" /></button>
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4">
          {slides.map((slide, index) => <button key={`${slide.eyebrow}-dot`} type="button" onClick={() => setActive(index)} aria-label={`Show banner ${index + 1}`} aria-current={index === active ? "true" : undefined} className={`h-1.5 rounded-full transition-all ${index === active ? "w-6 bg-gold" : "w-1.5 bg-cream/70 hover:bg-cream"}`} />)}
        </div>
      </div>
    </section>
  );
}
