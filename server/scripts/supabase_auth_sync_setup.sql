-- Function for INSERT Trigger
create or replace function handle_auth_user_insert()
returns trigger as $$
begin
  raise notice 'Insert Trigger activated for user ID: %', NEW.id;

  -- Insert into public."User" table, casting NEW.id to text
  insert into public."User" (id, email, "fullName", "avatarUrl", "createdAt", "updatedAt")
  values (
    NEW.id::text,  -- Cast NEW.id (uuid) to text
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'display_name', NULL),
    coalesce(NEW.raw_user_meta_data->>'avatarUrl', NULL),
    now(),
    now()
  )
  on conflict (id) do nothing;

  raise notice '✅ User inserted: ID=%, Email=%', NEW.id, NEW.email;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger for INSERT
drop trigger if exists on_auth_user_insert on auth.users;

create trigger on_auth_user_insert
after insert on auth.users
for each row
execute function handle_auth_user_insert();

-- Function for UPDATE Trigger
create or replace function handle_auth_user_update()
returns trigger as $$
begin
  raise notice 'Update Trigger activated for user ID: %', NEW.id;

  -- Update public."User" table, casting NEW.id to text
  update public."User"
  set email = NEW.email,
      "fullName" = coalesce(NEW.raw_user_meta_data->>'display_name', "fullName"),
      "avatarUrl" = coalesce(NEW.raw_user_meta_data->>'avatarUrl', "avatarUrl"),
      "updatedAt" = now()
  where id = NEW.id::text;  -- Cast NEW.id (uuid) to text

  raise notice '✅ User updated: ID=%, Email=%', NEW.id, NEW.email;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger for UPDATE
drop trigger if exists on_auth_user_update on auth.users;

create trigger on_auth_user_update
after update on auth.users
for each row
execute function handle_auth_user_update();

-- Function for DELETE Trigger
create or replace function handle_auth_user_delete()
returns trigger as $$
begin
  raise notice 'Delete Trigger activated for user ID: %', OLD.id;

  -- Delete from public."User" table, casting OLD.id to text
  delete from public."User"
  where id = OLD.id::text;  -- Cast OLD.id (uuid) to text

  raise notice '✅ User deleted: ID=%, Email=%', OLD.id, OLD.email;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger for DELETE
drop trigger if exists on_auth_user_delete on auth.users;

create trigger on_auth_user_delete
after delete on auth.users
for each row
execute function handle_auth_user_delete();

-- Enable Row Level Security (RLS) on User table
alter table public."User" enable row level security;

-- Drop existing policies if they exist before recreating them
drop policy if exists "Users can view their own profile" on public."User";
drop policy if exists "Users can update their own profile" on public."User";
drop policy if exists "Users can delete their own profile" on public."User";

-- Policy: Allow users to view their own profile
create policy "Users can view their own profile"
on public."User"
for select
using (auth.uid()::text = id);  -- Cast auth.uid() (uuid) to text

-- Policy: Allow users to update their own profile
create policy "Users can update their own profile"
on public."User"
for update
using (auth.uid()::text = id);  -- Cast auth.uid() (uuid) to text

-- Policy: Allow users to delete their own profile
create policy "Users can delete their own profile"
on public."User"
for delete
using (auth.uid()::text = id);  -- Cast auth.uid() (uuid) to text