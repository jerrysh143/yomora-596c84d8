import { useQuery } from "@tanstack/react-query";
import { Instagram, Facebook, Youtube, Linkedin, Music2, Twitter, MessageCircle, Camera } from "lucide-react";
import { siteContentQuery } from "@/lib/site-content.queries";
import { SITE_CONTENT_DEFAULTS, type SocialPlatform } from "@/lib/site-content.defaults";

const ICONS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  Instagram,
  Facebook,
  YouTube: Youtube,
  TikTok: Music2,
  X: Twitter,
  WhatsApp: MessageCircle,
  Pinterest: Camera,
  LinkedIn: Linkedin,
};

export function SocialLinks({
  placement,
  className = "",
  iconClassName = "h-4 w-4",
}: {
  placement: "header" | "footer";
  className?: string;
  iconClassName?: string;
}) {
  const { data: content } = useQuery(siteContentQuery());
  const social = content?.social ?? SITE_CONTENT_DEFAULTS.social;
  const show = placement === "header" ? social.show_in_header : social.show_in_footer;
  if (!show || social.items.length === 0) return null;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {social.items.map((s, i) => {
        const Icon = ICONS[s.platform] ?? Instagram;
        return (
          <a
            key={i}
            href={s.url}
            aria-label={s.label || s.platform}
            target="_blank"
            rel="noopener noreferrer"
            className="grid place-items-center rounded-full border border-gold/40 p-2 text-cream/85 transition-colors hover:border-gold hover:text-gold"
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
    </div>
  );
}
