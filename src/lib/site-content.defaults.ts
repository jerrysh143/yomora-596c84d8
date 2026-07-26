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
  autoplay: boolean;
  loop: boolean;
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

export type AboutPageContent = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  stats: { value: string; label: string }[];
  store_title: string;
};

export type CustomPageContent = {
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  features: string[];
  steps_eyebrow: string;
  steps: { title: string; description: string; icon: IconName }[];
  form_title: string;
  form_button_label: string;
  form_success_message: string;
};

export type ContactPageContent = {
  title: string;
  subtitle: string;
  phone_lines: string[];
  email: string;
  address_lines: string[];
  form_button_label: string;
  form_success_message: string;
};

export type FaqPageContent = {
  title: string;
  items: { question: string; answer: string }[];
  aside_title: string;
  aside_body: string;
  aside_button_label: string;
};

export type MembershipPageContent = {
  eyebrow: string;
  title_line_1: string;
  title_line_2: string;
  tagline_fallback: string;
  unlock_title: string;
  pay_label: string;
  pay_note: string;
  or_label: string;
  shop_amount_label: string;
  shop_note: string;
  validity_note: string;
  card_title: string;
  card_subtitle: string;
  card_line_1: string;
  card_line_2: string;
  card_line_3: string;
  privileges_title: string;
  privileges_footer: string;
  privileges: { icon: IconName; title: string; description: string }[];
};

