
-- First, drop all policies
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their groups" on public.groups;
drop policy if exists "Users can create groups" on public.groups;
drop policy if exists "Group creators can update groups" on public.groups;
drop policy if exists "Group creators can delete groups" on public.groups;
drop policy if exists "Users can view members in their groups" on public.members;
drop policy if exists "Group members can add new members" on public.members;
drop policy if exists "Group creators can manage members" on public.members;
drop policy if exists "Users can view group members" on public.group_members;
drop policy if exists "Group creators can manage group members" on public.group_members;
drop policy if exists "Users can view expenses in their groups" on public.expenses;
drop policy if exists "Group creators can manage expenses" on public.expenses;
drop policy if exists "Users can view splits in their groups" on public.splits;
drop policy if exists "Group creators can manage splits" on public.splits;

-- Drop triggers
drop trigger if exists on_auth_user_created on auth.users;

-- Drop functions
drop function if exists public.handle_new_user();

-- Drop tables in correct order (due to foreign key dependencies)
drop table if exists public.splits;
drop table if exists public.expenses;
drop table if exists public.group_members;
drop table if exists public.members;
drop table if exists public.groups;
drop table if exists public.profiles;

-- Drop indexes
drop index if exists public.idx_groups_created_by;
drop index if exists public.idx_expenses_group_id;
drop index if exists public.idx_splits_expense_id;
drop index if exists public.idx_splits_member_id;
