ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_fkey;

-- Make sure every category currently used by a product exists in categories
INSERT INTO public.categories (slug, label, sort_order)
SELECT DISTINCT p.category, initcap(replace(p.category, '-', ' ')), 999
FROM public.products p
WHERE p.category IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.slug = p.category)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.products
ADD CONSTRAINT products_category_fkey
FOREIGN KEY (category)
REFERENCES public.categories(slug)
ON UPDATE CASCADE
ON DELETE RESTRICT;