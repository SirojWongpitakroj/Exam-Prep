# 🎯 Quiz & Answer Webhook Integration

## Summary

The chat now **waits for the webhook response** and can handle both:
1. **Regular answers** - Display text responses from your AI
2. **Quiz generation** - Parse quiz data and show a "View Quiz" button

---

## 🔄 How It Works

### 1. **User Sends Message**
- User types a question and presses Enter
- Message shows immediately in chat
- Typing indicator appears (`●●●`)

### 2. **Webhook Request Sent**
The app sends POST request to:
```
https://siroj6253.app.n8n.cloud/webhook-test/c5b0185d-0f9d-4d13-ad53-12aa607eedfa
```

With payload:
```json
{
  "message": "User's question",
  "user_id": "firebase-user-uid",
  "userPlan": "free",
  "timestamp": "2025-11-17T12:34:56.789Z",
  "checkedFiles": [...]
}
```

### 3. **Wait for Webhook Response**
- App **waits** for your n8n workflow to respond
- Typing indicator shows while waiting
- Can take 1 second or 30 seconds - app waits!

### 4. **Process Response**
The app handles two types of responses:

#### Type A: Regular Answer
```json
{
  "answer": "Here's the explanation..."
}
```
Result: Shows answer text in chat

#### Type B: Answer + Quiz
```json
{
  "answer": "Here's the explanation...",
  "quiz": [
    {
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 2,
      "explanation": "Optional explanation"
    }
  ],
  "quizTitle": "Biology Quiz"
}
```
Result: Shows answer text + "View Quiz" button

---

## 📤 Expected Webhook Response Format

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `answer` | string | The text response to display | "Photosynthesis is..." |

### Optional Fields (for Quiz)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `quiz` | array | Array of question objects | See below |
| `quizTitle` | string | Title for the quiz | "Biology Quiz" |
| `quizIntro` | string | Intro text before answer | "I've generated a quiz!" |

### Quiz Question Object

Each question in the `quiz` array should have:

```json
{
  "question": "What is photosynthesis?",
  "options": [
    "Process A",
    "Process B", 
    "Process C",
    "Process D"
  ],
  "correctAnswer": 1,  // 0-indexed (1 = "Process B")
  "explanation": "Optional: Why this is correct"
}
```

---

## 🎨 User Experience

### Scenario 1: Regular Answer

**User**: "Explain photosynthesis"

**Webhook Response**:
```json
{
  "answer": "Photosynthesis is the process by which plants convert light energy into chemical energy..."
}
```

**Result in Chat**:
```
┌──────────────────────────────────┐
│ User:                            │
│ Explain photosynthesis           │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Assistant:                       │
│ Photosynthesis is the process   │
│ by which plants convert light    │
│ energy into chemical energy...   │
└──────────────────────────────────┘
```

---

### Scenario 2: Answer with Quiz

**User**: "Create a quiz on photosynthesis"

**Webhook Response**:
```json
{
  "answer": "I've created a quiz to test your knowledge on photosynthesis!",
  "quiz": [
    {
      "question": "What is the primary pigment in photosynthesis?",
      "options": ["Carotene", "Chlorophyll", "Xanthophyll", "Melanin"],
      "correctAnswer": 1
    },
    {
      "question": "Where does photosynthesis occur?",
      "options": ["Mitochondria", "Nucleus", "Chloroplasts", "Ribosomes"],
      "correctAnswer": 2
    }
  ],
  "quizTitle": "Photosynthesis Quiz"
}
```

**Result in Chat**:
```
┌──────────────────────────────────┐
│ User:                            │
│ Create a quiz on photosynthesis  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Assistant:                       │
│ I've generated a quiz for you!   │
│                                  │
│ I've created a quiz to test your│
│ knowledge on photosynthesis!     │
│                                  │
│ ┌────────────────────────────┐  │
│ │  📖 View Quiz (2 questions)│  │ ← Clickable button!
│ └────────────────────────────┘  │
└──────────────────────────────────┘
```

**When User Clicks "View Quiz"**:
- Quiz panel slides in from the right
- Shows questions one at a time
- Tracks answers
- Shows score at the end

---

## 🔧 Implementation Details

