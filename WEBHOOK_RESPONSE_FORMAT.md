# Webhook Response Format

This document describes the expected format for responses from the n8n webhook.

## Response Structure

The webhook should return a JSON object with two main fields:

```json
{
  "answer": "text response or empty string",
  "quiz": { /* quiz object or null */ }
}
```

## Response Scenarios

### 1. Text Answer Only (No Quiz)

When providing a text answer without a quiz:

```json
{
  "answer": "This is the answer to your question based on the uploaded materials...",
  "quiz": null
}
```

### 2. Quiz Only (No Text Answer)

When generating a quiz without additional text:

```json
{
  "answer": "",
  "quiz": {
    "question1": {
      "question": "What does the 'd' symbol indicate?",
      "choice": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Optional explanation here"
    },
    "question2": {
      "question": "Second question?",
      "choice": ["Choice 1", "Choice 2", "Choice 3"],
      "answer": "Choice 2",
      "explanation": "Optional explanation"
    }
  }
}
```

### 3. Both Answer and Quiz

When providing both a text answer and a quiz:

```json
{
  "answer": "Here's a detailed explanation... I've also generated a quiz to help you test your knowledge!",
  "quiz": {
    "question1": {
      "question": "Test question 1?",
      "choice": ["A", "B", "C"],
      "answer": "B"
    }
  }
}
```

## Quiz Object Format

### Current Format (Quizzes Array) - **RECOMMENDED**

```json
{
  "quizzes": [
    {
      "question": "Question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer": "Option 2"  // String matching one of the options
    },
    {
      "question": "Second question?",
      "options": ["A", "B", "C", "D"],
      "answer": "B"
    }
  ]
}
```

**Field Descriptions:**
- `quizzes`: Array of question objects
- `question`: The question text (string)
- `options`: Array of possible answers (string[])
- `answer`: The correct answer as a string that matches one item in the `options` array

### Alternative Format (Object with numbered keys)

```json
{
  "question1": {
    "question": "Question text here?",
    "choice": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": "Option 2",  // String matching one of the choices
    "explanation": "Optional explanation text"
  },
  "question2": { /* ... */ },
  "question3": { /* ... */ }
}
```

**Field Descriptions:**
- `questionN`: Key format where N is the question number (1, 2, 3, etc.)
- `question`: The question text (string)
- `choice`: Array of possible answers (string[])
- `answer`: The correct answer as a string that matches one item in the `choice` array
- `explanation`: (Optional) Explanation for the correct answer

### Legacy Format (Array) - Still Supported

```json
[
  {
    "question": "Question text?",
    "options": ["Option 1", "Option 2", "Option 3"],
    "correctAnswer": 1,  // Index of correct answer (0-based)
    "explanation": "Optional explanation"
  }
]
```

## Processing Logic

The frontend handles both formats:

1. **Answer Field**:
   - If `answer` is not empty → Display as text response
   - If `answer` is empty → Show default quiz intro message

2. **Quiz Field**:
   - If `quiz` is an object with `question1`, `question2`, etc. → Parse as new format
   - If `quiz` is an array → Parse as legacy format
   - Extract questions and convert `answer` string to index in `choice` array
   - Display "View Quiz" button if quiz is present

## Example Responses from Your Webhook

### Example 1: Quiz Generation (Current Format)

```json
{
  "answer": "",
  "quiz": {
    "quizzes": [
      {
        "question": "In the EER diagram, which entity is specialized into CAR, TRUCK, and SUV?",
        "options": ["SALE", "VEHICLE", "SALESPERSON", "CUSTOMER"],
        "answer": "VEHICLE"
      },
      {
        "question": "What does the 'd' symbol indicate in the specialization of VEHICLE?",
        "options": [
          "Disjoint specialization",
          "Overlapping specialization",
          "Total participation",
          "Partial participation"
        ],
        "answer": "Disjoint specialization"
      },
      {
        "question": "Which table in the relational schema contains columns for Vin, Price, Model?",
        "options": ["SALE", "CUSTOMER", "SALESPERSON", "VEHICLE"],
        "answer": "VEHICLE"
      }
    ]
  }
}
```

### Example 2: Summarization Response

```json
{
  "answer": "# Summary of HW EER-to-Relational Mapping.pdf\n\nThis document outlines a relational schema derived from an EER diagram.\n\n## Key Points:\n\n- **VEHICLE** entity has specializations: CAR, TRUCK, SUV\n- Disjoint specialization indicated by 'd' symbol\n- **SALE** table links vehicles, salespeople, and customers\n\n## Tables:\n\n1. **VEHICLE**: Vin, Price, Model, Engine_Size, Tonnage, No_seats\n2. **SALESPERSON**: Sid, Name\n3. **CUSTOMER**: Ssn, Name, Address\n4. **SALE**: Vin, Sid, Ssn, Date",
  "quiz": ""
}
```

**Rendering**: The markdown in `answer` is automatically formatted with proper headings, bold text, lists, etc.

## Frontend Behavior

- **If answer is empty and quiz exists**: Show "I've generated a quiz for you based on your materials!" + View Quiz button
- **If answer has text and quiz exists**: Show the answer text + View Quiz button
- **If only answer exists (no quiz)**: Show the answer text only
- **If neither exists**: Show fallback message

## Current Webhook URL

- **Chatbot**: `https://siroj6253.app.n8n.cloud/webhook-test/c5b0185d-0f9d-4d13-ad53-12aa607eedfa`
- **File Upload**: `https://siroj6253.app.n8n.cloud/webhook/5b30d074-175b-4407-90b0-e638ad0f5026`

