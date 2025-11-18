# 📧 Quick Start: Daily Email Reminders

Set up automated daily quiz reminder emails in **5 minutes**!

---

## ⚡ Quick Setup (Gmail - Fastest)

### 1. Install Dependencies

```bash
cd functions
npm install
cd ..
```

### 2. Configure Gmail

1. **Enable 2FA** on your Gmail account: https://myaccount.google.com/security
2. **Create App Password**: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)"
   - Copy the 16-character password
3. **Set Firebase config**:
   ```bash
   firebase functions:config:set email.user="your-email@gmail.com"
   firebase functions:config:set email.password="your-16-char-app-password"
   ```

### 3. Update Configuration

Edit `functions/src/index.ts`:

**Line 56-57**: Update your domain
```typescript
const quizUrl = `https://your-domain.com/quiz`;  // Change this!
const dashboardUrl = `https://your-domain.com/`; // Change this!
```

**Line 277**: Set your timezone
```typescript
.timeZone("America/Los_Angeles") // Change to your timezone
```

### 4. Deploy

```bash
firebase deploy --only functions
```

Wait 2-5 minutes for deployment.

### 5. Test It!

**Option A**: Visit your Profile page and click "Test Email Reminder" button

**Option B**: Run this command:
```bash
firebase functions:call sendQuizRemindersManual
```

**Option C**: Add user to your app, generate a quiz, wait for 7 AM tomorrow! ⏰

---

## 🎯 What Happens?

### Daily at 7 AM (Your Timezone):
1. ✅ Queries Firestore for all quizzes
2. ✅ Gets unique users who created quizzes
3. ✅ Fetches user emails from Firebase Auth
4. ✅ Sends personalized email to each user with:
   - Quiz title
   - Number of questions
   - Direct link to take quiz
   - Beautiful HTML template
5. ✅ Logs results (success/failure counts)

---

## 📧 Email Preview

**Subject**: 📚 Don't Forget Your Quiz! - Exam Prep Assistant

**Content**:
- Personalized greeting
- Quiz details (title, questions count, created date)
- "Take Quiz Now" button
- Study tips
- Beautiful gradient design (purple/pink)

---

## 🔧 Configuration Options

### Change Schedule Time

Edit `functions/src/index.ts` line 276:

```typescript
// Every day at 9 AM
.schedule("0 9 * * *")

// Every day at 7 AM and 7 PM
.schedule("0 7,19 * * *")

// Every Monday at 8 AM
.schedule("0 8 * * 1")

// Every weekday at 7 AM
.schedule("0 7 * * 1-5")
```

### Change Timezone

Line 277:
```typescript
.timeZone("America/New_York")      // Eastern Time
.timeZone("Europe/London")         // UK
.timeZone("Asia/Singapore")        // Singapore
.timeZone("Australia/Sydney")      // Sydney
```

Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### Customize Email Template

Edit `functions/src/index.ts` in the `sendQuizReminderEmail` function (starting around line 119):

- **Subject**: Line 121
- **Colors**: Lines 132-220 (CSS section)
- **Content**: Lines 221-320 (HTML section)
- **Button text**: Line 265
- **Footer**: Lines 321-336

---

## 🧪 Testing

### Method 1: Test Button (Easiest)

1. Go to your Profile page (`/profile`)
2. Scroll to "Email Notifications" section
3. Click "Test Email Reminder"
4. Check your logs for results

### Method 2: Firebase CLI

```bash
firebase functions:call sendQuizRemindersManual
```

### Method 3: Wait for Scheduled Run

Just wait until 7 AM tomorrow! The function will run automatically.

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
firebase functions:log --only sendDailyQuizReminders

# Or view in console
# https://console.firebase.google.com → Functions → Logs
```

### Check Scheduled Runs

1. Go to: https://console.cloud.google.com/cloudscheduler
2. Find: `sendDailyQuizReminders`
3. View execution history

---

## 💰 Cost

**FREE!** 🎉

- Firebase Functions Free Tier: 2M invocations/month
- Daily job = ~30 invocations/month
- Gmail = Free (with App Password)

---

## 🐛 Common Issues

### "Function not found"
- **Solution**: Deploy functions first: `firebase deploy --only functions`

### "Gmail authentication failed"
- **Solution**: 
  1. Enable 2FA on Gmail
  2. Use App Password (not your regular password)
  3. Check config: `firebase functions:config:get`

### "Billing required for scheduled functions"
- **Solution**: 
  1. Go to Firebase Console → Settings
  2. Upgrade to "Blaze" (pay-as-you-go) plan
  3. Don't worry - still free with usage limits!

### Emails going to spam
- **Solution**: 
  1. Add your domain to SPF/DKIM records
  2. Use SendGrid for production
  3. Ask recipients to mark as "Not Spam"

---

## 🚀 Next Steps

1. ✅ Deploy functions
2. ✅ Test with test button
3. ✅ Customize email template
4. ✅ Set correct timezone
5. ✅ Monitor first scheduled run
6. ✅ (Optional) Upgrade to SendGrid for production

---

## 📝 Files Created

- `functions/src/index.ts` - Main function code
- `functions/package.json` - Dependencies
- `functions/tsconfig.json` - TypeScript config
- `firebase.json` - Firebase config
- `src/components/TestEmailButton.tsx` - Test button component
- `DAILY_EMAIL_SETUP.md` - Detailed setup guide
- `EMAIL_QUICKSTART.md` - This file!

---

## ✅ Success Checklist

- [ ] Dependencies installed (`cd functions && npm install`)
- [ ] Gmail App Password created
- [ ] Firebase config set (`functions:config:set`)
- [ ] Domain URLs updated in code
- [ ] Timezone set correctly
- [ ] Functions deployed (`firebase deploy --only functions`)
- [ ] Test email sent successfully
- [ ] Logs show no errors
- [ ] Scheduled job appears in Cloud Scheduler

---

## 🎉 Done!

Your daily email reminder system is ready!

**Questions?** Check `DAILY_EMAIL_SETUP.md` for detailed documentation.

**Need help?** Check the logs: `firebase functions:log`

