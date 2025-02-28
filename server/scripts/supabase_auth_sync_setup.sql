-- Function to sync Supabase auth.users with public.User table and log actions with exception handling
create or replace function handle_auth_user_changes()
returns trigger as $$
begin
  -- Log the event type and user ID
  raise notice 'Trigger activated: % for user ID: %', TG_OP, coalesce(NEW.id::text, OLD.id::text);

  if (TG_OP = 'INSERT') then
    begin
      -- Insert user into User table
      insert into public."User" (id, email, "fullName", "avatarUrl", "createdAt", "updatedAt")
      values (NEW.id, NEW.email, coalesce(NEW.raw_user_meta_data->>'fullName', NULL), 
              coalesce(NEW.raw_user_meta_data->>'avatarUrl', NULL), now(), now())
      on conflict (id) do nothing;

      raise notice '✅ User inserted: ID=%, Email=%', NEW.id, NEW.email;
    exception when others then
      raise notice '❌ Error inserting user: ID=%, Email=%, ERROR=%', NEW.id, NEW.email, sqlerrm;
    end;
    return NEW;

  elsif (TG_OP = 'UPDATE') then
    begin
      -- Update user fields in User table
      update public."User"
      set email = NEW.email,
          "fullName" = coalesce(NEW.raw_user_meta_data->>'fullName', "fullName"), 
          "avatarUrl" = coalesce(NEW.raw_user_meta_data->>'avatarUrl', "avatarUrl"),
          "updatedAt" = now()
      where id = NEW.id;

      raise notice '✅ User updated: ID=%, Email=%', NEW.id, NEW.email;
    exception when others then
      raise notice '❌ Error updating user: ID=%, Email=%, ERROR=%', NEW.id, NEW.email, sqlerrm;
    end;
    return NEW;

  elsif (TG_OP = 'DELETE') then
    begin
      -- Delete user from User table
      delete from public."User"
      where id = OLD.id;

      raise notice '✅ User deleted: ID=%, Email=%', OLD.id, OLD.email;
    exception when others then
      raise notice '❌ Error deleting user: ID=%, Email=%, ERROR=%', OLD.id, OLD.email, sqlerrm;
    end;
    return OLD;
  end if;

  return NULL;
end;
$$ language plpgsql security definer;

-- Ensure trigger does not already exist
drop trigger if exists on_auth_user_changes on auth.users;

-- Create trigger to sync users between auth.users and User table
create trigger on_auth_user_changes
after insert or update or delete on auth.users
for each row
execute function handle_auth_user_changes();

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
using (auth.uid() = id::uuid);

-- Policy: Allow users to update their own profile
create policy "Users can update their own profile"
on public."User"
for update
using (auth.uid() = id::uuid);

-- Policy: Allow users to delete their own profile
create policy "Users can delete their own profile"
on public."User"
for delete
using (auth.uid() = id::uuid);