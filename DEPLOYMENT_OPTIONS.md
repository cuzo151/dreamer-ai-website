# Deployment Options for Dreamer AI

## Frontend Deployment (Choose One)

### 1. Netlify (Recommended)
- Visit: https://app.netlify.com
- Drag 'frontend/build' folder to deploy
- Free SSL and custom domain support

### 2. Vercel
```bash
cd frontend
npx vercel --prod
```

### 3. GitHub Pages
```bash
npm install -g gh-pages
npm run deploy
```

## Backend Deployment Options

### 1. Railway.app
- Connect GitHub repo
- Auto-deploys on push
- /month

### 2. Render.com
- Free tier available
- Connect GitHub repo
- Automatic SSL

### 3. Heroku
- Free tier (limited hours)
- Easy deployment

## Custom Domain Setup

After deploying, add these DNS records at GoDaddy:
- A Record: @ → [Platform's IP]
- CNAME: www → [Platform's domain]

Each platform will provide specific DNS instructions.
