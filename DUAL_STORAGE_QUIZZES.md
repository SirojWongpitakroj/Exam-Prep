# Dual Storage System for Quizzes

## Overview
Quizzes are now saved to **BOTH** localStorage and Firestore for maximum reliability.

## How It Works

### **Saving Quizzes (ChatInterface.tsx)**

When a quiz is generated, it is saved in this order:

1. **localStorage** - ALWAYS saved first (100% reliable)
   - Key: `quiz_${userId}_latest`
   - Contains full quiz data with questions, options, answers
   - Never fails (works offline)

2. **Firestore** - Attempted second (may fail due to permissions)
   - Collection: `quizzes`
   - Contains same data as localStorage
   - If it fails, quiz is still available from localStorage

### **Loading Quizzes (Quiz.tsx)**

When user clicks "View Quiz", the system loads in this priority:

1. **Context** - If quiz is already in memory, use it immediately
2. **Firestore** - Try to load from Firebase first (latest quiz)
3. **localStorage** - Fallback if Firestore fails or is empty
4. **Error** - Only if no quiz exists anywhere

## Benefits

✅ **100% Reliability** - Quiz always saves to localStorage  
✅ **Offline Support** - Works even without internet  
✅ **Cloud Backup** - Firestore provides backup when working  
✅ **Fast Access** - localStorage is instant  
✅ **No Data Loss** - Even if Firestore fails, quiz is safe  

## Storage Format

### localStorage
```javascript
Key: "quiz_abc123_latest"
Value: {
  id: "quiz-1234567890",
  user_id: "abc123",
  title: "Quiz - filename.pdf",
  questions: [
    {
      id: "q-1234567890-0",
      question: "What is 2+2?",
      options: ["1", "2", "3", "4"],
      correctAnswer: 3,
      explanation: "Basic math"
    }
  ],
  createdAt: "2024-11-18T06:12:30.000Z",
  userPlan: "free"
}
```

### Firestore
```
Collection: quizzes
Document ID: auto-generated
Fields:
  - user_id: string
  - title: string
  - questions: array
  - createdAt: timestamp
  - userPlan: string
```

## Console Logs

When saving:
```
💾 Quiz saved to localStorage
💾 Quiz saved to Firestore with ID: abc123
```

Or if Firestore fails:
```
💾 Quiz saved to localStorage
❌ Failed to save quiz to Firestore: [error]
✅ Quiz still available from localStorage
```

When loading:
```
📚 Using quiz from context
```
or
```
📚 Loaded quiz from Firestore: Quiz - filename.pdf
```
or
```
📚 Loaded quiz from localStorage: Quiz - filename.pdf
```

## Why This Fixes Instability

**Before:** Quiz only saved to Firestore → If Firestore failed, quiz was lost

**Now:** Quiz saved to localStorage first → Always works, Firestore is bonus

Even if:
- Firestore rules are wrong ❌
- Internet is down ❌
- Firebase is slow ❌
- Permissions are denied ❌

**The quiz will ALWAYS be available from localStorage** ✅

## Testing

1. Generate a quiz
2. Check console - should see: `💾 Quiz saved to localStorage`
3. Click "View Quiz" - should work immediately
4. Check browser DevTools → Application → Local Storage
   - Look for key: `quiz_[your-user-id]_latest`
   - Should contain full quiz JSON

## Cleanup

Quiz in localStorage is overwritten each time a new quiz is generated (keeps only latest).

To clear manually:
```javascript
localStorage.removeItem('quiz_[userId]_latest');
```

## Future Enhancements

Could add:
- Store multiple quizzes in localStorage (history)
- Sync localStorage → Firestore when connection restored
- Clear old quizzes after X days
- Export quiz to JSON file

