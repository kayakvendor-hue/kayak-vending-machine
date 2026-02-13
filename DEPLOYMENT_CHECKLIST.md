# Quick Deployment Checklist

Use this checklist as you deploy your Kayak Vending Machine website.

## ✅ Prerequisites (Completed)
- [x] Code pushed to GitHub
- [x] Node.js v24 compatibility updated
- [x] Deployment configuration files added

---

## 🚀 Backend Deployment (Railway)

### Account Setup
- [ ] Create Railway account at https://railway.app
- [ ] Connect GitHub account to Railway
- [ ] Import `kayakvendor-hue/kayak-vending-machine` repository

### MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- [ ] Create a free cluster
- [ ] Create database user with password
- [ ] Set Network Access to "Allow from anywhere" (0.0.0.0/0)
- [ ] Get connection string and save it

### Third-Party Service Setup
- [ ] **Stripe**: Get API keys from https://stripe.com
  - [ ] Save Secret Key
  - [ ] Save Publishable Key

- [ ] **Gmail**: Set up App Password
  - [ ] Enable 2FA on Google Account
  - [ ] Generate App Password (16 characters)

- [ ] **Cloudinary**: Get credentials from https://cloudinary.com
  - [ ] Save Cloud Name
  - [ ] Save API Key
  - [ ] Save API Secret

- [ ] **TTLock**: Contact for API access
  - [ ] Save Client ID
  - [ ] Save Client Secret
  - [ ] Save Username
  - [ ] Save Password

- [ ] **Twilio** (Optional): Get credentials from https://www.twilio.com
  - [ ] Save Account SID
  - [ ] Save Auth Token
  - [ ] Save Phone Number

### Railway Environment Variables
Add the following in Railway → Project → Variables:

```
- [ ] PORT=5000
- [ ] NODE_ENV=production
- [ ] DATABASE_URL=<your_mongodb_connection_string>
- [ ] JWT_SECRET=<generate_random_string>
- [ ] TTLOCK_CLIENT_ID=<your_value>
- [ ] TTLOCK_CLIENT_SECRET=<your_value>
- [ ] TTLOCK_USERNAME=<your_value>
- [ ] TTLOCK_PASSWORD=<your_value>
- [ ] EMAIL_SERVICE_USER=<your_email>
- [ ] EMAIL_SERVICE_PASS=<your_app_password>
- [ ] STRIPE_SECRET_KEY=<your_key>
- [ ] STRIPE_PUBLISHABLE_KEY=<your_key>
- [ ] CLOUDINARY_CLOUD_NAME=<your_value>
- [ ] CLOUDINARY_API_KEY=<your_key>
- [ ] CLOUDINARY_API_SECRET=<your_secret>
- [ ] TWILIO_ACCOUNT_SID=<your_sid> (optional)
- [ ] TWILIO_AUTH_TOKEN=<your_token> (optional)
- [ ] TWILIO_PHONE_NUMBER=<your_phone> (optional)
- [ ] FRONTEND_URL=https://temp.com (update later)
```

### Deploy Backend
- [ ] Click "Deploy" in Railway
- [ ] Wait for build to complete
- [ ] Get Railway URL (e.g., `https://your-app.railway.app`)
- [ ] Test: Visit `https://your-app.railway.app/api`
- [ ] Should see: `{"message":"Kayak Vending Machine API is running","status":"OK"}`

---

## 🎨 Frontend Deployment (Vercel)

### Account Setup
- [ ] Create Vercel account at https://vercel.com
- [ ] Connect GitHub account to Vercel
- [ ] Import `kayakvendor-hue/kayak-vending-machine` repository

### Project Configuration
- [ ] Framework Preset: Create React App
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build`
- [ ] Install Command: `npm install`

### Vercel Environment Variables
Add in Vercel → Project → Settings → Environment Variables:

```
- [ ] REACT_APP_API_URL=<your_railway_url>
```
(Replace with your Railway URL from backend deployment)

### Deploy Frontend
- [ ] Click "Deploy" in Vercel
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Get Vercel URL (e.g., `https://your-app.vercel.app`)

---

## 🔗 Final Configuration

### Update Backend FRONTEND_URL
- [ ] Go back to Railway dashboard
- [ ] Update `FRONTEND_URL` variable with your Vercel URL
- [ ] Railway will automatically redeploy

---

## 🧪 Testing

### Backend Tests
- [ ] Visit `https://your-railway-url.railway.app/api`
- [ ] Verify API responds correctly

### Frontend Tests  
- [ ] Visit your Vercel URL
- [ ] Test signup/login
- [ ] Sign a waiver
- [ ] Try renting a kayak
- [ ] Check payment processing
- [ ] Verify email notifications

### Full Integration Test
- [ ] Create new account on live site
- [ ] Complete waiver form
- [ ] Select kayak and complete rental
- [ ] Verify payment processed
- [ ] Check email for confirmation
- [ ] Verify passcode generation works

---

## 📝 Important URLs to Save

```
GitHub Repository: https://github.com/kayakvendor-hue/kayak-vending-machine
Railway Backend URL: _______________________
Vercel Frontend URL: _______________________
MongoDB Atlas: https://cloud.mongodb.com
Railway Dashboard: https://railway.app/dashboard
Vercel Dashboard: https://vercel.com/dashboard
```

---

## 🆘 Troubleshooting

### Backend not deploying?
- Check Railway logs for errors
- Verify all environment variables are set
- Check MongoDB connection string format

### Frontend not connecting to backend?
- Verify `REACT_APP_API_URL` is correct in Vercel
- Check CORS settings in backend
- Verify `FRONTEND_URL` is set in Railway

### Database connection failed?
- Check MongoDB Atlas Network Access allows all IPs
- Verify connection string has correct password
- Ensure database user has correct permissions

---

## ✅ Deployment Complete!

Once all checkboxes are marked:
- Your website is live! 🎉
- Changes to `main` branch will auto-deploy
- Monitor Railway and Vercel dashboards for issues

**Need help?** See DEPLOYMENT_GUIDE.md for detailed steps.
