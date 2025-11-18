# Deploy Firestore Rules for Quizzes

## Issue Found
The Firebase Firestore rules were missing the `quizzes` collection rules, which was preventing quizzes from being saved to the database.

## Solution
Added Firestore security rules for the `quizzes` collection in `firestore.rules`.

## How to Deploy

### Option 1: Firebase Console (Web Interface)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab at the top
5. Copy and paste the entire content from `firestore.rules` file
6. Click **Publish** button

### Option 2: Firebase CLI (Command Line)
```bash
# Make sure you're in the project directory
cd C:\Users\fookl\OneDrive\Desktop\Exam-Prep

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

## New Rules Added

```javascript
// Rules for quizzes collection
match /quizzes/{quizId} {
  // Allow users to read their own quizzes
  allow read: if isAuthenticated() && 
                 resource.data.user_id == request.auth.uid;
  
  // Allow users to create quizzes with their own user_id
  allow create: if isAuthenticated() && 
                   request.resource.data.user_id == request.auth.uid &&
                   request.resource.data.keys().hasAll(['user_id', 'title', 'questions', 'createdAt', 'userPlan']);
  
  // Allow users to update their own quizzes
  allow update: if isAuthenticated() && 
                   resource.data.user_id == request.auth.uid &&
                   request.resource.data.user_id == request.auth.uid;
  
  // Allow users to delete their own quizzes
  allow delete: if isAuthenticated() && 
                   resource.data.user_id == request.auth.uid;
}
```

## What These Rules Do

1. **Read**: Users can only read their own quizzes (filtered by `user_id`)
2. **Create**: Users can only create quizzes with their own `user_id`, and must include all required fields
3. **Update**: Users can only update their own quizzes
4. **Delete**: Users can only delete their own quizzes

## Required Fields for Quiz Creation

- `user_id`: String (Firebase Auth UID)
- `title`: String (e.g., "Quiz - filename.pdf")
- `questions`: Array of question objects
- `createdAt`: Timestamp
- `userPlan`: String ("free" or "pro")

## After Deployment

1. Try generating a quiz again by asking the chatbot
2. Check the browser console for these logs:
   - `🎯 Quiz detected! From: Quiz AI Agent`
   - `📝 Parsed quiz questions: X`
   - `💾 Quiz saved to Firestore with ID: xxx`
3. Check Firebase Console → Firestore Database → `quizzes` collection
4. You should see your quiz document with all the data

## Troubleshooting

If quizzes still don't save after deploying:
1. Check browser console for permission errors
2. Verify user is authenticated (`user.id` is not null)
3. Check that webhook response contains `"from": "Quiz AI Agent"`
4. Verify the quiz data structure matches expected format
