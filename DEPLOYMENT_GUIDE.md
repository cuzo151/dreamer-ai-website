# Dreamer AI Solutions - Deployment & Update Guide

## 🚀 Initial Deployment

### Frontend Deployment (React App)

1. **Build the React app:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to dreamerai.io:**
   - Upload the contents of `frontend/build/` folder to your web hosting
   - OR use services like Vercel, Netlify, or GitHub Pages
   - Point your domain (dreamerai.io) to the hosting service

### Backend Deployment (API)

1. **Prepare for production:**
   ```bash
   cd backend
   npm install --production
   ```

2. **Set up environment variables on your server:**
   ```bash
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   PORT=5000
   FRONTEND_URL=https://dreamerai.io
   ```

3. **Deploy to cloud service:**
   - Heroku, DigitalOcean, AWS, or your preferred hosting
   - Ensure the API is accessible at a public URL
   - Update frontend `.env` with your API URL

## 📝 Content Updates (No Code Required)

### Easy Content Updates
To update website content without coding, edit: `frontend/src/data/siteConfig.ts`

**Common Updates:**

1. **Change company information:**
   ```typescript
   company: {
     name: "Dreamer AI Solutions",
     email: "support@dreamerai.io",
     // ... update any field
   }
   ```

2. **Update founder details:**
   ```typescript
   founder: {
     name: "J. LaSalle",
     bio: "Updated biography here...",
     // ... modify any field
   }
   ```

3. **Add new capabilities:**
   ```typescript
   capabilities: [
     // ... existing capabilities
     {
       name: "New Service",
       description: "Description of new service",
       features: ["Feature 1", "Feature 2"]
     }
   ]
   ```

4. **Update stats/achievements:**
   ```typescript
   achievements: [
     { name: "Enterprise Clients", value: "200+" }, // Updated from 100+
     // ... other stats
   ]
   ```

### After Making Changes:

1. **Rebuild the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload new build to your hosting**
3. **Changes go live immediately**

## 🔧 Advanced Updates

### Adding New Demo Types
1. Edit `frontend/src/components/Interactive/DemoResult.tsx`
2. Add new case in the switch statement
3. Create the demo interface in `Interactive.tsx`

### Updating AI Chatbot Knowledge
1. Edit `backend/services/aiService.js`
2. Update the `COMPANY_CONTEXT` variable
3. Restart the backend server

### Styling Changes
1. Edit `frontend/src/index.css` for global styles
2. Modify individual component files for specific changes
3. Colors are defined in `tailwind.config.js`

## 🛠 Development Setup (For Major Changes)

### Local Development:
```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend  
npm start
```

### Making Code Changes:
1. Create a new branch: `git checkout -b feature/new-feature`
2. Make your changes
3. Test locally
4. Commit: `git commit -m "Description of changes"`
5. Push to GitHub: `git push origin feature/new-feature`
6. Deploy updated build

## 📱 Mobile & Responsive
- Site is fully responsive
- Test on mobile devices after updates
- Images automatically optimize

## 🔒 Security Notes
- Never commit API keys to Git
- Use environment variables for sensitive data
- Regularly update dependencies: `npm audit fix`

## 📞 Support
- For technical issues: jlasalle@dreamerai.io
- For content updates: Follow this guide
- For major changes: Consider hiring a developer

## 🚦 Quick Update Checklist
- [ ] Edit `siteConfig.ts` with new content
- [ ] Run `npm run build` in frontend
- [ ] Upload build folder to hosting
- [ ] Test the live site
- [ ] Commit changes to Git for backup

This guide ensures you can keep your website updated and current without technical expertise!