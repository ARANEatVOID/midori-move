CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can view own trips"
ON trips
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own trips"
ON trips
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);
