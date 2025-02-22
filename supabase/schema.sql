-- Create tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles(id) on delete cascade not null
);

-- Table for storing member information (both registered and non-registered)
create table if not exists public.members (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for group memberships
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, member_id)
);

create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  description text not null,
  amount decimal(10,2) not null check (amount > 0),
  paid_by uuid references public.members(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  note text
);

create table if not exists public.splits (
  expense_id uuid references public.expenses(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  amount decimal(10,2) not null,
  split_type text not null check (split_type in ('equal', 'percentage', 'fixed')),
  percentage decimal(5,2) check (percentage > 0 and percentage <= 100),
  settled boolean default false not null,
  primary key (expense_id, member_id)
);

-- Create indexes
create index if not exists idx_groups_created_by on public.groups(created_by);
create index if not exists idx_expenses_group_id on public.expenses(group_id);
create index if not exists idx_splits_expense_id on public.splits(expense_id);
drop index if exists idx_splits_user_id;
create index if not exists idx_splits_member_id on public.splits(member_id);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.splits enable row level security;

-- Create policies
-- Profile policies
create policy "Profiles base policy"
  on public.profiles for all
  using (auth.uid() = id);

-- Groups policies
create policy "Creator can access groups"
  on public.groups for all
  using (created_by = auth.uid());

create policy "Member can access groups"
  on public.groups for select
  using (
    id in (
      select group_id from public.group_members
      where member_id in (
        select id from public.members
        where user_id = auth.uid()
      )
    )
  );

-- Members policies
create policy "Any user can select their member record"
  on public.members for select
  using (user_id = auth.uid());

create policy "Members write policy"
  on public.members for insert
  with check (true);

-- Group members policies
create policy "Members can view their memberships"
  on public.group_members for select
  using (
    member_id in (
      select id from public.members
      where user_id = auth.uid()
    )
  );

create policy "Creators manage group members"
  on public.group_members for all
  using (
    group_id in (
      select id from public.groups 
      where created_by = auth.uid()
    )
  );

-- Expenses policies
create policy "Users view group expenses"
  on public.expenses for select
  using (
    group_id in (
      select id from public.groups 
      where created_by = auth.uid()
    )
  );

-- Splits policies
create policy "Users view expense splits"
  on public.splits for select
  using (
    expense_id in (
      select id from public.expenses 
      where group_id in (
        select id from public.groups 
        where created_by = auth.uid()
      )
    )
  );

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Create trigger for new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
