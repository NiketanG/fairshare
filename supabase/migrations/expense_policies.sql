-- Enable RLS for expenses table
alter table expenses enable row level security;

-- Enable RLS for splits table
alter table splits enable row level security;

-- Policy to read expenses: users can read expenses for groups they are members of
create policy "Group members can view expenses"
on expenses for select
using (
  exists (
    select 1 from group_members gm
    join members m on m.id = gm.member_id
    where gm.group_id = expenses.group_id
    and m.user_id = auth.uid()
  )
);

-- Policy to create expenses: users can create expenses for groups they are members of
create policy "Group members can create expenses"
on expenses for insert
with check (
  exists (
    select 1 from group_members gm
    join members m on m.id = gm.member_id
    where gm.group_id = group_id
    and m.user_id = auth.uid()
  )
);

-- Policy to read splits
create policy "Users can view splits for their groups"
on splits for select
using (
  exists (
    select 1 from expenses e
    join group_members gm on gm.group_id = e.group_id
    join members m on m.id = gm.member_id
    where e.id = splits.expense_id
    and m.user_id = auth.uid()
  )
);

-- Policy to create splits: users can create splits for expenses they create
create policy "Users can create splits"
on splits for insert
with check (
  exists (
    select 1 from expenses e
    join group_members gm on gm.group_id = e.group_id
    join members m on m.id = gm.member_id
    where e.id = expense_id
    and m.user_id = auth.uid()
  )
);
