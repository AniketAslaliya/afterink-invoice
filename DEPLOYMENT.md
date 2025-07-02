# 🚀 Afterink Invoice - Deployment Guide

## 📋 Local Testing (Option 1)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend  
npm install
npm run dev
```

### 🔍 Key Testing Areas:
- ✅ Invoice CRUD operations
- ✅ Payment modal functionality  
- ✅ Project to invoice integration
- ✅ Settings brand color sync
- ✅ Reports analytics
- ✅ Client management
- ✅ Modern UI animations

---

## 🌐 Production Deployment (Option 2)

### Backend - Render Deployment

1. **Create account on [Render](https://render.com)**

2. **Connect your GitHub repository**

3. **Create Web Service with these settings:**
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment:** Node.js

4. **Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/afterink
   PORT=3001
   ```

5. **Note your deployed URL:** `https://your-app-name.onrender.com`

### Frontend - Vercel Deployment

1. **Update API URL in code:**
   - Edit `frontend/src/api.ts`
   - Replace `your-backend-app.onrender.com` with your actual Render URL

2. **Create account on [Vercel](https://vercel.com)**

3. **Import your GitHub repository**

4. **Configure build settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `cd frontend && npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `cd frontend && npm install`

5. **Deploy and share URL with team**

---

## 🔧 Environment Configuration

### Backend Environment Variables
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/afterink

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-different-from-above

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS (if needed)
CLIENT_URL=https://your-frontend-app.vercel.app
```

### Frontend Environment
The frontend automatically detects production/development environment and uses appropriate API URLs.

---

## 📝 Pre-Deployment Checklist

### Backend
- [ ] MongoDB database accessible from Render
- [ ] Environment variables configured
- [ ] JWT secrets are secure (32+ characters)
- [ ] CORS configured for frontend domain
- [ ] API endpoints return proper status codes

### Frontend
- [ ] API_BASE_URL updated with production backend URL
- [ ] Build process works locally (`npm run build`)
- [ ] All routes work with Vercel's SPA configuration
- [ ] Environment variables (if any) configured

---

## 🐛 Common Issues & Solutions

### Backend Issues
1. **MongoDB Connection Error**
   - Verify MONGODB_URI format
   - Check network access in MongoDB Atlas
   - Ensure IP whitelist includes 0.0.0.0/0 for Render

2. **JWT Token Issues**
   - Verify JWT_SECRET is set and secure
   - Check token expiration settings
   - Ensure refresh token flow works

### Frontend Issues
1. **API Connection Error**
   - Verify backend URL is correct and accessible
   - Check CORS configuration on backend
   - Ensure API endpoints match frontend calls

2. **Build Errors**
   - Run `npm run build` locally first
   - Check TypeScript errors
   - Verify all imports are correct

3. **Routing Issues**
   - Ensure `vercel.json` is properly configured
   - Check that all routes redirect to index.html

---

## 🎯 Team Testing Strategy

1. **Share URLs with team:**
   - Frontend: `https://your-app.vercel.app`
   - Backend API: `https://your-backend.onrender.com/api`

2. **Test user flows:**
   - User registration and login
   - Create/edit clients and projects  
   - Invoice creation and management
   - Payment processing
   - Reports and analytics
   - Settings management

3. **Browser testing:**
   - Chrome, Firefox, Safari
   - Mobile responsiveness
   - Different screen sizes

4. **Performance testing:**
   - Page load times
   - API response times
   - Animation smoothness

---

## 🔗 Useful Commands

```bash
# Check deployment status
git status
git log --oneline -5

# Local testing
npm run dev          # Start development server
npm run build        # Test build process
npm run preview      # Preview production build

# Troubleshooting
npm run lint         # Check for code issues
npm run type-check   # Verify TypeScript
```

---

## 📧 Post-Deployment

After successful deployment:
1. Test all major features
2. Monitor error logs on both platforms
3. Share URLs with team for testing
4. Document any bugs found
5. Plan next iteration based on feedback

**Frontend URL:** `https://your-app.vercel.app`  
**Backend URL:** `https://your-backend.onrender.com`

Happy deploying! 🚀 