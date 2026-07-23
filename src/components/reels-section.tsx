import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";

declare global {
  interface Window {
    instgrm?: { Embeds?: { process: () => void } };
  }
}

function loadInstagramEmbedScript() {
  if (typeof window === "undefined") return;
  if (window.instgrm?.Embeds) {
    window.instgrm.Embeds.process();
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>('script[src*="instagram.com/embed.js"]');
  if (existing) {
    existing.addEventListener("load", () => window.instgrm?.Embeds?.process());
    return;
  }
  const s = document.createElement("script");
  s.src = "https://www.instagram.com/embed.js";
  s.async = true;
  s.onload = () => window.instgrm?.Embeds?.process();
  document.body.appendChild(s);
}

function normalizeUrl(u: string) {
  const trimmed = u.trim().split("?")[0].replace(/\/$/, "");
  return trimmed.endsWith("/") ? trimmed : trimmed + "/";
}

export function ReelsSection() {
  const { data: content } = useQuery(siteContentQuery());
  const reels = content?.reels ?? SITE_CONTENT_DEFAULTS.reels;
  const social = content?.social ?? SITE_CONTENT_DEFAULTS.social;
  const instagram = social.items.find((i) => i.platform === "Instagram");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reels.enabled || reels.items.length === 0) return;
    loadInstagramEmbedScript();
    const t = setTimeout(() => window.instgrm?.Embeds?.process(), 400);
    return () => clearTimeout(t);
  }, [reels.enabled, reels.items.length]);

  // Apply autoplay/loop hints to the rendered Instagram iframes.
  useEffect(() => {
    if (!reels.enabled || !ref.current) return;
    const root = ref.current;

    const apply = () => {
      const frames = root.querySelectorAll<HTMLIFrameElement>("iframe.instagram-media");
      frames.forEach((f) => {
        if (reels.autoplay) f.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
        else f.removeAttribute("allow");
        f.dataset.reelLoop = reels.loop ? "1" : "0";
      });
    };

    apply();
    const mo = new MutationObserver(apply);
    mo.observe(root, { childList: true, subtree: true });

    // Best-effort: when Instagram's embed posts an "ended" style message, ask it to restart.
    const onMsg = (e: MessageEvent) => {
      if (!reels.loop) return;
      const src = (e.source as Window | null) ?? null;
      if (!src) return;
      const frames = root.querySelectorAll<HTMLIFrameElement>("iframe.instagram-media");
      const match = Array.from(frames).find((f) => f.contentWindow === src);
      if (!match) return;
      const data = typeof e.data === "string" ? e.data : JSON.stringify(e.data ?? "");
      if (/end|complete|finish/i.test(data)) {
        try {
          match.contentWindow?.postMessage({ method: "restart" }, "*");
        } catch {
          /* noop */
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => {
      mo.disconnect();
      window.removeEventListener("message", onMsg);
    };
  }, [reels.enabled, reels.autoplay, reels.loop, reels.items.length]);

  if (!reels.enabled || reels.items.length === 0) return null;

  return (
    <section className="bg-onyx">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center py-20">
        <div
          ref={ref}
          className="no-scrollbar flex w-full snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 md:justify-center md:gap-6 md:px-10"
        >
          {reels.items.map((r, i) => (
            <div
              key={i}
              className="group relative aspect-[9/16] w-[78vw] max-w-[320px] flex-none snap-center overflow-hidden border border-gold/40 bg-[#0d0d0d] shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:-translate-y-1 hover:border-gold sm:w-[280px] md:w-[300px]"
            >
              <blockquote
                className="instagram-media !m-0 !min-w-0 !w-full h-full"
                data-instgrm-permalink={normalizeUrl(r.url)}
                data-instgrm-version="14"
                style={{ background: "#0d0d0d", margin: 0, minWidth: 0, width: "100%" }}
              />
            </div>
          ))}
        </div>

        {instagram && (
          <div className="mt-12 flex flex-col items-center">
            <a
              href={instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 border border-gold/60 px-10 py-3.5 text-[12px] tracking-[0.28em] text-gold transition-colors hover:border-gold hover:bg-gold/10"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              VISIT INSTAGRAM
              <ArrowRight className="h-4 w-4 opacity-80 transition-transform group-hover:translate-x-1" strokeWidth={1} />
            </a>
            <div className="mt-4 h-px w-12 bg-gold/30" />
          </div>
        )}
      </div>
    </section>
  );
}
