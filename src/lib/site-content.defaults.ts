import { YOMORA_EMAIL, YOMORA_PHONE_DIGITS, YOMORA_PHONE_DISPLAY } from "@/lib/contact-details";

export type IconName =
  | "Truck"
  | "ShieldCheck"
  | "RotateCcw"
  | "Award"
  | "Gem"
  | "Hammer"
  | "Sparkles"
  | "Star"
  | "Heart"
  | "BadgeCheck"
  | "PackageCheck"
  | "Recycle"
  | "Clock";

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
  "BadgeCheck",
  "PackageCheck",
  "Recycle",
  "Clock",
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

export type AssuranceBarContent = {
  enabled: boolean;
  items: { icon: IconName; title: string; subtitle: string }[];
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
  whatsapp_number: string;
  whatsapp_message: string;
};

export type HomepageBannersContent = {
  slides: { image_url: string; link: string; alt: string }[];
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
  "Instagram" | "Facebook" | "YouTube" | "TikTok" | "X" | "WhatsApp" | "Pinterest" | "LinkedIn";

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

export type PaymentQrContent = {
  image_url: string;
};

export type SiteContentMap = {
  header: HeaderContent;
  header_nav: HeaderNavContent;
  hero: HeroContent;
  trust_bar: TrustBarContent;
  assurance_bar: AssuranceBarContent;
  legacy: LegacyContent;
  categories_section: SectionHeadingContent;
  featured_section: SectionHeadingContent;
  cta_strip: CtaStripContent;
  homepage_banners: HomepageBannersContent;
  footer: FooterContent;
  reels: ReelsContent;
  social: SocialContent;
  page_about: AboutPageContent;
  page_custom: CustomPageContent;
  page_contact: ContactPageContent;
  page_faq: FaqPageContent;
  page_membership: MembershipPageContent;
  page_track_order: TrackOrderPageContent;
  payment_qr: PaymentQrContent;
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
      { label: "RINGS", to: "/products/rings", hash: "" },
      { label: "EARRINGS", to: "/products/earrings", hash: "" },
      { label: "NECKWEAR", to: "/products/neckwear", hash: "" },
      { label: "BRACELETS", to: "/products/bracelets", hash: "" },
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
      "Backed by a Family Jewellery Legacy",
    ],
  },
  categories_section: { eyebrow: "SHOP BY CATEGORY", title: "Explore Our Collections" },
  assurance_bar: {
    enabled: true,
    items: [
      { icon: "BadgeCheck", title: "925 Sterling Silver", subtitle: "Certified Authentic" },
      { icon: "ShieldCheck", title: "6-Month Warranty", subtitle: "Quality You Can Trust" },
      { icon: "Recycle", title: "Lifetime Replating", subtitle: "Lasting Brilliance" },
      { icon: "PackageCheck", title: "7-Day Easy Returns", subtitle: "Simple & Hassle-Free" },
    ],
  },
  featured_section: { eyebrow: "FEATURED", title: "Signature Pieces" },
  cta_strip: {
    title: "Custom & Modified 925 Silver Jewellery",
    body: "Have something in mind? Our karigars craft made-to-order pieces to your exact specifications.",
    button_label: "REQUEST A CUSTOM PIECE",
    whatsapp_number: YOMORA_PHONE_DIGITS,
    whatsapp_message: "Hi! I'd like to request a custom 925 silver jewellery piece.",
  },
  homepage_banners: {
    slides: [
      {
        image_url: "",
        link: "/custom-jewellery",
        alt: "Three-face 925 silver pendant — YOMORA custom jewellery",
      },
    ],
  },
  footer: {
    brand_blurb:
      "Premium 925 sterling silver jewellery by Nehalbhai Devika Jewellers. A legacy of trust since 1994.",
    shop_links: [
      { label: "Rings", to: "/products/rings" },
      { label: "Earrings", to: "/products/earrings" },
      { label: "Neckwear", to: "/products/neckwear" },
      { label: "Bracelets", to: "/products/bracelets" },
    ],
    help_links: [
      { label: "Track Order", to: "/track-order" },
      { label: "FAQ", to: "/faq" },
      { label: "Shipping Policy", to: "/faq" }, // Will link to FAQ section on shipping
      { label: "Returns Policy", to: "/faq" }, // Will link to FAQ section on returns
      { label: "Care Guide", to: "/faq" }, // Will link to FAQ section on care
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
    description: "Behind the craft, styling notes and new drops — follow along on Instagram.",
    autoplay: true,
    loop: true,
    items: [],
  },
  social: {
    cta_label: "FOLLOW US",
    handle: "@houseofyomora",
    show_in_header: true,
    show_in_footer: true,
    items: [
      { platform: "Instagram", url: "https://instagram.com/houseofyomora", label: "Instagram" },
    ],
  },
  page_about: {
    eyebrow: "OUR STORY",
    title: "A Legacy Built on Trust",
    paragraphs: [
      "It all began in 1994 when Late Shri Nehalbhai Devjibhai and Smt. Devikaben Nehalbhai laid the foundation of trust, purity and craftsmanship.",
      "For over 32 years, our family has built its name on trust, purity and craftsmanship. Now, we bring this legacy to the digital world with premium 925 silver jewellery under YOMORA.",
      "Every piece we make is a promise — of hallmarked purity, timeless design and the warmth of a family business that has always put its customers first.",
    ],
    stats: [
      { value: "32+", label: "Years of Legacy" },
      { value: "PAN-INDIA", label: "Online Service" },
      { value: "AHMEDABAD", label: "Gujarat" },
      { value: "100%", label: "Hallmarked Purity" },
    ],
    store_title: "Our Flagship Store",
  },
  page_custom: {
    hero_title: "CUSTOM JEWELLERY",
    hero_subtitle: "Made Just For You",
    hero_description:
      "Have a design in mind? We make personalised 925 silver jewellery as per your style and requirements.",
    features: [
      "Personalized Designs",
      "Premium 925 Silver",
      "Expert Craftsmanship",
      "Typical crafting time: 10–21 days after design approval",
    ],
    steps_eyebrow: "HOW IT WORKS",
    steps: [
      {
        icon: "Sparkles",
        title: "SHARE YOUR IDEA",
        description: "Share your design or inspiration with us",
      },
      { icon: "Star", title: "GET QUOTE", description: "We will send you the best quote" },
      { icon: "Hammer", title: "WE CRAFT IT", description: "Our experts craft it with perfection" },
      {
        icon: "Truck",
        title: "DELIVERED TO YOU",
        description: "Delivered safely to your doorstep",
      },
    ],
    form_title: "Enquire Now",
    form_button_label: "SUBMIT ENQUIRY",
    form_success_message: "Thank you — our team will contact you shortly.",
  },
  page_contact: {
    title: "Get in Touch",
    subtitle: "We're here to help you.",
    phone_lines: [YOMORA_PHONE_DISPLAY, "Mon – Sat: 10:00 AM – 7:00 PM"],
    email: YOMORA_EMAIL,
    address_lines: [
      "YOMORA by Nehalbhai Devika Jewellers",
      "Ahmedabad, Gujarat — serving customers across India",
    ],
    form_button_label: "SEND MESSAGE",
    form_success_message: "Thank you — we'll be in touch shortly.",
  },
  page_faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "What is 925 Sterling Silver?",
        answer:
          "925 sterling silver contains 92.5% pure silver. YOMORA pieces are hallmarked for purity.",
      },
      {
        question: "How do I know my ring size?",
        answer:
          "Measure the inner diameter of a well-fitting ring, use our size guide, or send us a photo of a fitted ring on WhatsApp for help.",
      },
      {
        question: "Do you offer Cash on Delivery?",
        answer: "Yes. Cash on Delivery is available across India with no extra COD fee.",
      },
      {
        question: "How long does shipping take?",
        answer:
          "Delivery usually takes 3–7 working days after dispatch, depending on the destination. Prepaid orders are processed first.",
      },
      {
        question: "What is your return policy?",
        answer:
          "Returns are accepted within 7 days for unused items with tags and original packaging. Custom-made pieces are non-returnable.",
      },
      {
        question: "Can I customize my jewellery?",
        answer: "Yes — visit our Custom Jewellery page and share your design with us.",
      },
      {
        question: "How do I care for my silver jewellery?",
        answer:
          "Keep jewellery dry, avoid perfume, bleach and pool water, and wipe it gently with a soft dry cloth before storing it in an airtight pouch.",
      },
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
      { icon: "Sparkles", title: "25% OFF", description: "on everything you order for 1 year" },
      {
        icon: "Star",
        title: "EARLY ACCESS",
        description: "to new arrivals & exclusive collections",
      },
      { icon: "Gem", title: "MEMBER-ONLY OFFERS", description: "special discounts all year long" },
      { icon: "Heart", title: "BIRTHDAY SURPRISE", description: "a special treat just for you" },
      { icon: "Truck", title: "PRIORITY DISPATCH", description: "faster processing & shipping" },
      { icon: "Award", title: "DEDICATED SUPPORT", description: "priority customer assistance" },
      {
        icon: "Hammer",
        title: "CUSTOM JEWELLERY",
        description: "personalized designs crafted for you",
      },
    ],
  },
  page_track_order: {
    title: "Track Your Order",
    description: "Enter your Order ID and Email to track your order.",
    order_id_label: "ORDER ID",
    email_label: "EMAIL",
    button_label: "TRACK ORDER",
    help_text: `Need help? Contact us on ${YOMORA_PHONE_DISPLAY}`,
    empty_message: "Enter your order details to see its status.",
  },
  payment_qr: {
    image_url: "/devika-jewellers-phonepe-qr.jpeg",
  },
};

