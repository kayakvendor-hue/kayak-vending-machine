# Email and SMS Setup Guide

Your kayak vending machine now supports email and SMS notifications! Here's how to set them up:

## Email Notifications (Gmail)

### What You'll Send:
- 📧 Rental confirmation with passcode and instructions
- 📧 Return confirmation and thank you message
- 📧 Waiver confirmation

### Setup Steps:

1. **Create a Gmail App Password** (if using Gmail):
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

2. **Update `.env` file**:
   ```
   EMAIL_SERVICE_USER="your_email@gmail.com"
   EMAIL_SERVICE_PASS="your_16_character_app_password"
   ```

3. **Restart the backend server**

That's it! Emails will now be sent automatically on rental and return.

---

## SMS Notifications (Twilio)

### What You'll Send:
- 📱 Rental confirmation with passcode
- 📱 Return reminder (15 minutes before expiration)
- 📱 Return confirmation

### Setup Steps:

1. **Create a Twilio Account**:
   - Go to [twilio.com](https://www.twilio.com/try-twilio)
   - Sign up for a free account
   - Get $15.50 in free credit

2. **Get Your Credentials**:
   - From the Twilio Console dashboard, copy:
     - Account SID
     - Auth Token
   - Get a phone number from "Phone Numbers" → "Manage" → "Buy a number"

3. **Update `.env` file**:
   ```
   TWILIO_ACCOUNT_SID="your_account_sid_here"
   TWILIO_AUTH_TOKEN="your_auth_token_here"
   TWILIO_PHONE_NUMBER="+15551234567"
   ```

4. **Add Phone Number to User Model**:
   - Users can now add their phone number during signup or in their profile
   - SMS will only be sent if the user has a phone number on file

5. **Restart the backend server**

---

## Testing

### Without Configuration:
- The app will work fine without email/SMS setup
- You'll see console warnings: `⚠️ Email service not configured`
- No emails or SMS will be sent

### With Configuration:
- Test by renting a kayak - you should receive:
  - Email with passcode and rental details
  - SMS with passcode (if phone number provided)
- Test by returning a kayak - you should receive:
  - Email thanking you for returning
  - SMS confirmation (if phone number provided)

---

## Adding Phone Numbers to Users

Users need to add their phone number to receive SMS. Options:

1. **Add to signup form** (frontend/src/pages/Signup.tsx)
2. **Add to profile/account page** (recommended)
3. **Manually update in MongoDB** (for testing)

Example MongoDB update:
```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { phone: "+15551234567", name: "Your Name" } }
)
```

---

## Cost Estimates

### Email (Gmail):
- **FREE** - unlimited emails through Gmail

### SMS (Twilio):
- **$15.50 free credit** on signup
- **$1/month** for phone number
- **$0.0079 per SMS** sent in US
- Example: 1000 SMS = ~$8.90

### Recommended Approach:
1. **Start with EMAIL ONLY** (free)
2. **Add SMS later** when you have more users
3. SMS is great for urgent notifications (passcode, reminders)
4. Email is perfect for confirmations and receipts
