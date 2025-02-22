-- Enable RLS
alter table members enable row level security;

-- Allow read access to authenticated users
create policy "Members are viewable by authenticated users"
on members for select
to authenticated
using (true);

-- Allow anyone to insert new members (needed for adding non-user members)
create policy "Anyone can create new members"
on members for insert
to authenticated
with check (true);

-- Allow updates only by the user who owns the member record
create policy "Users can update their own member records"
on members for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