export type SiteContentKey = keyof SiteContentMap;

export function mergeSiteContent(rows: { key: string; data: unknown }[]): SiteContentMap {
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.data;
  const out = { ...SITE_CONTENT_DEFAULTS };
  (Object.keys(SITE_CONTENT_DEFAULTS) as SiteContentKey[]).forEach((k) => {
    if (map[k]) {
      const def = SITE_CONTENT_DEFAULTS[k];
      const val = map[k];
      if (
        def &&
        typeof def === "object" &&
        !Array.isArray(def) &&
        val &&
        typeof val === "object" &&
        !Array.isArray(val)
      ) {
        (out as Record<string, unknown>)[k] = { ...(def as object), ...(val as object) };
      } else {
        (out as Record<string, unknown>)[k] = val;
      }
    }
  });
  // Contact details are canonical business information. Keep old saved CMS values
  // from reintroducing obsolete or placeholder contact details.
  out.cta_strip = { ...out.cta_strip, whatsapp_number: YOMORA_PHONE_DIGITS };
  out.footer = {
    ...out.footer,
    shop_links: SITE_CONTENT_DEFAULTS.footer.shop_links,
    help_links: SITE_CONTENT_DEFAULTS.footer.help_links,
  };
  out.page_contact = {
    ...out.page_contact,
    phone_lines: [YOMORA_PHONE_DISPLAY, "Mon – Sat: 10:00 AM – 7:00 PM"],
    email: YOMORA_EMAIL,
    address_lines: [
      "YOMORA by Nehalbhai Devika Jewellers",
      "Ahmedabad, Gujarat — serving customers across India",
    ],
  };
  out.page_track_order = {
    ...out.page_track_order,
    help_text: `Need help? Contact us on ${YOMORA_PHONE_DISPLAY}`,
  };
  out.legacy = {
    ...out.legacy,
    bullets: out.legacy.bullets.map((feature) =>
      feature === "Loved by Thousands of Customers"
        ? "Backed by a Family Jewellery Legacy"
        : feature,
    ),
  };
  out.page_about = {
    ...out.page_about,
    paragraphs: out.page_about.paragraphs.map((paragraph) =>
      paragraph ===
      "For over 32 years, we have earned the trust of thousands of families. Now, we bring this legacy to the digital world with premium 925 silver jewellery under YOMORA."
        ? "For over 32 years, our family has built its name on trust, purity and craftsmanship. Now, we bring this legacy to the digital world with premium 925 silver jewellery under YOMORA."
        : paragraph,
    ),
    stats: out.page_about.stats
      .filter((stat) => !(stat.value === "5★" && stat.label === "Customer Rating"))
      .map((stat) =>
        stat.value === "1000+" && stat.label === "Happy Customers Daily"
          ? { value: "PAN-INDIA", label: "Online Service" }
          : stat,
      ),
  };
  if (!out.page_about.paragraphs.some((paragraph) => paragraph.includes("Ahmedabad"))) {
    out.page_about.paragraphs = [
      ...out.page_about.paragraphs,
      "Based in Ahmedabad, Gujarat, our family jewellery business serves customers across India. Each 925 silver piece is hallmarked to verify its purity.",
    ];
  }
  out.page_faq = { ...out.page_faq, items: SITE_CONTENT_DEFAULTS.page_faq.items };
  if (!out.page_custom.features.some((feature) => feature.includes("10–21 days"))) {
    out.page_custom = {
      ...out.page_custom,
      features: [
        ...out.page_custom.features.filter((feature) => feature !== "Timely Delivery"),
        "Typical crafting time: 10–21 days after design approval",
      ],
    };
  }
  return out;
}
