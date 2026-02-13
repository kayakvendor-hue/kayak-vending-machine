# Deployment Guide - Kayak Vending Machine

This guide will walk you through deploying your Kayak Vending Machine website online.

## Overview

- **Backend**: Railway (Node.js + MongoDB)
- **Frontend**: Vercel (React)
- **Database**: MongoDB Atlas
- **Repository**: GitHub

---

## Step 1: Push Code to GitHub ✅ COMPLETED

Your latest code with Node.js v24 compatibility has been pushed to:
https://github.com/kayakvendor-hue/kayak-vending-machine

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with your GitHub account
3. Click "Authorize Railway" to connect your GitHub

### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `kayakvendor-hue/kayak-vending-machine`
4. Railway will automatically detect your backend

### 2.3 Configure Build Settings
Railway should auto-detect the backend, but if needed:
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 2.4 Add Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```
PORT=5000
NODE_ENV=production
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
TTLOCK_CLIENT_ID=your_client_id
TTLOCK_CLIENT_SECRET=your_client_secret
TTLOCK_USERNAME=your_username
TTLOCK_PASSWORD=your_password
EMAIL_SERVICE_USER=your_email@gmail.com
EMAIL_SERVICE_PASS=your_email_app_password
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TWILIO_ACCOUNT_SID=your_account_sid (optional)
TWILIO_AUTH_TOKEN=your_auth_token (optional)
TWILIO_PHONE_NUMBER=your_twilio_phone (optional)
FRONTEND_URL=https://your-frontend.vercel.app
```

**Important Notes:**
- For `DATABASE_URL`: Use your MongoDB Atlas connection string
- For `JWT_SECRET`: Generate a random string (e.g., use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- For `EMAIL_SERVICE_PASS`: Use an App Password from Gmail (not your regular password)
- Save `FRONTEND_URL` as temporary value, we'll update it after deploying frontend

### 2.5 Deploy
1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Once deployed, Railway will provide a URL like: `https://your-app.railway.app`
4. **SAVE THIS URL** - you'll need it for the frontend

### 2.6 Verify Backend
1. Visit `https://your-app.railway.app/api`
2. You should see: `{"message":"Kayak Vending Machine API is running","status":"OK"}`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with your GitHub account
3. Click "Authorize Vercel"

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Import `kayakvendor-hue/kayak-vending-machine`
3. Vercel will detect it's a React app

### 3.3 Configure Project Settings
- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 3.4 Add Environment Variables
In Vercel project settings → Environment Variables, add:

```
REACT_APP_API_URL=https://your-backend-railway-url.railway.app
```

Replace `your-backend-railway-url.railway.app` with the URL from Step 2.5

### 3.5 Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Vercel will provide a URL like: `https://your-app.vercel.app`

### 3.6 Update Backend FRONTEND_URL
1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL
3. Railway will automatically redeploy

---

## Step 4: Setup MongoDB Atlas (If Not Already Done)

### 4.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (choose free tier)

### 4.2 Create Database User
1. Go to "Database Access"
2. Add new database user
3. Choose password authentication
4. Save username and password

### 4.3 Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0)
4. This allows Railway to connect

### 4.4 Get Connection String
1. Go to "Clusters" → Click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `kayakvendor` (or your preferred database name)
6. Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/kayakvendor?retryWrites=true&w=majority`

### 4.5 Update Railway Environment Variable
1. Paste the connection string as `DATABASE_URL` in Railway
2. Railway will redeploy automatically

---

## Step 5: Configure Additional Services

### 5.1 Stripe Setup (Payment Processing)
1. Go to https://stripe.com
2. Create account (or log in)
3. Get API keys from Dashboard → Developers → API keys
4. Add `STRIPE_SECRET_KEY` to Railway (backend)
5. Add `STRIPE_PUBLISHABLE_KEY` to Railway (backend)

### 5.2 Gmail App Password (Email Notifications)
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password: Security → 2-Step Verification → App passwords
4. Select "Mail" and "Other (Custom name)"
5. Copy the 16-character password
6. Add as `EMAIL_SERVICE_PASS` in Railway

### 5.3 Cloudinary Setup (Image Uploads)
1. Go to https://cloudinary.com
2. Create free account
3. Get credentials from Dashboard
4. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to Railway

### 5.4 TTLock Setup (Kayak Lock Access)
1. Contact TTLock for API access
2. Get client ID, client secret, username, and password
3. Add credentials to Railway environment variables

### 5.5 Twilio Setup (Optional - SMS Notifications)
1. Go to https://www.twilio.com
2. Create account ($15 free credit)
3. Get Account SID, Auth Token, and Phone Number
4. Add to Railway environment variables

---

## Step 6: Test Your Deployment

### 6.1 Frontend Tests
1. Visit your Vercel URL
2. Test signup/login
3. Check if pages load correctly

### 6.2 Backend Tests
1. Visit `https://your-railway-url.railway.app/api`
2. Check if API responds

### 6.3 Full Flow Test
1. Create a new user account
2. Sign the waiver
3. Try to rent a kayak
4. Check if payment processing works
5. Verify email notifications are sent

---

## Step 7: Enable Automatic Deployments

### GitHub Integration (Already Configured ✅)
Both Railway and Vercel are now connected to your GitHub repo.

**Automatic Deployments:**
- Push to `main` branch → Automatic deployment to production
- Create a branch → Push changes → Test locally → Merge to main → Auto-deploy

---

## Troubleshooting

### Backend Issues
- **503 Error**: Check Railway logs for errors
- **Database Connection Failed**: Verify MongoDB connection string
- **CORS Errors**: Ensure `FRONTEND_URL` is set correctly

### Frontend Issues
- **Can't connect to API**: Verify `REACT_APP_API_URL` in Vercel
- **Build Failed**: Check Node.js version (should use 18+)
- **White screen**: Check browser console for errors

### View Logs
- **Railway**: Project → Deployments → View Logs
- **Vercel**: Project → Deployments → Click deployment → View Function Logs

---

## Quick Reference URLs

- **GitHub Repo**: https://github.com/kayakvendor-hue/kayak-vending-machine
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com

---

**Last Updated**: February 13, 2026
**Node.js Version**: v24.13.1 (compatible)
**React Version**: 18.2.0
