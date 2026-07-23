import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Instagram } from "lucide-react";
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

  if (!reels.enabled || reels.items.length === 0) return null;

  return (
    <section className="bg-secondary/30">
      <div className="container-x mx-auto max-w-[1400px] py-20">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold">{reels.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl text-foreground">{reels.title}</h2>
            {reels.description && (
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">{reels.description}</p>
            )}
          </div>
          {instagram && (
            <a
              href={instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-gold/60 bg-onyx px-5 py-3 text-[11px] font-semibold tracking-[0.24em] text-cream hover:bg-gold/10"
            >
              <Instagram className="h-4 w-4 text-gold" /> FOLLOW {social.handle.toUpperCase()}
            </a>
          )}
        </div>

        <div ref={ref} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reels.items.map((r, i) => (
            <div key={i} className="group border border-border bg-background overflow-hidden">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={normalizeUrl(r.url)}
                data-instgrm-version="14"
                style={{ background: "#000", margin: 0, minWidth: 0, width: "100%" }}
              />
              {r.caption && (
                <p className="px-4 py-3 text-xs text-muted-foreground">{r.caption}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
