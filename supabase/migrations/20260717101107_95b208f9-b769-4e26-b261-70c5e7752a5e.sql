
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Products
CREATE TABLE public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('rings','earrings','neckwear','bracelets')),
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text,
  is_new boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed initial products
INSERT INTO public.products (id, name, price, category, tagline, description, is_new) VALUES
('eternity-band','Aria Eternity Band',4899,'rings','Hallmarked 925 silver · Brilliant cut','A slim eternity band set with a continuous halo of brilliant-cut stones. Rhodium plated to protect the sterling silver finish and keep every facet radiant.',false),
('solitaire-teardrop','Luna Teardrop Pendant',3599,'neckwear','Halo teardrop · 18" chain','A softly weighted teardrop pendant framed by a delicate halo, suspended on an adjustable 18-inch cable chain in polished 925 sterling silver.',true),
('classic-studs','Éclat Solitaire Studs',1899,'earrings','4-prong · Everyday classic','The everyday studs — a pair of round brilliant solitaires held in four-prong settings, secured with butterfly backs. Understated, endlessly versatile.',false),
('tennis-bracelet','Reverie Tennis Bracelet',6299,'bracelets','Continuous line · Box clasp','A continuous line of prong-set stones flows around the wrist, secured by a discreet box clasp with a safety catch for confident everyday wear.',true),
('signet-ring','Monde Signet Ring',2799,'rings','Modern signet · Polished','A quietly modern signet with a softly cushioned face, hand-polished to a mirror finish.',false),
('drop-earrings','Sable Drop Earrings',2499,'earrings','Twin stone · Push back','Twin-stone drops that catch the light with every turn of the head. Push-back closure.',false),
('chain-necklace','Vera Cable Chain',2199,'neckwear','Layerable · 20" chain','A refined cable chain designed to layer effortlessly with pendants and shorter neckwear.',false),
('bangle','Halo Cuff Bracelet',3299,'bracelets','Open cuff · Adjustable','A sculpted open cuff with a subtle taper — sits close to the wrist without a clasp.',false);
