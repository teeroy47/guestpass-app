# ⚡ Quick Deploy Reference

## 🎯 Framework Choice: **VITE** (Not Next.js!)

When Vercel asks about framework:
- ✅ **SELECT: "Vite"**
- ❌ **DON'T SELECT: "Next.js"**

---

## 🚀 Three Commands to Deploy

```powershell
# 1. Login
vercel login

# 2. First deployment
vercel

# 3. Production deployment (after adding env vars)
vercel --prod
```

---

## 🔑 Environment Variables to Add in Vercel Dashboard

After first deployment, add these in **Settings → Environment Variables**:

```
VITE_SUPABASE_URL
https://yiujxmrwwsgfhqcllafe.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdWp4bXJ3d3NnZmhxY2xsYWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTU0NDEsImV4cCI6MjA3NDk3MTQ0MX0.1Dx8HF7wSzhvREKudHJ7yNbfbKoCxvnUP-Swdg6j4RA
```

✅ Check: Production, Preview, Development

---

## 📋 Vercel Questions & Answers

| Question | Answer |
|----------|--------|
| Set up and deploy? | **Y** |
| Link to existing project? | **N** |
| Project name? | **guestpass-app** |
| Directory? | **./** (press Enter) |
| Override settings? | **N** |
| Framework? | **Vite** ⚠️ |

---

## ✅ Test After Deployment

1. ✅ Login works
2. ✅ Create event
3. ✅ Add guest
4. ✅ See delete buttons (trash icons)
5. ✅ Bulk delete with checkboxes
6. ✅ Duplicate prevention works

---

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Your Supabase: https://yiujxmrwwsgfhqcllafe.supabase.co

---

**Status**: ✅ Ready to deploy!