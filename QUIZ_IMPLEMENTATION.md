# Quiz Detection and Firebase Storage Implementation

## Overview
This implementation automatically detects quiz responses from the AI webhook, stores them in Firebase Firestore, and loads the most recent quiz when the user clicks "View Quiz".

## How It Works

### 1. Quiz Detection (ChatInterface.tsx)

When the chatbot receives a response from the webhook, it checks if any item in the response array has `"from"` containing the word "Quiz":

```typescript
if (item.output.from && typeof item.output.from === 'string' && 
    item.output.from.toLowerCase().includes('quiz'))
```

### 2. Quiz Parsing

When a quiz is detected, the system:
- Extracts the `quizzes` array from `item.output.quizzes`
- Converts each quiz question to the proper format
- Handles both string and number answers by converting string answers to option indices
- Maps the file names from checked files to create a quiz title

### 3. Firebase Storage

The parsed quiz is saved to Firestore with:
- `user_id`: User's Firebase authentication ID
- `title`: Generated from checked file names (e.g., "Quiz - HW EER-to-Relational Mapping.pdf")
- `questions`: Array of quiz questions with options and correct answers
- `createdAt`: Timestamp for sorting
- `userPlan`: User's current plan (free/pro)

### 4. Quiz Loading

When the user clicks "View Quiz":
1. Navigate to `/quiz` page
2. Quiz page automatically calls `getLatestUserQuiz(user.id)`
3. Loads the most recent quiz from Firebase (sorted by `createdAt` descending)
4. Displays the quiz with full functionality

## Webhook Response Format

The system expects this format from the Quiz AI Agent:

```json
[
  {
    "output": {
      "quizzes": [
        {
          "question": "Which planet is known as the Red Planet?",
          "options": ["Earth", "Mars", "Jupiter", "Venus"],
          "answer": "Mars"
        }
      ],
      "from": "Quiz AI Agent"
    }
  }
]
```

## Key Features

1. **Automatic Detection**: No manual trigger needed - quiz is detected and saved automatically
2. **Firebase Persistence**: Quizzes are stored in Firestore and persist across sessions
3. **Most Recent First**: Always loads the latest quiz generated
4. **File Context**: Quiz title includes the names of files used to generate it
5. **User Isolation**: Each user only sees their own quizzes (filtered by `user_id`)
6. **Error Handling**: Graceful fallbacks if quiz detection or loading fails

## Database Structure

### Firestore Collection: `quizzes`

```typescript
{
  id: string,              // Auto-generated Firestore document ID
  user_id: string,         // Firebase auth user ID
  title: string,           // "Quiz - {fileName(s)}"
  questions: [
    {
      id: string,          // "q-{timestamp}-{index}"
      question: string,
      options: string[],
      correctAnswer: number, // Index of correct option
      explanation?: string
    }
  ],
  createdAt: Timestamp,    // Firebase timestamp
  userPlan: "free" | "pro"
}
```

## User Flow

1. User uploads files and asks for a quiz
2. Webhook responds with quiz data (from "Quiz AI Agent")
3. System detects "Quiz" in the `from` field
4. Quiz is automatically saved to Firebase
5. Toast notification: "Quiz generated! Click 'View Quiz' to start."
6. Chat message: "I've generated a quiz for you..."
7. "View Quiz" button becomes enabled
8. User clicks button → navigates to `/quiz` page
9. Quiz page loads most recent quiz from Firebase
10. User takes the quiz with full functionality

## Console Logs

For debugging, the system logs:
- `🎯 Quiz detected! From: {from_field}`
- `📝 Parsed quiz questions: {count}`
- `💾 Quiz saved to Firestore with ID: {id}`
- `📚 Loaded quiz from Firebase: {title}`

## Benefits

- **Persistence**: Quizzes survive logout/login and page refreshes
- **History**: All quizzes are stored (can be extended to show quiz history)
- **Reliability**: Uses Firebase's robust cloud infrastructure
- **Performance**: Queries are optimized with sorting at the database level
- **Scalability**: Can easily add features like quiz history, favorites, etc.

