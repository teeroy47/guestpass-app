# 🚀 Deploy Your GuestPass App to Vercel - Step by Step

## ✅ Pre-Deployment Checklist (Already Done!)

- ✅ Build configuration fixed (`vite build`)
- ✅ `vercel.json` created
- ✅ Local build tested successfully
- ✅ Duplicate prevention implemented
- ✅ Delete buttons working
- ✅ Supabase credentials in `.env.local`

---

## 📋 Step-by-Step Deployment Instructions

### Step 1: Install Vercel CLI (In Progress)

The Vercel CLI is currently being installed. Wait for it to complete.

### Step 2: Login to Vercel

Open your terminal and run:
```powershell
vercel login
```

This will:
- Open your browser
- Ask you to sign in with GitHub, GitLab, Bitbucket, or Email
- **Recommended**: Use GitHub for easier future deployments

### Step 3: Deploy to Vercel

Run this command in your project directory:
```powershell
vercel
```

You'll be asked several questions:

#### Question 1: "Set up and deploy?"
**Answer**: `Y` (Yes)

#### Question 2: "Which scope do you want to deploy to?"
**Answer**: Select your personal account or team

#### Question 3: "Link to existing project?"
**Answer**: `N` (No - this is a new project)

#### Question 4: "What's your project's name?"
**Answer**: `guestpass-app` (or any name you prefer)

#### Question 5: "In which directory is your code located?"
**Answer**: `./` (press Enter - current directory)

#### Question 6: "Want to override the settings?"
**Answer**: `N` (No - we already have vercel.json configured)

**IMPORTANT - Framework Detection:**
When Vercel asks about the framework:
- ✅ **Select: "Vite"** or "Other"
- ❌ **DO NOT select: "Next.js"**

Your app uses **Vite**, not Next.js!

### Step 4: Configure Environment Variables

After the first deployment, you need to add your Supabase credentials:

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on your project (`guestpass-app`)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
VITE_SUPABASE_URL = https://yiujxmrwwsgfhqcllafe.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdWp4bXJ3d3NnZmhxY2xsYWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTU0NDEsImV4cCI6MjA3NDk3MTQ0MX0.1Dx8HF7wSzhvREKudHJ7yNbfbKoCxvnUP-Swdg6j4RA
```

**Important**: 
- Select **"Production"**, **"Preview"**, and **"Development"** for both variables
- Click **"Save"**

### Step 5: Redeploy with Environment Variables

After adding environment variables, redeploy:
```powershell
vercel --prod
```

This will deploy to production with your environment variables.

---

## 🎯 What Happens During Deployment

1. **Vercel reads `vercel.json`** - Knows how to build your app
2. **Runs `npm install`** - Installs dependencies
3. **Runs `vite build`** - Builds your React app
4. **Deploys frontend** - Static files to Vercel CDN
5. **Deploys backend** - Express server as serverless function
6. **Gives you a URL** - Your app is live!

---

## 🔍 Vercel Settings Explained

### When Setting Up Deployment:

**Framework Preset**: 
- ✅ Choose: **"Vite"** or **"Other"**
- Your app uses Vite for building

**Build Command**: 
- Should be: `vite build` (already in package.json)
- Vercel will use this automatically

**Output Directory**: 
- Should be: `dist`
- This is where Vite puts built files

**Install Command**: 
- Should be: `npm install`
- Vercel does this automatically

**Development Command**: 
- Should be: `vite` or `npm run dev`
- Only used for Vercel dev environment

---

## ✅ After Deployment Checklist

Once deployed, test these features:

### 1. Test Authentication
- [ ] Go to your Vercel URL
- [ ] Register a new account
- [ ] Login successfully

### 2. Test Events
- [ ] Create a new event
- [ ] Try creating a duplicate event (should be blocked!)
- [ ] View event details

### 3. Test Guests
- [ ] Add a guest to an event
- [ ] Try adding the same guest again (should be blocked!)
- [ ] See the **trash icon** delete button
- [ ] Delete a single guest
- [ ] Add multiple guests
- [ ] **Check boxes** next to guests
- [ ] Click **"Delete Selected (X)"** button
- [ ] Bulk delete works

### 4. Test QR Codes
- [ ] Generate QR codes for guests
- [ ] Download PDF
- [ ] Download ZIP bundle

### 5. Test Check-in
- [ ] Scan a QR code
- [ ] Check in a guest
- [ ] Verify check-in status updates

---

## 🐛 Common Issues & Solutions

### Issue: "Build Failed"
**Solution**: 
- Check the build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Verify environment variables are set

### Issue: "Supabase Connection Error"
**Solution**: 
- Verify environment variables are set correctly
- Make sure they're prefixed with `VITE_`
- Redeploy after adding variables

### Issue: "Backend API Not Working"
**Solution**: 
- Check that `server/index.mjs` exists
- Verify `vercel.json` routes are correct
- Check Vercel function logs

### Issue: "Page Not Found (404)"
**Solution**: 
- Vercel should handle SPA routing automatically
- Check that `vercel.json` has the catch-all route
- Clear browser cache and try again

---

## 📱 Your Deployment URLs

After deployment, you'll get:

**Production URL**: `https://guestpass-app.vercel.app`
- This is your main live site
- Share this with users

**Preview URLs**: `https://guestpass-app-[hash].vercel.app`
- Created for each git push
- Great for testing before production

**Custom Domain** (Optional):
- You can add your own domain in Vercel settings
- Example: `guestpass.yourdomain.com`

---

## 🔄 Future Deployments

### Option 1: Connect to GitHub (Recommended)

1. Push your code to GitHub
2. In Vercel Dashboard, connect your GitHub repo
3. **Every push to main = automatic deployment!**

### Option 2: Manual Deployment

Run this command whenever you want to deploy:
```powershell
vercel --prod
```

---

## 🎉 Success Indicators

You'll know deployment succeeded when:

✅ Vercel CLI shows: "✅ Production: https://your-app.vercel.app"
✅ You can access the URL in your browser
✅ Login page loads correctly
✅ You can register and login
✅ Events and guests work
✅ Delete buttons are visible
✅ Bulk delete works
✅ Duplicate prevention works

---

## 📞 Need Help?

If something goes wrong:

1. **Check Vercel Logs**: Dashboard → Your Project → Deployments → Click deployment → View logs
2. **Check Browser Console**: F12 → Console tab
3. **Check Network Tab**: F12 → Network tab (look for failed requests)
4. **Verify Environment Variables**: Settings → Environment Variables

---

## 🚀 Ready to Deploy?

Run these commands in order:

```powershell
# 1. Login to Vercel
vercel login

# 2. Deploy (first time)
vercel

# 3. After adding environment variables in dashboard
vercel --prod
```

**That's it!** Your app will be live in minutes! 🎉

---

**Current Status**: ✅ Ready to deploy
**Build Status**: ✅ Tested and working
**Configuration**: ✅ Complete