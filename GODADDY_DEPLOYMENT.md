# GoDaddy Deployment Guide for Dreamer AI Website

## 📌 Quick Reference for Later
You mentioned you'll get back to this - here's everything you need when you're ready.

## 🎯 GoDaddy Hosting Options

### Option 1: GoDaddy Web Hosting (If you have hosting plan)
1. **Build the React app**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload via cPanel File Manager**:
   - Log into GoDaddy → My Products → Web Hosting → Manage
   - Open cPanel → File Manager
   - Navigate to `public_html`
   - Upload contents of `frontend/build/` folder
   - Make sure to upload the CNAME file

3. **Configure domain** (if using subdomain):
   - In cPanel → Domains → Subdomains
   - Create subdomain if needed

### Option 2: Use GoDaddy Domain with External Hosting (Recommended)

Since this is a React app, you might want to use GoDaddy domain with free hosting like Netlify or Vercel:

#### A. Deploy to Netlify (FREE + Fast)
1. **Deploy the site**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Build and deploy
   cd frontend
   npm run build
   netlify deploy --prod --dir=build
   ```

2. **In GoDaddy DNS Settings**:
   - Log into GoDaddy → My Products → Domains → DNS
   - Update these records:
   
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   TTL: 600 seconds
   
   Type: CNAME  
   Name: www
   Value: [your-site-name].netlify.app
   TTL: 600 seconds
   ```

#### B. Deploy to Vercel (FREE + Fastest)
1. **Deploy the site**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   cd frontend
   vercel --prod
   ```

2. **In GoDaddy DNS Settings**:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 600 seconds
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 600 seconds
   ```

## 🔧 GoDaddy DNS Configuration Steps

1. **Log into GoDaddy Account**
2. **Go to**: My Products → Domains → Select your domain → Manage DNS
3. **Delete existing records** for @ and www (if any)
4. **Add new records** based on your hosting choice above
5. **Save changes**
6. **Wait 5-30 minutes** for propagation

## 📁 Current File Structure
```
Your CNAME file is at: frontend/public/CNAME
Current domain in CNAME: dreamer-ai.com
```

To update domain:
```bash
echo "your-actual-domain.com" > frontend/public/CNAME
```

## ⚡ Quick Deployment Commands

### For Netlify:
```bash
cd frontend
npm run build
npx netlify-cli deploy --prod --dir=build
```

### For Vercel:
```bash
cd frontend
npm run build
npx vercel --prod
```

### For GitHub Pages:
```bash
# Add to package.json first:
# "homepage": "https://your-domain.com"

npm run build
npm install --save-dev gh-pages
npm run deploy
```

## 📝 Environment Variables for Production

Create `.env.production` in frontend folder:
```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_ENV=production
```

## 🚀 When You're Ready - Quick Checklist

- [ ] Update CNAME file with your actual domain
- [ ] Build the production bundle: `npm run build`
- [ ] Choose hosting option (Netlify/Vercel recommended)
- [ ] Deploy the frontend
- [ ] Update GoDaddy DNS settings
- [ ] Wait for propagation (5-30 mins)
- [ ] Test the live site
- [ ] Enable SSL if needed

## 💡 Pro Tips for GoDaddy Users

1. **Use GoDaddy domain with external hosting** - it's faster and free
2. **Keep TTL at 600** during setup, increase to 3600 after everything works
3. **Screenshot your DNS settings** before making changes
4. **Use GoDaddy's DNS template** feature if deploying multiple sites

## 🔍 Testing Your Deployment

Once DNS is updated:
```bash
# Check DNS propagation
nslookup your-domain.com

# Test the site
curl -I https://your-domain.com

# Check SSL
openssl s_client -connect your-domain.com:443
```

## 📞 GoDaddy Support

- **GoDaddy Support**: 1-480-505-8877
- **Live Chat**: Available 24/7 in your GoDaddy account
- **DNS Changes**: Can take up to 48 hours (usually 5-30 minutes)

## 💾 Save This for Later

When you're ready to deploy, you'll need:
1. This guide
2. Your GoDaddy login
3. About 30 minutes
4. The built React app (run `npm run build`)

---

**Note**: This guide is saved for when you're ready to proceed with GoDaddy deployment. The site is currently running locally and fully functional!