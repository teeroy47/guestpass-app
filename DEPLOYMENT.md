# GuestPass App - Complete Deployment Guide

## 🎯 Overview

GuestPass is a full-stack event management application with QR code generation capabilities. It consists of:
- **Frontend**: React + Vite (SPA)
- **Backend**: Express.js API server (for PDF/ZIP generation)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## 📋 Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- A Supabase account and project
- Git installed
- Access to a hosting platform (Vercel, Netlify, Railway, etc.)

## 🔧 Environment Variables

Create a `.env.local` file (for development) or configure these in your hosting platform:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration (Optional)
PORT=4000
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon/public" key

### Configuring Email Redirects

**Important**: Configure your Supabase authentication URLs to ensure email confirmation links point to your production domain:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)
5. Add your production domain to **Redirect URLs** list
6. For development, also add `http://localhost:5173` to **Redirect URLs**

The app automatically uses `window.location.origin` for email redirects, so it will work correctly in both development and production environments.

## 🗄️ Database Setup

### Supabase Schema

Your Supabase database should have the following tables:

#### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT,
  owner_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_guests INTEGER DEFAULT 0,
  checked_in_guests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Guests Table
```sql
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  unique_code TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view all events" ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own events" ON events FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own events" ON events FOR DELETE USING (auth.uid() = owner_id);

-- Guests policies
CREATE POLICY "Users can view all guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create guests" ON guests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update guests" ON guests FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete guests" ON guests FOR DELETE USING (auth.uid() IS NOT NULL);
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Frontend + Backend)

Vercel can host both the frontend and backend API.

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Create `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/index.mjs",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.mjs"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

#### Step 3: Deploy
```bash
vercel
```

#### Step 4: Configure Environment Variables
In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Redeploy

---

### Option 2: Netlify (Frontend) + Railway (Backend)

#### Frontend on Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Create `netlify.toml`**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Configure Environment Variables**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add your Supabase credentials

#### Backend on Railway

1. **Create `railway.json`**
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "node server/index.mjs",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Deploy to Railway**
   - Go to [Railway](https://railway.app)
   - Create new project
   - Connect your GitHub repo
   - Set start command: `node server/index.mjs`
   - Add environment variable: `PORT=4000`

3. **Update Frontend API URL**
   - Get your Railway backend URL
   - Update API calls in frontend to use the Railway URL

---

### Option 3: Docker Deployment

#### Create `Dockerfile` for Frontend
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Create `nginx.conf`
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
```

#### Create `Dockerfile.backend`
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server ./server
EXPOSE 4000
CMD ["node", "server/index.mjs"]
```

#### Deploy
```bash
docker-compose up -d
```

---

### Option 4: Traditional VPS (DigitalOcean, AWS EC2, etc.)

#### Step 1: Install Node.js on Server
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 2: Install PM2
```bash
sudo npm install -g pm2
```

#### Step 3: Clone and Setup
```bash
git clone <your-repo-url>
cd guestpass-app
npm install
npm run build
```

#### Step 4: Create PM2 Ecosystem File
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'guestpass-backend',
      script: 'server/index.mjs',
      env: {
        PORT: 4000
      }
    }
  ]
}
```

#### Step 5: Start Services
```bash
# Start backend
pm2 start ecosystem.config.js

# Serve frontend with nginx
sudo apt install nginx
sudo cp dist/* /var/www/html/
```

#### Step 6: Configure Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📦 Available Scripts

```bash
# Development (frontend + backend)
npm run dev

# Development (frontend only)
npm run dev:client

# Backend server only
npm run server

# Build for production
npm run build

# Preview production build
npm run preview

# Start production (frontend + backend)
npm start
```

## ✅ Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase database tables created
- [ ] Row Level Security policies enabled
- [ ] Frontend deployed and accessible
- [ ] Backend API deployed and accessible
- [ ] Test user registration and login
- [ ] Test event creation
- [ ] Test guest management
- [ ] Test QR code generation
- [ ] Test PDF/ZIP export functionality
- [ ] Test check-in functionality
- [ ] Configure custom domain (optional)
- [ ] Set up SSL certificate (if not automatic)

## 🔍 Testing Your Deployment

### 1. Test Frontend
```bash
curl https://your-domain.com
```

### 2. Test Backend API
```bash
curl https://your-domain.com/api/health
```

### 3. Test Full Flow
1. Register a new user
2. Create an event
3. Add guests to the event
4. Generate QR codes
5. Test check-in functionality
6. Export PDF/ZIP bundle

## 🐛 Troubleshooting

### Issue: "Missing Supabase URL" Error
**Solution**: Ensure environment variables are prefixed with `VITE_` and configured in your hosting platform.

### Issue: Backend API Not Responding
**Solution**: 
- Check if backend server is running
- Verify PORT configuration
- Check CORS settings in `server/index.mjs`

### Issue: Build Fails
**Solution**:
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Rebuild: `npm run build`

### Issue: Database Connection Errors
**Solution**:
- Verify Supabase credentials
- Check RLS policies
- Ensure tables exist

### Issue: Duplicate Prevention Not Working
**Solution**: The app now prevents duplicates at the application level. If you still see duplicates, clear your browser cache and refresh.

### Issue: Email Confirmation Links Point to Localhost
**Solution**: 
1. The app now automatically uses `window.location.origin` for email redirects
2. Ensure your Supabase **Site URL** is set to your production domain:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL to `https://yourdomain.com`
   - Add your production domain to Redirect URLs
3. Redeploy your application after making these changes
4. For users who received old emails with localhost links:
   - They can use "Forgot Password" to get a new email with correct links
   - Or manually resend confirmation from Supabase Dashboard → Authentication → Users

### Issue: Session Not Persisting After Page Reload
**Solution**: 
- The app now includes session persistence configuration
- Sessions are stored in localStorage with auto token refresh
- Users stay logged in across page reloads and browser restarts
- Check browser console for auth-related logs if issues persist

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** for all sensitive data
3. **Enable RLS** on all Supabase tables
4. **Use HTTPS** in production
5. **Implement rate limiting** on API endpoints
6. **Regularly update dependencies**: `npm audit fix`
7. **Set up monitoring** and error tracking (Sentry, LogRocket, etc.)

## 📊 Monitoring

### Recommended Tools
- **Frontend**: Vercel Analytics, Google Analytics
- **Backend**: PM2 monitoring, New Relic
- **Errors**: Sentry
- **Uptime**: UptimeRobot, Pingdom

## 🎉 Success!

Your GuestPass app should now be live! 

**Access your app at**: `https://your-domain.com`

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs
3. Check Supabase dashboard for database issues
4. Verify all environment variables are set correctly

---

**Last Updated**: January 2025
**Version**: 1.0.0