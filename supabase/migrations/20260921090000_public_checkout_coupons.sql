alter table public.coupons
  add column if not exists show_at_checkout boolean not null default false;

comment on column public.coupons.show_at_checkout is
  'When true, this coupon code may be listed publicly in the checkout deal selector.';
