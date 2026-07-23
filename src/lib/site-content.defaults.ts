export type IconName =
  | "Truck"
  | "ShieldCheck"
  | "RotateCcw"
  | "Award"
  | "Gem"
  | "Hammer"
  | "Sparkles"
  | "Star"
  | "Heart";

export const ICON_CHOICES: IconName[] = [
  "Truck",
  "ShieldCheck",
  "RotateCcw",
  "Award",
  "Gem",
  "Hammer",
  "Sparkles",
  "Star",
  "Heart",
];

export type HeaderContent = {
  announcements: { icon: IconName; text: string }[];
  brand_name: string;
  brand_tagline: string;
};

export type HeaderNavContent = {
  items: { label: string; to: string; hash: string }[];
  include_categories: boolean;
};

export type HeroContent = {
  eyebrow: string;
  title_line_1: string;
  title_line_2: string;
  description: string;
  primary_cta_label: string;
  primary_cta_hash: string;
  secondary_cta_label: string;
  secondary_cta_hash: string;
  custom_card_title: string;
  custom_card_body: string;
};

export type TrustBarContent = {
  items: { icon: IconName; title: string; body: string }[];
};

export type LegacyContent = {
  eyebrow: string;
  title_line_1: string;
  title_line_2: string;
  description: string;
  image_url: string;
  bullets: string[];
};

export type SectionHeadingContent = { eyebrow: string; title: string };

export type CtaStripContent = {
  title: string;
  body: string;
  button_label: string;
};

export type FooterContent = {
  brand_blurb: string;
  shop_links: { label: string; to: string }[];
  help_links: { label: string; to: string }[];
  newsletter_title: string;
  newsletter_body: string;
  copyright: string;
};

export type ReelsContent = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  items: { url: string; caption: string }[];
};

export type SocialPlatform =
  | "Instagram"
  | "Facebook"
  | "YouTube"
  | "TikTok"
  | "X"
  | "WhatsApp"
  | "Pinterest"
  | "LinkedIn";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "Instagram",
  "Facebook",
  "YouTube",
  "TikTok",
  "X",
  "WhatsApp",
  "Pinterest",
  "LinkedIn",
];

export type SocialContent = {
  cta_label: string;
  handle: string;
  show_in_header: boolean;
  show_in_footer: boolean;
  items: { platform: SocialPlatform; url: string; label: string }[];
};

export type SiteContentMap = {
  header: HeaderContent;
  header_nav: HeaderNavContent;
  hero: HeroContent;
  trust_bar: TrustBarContent;
  legacy: LegacyContent;
  categories_section: SectionHeadingContent;
  featured_section: SectionHeadingContent;
  cta_strip: CtaStripContent;
  footer: FooterContent;
  reels: ReelsContent;
  social: SocialContent;
};

export const SITE_CONTENT_DEFAULTS: SiteContentMap = {
  header: {
    announcements: [
      { icon: "Truck", text: "Free Shipping Across India" },
      { icon: "ShieldCheck", text: "925 Hallmarked Silver" },
      { icon: "RotateCcw", text: "Easy 7-Day Returns" },
    ],
    brand_name: "YOMORA",
    brand_tagline: "BY NEHALBHAI DEVIKA JEWELLERS",
  },
  header_nav: {
    include_categories: true,
    items: [
      { label: "COLLECTIONS", to: "/products", hash: "" },
      { label: "NEW ARRIVALS", to: "/products", hash: "new" },
    ],
  },
  hero: {
    eyebrow: "PREMIUM 925 STERLING SILVER JEWELLERY",
    title_line_1: "Timeless Elegance,",
    title_line_2: "Crafted for Every You",
    description:
      "Discover beautifully designed 925 Sterling Silver jewellery, crafted to complement every moment of your life. From everyday wear to unforgettable occasions.",
    primary_cta_label: "SHOP COLLECTION",
    primary_cta_hash: "",
    secondary_cta_label: "NEW ARRIVALS",
    secondary_cta_hash: "new",
    custom_card_title: "MODIFIED 925 SILVER JEWELLERY",
    custom_card_body:
      "We also create custom & modified 925 silver jewellery as per your style and requirements.",
  },
  trust_bar: {
    items: [
      { icon: "Award", title: "32+ YEARS OF TRUST", body: "Trusted Jewellery Legacy Since 1994" },
      { icon: "Gem", title: "GENUINE 925 SILVER", body: "Hallmarked & Quality Assured" },
      { icon: "Hammer", title: "EXPERT CRAFTSMANSHIP", body: "Fine Detailing, Superior Finish" },
      { icon: "Truck", title: "PAN INDIA DELIVERY", body: "Fast, Secure & Reliable" },
      { icon: "ShieldCheck", title: "SECURE PAYMENTS", body: "100% Safe & Protected" },
    ],
  },
  legacy: {
    eyebrow: "OUR LEGACY",
    title_line_1: "A Legacy of Trust.",
    title_line_2: "A Future of Luxury.",
    description:
      "For over 32 years, Nehalbhai Devika Jewellers has been a name of trust, quality and timeless relationships. YOMORA is our premium silver jewellery brand, bringing that legacy to the modern world.",
    image_url: "",
    bullets: [
      "Genuine 925 Hallmarked Silver",
      "Trendy & Timeless Designs",
      "Modified & Custom Jewellery",
      "Premium Packaging",
      "Loved by Thousands of Customers",
    ],
  },
  categories_section: { eyebrow: "SHOP BY CATEGORY", title: "Explore Our Collections" },
  featured_section: { eyebrow: "FEATURED", title: "Signature Pieces" },
  cta_strip: {
    title: "Custom & Modified 925 Silver Jewellery",
    body: "Have something in mind? Our karigars craft made-to-order pieces to your exact specifications.",
    button_label: "REQUEST A CUSTOM PIECE",
  },
  footer: {
    brand_blurb:
      "Premium 925 sterling silver jewellery by Nehalbhai Devika Jewellers. A legacy of trust since 1994.",
    shop_links: [
      { label: "Rings", to: "/products" },
      { label: "Earrings", to: "/products" },
      { label: "Neckwear", to: "/products" },
      { label: "Bracelets", to: "/products" },
    ],
    help_links: [
      { label: "Shipping", to: "/products" },
      { label: "Returns", to: "/products" },
      { label: "Care Guide", to: "/products" },
      { label: "Contact", to: "/products" },
    ],
    newsletter_title: "STAY IN TOUCH",
    newsletter_body: "New arrivals, quiet drops, and craft notes.",
    copyright: "© YOMORA · Nehalbhai Devika Jewellers",
  },
  reels: {
    enabled: true,
    eyebrow: "AS SEEN ON INSTAGRAM",
    title: "Reels & Stories",
    description:
      "Behind the craft, styling notes and new drops — follow along on Instagram.",
    items: [],
  },
  social: {
    cta_label: "FOLLOW US",
    handle: "@yomora",
    show_in_header: true,
    show_in_footer: true,
    items: [
      { platform: "Instagram", url: "https://instagram.com/", label: "Instagram" },
    ],
  },
};

export type SiteContentKey = keyof SiteContentMap;

export function mergeSiteContent(
  rows: { key: string; data: unknown }[],
): SiteContentMap {
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.data;
  const out = { ...SITE_CONTENT_DEFAULTS };
  (Object.keys(SITE_CONTENT_DEFAULTS) as SiteContentKey[]).forEach((k) => {
    if (map[k]) (out as Record<string, unknown>)[k] = map[k];
  });
  return out;
}