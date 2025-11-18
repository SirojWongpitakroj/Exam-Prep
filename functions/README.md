# 📧 Exam Prep Assistant - Email Functions

Firebase Cloud Functions for automated daily quiz reminder emails.

---

## 📋 Overview

This Firebase Function automatically sends email reminders to users who have generated quizzes.

- **Schedule**: Daily at 7:00 AM (configurable timezone)
- **Recipients**: All users with at least one quiz
- **Email Service**: Gmail or SendGrid
- **Runtime**: Node.js 18

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Service

**For Gmail**:
```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

**For SendGrid**:
```bash
firebase functions:config:set sendgrid.apikey="your-api-key"
```

### 3. Build and Deploy

```bash
npm run build
firebase deploy --only functions
```

---

## 📁 File Structure

```
functions/
├── src/
│   └── index.ts          # Main function code
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

---

## 🔧 Functions

### `sendDailyQuizReminders` (Scheduled)

Runs automatically every day at 7 AM.

**What it does**:
1. Queries all quizzes from Firestore
2. Gets unique user IDs who created quizzes
3. Fetches user details from Firebase Auth
4. Gets the latest quiz for each user
5. Sends personalized email to each user
6. Logs success/failure results

**Schedule**: `0 7 * * *` (7 AM daily)
**Timezone**: Configurable (default: America/Los_Angeles)

### `sendQuizRemindersManual` (Callable)

Manual trigger for testing.

**Usage**:
```bash
firebase functions:call sendQuizRemindersManual
```

Or from the app:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendReminders = httpsCallable(functions, 'sendQuizRemindersManual');
await sendReminders();
```

---

## ⚙️ Configuration

### Update Domain URLs

Edit `src/index.ts` lines 56-57:

```typescript
const quizUrl = `https://your-domain.com/quiz`;
const dashboardUrl = `https://your-domain.com/`;
```

### Change Schedule

Edit `src/index.ts` line 276:

```typescript
// Every day at 9 AM
.schedule("0 9 * * *")

// Twice daily: 9 AM and 7 PM
.schedule("0 9,19 * * *")

// Weekdays only at 7 AM
.schedule("0 7 * * 1-5")
```

### Change Timezone

Edit `src/index.ts` line 277:

```typescript
.timeZone("America/New_York")
.timeZone("Europe/London")
.timeZone("Asia/Singapore")
```

---

## 🧪 Testing

### Local Testing

```bash
# Start emulator
npm run serve

# In another terminal
firebase functions:call sendQuizRemindersManual
```

### Production Testing

```bash
firebase functions:call sendQuizRemindersManual
```

Or use the Test Email Button in the app's Profile page.

---

## 📊 Monitoring

### View Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only sendDailyQuizReminders

# Real-time
firebase functions:log --follow
```

### Firebase Console

https://console.firebase.google.com → Functions → Logs

### Cloud Scheduler

https://console.cloud.google.com/cloudscheduler

---

## 📧 Email Template

The email includes:
- Personalized greeting
- Quiz details (title, questions, date)
- Direct link to take quiz
- Study tips
- Beautiful HTML design with gradients

**Customize**: Edit `sendQuizReminderEmail` function in `src/index.ts`

---

## 🔒 Security

- Email credentials stored in Firebase Functions config
- Manual trigger requires authentication
- Rate limiting: 1-second delay between emails
- Only emails users who created quizzes

---

## 💰 Cost

**Firebase Functions Free Tier**:
- 2M invocations/month
- 400,000 GB-seconds
- 200,000 CPU-seconds

**This function**:
- ~30 invocations/month (daily)
- **Well within free tier!** ✅

**Email Services**:
- Gmail: Free (with App Password)
- SendGrid: Free tier = 100 emails/day

---

## 🐛 Troubleshooting

### "Function not found"
Deploy functions first:
```bash
firebase deploy --only functions
```

### "Gmail authentication failed"
1. Enable 2FA on Gmail
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use App Password (not regular password)

### "Billing required"
Scheduled functions require Blaze (pay-as-you-go) plan:
1. Firebase Console → Settings → Usage and billing
2. Upgrade to Blaze
3. Set spending limits (optional)

### Check Configuration
```bash
firebase functions:config:get
```

---

## 📚 Scripts

```bash
# Start emulator
npm run serve

# Start shell
npm run shell

# Deploy
npm run deploy

# View logs
npm run logs

# Build
npm run build
```

---

## 🔗 Related Files

- `../DAILY_EMAIL_SETUP.md` - Detailed setup instructions
- `../EMAIL_QUICKSTART.md` - Quick start guide
- `../src/components/TestEmailButton.tsx` - Test UI component
- `../firestore.rules` - Firestore security rules

---

## 📝 Environment Variables

**Development** (local testing):
```bash
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="your-app-password"
```

**Production** (Firebase Functions config):
```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

---

## ✅ Deployment Checklist

- [ ] Dependencies installed
- [ ] Email service configured
- [ ] Domain URLs updated
- [ ] Timezone set correctly
- [ ] Code built successfully
- [ ] Firestore rules deployed
- [ ] Functions deployed
- [ ] Test email sent
- [ ] Logs checked for errors
- [ ] Cloud Scheduler job active

---

## 🎯 Next Steps

1. Customize email template
2. Add user preferences (email opt-in/out)
3. Add email analytics
4. Support multiple quiz reminders
5. Add digest emails (weekly summary)

---

## 📞 Support

**Logs**: `firebase functions:log`  
**Console**: https://console.firebase.google.com  
**Scheduler**: https://console.cloud.google.com/cloudscheduler

---

Built with ❤️ using Firebase Cloud Functions

