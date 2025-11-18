# 📧 Daily Quiz Email Reminder Setup Guide

This guide will help you set up automated daily email reminders for users who have generated quizzes.

## 📋 Overview

- **Schedule**: Every day at 7:00 AM (configurable timezone)
- **Recipients**: All users who have generated at least one quiz
- **Content**: Personalized email with quiz details and direct link to take the quiz
- **Service**: Firebase Cloud Functions + Nodemailer

---

## 🚀 Setup Instructions

### Step 1: Initialize Firebase Functions

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Functions** (if not already done):
   ```bash
   firebase init functions
   ```
   - Select your Firebase project
   - Choose **TypeScript**
   - Install dependencies: **Yes**

### Step 2: Install Dependencies

Navigate to the `functions` directory and install required packages:

```bash
cd functions
npm install firebase-admin firebase-functions nodemailer
npm install --save-dev @types/nodemailer
cd ..
```

### Step 3: Configure Email Service

You have two options for sending emails:

#### **Option A: Gmail (Recommended for Testing)**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Create an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Generate password
   - Copy the 16-character password

3. **Set Firebase environment variables**:
   ```bash
   firebase functions:config:set email.user="your-email@gmail.com"
   firebase functions:config:set email.password="your-app-password"
   ```

#### **Option B: SendGrid (Recommended for Production)**

1. **Sign up for SendGrid**: https://sendgrid.com/
2. **Create an API Key**
3. **Modify `functions/src/index.ts`**:
   ```typescript
   const transporter = nodemailer.createTransport({
     host: "smtp.sendgrid.net",
     port: 587,
     auth: {
       user: "apikey",
       pass: functions.config().sendgrid?.apikey || process.env.SENDGRID_API_KEY,
     },
   });
   ```
4. **Set Firebase environment variable**:
   ```bash
   firebase functions:config:set sendgrid.apikey="your-sendgrid-api-key"
   ```

### Step 4: Update Your Domain

Open `functions/src/index.ts` and replace placeholder URLs:

```typescript
const quizUrl = `https://your-domain.com/quiz`;  // Replace with your actual domain
const dashboardUrl = `https://your-domain.com/`; // Replace with your actual domain
```

If you're testing locally, you can use:
```typescript
const quizUrl = `http://localhost:5173/quiz`;
const dashboardUrl = `http://localhost:5173/`;
```

### Step 5: Configure Timezone

Edit `functions/src/index.ts` to set your timezone:

```typescript
export const sendDailyQuizReminders = functions.pubsub
  .schedule("0 7 * * *")
  .timeZone("America/Los_Angeles") // Change to your timezone
  .onRun(async (context) => {
    // ... function code
  });
```

**Common Timezones**:
- `America/New_York` - Eastern Time
- `America/Chicago` - Central Time
- `America/Los_Angeles` - Pacific Time
- `Europe/London` - UK
- `Asia/Singapore` - Singapore
- `Australia/Sydney` - Australia

**Full timezone list**: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### Step 6: Build and Deploy

1. **Build the functions**:
   ```bash
   cd functions
   npm run build
   cd ..
   ```

2. **Deploy to Firebase**:
   ```bash
   firebase deploy --only functions
   ```

3. **Wait for deployment** (may take 2-5 minutes)

---

## 🧪 Testing

### Test Immediately (Without Waiting for 7 AM)

You can manually trigger the email function to test it:

#### **Method 1: Using Firebase Console**

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Navigate to **Functions** in the left sidebar
4. Find `sendQuizRemindersManual`
5. Click **Dashboard** → **Logs** to see execution results

#### **Method 2: Using Firebase CLI**

```bash
firebase functions:call sendQuizRemindersManual
```

#### **Method 3: Add a Test Button in Your App**

Add this to your React app (e.g., in Profile page):

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const TestEmailButton = () => {
  const handleTestEmail = async () => {
    try {
      const functions = getFunctions();
      const sendReminders = httpsCallable(functions, 'sendQuizRemindersManual');
      const result = await sendReminders();
      console.log('Email test result:', result);
      toast.success('Test emails sent!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send test emails');
    }
  };

  return (
    <Button onClick={handleTestEmail}>
      📧 Test Email Reminder
    </Button>
  );
};
```

