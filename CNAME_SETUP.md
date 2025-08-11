# CNAME Setup Guide for Dreamer AI Website

## 📋 Overview
This guide explains how to configure your custom domain for the Dreamer AI website.

## 🌐 CNAME File Location
- **Frontend**: `/frontend/public/CNAME` 
- **Current Domain**: `dreamer-ai.com`

## 🚀 Deployment Options

### Option 1: GitHub Pages
1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. The CNAME file in `/public` will automatically configure your custom domain
4. Add these DNS records to your domain provider:
   ```
   Type: CNAME
   Name: www
   Value: [your-github-username].github.io
   
   Type: A
   Name: @
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153
   ```

### Option 2: Netlify
1. Deploy to Netlify
2. Add custom domain in Netlify settings
3. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: [your-site-name].netlify.app
   
   Type: A
   Name: @
   Value: 75.2.60.5
   ```

### Option 3: Vercel
1. Deploy to Vercel
2. Add domain in Vercel project settings
3. Vercel will provide DNS records to add:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

### Option 4: Google Cloud Platform (Firebase Hosting)
1. Deploy using Firebase:
   ```bash
   npm install -g firebase-tools
   firebase init hosting
   firebase deploy
   ```
2. Add custom domain in Firebase Console
3. Add provided DNS records

### Option 5: AWS (S3 + CloudFront)
1. Build the app: `npm run build`
2. Upload to S3 bucket
3. Configure CloudFront distribution
4. Add CNAME in CloudFront settings
5. Update DNS to point to CloudFront

## 📝 To Change Domain

Edit the CNAME file:
```bash
echo "your-domain.com" > frontend/public/CNAME
```

Or manually edit: `/frontend/public/CNAME`

## 🔧 DNS Configuration at Domain Registrar

### For GoDaddy:
1. Log into GoDaddy account
2. Go to DNS Management
3. Add/Edit records as specified above
4. TTL: 600 seconds (for faster propagation during setup)

### For Namecheap:
1. Log into Namecheap account
2. Go to Advanced DNS
3. Add Host Records as specified
4. Save changes

### For Cloudflare:
1. Log into Cloudflare
2. Select your domain
3. Go to DNS settings
4. Add records (set Proxy status to DNS only initially)
5. Once working, enable Cloudflare proxy for protection

## ⚡ Build for Production

```bash
# Navigate to frontend
cd frontend

# Build optimized production bundle
npm run build

# The build folder will contain static files ready for deployment
```

## 🔍 Verify Setup

After DNS propagation (5-30 minutes):
1. Visit http://your-domain.com
2. Check SSL certificate (if using HTTPS)
3. Verify www and non-www versions work
4. Test all routes and functionality

## 🛡️ SSL/HTTPS Setup

Most platforms provide free SSL:
- **GitHub Pages**: Automatic with custom domain
- **Netlify**: Automatic with Let's Encrypt
- **Vercel**: Automatic
- **Firebase**: Automatic
- **CloudFlare**: Enable "Full SSL" mode

## 📊 Monitoring

After deployment, monitor:
- Domain resolution: `nslookup your-domain.com`
- SSL status: https://www.ssllabs.com/ssltest/
- Performance: Google PageSpeed Insights
- Uptime: UptimeRobot or similar

## 🆘 Troubleshooting

### Domain not resolving:
- Wait for DNS propagation (up to 48 hours)
- Check DNS records are correct
- Clear browser cache
- Try `nslookup` or `dig` commands

### SSL errors:
- Ensure CNAME/A records are correct
- Wait for SSL certificate provisioning
- Check if forcing HTTPS in settings

### 404 errors on routes:
- For SPAs, ensure proper redirect rules
- Add `_redirects` file for Netlify
- Configure routing for your hosting platform

## 📞 Support Contacts

- **Domain Issues**: Contact your domain registrar
- **Hosting Issues**: Check platform-specific documentation
- **Application Issues**: Check error logs in browser console

---

**Note**: Remember to update the CNAME file with your actual domain before deploying!