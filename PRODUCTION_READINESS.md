# Production Readiness Checklist

## Priority 1: CRITICAL SECURITY (Must do before any deployment)

- [ ] **Remove `.env` file from git history**
  - Add `.env` to `.gitignore` if not already there
  - Use `git filter-branch` or `git filter-repo` to remove from history
  - Rotate all exposed credentials (Stripe, TTLock, email service, database, JWT secret)
  - Update `.env.example` with placeholder values instead

- [ ] **Set up environment variables on deployment platform**
  - Railway: Set environment variables in project settings
  - Vercel: Set environment variables in project settings for frontend
  - Never commit real `.env` files to git

- [ ] **Enable HTTPS for production**
  - Both frontend and backend must use HTTPS
  - Set secure cookie flags in JWT configuration
  - Update FRONTEND_URL to production HTTPS domain

- [ ] **Review error messages for information leaks**
  - Audit all `err.message` responses sent to frontend
  - Remove stack traces from production responses
  - Don't expose database errors or internal system details

---

## Priority 2: AUTHENTICATION & PROTECTION (High security impact)

- [ ] **Implement rate limiting**
  - Add `express-rate-limit` to signup endpoint (e.g., 5 attempts per 15 minutes per IP)
  - Rate limit login endpoint (e.g., 10 attempts per 15 minutes per IP)
  - Rate limit password reset endpoint
  - Rate limit forgot password endpoint

- [ ] **Add email verification on signup**
  - User receives email with verification link/token after signup
  - Account is disabled until email is verified
  - Token expires after 24 hours
  - Resend verification email option

- [ ] **Implement password reset security**
  - Password reset tokens should expire (already have this, verify 1 hour limit)
  - One-time use tokens (invalidate after use)
  - Verify token before allowing password change
  - Send email when password is changed (not just sent link)

- [ ] **Add CORS configuration**
  - Backend: Configure CORS to only accept requests from production frontend domain
  - Remove any wildcard CORS configs
  - Set proper credentials flags

- [ ] **JWT Security**
  - Verify JWT_SECRET is strong (looks good - 64+ chars)
  - Set appropriate token expiration (currently 7d - consider shorter for production)
  - Implement refresh token rotation if needed for longer sessions

---

## Priority 3: DATA & PAYMENTS (Critical for business operations)

- [ ] **Stripe API keys**
  - Verify using TEST keys only during staging
  - Have production Stripe keys ready for final deployment
  - Implement webhook handling for payment events
  - Test full payment flow end-to-end

- [ ] **Database backups**
  - Verify MongoDB Atlas automatic backups are enabled
  - Test restore procedure to ensure backups work
  - Document backup retention policy

- [ ] **Test complete rental flow**
  - Create account → Set name/phone → Sign waiver → Rent kayak → Pay → Get passcode → Return
  - Test with multiple browsers/devices
  - Verify emails/SMS notifications send correctly

- [ ] **Admin controls**
  - Create admin user account for production database
  - Test admin dashboard/controls for managing kayaks and rentals
  - Implement proper admin authentication checks

---

## Priority 4: FRONTEND CONFIG (Deployment configuration)

- [ ] **Update frontend API URL to production**
  - Check `frontend/src/config/api.ts` or similar
  - Update `API_BASE_URL` to point to production backend
  - Verify it works with production domain

- [ ] **Update environment variables**
  - Frontend .env: REACT_APP_STRIPE_PUBLISHABLE_KEY (production key)
  - Frontend .env: REACT_APP_API_BASE_URL (production backend URL)
  - Frontend .env: FRONTEND_URL in backend .env matches production domain

- [ ] **Vercel/deployment platform config**
  - Verify `vercel.json` or deployment config is correct
  - Set up proper redirects for React Router
  - Configure custom domain

---

## Priority 5: TESTING & VALIDATION

- [ ] **End-to-end testing checklist**
  - [ ] Signup with weak password → Error message
  - [ ] Signup with strong password → Success
  - [ ] Login with correct credentials → Success
  - [ ] Login with wrong password → Error
  - [ ] Forgot password → Email received → Reset → Login works
  - [ ] Update profile (name/phone) → Saves correctly
  - [ ] Sign waiver → Waiver page shows as signed
  - [ ] Create rental → Passcode generated
  - [ ] Payment flow completes
  - [ ] Late fees calculated correctly
  - [ ] Admin can view all rentals

- [ ] **Mobile testing**
  - Test signup form on mobile
  - Test profile page on mobile
  - Test rental passcode display on mobile
  - Verify all buttons/links are clickable

- [ ] **Browser compatibility**
  - Test on Chrome, Firefox, Safari, Edge
  - Verify no console errors
  - Test on different screen sizes

- [ ] **Performance testing**
  - Check homepage load time
  - Check signup page load time
  - Verify no N+1 database queries
  - Test with slow network (DevTools throttling)

---

## Priority 6: MONITORING & LOGGING

- [ ] **Set up error tracking**
  - Implement Sentry, LogRocket, or similar
  - Backend: Send server errors to monitoring service
  - Frontend: Send frontend errors to monitoring service

- [ ] **Set up logging**
  - Backend: Log all authentication attempts
  - Backend: Log payment transactions
  - Backend: Log rental operations
  - Keep logs for at least 30 days

- [ ] **Set up uptime monitoring**
  - Use service like UptimeRobot to monitor backend
  - Set up alerts if service goes down
  - Document incident response procedure

---

## Priority 7: DOCUMENTATION & HANDOFF

- [ ] **Document deployment procedure**
  - How to deploy frontend (Vercel)
  - How to deploy backend (Railway)
  - How to update environment variables
  - How to rollback if issues occur

- [ ] **Document emergency procedures**
  - How to disable a user account
  - How to cancel/refund a payment
  - How to manually generate a passcode
  - Database restore procedure

- [ ] **Update README**
  - Production deployment instructions
  - Environment variable setup
  - How to run locally
  - Basic troubleshooting

- [ ] **Create admin documentation**
  - How to use admin dashboard
  - Common support issues and solutions
  - How to manage kayak inventory

---

## Priority 8: FINAL PRE-LAUNCH (Last week before launch)

- [ ] **Load testing**
  - Simulate 100+ concurrent users
  - Verify backend handles load
  - Check database performance under load

- [ ] **Security audit**
  - Review all API endpoints for auth checks
  - Verify SQL injection/NoSQL injection impossible
  - Check for XSS vulnerabilities
  - Verify CSRF protection if applicable

- [ ] **Legal/Compliance**
  - Terms of Service page
  - Privacy Policy page
  - Waiver agreement finalized
  - Data deletion policy (GDPR compliance if EU users)

- [ ] **Communications**
  - Notify early users about launch
  - Set up help/support email
  - Create FAQ page for common issues

- [ ] **Final smoke test**
  - Run through complete user flow one more time
  - Test on actual production domain
  - Verify all emails send correctly
  - Check that admin dashboard is accessible

---

## Suggested Implementation Order:

1. **Today:** Priority 1 (Security + credentials)
2. **This week:** Priority 2 (Auth/Protection)
3. **This week:** Priority 3 (Data/Payments)
4. **Next week:** Priority 4 (Frontend config)
5. **Next week:** Priority 5 (Testing)
6. **Final week:** Priority 6-8 (Monitoring + Launch prep)

---

## Notes:
- Current status: Email verification, rate limiting, and password reset security are not yet implemented
- TTLock and payment systems are ready but need end-to-end testing
- Admin dashboard status unknown - needs verification
- Consider starting with rate limiting and email verification as quick wins
