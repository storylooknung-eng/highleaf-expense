-- ============================================================
-- Wallet / ตัดบิล — เพิ่มหลังจาก schema.sql หลัก
-- Run ใน Supabase Dashboard → SQL Editor
--
-- Backup ก่อนรัน:
--   (ยังไม่มีตาราง wallet_transactions จึงไม่ต้อง backup)
-- Rollback:
--   drop trigger if exists expenses_credit_wallet on public.expenses;
--   drop function if exists public.credit_wallet_on_approve();
--   drop table if exists public.wallet_transactions;
-- ============================================================

create table if not exists public.wallet_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.user_profiles(id) on delete cascade,
  type            text not null check (type in ('credit','debit')),
  amount          numeric(12,2) not null check (amount > 0),
  description     text not null default '',
  ref_expense_id  text references public.expenses(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists wt_user_idx on public.wallet_transactions (user_id, created_at desc);

-- slip attachment (optional)
alter table public.wallet_transactions add column if not exists slip_path text;
alter table public.wallet_transactions add column if not exists slip_url  text;

-- edit history log (admin only) — stores array of {at, old_amount, old_description, by}
alter table public.wallet_transactions add column if not exists edit_log  jsonb not null default '[]'::jsonb;

-- admin can insert/update/delete any transaction
drop policy if exists "wallet_update_admin" on public.wallet_transactions;
drop policy if exists "wallet_delete_admin" on public.wallet_transactions;
drop policy if exists "wallet_insert_admin" on public.wallet_transactions;

create policy "wallet_insert_admin"
on public.wallet_transactions for insert
to authenticated
with check (public.is_admin());

create policy "wallet_update_admin"
on public.wallet_transactions for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "wallet_delete_admin"
on public.wallet_transactions for delete
to authenticated
using (public.is_admin());

alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_select_own_or_manager" on public.wallet_transactions;
drop policy if exists "wallet_insert_own"             on public.wallet_transactions;
drop policy if exists "wallet_insert_system"          on public.wallet_transactions;

-- staff เห็นของตัวเอง, manager เห็นทั้งหมด
create policy "wallet_select_own_or_manager"
on public.wallet_transactions for select
to authenticated
using (user_id = auth.uid() or public.is_manager());

-- staff insert เฉพาะ debit (ตัดบิล) ของตัวเอง
create policy "wallet_insert_own"
on public.wallet_transactions for insert
to authenticated
with check (user_id = auth.uid() and type = 'debit');

-- trigger function (security definer) insert credit ได้โดยไม่โดน RLS บล็อก
create or replace function public.credit_wallet_on_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'approved'
     and (OLD.status is null or OLD.status <> 'approved')
     and NEW.submitted_by_id is not null
  then
    insert into public.wallet_transactions
      (user_id, type, amount, description, ref_expense_id)
    values
      (NEW.submitted_by_id, 'credit', NEW.amount,
       'รับเงินเบิก: ' || coalesce(nullif(trim(NEW.note), ''), NEW.id),
       NEW.id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists expenses_credit_wallet on public.expenses;
create trigger expenses_credit_wallet
after update on public.expenses
for each row execute function public.credit_wallet_on_approve();
