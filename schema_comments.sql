-- ============================================================
-- expense_comments — สร้างตาราง + เพิ่ม image_path
-- Run ใน Supabase Dashboard → SQL Editor
-- Rollback: drop table if exists public.expense_comments;
-- ============================================================

create table if not exists public.expense_comments (
  id          uuid primary key default gen_random_uuid(),
  expense_id  text not null references public.expenses(id) on delete cascade,
  user_id     uuid references public.user_profiles(id) on delete set null,
  user_name   text not null default '',
  body        text not null default '',
  image_path  text,
  created_at  timestamptz not null default now()
);

-- เพิ่ม column image_path ถ้ายังไม่มี (safe re-run)
alter table public.expense_comments add column if not exists image_path text;

create index if not exists comments_expense_idx on public.expense_comments (expense_id, created_at);

alter table public.expense_comments enable row level security;

drop policy if exists "comments_select" on public.expense_comments;
drop policy if exists "comments_insert" on public.expense_comments;
drop policy if exists "comments_delete" on public.expense_comments;

create policy "comments_select"
on public.expense_comments for select
to authenticated
using (true);

create policy "comments_insert"
on public.expense_comments for insert
to authenticated
with check (user_id = auth.uid());

create policy "comments_delete"
on public.expense_comments for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Storage: อนุญาต upload รูป comment เข้า bucket slips/comments/
-- (ใช้ bucket เดิม slips ที่มีอยู่แล้ว ไม่ต้องสร้างใหม่)
