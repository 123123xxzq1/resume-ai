-- =====================================================================
-- ResumeAI · Supabase 数据库迁移脚本
-- =====================================================================
-- 使用方式：
-- 1. 打开 https://app.supabase.com 你的项目
-- 2. 左侧 SQL Editor → New query
-- 3. 把本文件内容全部粘贴进去 → Run
-- 4. 一次成功后就不要重复运行（带 drop 的幂等版本可后续再发）
-- =====================================================================

-- extensions ----------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- profiles ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'lifetime')),
  plan_expires_at timestamptz,
  credits integer not null default 3,
  total_analyses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- analyses ------------------------------------------------------------
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_preview text,        -- 前 200 字，用于用户自查历史
  jd_preview text,
  score integer,
  model text,
  tokens_used integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_analyses_user_created
  on public.analyses (user_id, created_at desc);

-- orders --------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('stripe', 'zpay')),
  provider_order_id text,                 -- Stripe session id / ZPay trade_no
  out_trade_no text not null unique,      -- 我们自己的订单号
  plan text not null check (plan in ('pro', 'lifetime')),
  amount_cents integer not null,          -- 分（CNY 分 或 USD cent）
  currency text not null default 'CNY',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  raw jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists idx_orders_user on public.orders (user_id, created_at desc);
create index if not exists idx_orders_status on public.orders (status);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.orders enable row level security;

-- profiles: 用户只能读写自己
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- analyses: 用户只能看自己的
drop policy if exists "analyses_select_own" on public.analyses;
create policy "analyses_select_own" on public.analyses
  for select using (auth.uid() = user_id);

-- orders: 用户只能看自己的
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

-- 写操作全部走 service_role（webhook / api/analyze），不开放给普通用户

-- =====================================================================
-- Trigger: 注册后自动建 profile
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, credits, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    3,
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RPC: 原子扣积分（避免并发问题）
-- =====================================================================
create or replace function public.consume_credit(p_user_id uuid)
returns table(ok boolean, remaining integer, plan text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits int;
  v_plan text;
  v_expires timestamptz;
begin
  select profiles.credits, profiles.plan, profiles.plan_expires_at
    into v_credits, v_plan, v_expires
  from public.profiles
  where profiles.id = p_user_id
  for update;

  if not found then
    return query select false, 0, 'free'::text;
    return;
  end if;

  -- pro/lifetime 在有效期内无限次
  if v_plan in ('pro', 'lifetime') and (v_expires is null or v_expires > now()) then
    update public.profiles
      set total_analyses = total_analyses + 1,
          updated_at = now()
      where id = p_user_id;
    return query select true, 999999, v_plan;
    return;
  end if;

  -- free：扣 1 点
  if v_credits <= 0 then
    return query select false, 0, v_plan;
    return;
  end if;

  update public.profiles
    set credits = credits - 1,
        total_analyses = total_analyses + 1,
        updated_at = now()
    where id = p_user_id;
  return query select true, v_credits - 1, v_plan;
end;
$$;

grant execute on function public.consume_credit(uuid) to authenticated;
