# Deploy Quiz Firestore Rules

The Firestore security rules have been updated to include the `quizzes` collection. Follow these steps to deploy the updated rules:

## Option 1: Deploy via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents from `firestore.rules` in this project
5. Paste into the Firebase Console rules editor
6. Click **Publish**

## Option 2: Deploy via Firebase CLI

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## Updated Rules Summary

The new rules add support for the `quizzes` collection:

### Security Features:
- ✅ Users can only read their own quizzes
- ✅ Users can only create quizzes with their own user_id
- ✅ Required fields enforced: `user_id`, `title`, `questions`, `createdAt`, `userPlan`
- ✅ Users can update their own quizzes
- ✅ Users can delete their own quizzes

## Testing the Rules

After deploying, test the implementation:

1. **Generate a Quiz**:
   - Upload a study material
   - Ask: "Generate a quiz for me"
   - Check that "Take Quiz" button appears in header

2. **Verify Firebase Storage**:
   - Go to Firebase Console → Firestore Database
   - Check `quizzes` collection
   - Verify your quiz is saved with correct user_id

3. **Test Button Functionality**:
   - Click "Take Quiz" button in header
   - Verify quiz panel opens
   - Complete the quiz
   - Close and reopen - quiz should persist

4. **Test Persistence**:
   - Log out and log back in
   - Quiz should still be available
   - "Take Quiz" button should still appear

## Troubleshooting

### Permission Denied Error
If you get "permission denied" errors:
1. Verify you deployed the rules successfully
2. Check Firebase Console → Firestore → Rules
3. Ensure rules include the `quizzes` collection
4. Verify your user is authenticated

### Quiz Not Saving
If quiz isn't saving to Firebase:
1. Check browser console for errors
2. Verify Firebase config in `.env` file
3. Check Firebase Console → Firestore → Data
4. Verify `quizzes` collection exists

### Button Not Appearing
If "Take Quiz" button doesn't show:
1. Check that quiz was generated successfully
2. Open browser console, look for "Quiz saved to Firestore"
3. Verify `QuizContext` has `currentQuiz` set
4. Check React DevTools for `hasActiveQuiz` state

## Collections Overview

After deployment, your Firestore should have these collections:

1. **uploaded_files**: User's uploaded study materials
2. **chat_messages**: Chat conversation history
3. **quizzes**: Generated quizzes (NEW)

Each collection is secured with user-specific access rules.

