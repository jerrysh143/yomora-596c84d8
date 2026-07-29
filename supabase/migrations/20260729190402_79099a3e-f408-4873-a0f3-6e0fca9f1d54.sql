ALTER TABLE public.products ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'unisex';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_audience_check;
ALTER TABLE public.products ADD CONSTRAINT products_audience_check CHECK (audience IN ('men','women','kids','unisex'));