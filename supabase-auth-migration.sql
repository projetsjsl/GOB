-- ============================================================
-- MIGRATION: Fix RLS Policies for Users Table
-- Run this in Supabase SQL Editor if you're getting
-- "The string did not match the expected pattern" error at login
-- ============================================================

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;

-- Create INSERT policy for users table
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Create UPDATE policy for users table
CREATE POLICY "Service role can update users"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