export type TrackOrderPageContent = {
  title: string;
  description: string;
  order_id_label: string;
  email_label: string;
  button_label: string;
  help_text: string;
  empty_message: string;
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
  page_about: AboutPageContent;
  page_custom: CustomPageContent;
  page_contact: ContactPageContent;
  page_faq: FaqPageContent;
  page_membership: MembershipPageContent;
  page_track_order: TrackOrderPageContent;
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
      { label: "CUSTOM", to: "/custom-jewellery", hash: "" },
      { label: "MEMBERSHIP", to: "/membership", hash: "" },
      { label: "ABOUT", to: "/about", hash: "" },
      { label: "CONTACT", to: "/contact", hash: "" },
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
      { label: "Track Order", to: "/track-order" },
      { label: "FAQ", to: "/faq" },
      { label: "Custom Jewellery", to: "/custom-jewellery" },
      { label: "Contact", to: "/contact" },
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
    autoplay: true,
    loop: true,
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
  page_about: {
    eyebrow: "OUR STORY",
    title: "A Legacy Built on Trust",
    paragraphs: [
      "It all began in 1994 when Late Shri Nehalbhai Devjibhai and Smt. Devikaben Nehalbhai laid the foundation of trust, purity and craftsmanship.",
      "For over 32 years, we have earned the trust of thousands of families. Now, we bring this legacy to the digital world with premium 925 silver jewellery under YOMORA.",
      "Every piece we make is a promise — of hallmarked purity, timeless design and the warmth of a family business that has always put its customers first.",
    ],
    stats: [
      { value: "32+", label: "Years of Legacy" },
      { value: "1000+", label: "Happy Customers Daily" },
      { value: "5★", label: "Customer Rating" },
      { value: "100%", label: "Hallmarked Purity" },
    ],
    store_title: "Our Flagship Store",
  },
  page_custom: {
    hero_title: "CUSTOM JEWELLERY",
    hero_subtitle: "Made Just For You",
    hero_description:
      "Have a design in mind? We make personalised 925 silver jewellery as per your style and requirements.",
    features: ["Personalized Designs", "Premium 925 Silver", "Expert Craftsmanship", "Timely Delivery"],
    steps_eyebrow: "HOW IT WORKS",
    steps: [
      { icon: "Sparkles", title: "SHARE YOUR IDEA", description: "Share your design or inspiration with us" },
      { icon: "Star", title: "GET QUOTE", description: "We will send you the best quote" },
      { icon: "Hammer", title: "WE CRAFT IT", description: "Our experts craft it with perfection" },
      { icon: "Truck", title: "DELIVERED TO YOU", description: "Delivered safely to your doorstep" },
    ],
    form_title: "Enquire Now",
    form_button_label: "SUBMIT ENQUIRY",
    form_success_message: "Thank you — our team will contact you shortly.",
  },
  page_contact: {
    title: "Get in Touch",
    subtitle: "We're here to help you.",
    phone_lines: ["+91 98765 43210", "Mon – Sat: 10:00 AM – 7:00 PM"],
    email: "support@yomora.in",
    address_lines: [
      "YOMORA by Nehalbhai Devika Jewellers,",
      "122, NR Road, Andheri West,",
      "Mumbai, Maharashtra – 400058",
    ],
    form_button_label: "SEND MESSAGE",
    form_success_message: "Thank you — we'll be in touch shortly.",
  },
  page_faq: {
    title: "Frequently Asked Questions",
    items: [
      { question: "What is 925 Sterling Silver?", answer: "925 Sterling Silver is an alloy containing 92.5% pure silver — the international standard for high-quality silver jewellery." },
      { question: "How do I know my ring size?", answer: "You can measure the inner diameter of a well-fitting ring or request our free ring sizer." },
      { question: "Do you offer Cash on Delivery?", answer: "Yes, Cash on Delivery is available on all orders across India." },
      { question: "How long does shipping take?", answer: "Orders are dispatched within 24 hours and delivered in 3–7 business days depending on location." },
      { question: "What is your return policy?", answer: "We offer easy 7-day returns on all purchases in original condition." },
      { question: "Can I customize my jewellery?", answer: "Yes — visit our Custom Jewellery page and share your design with us." },
      { question: "How do I care for my silver jewellery?", answer: "Store in an airtight pouch, avoid perfumes and polish gently with a soft cloth." },
    ],
    aside_title: "Still have questions?",
    aside_body: "We're here to help!",
    aside_button_label: "CONTACT US",
  },
  page_membership: {
    eyebrow: "YOMORA",
    title_line_1: "BLACK SIGNATURE",
    title_line_2: "MEMBERSHIP",
    tagline_fallback: "Exclusive. Rewarded. Always.",
    unlock_title: "HOW TO UNLOCK YOUR MEMBERSHIP",
    pay_label: "PAY",
    pay_note: "one-time membership fee (non-refundable)",
    or_label: "OR",
    shop_amount_label: "SHOP FOR ₹25,000",
    shop_note: "or more in a single transaction",
    validity_note: "Your membership is valid for 1 year from the date of activation.",
    card_title: "YOMORA",
    card_subtitle: "BY NEHALBHAI DEVIKA JEWELLERS",
    card_line_1: "BLACK SIGNATURE",
    card_line_2: "MEMBERSHIP",
    card_line_3: "EXCLUSIVE MEMBERS ONLY",
    privileges_title: "ONE MEMBERSHIP. ENDLESS PRIVILEGES.",
    privileges_footer:
      "A PRIVILEGE RESERVED FOR THOSE WHO VALUE QUALITY, TRUST & TIMELESS ELEGANCE.",
    privileges: [
      { icon: "Sparkles", title: "15% OFF", description: "on everything you order for 1 year" },
      { icon: "Star", title: "EARLY ACCESS", description: "to new arrivals & exclusive collections" },
      { icon: "Gem", title: "MEMBER-ONLY OFFERS", description: "special discounts all year long" },
      { icon: "Heart", title: "BIRTHDAY SURPRISE", description: "a special treat just for you" },
      { icon: "Truck", title: "PRIORITY DISPATCH", description: "faster processing & shipping" },
      { icon: "Award", title: "DEDICATED SUPPORT", description: "priority customer assistance" },
      { icon: "Hammer", title: "CUSTOM JEWELLERY", description: "personalized designs crafted for you" },
    ],
  },
  page_track_order: {
    title: "Track Your Order",
    description: "Enter your Order ID and Email to track your order.",
    order_id_label: "ORDER ID",
    email_label: "EMAIL",
    button_label: "TRACK ORDER",
    help_text: "Need help? Contact us on +91 98765 43210",
    empty_message: "Enter your order details to see its status.",
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