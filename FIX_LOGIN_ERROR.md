# Fix: "The string did not match the expected pattern" Login Error

## Problem

When trying to login with credentials (e.g., `admin` / `admin`), you get the error:
```
The string did not match the expected pattern
```

## Root Cause

The `users` table has Row Level Security (RLS) enabled but was **missing INSERT and UPDATE policies**. This caused the authentication API to fail when trying to create or update user records during login.

## Solution

### For New Installations

The main schema file (`supabase-auth-setup.sql`) has been updated with the correct policies. Just run it in your Supabase SQL Editor.

### For Existing Databases (Quick Fix)

Run this migration script in your Supabase SQL Editor:

```sql
-- Add missing INSERT policy
CREATE POLICY IF NOT EXISTS "Service role can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Add missing UPDATE policy
CREATE POLICY IF NOT EXISTS "Service role can update users"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

Or simply run the provided migration file:
```bash
# In Supabase SQL Editor, paste contents of:
supabase-auth-migration.sql
```

## Verification

After applying the fix, verify the policies exist:

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

You should see:
- ✅ `Users can view themselves` (SELECT)
- ✅ `Service role can insert users` (INSERT)
- ✅ `Service role can update users` (UPDATE)

## Testing

After applying the fix, try logging in again:
1. Go to `/login.html`
2. Enter `admin` / `admin`
3. Login should succeed and redirect to dashboard

## Additional Fix Applied

Also fixed UUID generation in `emma-multi-user.js` to use proper UUID format compatible with PostgreSQL UUID type (prevents conversation save errors).

## Files Modified

- `supabase-auth-setup.sql` - Added missing RLS policies
- `supabase-auth-migration.sql` - Migration script for existing databases
- `public/js/emma-multi-user.js` - Fixed UUID generation for session IDs

## Environment Variables Required

Ensure these are set in Vercel:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase **service role key** (not anon key!)

The service role key is required to bypass RLS when the API creates users.
