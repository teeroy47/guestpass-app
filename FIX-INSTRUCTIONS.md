# 🔧 Fix Instructions for User Role & Display Name Issues

## 🐛 Issues Being Fixed

1. **Display name resets to email after logout** ❌
2. **Role changes don't take effect (users still see old role)** ❌
3. **403/406 errors in console when accessing users table** ❌

## ✅ What I've Done

### 1. Updated `auth-context.tsx`
- Fixed the `ensureUserProfile` function to ALWAYS fetch display name and role from database
- Even if there's an error during profile creation, it will still fetch the latest data
- This ensures role changes are immediately reflected

### 2. Created SQL Migration
- Created `supabase-migrations/fix-all-rls-policies.sql`
- This fixes ALL Row Level Security (RLS) policies on the `users` table

## 🚀 What You Need to Do

### Step 1: Run the SQL Migration

1. Open your **Supabase Dashboard**: https://supabase.com/dashboard
2. Go to your project: `yiujxmrwwsgfhqcllafe`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the ENTIRE contents of `supabase-migrations/fix-all-rls-policies.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

**Expected Output:**
```
Success. No rows returned
```

### Step 2: Verify the Policies

After running the migration, run this verification query in the SQL Editor:

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

**Expected Output:**
You should see 4 policies:
- `authenticated_users_can_read_all_profiles` (SELECT)
- `users_can_insert_own_profile` (INSERT)
- `users_can_update_own_profile` (UPDATE)
- `super_admin_can_update_any_user_role` (UPDATE)

### Step 3: Restart Your Development Server

1. Stop the server (Ctrl+C in the terminal)
2. Start it again:
   ```powershell
   npm run dev
   ```

### Step 4: Test the Fixes

#### Test 1: Display Name Persistence
1. Log in as any user
2. Go to your profile settings
3. Update your display name
4. Log out
5. Log back in
6. ✅ **Expected:** Display name should persist (not reset to email)

#### Test 2: Role Changes Take Effect
1. Log in as super admin (`chiunyet@africau.edu`)
2. Go to Admin Panel → User Management
3. Promote a usher to admin
4. Log out
5. Log in as that user
6. ✅ **Expected:** User should see admin view (not usher view)

#### Test 3: No Console Errors
1. Open browser console (F12)
2. Log in as any user
3. ✅ **Expected:** No 403 or 406 errors related to `/rest/v1/users`

## 🔍 What the SQL Migration Does

### Policy 1: Read Access
```sql
authenticated_users_can_read_all_profiles
```
- Allows ALL authenticated users to read all user profiles
- Needed for: Admin panel user list, fetching display names, fetching roles

### Policy 2: Insert Own Profile
```sql
users_can_insert_own_profile
```
- Allows users to create their own profile on signup
- Needed for: New user registration

### Policy 3: Update Own Profile
```sql
users_can_update_own_profile
```
- Allows users to update their own `display_name` and `full_name`
- **Prevents** users from changing their own `role`
- Needed for: Profile settings page

### Policy 4: Super Admin Role Management
```sql
super_admin_can_update_any_user_role
```
- Allows super admin (`chiunyet@africau.edu`) to update ANY user's role
- Needed for: Admin panel role management feature

## 🎯 Expected Behavior After Fix

### Display Name
- ✅ Users can update their display name
- ✅ Display name persists after logout/login
- ✅ Display name shows in UI instead of email

### User Roles
- ✅ Super admin can promote/demote users
- ✅ Role changes take effect immediately (no re-login needed)
- ✅ Users see the correct view based on their role
- ✅ Users cannot change their own role

### Console Errors
- ✅ No more 403 (Forbidden) errors
- ✅ No more 406 (Not Acceptable) errors
- ✅ Clean console logs

## 🆘 Troubleshooting

### If display name still resets:
1. Check browser console for errors
2. Verify the SQL migration ran successfully
3. Make sure you restarted the dev server

### If role changes don't take effect:
1. Make sure the user logs out and back in after role change
2. Check that the SQL migration created all 4 policies
3. Verify in Supabase Dashboard → Table Editor → users that the role was actually updated

### If you still see 403/406 errors:
1. Re-run the SQL migration
2. Check that RLS is enabled on the users table:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';
   ```
   Should return: `rowsecurity = true`

## 📝 Technical Details

### Why This Happened

1. **RLS Policies Were Too Restrictive**: The original policies didn't allow:
   - Reading user profiles (needed for display names and roles)
   - Inserting new profiles (needed for signup)
   - Updating profiles (needed for display name changes)

2. **Auth Context Didn't Refetch on Error**: When the upsert failed due to RLS, the code never fetched the display name and role from the database.

### How We Fixed It

1. **Created Comprehensive RLS Policies**: Now users can:
   - Read all profiles (for admin panel)
   - Insert their own profile (for signup)
   - Update their own display name (but not role)
   - Super admin can update any role

2. **Updated Auth Context**: Now it ALWAYS fetches display name and role from database, even if there's an error during profile creation.

---

## ✅ Checklist

- [ ] Run SQL migration in Supabase SQL Editor
- [ ] Verify 4 policies were created
- [ ] Restart development server
- [ ] Test display name persistence
- [ ] Test role changes
- [ ] Verify no console errors

---

**Need Help?** If you encounter any issues, share:
1. The error message from Supabase SQL Editor (if migration fails)
2. Browser console errors (if still seeing 403/406)
3. The output of the verification query