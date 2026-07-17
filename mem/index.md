# Project Memory

## Core
YOMORA e-commerce (925 silver jewellery). Dark onyx + gold accent, Cormorant Garamond display + Inter body.
Products live in `public.products` (Lovable Cloud). Admin CRUD gated by `has_role(auth.uid(),'admin')`.
Public buckets are blocked in this workspace — product images are stored as external URLs (text field), not uploaded to storage.
To promote the first admin: `insert into public.user_roles (user_id, role) values ('<uid>', 'admin');`

## Memories
(none yet)
