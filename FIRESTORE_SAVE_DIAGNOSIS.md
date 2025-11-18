# Firestore Quiz Save - Diagnosis Guide

## Problem
First quiz saves to Firestore successfully, but subsequent quizzes don't save.

## New Features Added

### 1. **Retry Logic (3 attempts)**
- Attempts to save 3 times with delays
- 1st attempt: Immediate
- 2nd attempt: Wait 1 second
- 3rd attempt: Wait 2 seconds

### 2. **Detailed Error Logging**
Every save attempt now logs:
```
🔄 saveQuizToFirestore called
📊 Quiz data to save: {...}
✅ Data validation passed
📤 Sending to Firestore...
✅ Firestore document created with ID: abc123
```

Or on failure:
```
❌ Firestore save attempt 1 failed
Error code: permission-denied
Error message: Missing or insufficient permissions
```

### 3. **Data Validation**
Checks before saving:
- ✅ `user_id` exists
- ✅ `questions` array is not empty
- ✅ All required fields present

## How to Diagnose

### Step 1: Generate Multiple Quizzes
1. Generate quiz #1 - Check console
2. Generate quiz #2 - Check console
3. Generate quiz #3 - Check console

### Step 2: Look for These Patterns

**Pattern 1: Permission Denied**
```
❌ Firestore save attempt 1 failed
Error code: permission-denied
```
**Solution:** Firestore rules issue - Check Firebase Console rules

**Pattern 2: Network Error**
```
❌ Firestore save attempt 1 failed
Error code: unavailable
```
**Solution:** Internet connection issue or Firebase down

**Pattern 3: Validation Error**
```
❌ Error saving quiz to Firestore
Error message: user_id is required
```
**Solution:** User authentication lost - Refresh and log in again

**Pattern 4: Silent Failure**
```
⚠️ All Firestore save attempts failed
✅ Quiz still available from localStorage
```
**Solution:** Check error details in console - likely rules or auth

### Step 3: Check Firebase Console

Go to: Firebase Console → Firestore Database → Rules

Make sure `match /quizzes/{quizId}` appears **BEFORE** `match /{document=**}`

Correct order:
```javascript
match /quizzes/{quizId} {
  allow create: if isAuthenticated() && 
    request.resource.data.user_id == request.auth.uid &&
    request.resource.data.keys().hasAll(['user_id', 'title', 'questions', 'createdAt', 'userPlan']);
}

// This must be LAST
match /{document=**} {
  allow read, write: if false;
}
```

### Step 4: Check Authentication

In console, type:
```javascript
console.log('User ID:', user?.id);
```

Should show: `User ID: abc123xyz...`

If shows `undefined` or `null`, user is not authenticated.

## Common Issues & Solutions

### Issue 1: Works Once, Then Fails
**Symptom:** First quiz saves, next ones don't
**Cause:** Firebase quota limit or rate limiting
**Solution:** Wait 1 minute between saves, or upgrade Firebase plan

### Issue 2: Permission Denied
**Symptom:** Error code: `permission-denied`
**Cause:** Firestore rules blocking writes
**Solution:** 
1. Go to Firebase Console → Firestore Database → Rules
2. Make sure quiz rules are published
3. Check rules are in correct order (before `match /{document=**}`)

### Issue 3: Empty Questions Array
**Symptom:** Quiz saves but `questions` field is empty
**Cause:** Questions not being parsed from webhook
**Solution:** Check console for:
```
📋 Raw quizzes array: []
📋 Quizzes array length: 0
```
This means webhook response is empty or wrong format.

### Issue 4: User ID Missing
**Symptom:** Error: "user_id is required"
**Cause:** User logged out or session expired
**Solution:** Refresh page and log in again

## Testing Checklist

- [ ] Generate quiz #1 → Check Firestore (should have 1 document)
- [ ] Generate quiz #2 → Check Firestore (should have 2 documents)
- [ ] Generate quiz #3 → Check Firestore (should have 3 documents)
- [ ] Check console for error codes
- [ ] Verify user is authenticated
- [ ] Check Firestore rules are correct
- [ ] Verify quiz has questions in localStorage

## Expected Console Output (Success)

```
=== CHECKING FOR QUIZ ===
🎯 Quiz detected! From: Quiz AI Agent
📋 Found quizzes in item.output.quizzes
📋 Quizzes array length: 2
Processing question 0: {...}
Processing question 1: {...}
📝 Parsed quiz questions: 2
💾 Quiz saved to localStorage
📤 Attempting Firestore save (attempt 1/3)...
🔄 saveQuizToFirestore called
📊 Quiz data to save: {...}
✅ Data validation passed
📤 Sending to Firestore...
✅ Firestore document created with ID: abc123xyz
✅ Quiz saved to Firestore with ID: abc123xyz
```

## What to Share for Help

If still having issues, share:
1. Full console output from generating 2-3 quizzes
2. Error codes and messages
3. Screenshot of Firebase Console → Firestore → Rules tab
4. Number of documents in `quizzes` collection

## Retry Logic Details

The system now tries 3 times with exponential backoff:
- **Attempt 1:** Immediate
- **Attempt 2:** Wait 1 second, retry
- **Attempt 3:** Wait 2 seconds, retry

This handles:
- Temporary network issues
- Rate limiting
- Transient Firebase errors

If all 3 attempts fail, quiz is still saved to localStorage.

