# Quiz Firebase Troubleshooting Guide

## Issue
Quizzes are not being saved to Firebase Firestore.

## Step-by-Step Diagnosis

### Step 1: Test Firebase Connection
1. Refresh your application
2. You should see a "Test Quiz Firestore" button under "Debug" section
3. Click the button
4. Check the browser console (F12 → Console tab)
5. Look for:
   - ✅ `Test quiz saved successfully!`
   - ❌ Error messages with permission denied

### Step 2: Verify Firestore Rules Are Deployed

**Check if rules are deployed:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Firestore Database** → **Rules** tab
4. Look for this section:

```javascript
// Rules for quizzes collection
match /quizzes/{quizId} {
  allow read: if isAuthenticated() && 
                 resource.data.user_id == request.auth.uid;
  
  allow create: if isAuthenticated() && 
                   request.resource.data.user_id == request.auth.uid &&
                   request.resource.data.keys().hasAll(['user_id', 'title', 'questions', 'createdAt', 'userPlan']);
}
```

**If not found, deploy the rules:**

```bash
cd C:\Users\fookl\OneDrive\Desktop\Exam-Prep
firebase deploy --only firestore:rules
```

### Step 3: Check Authentication

Open browser console and run:
```javascript
// Check if user is authenticated
console.log('User:', user);
console.log('User ID:', user?.id);
```

If `user.id` is `null` or `undefined`, the user is not authenticated properly.

### Step 4: Test Quiz Generation Flow

1. Upload a file
2. Check the checkbox
3. Ask: "Create a quiz"
4. Watch browser console for:

```
=== CHECKING FOR QUIZ ===
Is array? true
Array length: 2
Checking item: {...}
Item has output, from field: Quiz AI Agent
Has quizzes? true
🎯 Quiz detected! From: Quiz AI Agent
📝 Parsed quiz questions: 2
Attempting to save quiz to Firestore...
User ID: abc123xyz
Quiz title: Quiz - filename.pdf
💾 Quiz saved to Firestore with ID: def456uvw
```

### Step 5: Common Errors and Solutions

#### Error: "Missing or insufficient permissions"
**Cause:** Firestore rules not deployed
**Solution:** Deploy firestore rules (see Step 2)

#### Error: "User not authenticated"
**Cause:** User is not logged in
**Solution:** Make sure you're logged in with Google

#### Error: "Quiz not detected"
**Console shows:** `Has quizzes? false`
**Cause:** Webhook response doesn't have quiz data
**Solution:** Check webhook response format in console

#### Error: "TypeError: Cannot read property 'id' of undefined"
**Cause:** User object is undefined
**Solution:** Refresh page and log in again

### Step 6: Verify Webhook Response Format

The webhook must return this exact structure:

```json
[
  {
    "output": {
      "quizzes": [
        {
          "question": "Question text?",
          "options": ["A", "B", "C", "D"],
          "answer": "B"  // String or number
        }
      ],
      "from": "Quiz AI Agent"  // Must contain "Quiz"
    }
  }
]
```

**Key requirements:**
1. Response is an **array**
2. Item has `output.from` containing the word **"Quiz"** (case-insensitive)
3. Item has `output.quizzes` as an **array**
4. Each quiz has `question`, `options`, and `answer`

### Step 7: Manual Firebase Check

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Firestore Database**
4. Look for `quizzes` collection
5. Check if documents exist

If documents exist:
- ✅ Quizzes are being saved!
- Check the Quiz page is loading them correctly

If no documents:
- ❌ Quizzes are not being saved
- Go back to Step 1

### Step 8: Check Browser Console Errors

Look for any red error messages in the console:
- Firebase permission errors
- Network errors
- JavaScript errors

### Test Commands (Run in Browser Console)

```javascript
// Test 1: Check authentication
console.log('Auth User:', firebase.auth().currentUser);

// Test 2: Manually save a quiz
import { saveQuizToFirestore } from './lib/firestoreService';
await saveQuizToFirestore({
  user_id: "your-user-id-here",
  title: "Manual Test Quiz",
  questions: [
    {
      id: "1",
      question: "Test?",
      options: ["A", "B"],
      correctAnswer: 0
    }
  ],
  userPlan: "free"
});
```

## Quick Fix Checklist

- [ ] Firestore rules deployed (has `quizzes` collection rules)
- [ ] User is authenticated (check console for user.id)
- [ ] Webhook returns correct format (array with quiz data)
- [ ] `output.from` contains "Quiz"
- [ ] Browser console shows no errors
- [ ] Test button works (saves test quiz successfully)

## Still Not Working?

Share these console logs:
1. Full webhook response (from `=== WEBHOOK RESPONSE ===`)
2. Quiz detection logs (from `=== CHECKING FOR QUIZ ===`)
3. Any error messages (red text in console)
4. Result from "Test Quiz Firestore" button

