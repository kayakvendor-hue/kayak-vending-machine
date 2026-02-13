# Step-by-step Railway Configuration

## In Railway Dashboard:

### 1. Service Settings
- **Root Directory**: Leave empty (will auto-detect backend folder)
- **Build Command**: Automatic
- **Start Command**: Automatic (will use npm start from backend/package.json)

### 2. Environment Variables to Add:

```
NODE_ENV=production
PORT=${{PORT}}
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://your-frontend.vercel.app
TTLOCK_CLIENT_ID=your_client_id
TTLOCK_CLIENT_SECRET=your_client_secret
TTLOCK_USERNAME=your_username
TTLOCK_PASSWORD=your_password
EMAIL_SERVICE_USER=your_email@gmail.com
EMAIL_SERVICE_PASS=your_app_password
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Important Railway Settings:
- **Watch Paths**: `backend/**`
- This ensures Railway only redeploys when backend files change

---

# Vercel Configuration

## In Vercel Dashboard:

### 1. Project Settings
- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x

### 2. Environment Variables to Add:

```
REACT_APP_API_URL=https://your-backend.up.railway.app
```

### 3. Domains
- Your primary domain will be: `your-project.vercel.app`
- Make sure to update Railway's `FRONTEND_URL` with this exact URL

---

# Quick Fix Steps if Getting 404:

1. **Check Railway URL is working:**
   - Visit: `https://your-backend.up.railway.app/api`
   - Should see: `{"message":"Kayak Vending Machine API is running","status":"OK"}`

2. **Check Frontend Environment Variable:**
   - In Vercel → Settings → Environment Variables
   - Make sure `REACT_APP_API_URL` is set correctly
   - Redeploy after changing env vars

3. **Check Railway Environment Variables:**
   - Make sure `FRONTEND_URL` matches your Vercel URL
   - Make sure `PORT` is set to `${{PORT}}` (Railway's dynamic port)

4. **Force Redeploy:**
   - Railway: Settings → Redeploy
   - Vercel: Deployments → Click latest → Redeploy

5. **Check CORS:**
   - Backend should allow your Vercel domain
   - Check Railway logs for CORS errors
