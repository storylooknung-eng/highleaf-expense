-- ============================================================
-- HIGHLEAF Global — production-ready Supabase schema
-- Run in Supabase Dashboard -> SQL Editor.
--
-- Safety:
-- 1) Back up existing tables before running on production:
--    create table backup_expenses_YYYYMMDD as table public.expenses;
--    create table backup_user_profiles_YYYYMMDD as table public.user_profiles;
-- 2) Verify Auth is enabled and users exist in auth.users.
-- 3) Rollback path: restore policies/tables from the backups above or revert this file in git.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  dept        text not null default '',
  role        text not null default 'staff'
              check (role in ('admin','approver','staff')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_touch_updated_at on public.user_profiles;
create trigger user_profiles_touch_updated_at
before update on public.user_profiles
for each row execute function public.touch_updated_at();

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.user_profiles
  where id = auth.uid() and active = true
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() in ('admin','approver'), false)
$$;

create or replace function public.no_profiles_exist()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (select 1 from public.user_profiles limit 1)
$$;

create table if not exists public.expenses (
  id              text primary key,
  date            date not null,
  person          text not null,
  dept            text not null default '',
  cat             text not null default 'travel'
                  check (cat in ('travel','supply','market','meal','utility')),
  amount          numeric(12,2) not null default 0 check (amount >= 0),
  status          text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  note            text default '',
  hue             integer default 140,
  slip_path       text,
  slip_url        text,
  submitted_by_id uuid references public.user_profiles(id) on delete set null,
  submitted_by    text,
  approved_by_id  uuid references public.user_profiles(id) on delete set null,
  approved_by     text,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.expenses add column if not exists slip_path text;
alter table public.expenses add column if not exists slip_url text;
alter table public.expenses add column if not exists submitted_by_id uuid references public.user_profiles(id) on delete set null;
alter table public.expenses add column if not exists submitted_by text;
alter table public.expenses add column if not exists approved_by_id uuid references public.user_profiles(id) on delete set null;
alter table public.expenses add column if not exists approved_by text;
alter table public.expenses add column if not exists approved_at timestamptz;
alter table public.expenses add column if not exists updated_at timestamptz not null default now();

drop trigger if exists expenses_touch_updated_at on public.expenses;
create trigger expenses_touch_updated_at
before update on public.expenses
for each row execute function public.touch_updated_at();

create index if not exists expenses_date_idx on public.expenses (date desc);
create index if not exists expenses_status_idx on public.expenses (status);
create index if not exists expenses_submitter_idx on public.expenses (submitted_by_id);
create index if not exists expenses_created_idx on public.expenses (created_at desc);

alter table public.user_profiles enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "public_read" on public.expenses;
drop policy if exists "public_insert" on public.expenses;
drop policy if exists "public_update" on public.expenses;
drop policy if exists "profiles_select" on public.user_profiles;
drop policy if exists "profiles_insert_self" on public.user_profiles;
drop policy if exists "profiles_update_admin" on public.user_profiles;
drop policy if exists "expenses_select_scope" on public.expenses;
drop policy if exists "expenses_insert_self" on public.expenses;
drop policy if exists "expenses_update_scope" on public.expenses;

create policy "profiles_select"
on public.user_profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_self"
on public.user_profiles for insert
to authenticated
with check (
  id = auth.uid()
  and (
    role = 'staff'
    or (role = 'admin' and public.no_profiles_exist())
  )
);

create policy "profiles_update_admin"
on public.user_profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "expenses_select_scope"
on public.expenses for select
to authenticated
using (public.is_manager() or submitted_by_id = auth.uid());

create policy "expenses_insert_self"
on public.expenses for insert
to authenticated
with check (
  submitted_by_id = auth.uid()
  and status = 'pending'
  and approved_by_id is null
  and approved_at is null
);

create policy "expenses_update_scope"
on public.expenses for update
to authenticated
using (
  public.is_manager()
  or (submitted_by_id = auth.uid() and status = 'pending')
)
with check (
  public.is_manager()
  or (
    submitted_by_id = auth.uid()
    and status = 'pending'
    and approved_by_id is null
    and approved_at is null
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'slips',
  'slips',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists "slips_insert_own_folder" on storage.objects;
drop policy if exists "slips_select_own_or_manager" on storage.objects;
drop policy if exists "slips_update_own_folder" on storage.objects;

create policy "slips_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'slips'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "slips_select_own_or_manager"
on storage.objects for select
to authenticated
using (
  bucket_id = 'slips'
  and (public.is_manager() or (storage.foldername(name))[1] = auth.uid()::text)
);

create policy "slips_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'slips'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'slips'
  and (storage.foldername(name))[1] = auth.uid()::text
);
