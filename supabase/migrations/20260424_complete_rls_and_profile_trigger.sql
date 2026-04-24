-- Ensure RLS is enabled on both tables (no-op if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own profile (e.g. profile_picture_url)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- Allow users to delete their own trips
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;
CREATE POLICY "Users can delete own trips"
ON trips
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- Allow users to update their own trips (future-proofing; harmless if unused)
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
CREATE POLICY "Users can update own trips"
ON trips
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Auto-create a profile row whenever a new auth user is created.
-- Runs as SECURITY DEFINER so it bypasses the INSERT RLS check,
-- which is required when email confirmation is enabled (no session yet).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, country, profile_picture_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', 'DEFAULT'),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
