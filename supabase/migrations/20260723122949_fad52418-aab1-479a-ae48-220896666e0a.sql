CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site content"
  ON public.site_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert site content"
  ON public.site_content FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site content"
  ON public.site_content FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site content"
  ON public.site_content FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_content_set_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_content (key, data) VALUES
  ('header', '{
    "announcements": [
      {"icon": "Truck", "text": "Free Shipping Across India"},
      {"icon": "ShieldCheck", "text": "925 Hallmarked Silver"},
      {"icon": "RotateCcw", "text": "Easy 7-Day Returns"}
    ],
    "brand_name": "YOMORA",
    "brand_tagline": "BY NEHALBHAI DEVIKA JEWELLERS"
  }'::jsonb),
  ('hero', '{
    "eyebrow": "PREMIUM 925 STERLING SILVER JEWELLERY",
    "title_line_1": "Timeless Elegance,",
    "title_line_2": "Crafted for Every You",
    "description": "Discover beautifully designed 925 Sterling Silver jewellery, crafted to complement every moment of your life. From everyday wear to unforgettable occasions.",
    "primary_cta_label": "SHOP COLLECTION",
    "primary_cta_hash": "",
    "secondary_cta_label": "NEW ARRIVALS",
    "secondary_cta_hash": "new",
    "custom_card_title": "MODIFIED 925 SILVER JEWELLERY",
    "custom_card_body": "We also create custom & modified 925 silver jewellery as per your style and requirements."
  }'::jsonb),
  ('trust_bar', '{
    "items": [
      {"icon": "Award", "title": "32+ YEARS OF TRUST", "body": "Trusted Jewellery Legacy Since 1994"},
      {"icon": "Gem", "title": "GENUINE 925 SILVER", "body": "Hallmarked & Quality Assured"},
      {"icon": "Hammer", "title": "EXPERT CRAFTSMANSHIP", "body": "Fine Detailing, Superior Finish"},
      {"icon": "Truck", "title": "PAN INDIA DELIVERY", "body": "Fast, Secure & Reliable"},
      {"icon": "ShieldCheck", "title": "SECURE PAYMENTS", "body": "100% Safe & Protected"}
    ]
  }'::jsonb),
  ('legacy', '{
    "eyebrow": "OUR LEGACY",
    "title_line_1": "A Legacy of Trust.",
    "title_line_2": "A Future of Luxury.",
    "description": "For over 32 years, Nehalbhai Devika Jewellers has been a name of trust, quality and timeless relationships. YOMORA is our premium silver jewellery brand, bringing that legacy to the modern world.",
    "image_url": "",
    "bullets": [
      "Genuine 925 Hallmarked Silver",
      "Trendy & Timeless Designs",
      "Modified & Custom Jewellery",
      "Premium Packaging",
      "Loved by Thousands of Customers"
    ]
  }'::jsonb),
  ('categories_section', '{
    "eyebrow": "SHOP BY CATEGORY",
    "title": "Explore Our Collections"
  }'::jsonb),
  ('featured_section', '{
    "eyebrow": "FEATURED",
    "title": "Signature Pieces"
  }'::jsonb),
  ('cta_strip', '{
    "title": "Custom & Modified 925 Silver Jewellery",
    "body": "Have something in mind? Our karigars craft made-to-order pieces to your exact specifications.",
    "button_label": "REQUEST A CUSTOM PIECE"
  }'::jsonb),
  ('footer', '{
    "brand_blurb": "Premium 925 sterling silver jewellery by Nehalbhai Devika Jewellers. A legacy of trust since 1994.",
    "shop_links": [
      {"label": "Rings", "to": "/products"},
      {"label": "Earrings", "to": "/products"},
      {"label": "Neckwear", "to": "/products"},
      {"label": "Bracelets", "to": "/products"}
    ],
    "help_links": [
      {"label": "Shipping", "to": "/products"},
      {"label": "Returns", "to": "/products"},
      {"label": "Care Guide", "to": "/products"},
      {"label": "Contact", "to": "/products"}
    ],
    "newsletter_title": "STAY IN TOUCH",
    "newsletter_body": "New arrivals, quiet drops, and craft notes.",
    "copyright": "© YOMORA · Nehalbhai Devika Jewellers"
  }'::jsonb);
