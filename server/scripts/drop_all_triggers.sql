-- Drop all existing triggers related to auth.user sync
DROP TRIGGER IF EXISTS on_auth_user_insert ON auth.users;

DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users;

DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;

-- Drop associated functions
DROP FUNCTION IF EXISTS handle_auth_user_insert;

DROP FUNCTION IF EXISTS handle_auth_user_update;

DROP FUNCTION IF EXISTS handle_auth_user_delete;

-- Optional: Drop policies if needed
DROP POLICY IF EXISTS "Users can view their own profile" ON public."User";

DROP POLICY IF EXISTS "Users can update their own profile" ON public."User";

DROP POLICY IF EXISTS "Users can delete their own profile" ON public."User";

-- Disable RLS (Optional, if you want to reset security)
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;