---

## 📊 Monitoring

### View Logs

1. **Firebase Console**:
   - Go to: https://console.firebase.google.com/
   - Select your project
   - Navigate to **Functions** → Select function → **Logs**

2. **Firebase CLI**:
   ```bash
   firebase functions:log
   ```

### Check Scheduled Runs

1. Go to **Cloud Scheduler** in Google Cloud Console
2. You'll see your scheduled function: `sendDailyQuizReminders`
3. View execution history and success/failure rates

---

## 🎨 Email Template Customization

The email template is in `functions/src/index.ts` in the `sendQuizReminderEmail` function.

You can customize:
- **Subject line**: Change `subject: "📚 Don't Forget Your Quiz!"`
- **Colors**: Modify the gradient colors in the CSS
- **Content**: Update the HTML/text content
- **Button text**: Change "Take Quiz Now"
- **Logo**: Add your logo image URL

---

## 💰 Cost Estimation

Firebase Cloud Functions pricing (as of 2024):

- **Free Tier**:
  - 2M invocations/month
  - 400,000 GB-seconds
  - 200,000 CPU-seconds

- **Daily Email Job**:
  - 1 invocation per day = ~30 invocations/month
  - **Well within free tier!** ✅

- **Gmail/SendGrid**:
  - Gmail: Free (with App Password)
  - SendGrid: Free tier = 100 emails/day

**Estimated monthly cost**: $0 (free tier)

---

## 🔒 Security Considerations

1. **Email credentials**: Stored in Firebase Functions config (secure)
2. **User authentication**: Manual trigger requires authentication
3. **Rate limiting**: 1-second delay between emails to avoid spam filters
4. **Privacy**: Only sends emails to users who generated quizzes

---

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check Firebase Functions logs**:
   ```bash
   firebase functions:log
   ```

2. **Verify email config**:
   ```bash
   firebase functions:config:get
   ```

3. **Test email service**:
   - Try sending a test email from your Gmail
   - Check if App Password is correct
   - Ensure 2FA is enabled on Gmail

### Function Not Triggering at 7 AM

1. **Check Cloud Scheduler** in Google Cloud Console
2. **Verify timezone** in function code
3. **Check billing** is enabled on your Firebase project (required for scheduled functions)

### Gmail App Password Not Working

1. Enable 2-Factor Authentication
2. Generate new App Password
3. Use the 16-character password (no spaces)
4. Update Firebase config

---

## 📝 Cron Schedule Examples

Change the schedule in `functions/src/index.ts`:

```typescript
// Every day at 7:00 AM
.schedule("0 7 * * *")

// Every day at 9:00 AM and 7:00 PM
.schedule("0 9,19 * * *")

// Every Monday at 8:00 AM
.schedule("0 8 * * 1")

// Every weekday at 7:00 AM
.schedule("0 7 * * 1-5")

// Every hour
.schedule("0 * * * *")

// Every 30 minutes
.schedule("*/30 * * * *")
```

**Cron format**: `minute hour day-of-month month day-of-week`

---

## 🚀 Next Steps

After setup:

1. ✅ Test the manual trigger
2. ✅ Check logs for errors
3. ✅ Wait for 7 AM tomorrow to verify scheduled run
4. ✅ Monitor email deliverability
5. ✅ Customize email template to match your brand

---

## 📞 Support

If you encounter issues:

1. Check the logs: `firebase functions:log`
2. Review Firebase Console → Functions
3. Test email service separately
4. Verify all environment variables are set

---

## 🎉 Success!

Once deployed, your system will:
- ✅ Automatically send emails every day at 7 AM
- ✅ Only email users who have generated quizzes
- ✅ Include personalized quiz details
- ✅ Provide direct links to take the quiz
- ✅ Track success/failure in logs

**Your automated email reminder system is ready!** 🎊

