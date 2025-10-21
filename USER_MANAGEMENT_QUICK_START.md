# User Management - Quick Start Guide

## 🎯 What's New?

You (`chiunyet@africau.edu`) can now promote other users to admin role directly from the webapp!

## 🚀 How to Use

### Step 1: Access User Management
1. Log in to the dashboard
2. Click the **"Users"** tab (only visible to you)

### Step 2: Manage User Roles
- **Promote to Admin:** Click "Promote to Admin" button → Confirm
- **Demote to Usher:** Click "Demote to Usher" button → Confirm

### Step 3: Changes Take Effect Immediately
- User sees new permissions on next page refresh
- No logout required!

## 📊 Role Permissions

| Feature | Admin | Usher |
|---------|-------|-------|
| Create/Edit Events | ✅ | ❌ |
| Upload Guest Lists | ✅ | ❌ |
| View Analytics | ✅ | ❌ |
| Manage Users | ❌* | ❌ |
| Scan QR Codes | ✅ | ✅ |
| Check In Guests | ✅ | ✅ |

*Only super admin (you) can manage users

## 🔒 Security

- ✅ Only you can access user management
- ✅ Your role cannot be changed (protected)
- ✅ All changes are validated and logged
- ✅ Changes take effect immediately in backend

## 📝 Example Use Cases

### Scenario 1: Promote Event Organizer
```
1. Event organizer needs to create events
2. Go to Users tab
3. Find their email
4. Click "Promote to Admin"
5. They can now create events!
```

### Scenario 2: Demote Temporary Admin
```
1. Temporary admin no longer needs full access
2. Go to Users tab
3. Find their email
4. Click "Demote to Usher"
5. They now have limited access
```

## 🎨 What You'll See

### Users Tab
```
┌─────────────────────────────────────────────────────────┐
│ User Management                                          │
├─────────────────────────────────────────────────────────┤
│ Email              | Name    | Role   | Actions          │
├─────────────────────────────────────────────────────────┤
│ you@africau.edu    | You     | Admin  | Super Admin      │
│ john@example.com   | John    | Usher  | [Promote]        │
│ jane@example.com   | Jane    | Admin  | [Demote]         │
└─────────────────────────────────────────────────────────┘
```

## ⚡ Quick Tips

1. **Promote carefully** - Admins have full access
2. **Check regularly** - Review user roles periodically
3. **Communicate** - Let users know when you change their role
4. **Test first** - Try promoting/demoting a test user

## 🆘 Need Help?

**Issue:** Can't see Users tab  
**Fix:** Make sure you're logged in as `chiunyet@africau.edu`

**Issue:** Role change not working  
**Fix:** Check browser console, refresh page, or contact support

**Issue:** User still has old permissions  
**Fix:** Ask them to refresh their browser

## 📚 Full Documentation

For detailed technical information, see `USER_MANAGEMENT_FEATURE.md`

---

**That's it!** You're now ready to manage user roles. 🎉