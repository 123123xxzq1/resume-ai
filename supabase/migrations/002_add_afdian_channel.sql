-- 迁移 002: orders 表 channel 列允许 'afdian'
-- 应用方式: Supabase Dashboard → SQL Editor → New query → 粘贴 → Run

alter table public.orders
  drop constraint if exists orders_channel_check;

alter table public.orders
  add constraint orders_channel_check
  check (channel in ('stripe', 'zpay', 'afdian'));

-- 验证
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.orders'::regclass
  and conname like '%channel%';