### Created Files:
1. **`src/contexts/QuizContext.tsx`** - Manages quiz state
2. Updated **`src/App.tsx`** - Added QuizProvider
3. Updated **`src/components/ChatInterface.tsx`** - Handles webhook responses
4. Updated **`src/pages/Index.tsx`** - Shows QuizPanel
5. Updated **`src/components/QuizPanel.tsx`** - Uses quiz from context

### Key Features:
- ✅ **Waits for webhook** - Uses `await fetch()` 
- ✅ **Parses JSON response** - Extracts `answer` and `quiz`
- ✅ **Shows typing indicator** - While waiting
- ✅ **Flexible field names** - Supports `answer`, `response`, or `message`
- ✅ **Quiz button** - Only shows if quiz data present
- ✅ **Context-based** - Quiz state shared across components

---

## 📝 n8n Webhook Setup

### Example n8n Workflow

```javascript
// In your n8n workflow (Code node):

const userMessage = $json.message;
const checkedFiles = $json.checkedFiles || [];

// Your AI processing logic here...
let answer = "Your AI-generated answer";
let quiz = null;

// Check if user asked for a quiz
if (userMessage.toLowerCase().includes("quiz") || 
    userMessage.toLowerCase().includes("test me")) {
  
  quiz = [
    {
      question: "Sample question 1?",
      options: ["A", "B", "C", "D"],
      correctAnswer: 1
    },
    {
      question: "Sample question 2?",
      options: ["A", "B", "C", "D"],
      correctAnswer: 0
    }
  ];
}

// Return response
return {
  answer: answer,
  quiz: quiz,
  quizTitle: "Practice Quiz"
};
```

---

## 🧪 Testing

### Test 1: Regular Answer

1. Type: "What is photosynthesis?"
2. Press Enter
3. Watch typing indicator
4. See answer appear

**Expected**: Text response, no quiz button

### Test 2: Answer with Quiz

1. Type: "Create a quiz on biology"
2. Press Enter
3. Watch typing indicator
4. See answer + quiz button

**Expected**: Text response + "View Quiz" button

### Test 3: Click Quiz Button

1. After quiz appears, click "View Quiz"
2. Quiz panel slides in from right
3. Answer questions
4. See results

**Expected**: Interactive quiz with scoring

---

## 🎯 Response Field Variations

The app supports multiple field names for flexibility:

### For Answer Text:
- `result.answer` (preferred)
- `result.response`
- `result.message`

### For Quiz Data:
- `result.quiz` (must be array)

### For Quiz Title:
- `result.quizTitle`
- `result.quiz_title`

### For Quiz Intro:
- `result.quizIntro`
- `result.quiz_intro`

### For Correct Answer:
- `q.correctAnswer`
- `q.correct_answer`

---

## 📊 Data Flow Diagram

```
User Types → Send to Webhook → Wait ⏳
                                 ↓
                           Webhook Processes
                           (AI generates response)
                                 ↓
                           Return JSON
                                 ↓
                  ┌──────────────┴──────────────┐
                  │                             │
          Has "quiz"?                    No "quiz"?
                  │                             │
                  ↓                             ↓
      Show Answer + Quiz Button      Show Answer Only
                  │
                  └→ User clicks button
                              ↓
                        Open Quiz Panel
```

---

## ✅ Success Criteria

After implementation:
- ✅ Chat waits for webhook response
- ✅ Typing indicator shows while waiting
- ✅ Regular answers display correctly
- ✅ Quiz button appears when quiz data present
- ✅ Clicking button opens quiz panel
- ✅ Quiz questions display correctly
- ✅ Can answer and see results

---

## 🚀 Next Steps for Your n8n Workflow

1. **Set up AI integration** in n8n
2. **Parse user question** and checked files
3. **Generate appropriate response**
4. **Decide if quiz needed**
5. **Return JSON** in correct format
6. **Test with different question types**

---

## 💡 Tips

- **Quiz generation logic** should be in your n8n workflow
- **Answer quality** depends on your AI integration
- **Quiz difficulty** can vary based on user plan
- **File context** is available via `checkedFiles` array

---

🎉 **Implementation Complete!** Your chat now intelligently handles both answers and quizzes from your webhook.

