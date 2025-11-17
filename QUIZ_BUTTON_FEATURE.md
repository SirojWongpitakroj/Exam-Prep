# Quiz Button Feature

This document describes the implementation of the quiz button that appears in the header when a quiz is generated.

## Overview

When the chatbot generates a quiz from the webhook response, a "Take Quiz" button appears in the header next to "Exam Prep Assistant". This button allows users to quickly access and take the most recent quiz.

## Implementation Details

### 1. Quiz Storage in Firebase

**Collection**: `quizzes`

**Schema**:
```typescript
{
  id: string;              // Firestore document ID
  user_id: string;         // User's Firebase Auth UID
  title: string;           // Quiz title (e.g., "Generated Quiz")
  questions: [             // Array of quiz questions
    {
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;  // Index of correct answer
      explanation?: string;   // Optional explanation
    }
  ];
  createdAt: Timestamp;    // When quiz was created
  userPlan: "free" | "pro"; // User's plan tier
}
```

### 2. When Quiz is Generated

The flow when a quiz is received from the webhook:

1. **Parse Quiz Data**: Extract quiz questions from webhook response (supports both object and array formats)
2. **Save to Firebase**: Store quiz in Firestore with user_id and metadata
3. **Update Context**: Set quiz in `QuizContext` to make it available globally
4. **Show Button**: Button automatically appears in header when `hasActiveQuiz` is true
5. **Display Message**: Show quiz intro message in chat with "View Quiz" button

### 3. Quiz Context

**Location**: `src/contexts/QuizContext.tsx`

**Properties**:
- `currentQuiz`: The active quiz object or null
- `setCurrentQuiz`: Function to set the current quiz
- `hasActiveQuiz`: Boolean computed from `currentQuiz !== null`
- `isQuizPanelOpen`: Whether the quiz panel is open
- `openQuizPanel`: Function to open the quiz panel
- `closeQuizPanel`: Function to close the quiz panel

### 4. Header Quiz Button

**Location**: `src/pages/Index.tsx`

**Appearance**: 
- Only shows when `hasActiveQuiz` is true
- Displays: "Take Quiz" with book icon
- Shows question count in parentheses: "(5)"
- Positioned next to "Exam Prep Assistant" heading

**Functionality**:
- Clicking opens the quiz panel on the right
- Button has primary styling to stand out

```tsx
{hasActiveQuiz && (
  <Button
    variant="default"
    size="sm"
    onClick={openQuizPanel}
    className="ml-3 gap-2"
  >
    <BookOpen className="w-4 h-4" />
    <span>Take Quiz</span>
    {currentQuiz?.questions && (
      <span className="ml-1 text-xs opacity-80">
        ({currentQuiz.questions.length})
      </span>
    )}
  </Button>
)}
```

### 5. Firebase Security Rules

**Collection**: `quizzes`

**Rules**:
```
match /quizzes/{quizId} {
  // Users can only read their own quizzes
  allow read: if isAuthenticated() && 
                 resource.data.user_id == request.auth.uid;
  
  // Users can only create quizzes with their own user_id
  allow create: if isAuthenticated() && 
                   request.resource.data.user_id == request.auth.uid &&
                   request.resource.data.keys().hasAll(['user_id', 'title', 'questions', 'createdAt', 'userPlan']);
  
  // Users can update their own quizzes
  allow update: if isAuthenticated() && 
                   resource.data.user_id == request.auth.uid;
  
  // Users can delete their own quizzes
  allow delete: if isAuthenticated() && 
                   resource.data.user_id == request.auth.uid;
}
```

### 6. Firestore Service Functions

**Location**: `src/lib/firestoreService.ts`

**Functions**:
- `saveQuizToFirestore(quizData)`: Save a quiz to Firestore
- `getUserQuizzes(userId)`: Get all quizzes for a user (sorted newest first)
- `getLatestUserQuiz(userId)`: Get the most recent quiz for a user
- `deleteQuizFromFirestore(quizId)`: Delete a specific quiz
- `deleteAllUserQuizzes(userId)`: Delete all quizzes for a user

### 7. User Experience

**When quiz is generated**:
1. User asks a question like "Generate a quiz for me"
2. Webhook returns quiz data in response
3. Chat shows: "I've generated a quiz for you based on your materials!"
4. "View Quiz" button appears in the chat message
5. **"Take Quiz"** button appears in the header
6. Quiz is saved to Firebase with user_id

**Taking the quiz**:
- Click "Take Quiz" button in header OR
- Click "View Quiz" button in chat message
- Quiz panel slides in from the right
- User can answer questions and see results
- Quiz persists across sessions (stored in Firebase)

### 8. Data Flow

```
Webhook Response → Parse Quiz → Save to Firebase
                                       ↓
                              Update QuizContext
                                       ↓
                           hasActiveQuiz = true
                                       ↓
                         Header Button Appears
```

## Example Webhook Response

```json
{
  "answer": "",
  "quiz": {
    "question1": {
      "question": "What is React?",
      "choice": ["Library", "Framework", "Language", "Tool"],
      "answer": "Library",
      "explanation": "React is a JavaScript library for building UIs"
    },
    "question2": {
      "question": "What is JSX?",
      "choice": ["JavaScript XML", "Java Syntax", "JSON Extended"],
      "answer": "JavaScript XML"
    }
  }
}
```

## Benefits

✅ **Persistent Access**: Quiz saved in Firebase, available across sessions
✅ **Quick Access**: Button in header provides one-click access to quiz
✅ **User Data Tracking**: Each quiz linked to user_id and plan
✅ **Scalable**: Can extend to show quiz history, multiple quizzes, etc.
✅ **Secure**: Firebase rules ensure users only access their own quizzes

## Future Enhancements

- Quiz history dropdown showing past quizzes
- Quiz results tracking and analytics
- Quiz sharing between users (for pro plan)
- Timed quizzes with countdown timer
- Quiz performance metrics and insights

