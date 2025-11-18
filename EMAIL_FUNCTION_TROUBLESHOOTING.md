# 🔧 Email Function Troubleshooting

## Issue: "Internal" Error When Testing Email

If you're getting an "internal" error when clicking the "Test Email Reminder" button, follow these steps:

---

## ✅ Step 1: Check if Functions are Deployed

```bash
firebase functions:list
```

**Expected output**: You should see `sendTestEmailToMe` in the list.

**If not found**: Functions are not deployed yet.

---

## 🚀 Step 2: Deploy Functions

### Install Dependencies
```bash
cd functions
npm install
cd ..
```

### Build Functions
```bash
cd functions
npm run build
cd ..
```

### Deploy to Firebase
```bash
firebase deploy --only functions
```

Wait 2-5 minutes for deployment.

---

## 📧 Step 3: Configure Email Service

### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**:
   - Go to: https://myaccount.google.com/security
   - Enable 2FA

2. **Create App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)"
   - Name it "Exam Prep Email"
   - Copy the 16-character password (remove spaces)

3. **Set Firebase Configuration**:
   ```bash
   firebase functions:config:set email.user="your-email@gmail.com"
   firebase functions:config:set email.password="abcd efgh ijkl mnop"
   ```
   (Replace with your actual email and app password)

4. **Redeploy Functions**:
   ```bash
   firebase deploy --only functions
   ```

---

## 🧪 Step 4: Test

1. **Check browser console** (F12) for detailed error logs
2. **Click "Test Email Reminder"** button
3. **Check Firebase Functions logs**:
   ```bash
   firebase functions:log
   ```

---

## 🔍 Common Errors and Solutions

### Error: "functions/not-found"
**Problem**: Function not deployed  
**Solution**: Run `firebase deploy --only functions`

### Error: "functions/internal: Error sending test email: ..."
**Problem**: Email service not configured or credentials are wrong  
**Solution**:
1. Check config: `firebase functions:config:get`
2. Verify Gmail App Password is correct
3. Make sure 2FA is enabled on Gmail
4. Redeploy functions after setting config

### Error: "No quiz found"
**Problem**: User hasn't generated a quiz yet  
**Solution**: Generate a quiz first by chatting with the bot: "Create a quiz"

### Error: "User does not have an email address"
**Problem**: User authenticated but no email in Firebase Auth  
**Solution**: Check Firebase Console → Authentication → Users

---

## 📊 Verify Configuration

### Check Firebase Config
```bash
firebase functions:config:get
```

**Expected output**:
```json
{
  "email": {
    "user": "your-email@gmail.com",
    "password": "abcdefghijklmnop"
  }
}
```

### Check Deployed Functions
```bash
firebase functions:list
```

**Expected output should include**:
- `sendDailyQuizReminders`
- `sendQuizRemindersManual`
- `sendTestEmailToMe`

---

## 🎯 Quick Fix Checklist

- [ ] Functions dependencies installed (`cd functions && npm install`)
- [ ] Functions built (`cd functions && npm run build`)
- [ ] Functions deployed (`firebase deploy --only functions`)
- [ ] Gmail 2FA enabled
- [ ] Gmail App Password created
- [ ] Email config set (`firebase functions:config:set email.user=...`)
- [ ] Functions redeployed after config
- [ ] User has generated at least one quiz
- [ ] Browser console checked for errors
- [ ] Firebase Functions logs checked

---

## 💡 Testing Without Quiz

If you want to test email functionality without generating a quiz, you can modify the function temporarily:

Edit `functions/src/index.ts` and comment out the quiz check:

```typescript
// if (!quiz) {
//   return {
//     success: false,
//     message: "No quiz found..."
//   };
// }

// Use dummy quiz data for testing
const quiz = {
  title: "Test Quiz",
  questions: [{
    id: "1",
    question: "Test question?",
    options: ["A", "B", "C", "D"],
    correctAnswer: 0
  }],
  createdAt: admin.firestore.Timestamp.now()
};
```

Then redeploy.

---

## 📞 Still Having Issues?

1. **Check complete error in browser console** (F12 → Console tab)
2. **Check Firebase Functions logs**:
   ```bash
   firebase functions:log --only sendTestEmailToMe
   ```
3. **Verify Firebase project is in Blaze plan** (required for external API calls like email)

---

## ✅ Success Indicators

When working correctly, you should see:

**Browser Console**:
```
📧 Sending test email to current user...
✅ Email test result: {success: true, message: "Test email sent..."}
📨 Email sent to: user@example.com
```

**Toast Notification**:
```
✅ Test email sent to user@example.com!
```

**Your Email Inbox**:
- Email with subject: "📚 Don't Forget Your Quiz!"
- Personalized content
- Quiz details

**Firebase Logs**:
```
📧 Sending test email to current user: abc123
✅ Email sent to user@example.com
✅ Test email sent successfully to user@example.com
```

