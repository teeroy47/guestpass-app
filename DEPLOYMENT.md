# Guestpass App - Deployment Guide

## Project Reset Complete ✅

The project has been successfully reset to the initial git commit and is now ready for deployment using Vite.

## What Was Done

1. **Reset to Initial Commit**: Hard reset to commit `0e9a18c` (initial commit)
2. **Cleaned Up Next.js Artifacts**: Removed all Next.js specific files and configurations
3. **Fixed React Components**: 
   - Removed "use client" directives from context files
   - Updated HomePage component to be Vite-compatible
4. **Built Successfully**: Project builds without errors using Vite

## Build Output

- **Location**: `dist/` folder
- **Main Files**:
  - `index.html` - Entry point
  - `assets/index-B3DvPG3A.js` - Main JavaScript bundle (1.45 MB)
  - `assets/index-cReu292f.css` - Styles (115.67 KB)
  - Public assets (logos, placeholders)

## Available Scripts

```bash
# Development server (Vite only)
npm run dev

# Development with backend server
npm run dev:all

# Build for production
npm run build

# Preview production build locally
npm run preview

# Start backend server only
npm run server
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
PORT=3000
```

## Deployment Options

### Option 1: Vercel (Recommended for Vite)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Configure environment variables in Vercel dashboard

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Build command: `npm run build`
4. Publish directory: `dist`

### Option 3: Static Hosting (GitHub Pages, Cloudflare Pages, etc.)

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist/` folder contents to your hosting provider

3. Configure environment variables in your hosting provider's dashboard

### Option 4: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t guestpass-app .
docker run -p 80:80 guestpass-app
```

## Important Notes

1. **Environment Variables**: Make sure to set up your Supabase credentials before deploying
2. **Backend Server**: The Express server (`server/index.mjs`) needs to be deployed separately if you're using it
3. **Database**: Ensure your Supabase database is set up with the correct schema (see `prisma/schema.prisma`)
4. **CORS**: Configure CORS settings in your backend if deploying frontend and backend separately

## Testing Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`

3. Run development server:
   ```bash
   npm run dev
   ```

4. Or run with backend:
   ```bash
   npm run dev:all
   ```

5. Access at: `http://localhost:5173`

## Production Build Test

To test the production build locally:

```bash
npm run build
npm run preview
```

Access at: `http://localhost:4173`

## Troubleshooting

### Build Warnings

The build shows a warning about large chunks (>500 KB). This is expected due to the many dependencies. To optimize:

1. Consider code splitting with dynamic imports
2. Use lazy loading for routes
3. Analyze bundle with `npm run build -- --analyze`

### Environment Variables Not Working

Make sure all environment variables start with `VITE_` prefix for Vite to expose them to the client.

## Next Steps

1. ✅ Project reset to initial commit
2. ✅ Vite build working
3. ⏭️ Choose deployment platform
4. ⏭️ Configure environment variables
5. ⏭️ Deploy!

---

**Current Status**: Ready for deployment! 🚀