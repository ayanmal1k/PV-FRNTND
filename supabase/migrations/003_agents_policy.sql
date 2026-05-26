-- Allow authenticated users to create an `agents` row for themselves
-- Run this as a migration or paste into the Supabase SQL editor.

create policy "users create agents" on agents
  for insert
  with check (auth.uid() = user_id);

-- Optionally allow authenticated users to select their own agent row
create policy "users read own agent" on agents
  for select
  using (auth.uid() = user_id);

-- Optionally allow authenticated users to update their own agent row
create policy "users update own agent" on agents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
