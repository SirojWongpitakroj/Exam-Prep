# Usage Tracking Implementation - Free Tier Limits

## Overview
Free tier users now have usage limits:
- **Chat Messages**: Maximum 3 messages
- **Quiz Generation**: Maximum 1 quiz

Pro users have unlimited usage.

## How It Works

### Database Structure (Firestore)

**Collection**: `user_usage`

**Document Structure**:
```javascript
{
  user_id: "abc123",
  chatCount: 2,          // Number of chat messages sent
  quizCount: 0,          // Number of quizzes generated
  lastChatAt: Timestamp, // Last chat timestamp
  lastQuizAt: Timestamp, // Last quiz generated timestamp
  userPlan: "free",      // or "pro"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Workflow

#### Chat Message Flow:
1. User types message and presses send
2. System checks: `canUserChat(user_id, plan)`
3. If **free** and `chatCount >= 3` → **Block** with error message
4. If **allowed** → Send message
5. After successful send → `incrementChatCount(user_id)`

#### Quiz Generation Flow:
1. Webhook response contains quiz data
2. System detects quiz with "Quiz" in `from` field
3. System checks: `canUserGenerateQuiz(user_id, plan)`
4. If **free** and `quizCount >= 1` → **Block** with error message
5. If **allowed** → Save quiz
6. After successful save → `incrementQuizCount(user_id)`

## Functions

### `canUserChat(userId, userPlan)`
Returns:
```javascript
{
  allowed: true/false,
  remaining: 2,  // Messages remaining
  reason: "Free plan limit reached (3 messages)..."
}
```

### `canUserGenerateQuiz(userId, userPlan)`
Returns:
```javascript
{
  allowed: true/false,
  remaining: 0,  // Quizzes remaining
  reason: "Free plan limit reached (1 quiz)..."
}
```

### `incrementChatCount(userId)`
- Increments `chatCount` by 1
- Updates `lastChatAt` timestamp
- Updates `updatedAt` timestamp

### `incrementQuizCount(userId)`
- Increments `quizCount` by 1
- Updates `lastQuizAt` timestamp
- Updates `updatedAt` timestamp

## User Experience

### Free Tier User:

**Chat Limits**:
- Message 1: ✅ Sent successfully
- Message 2: ✅ Sent successfully
- Message 3: ✅ Sent successfully
- Message 4: ❌ Error: "Free plan limit reached (3 messages). Upgrade to Pro for unlimited chats!"

**Quiz Limits**:
- Quiz 1: ✅ Generated successfully
- Quiz 2: ❌ Error: "Free plan limit reached (1 quiz). Upgrade to Pro for unlimited quizzes!"

### Pro Tier User:
- ✅ Unlimited chats
- ✅ Unlimited quizzes
- No tracking/limits applied

## Error Messages

### Chat Limit Reached:
```
❌ Free plan limit reached (3 messages). Upgrade to Pro for unlimited chats!
```

### Quiz Limit Reached:
```
❌ Free plan limit reached (1 quiz). Upgrade to Pro for unlimited quizzes!
```

## Firestore Rules

Added rules for `user_usage` collection:

```javascript
match /user_usage/{usageId} {
  // Users can only read/write their own usage data
  allow read: if isAuthenticated() && 
                 resource.data.user_id == request.auth.uid;
  
  allow create: if isAuthenticated() && 
                   request.resource.data.user_id == request.auth.uid;
  
  allow update: if isAuthenticated() && 
                   resource.data.user_id == request.auth.uid;
  
  allow delete: if isAuthenticated() && 
                   resource.data.user_id == request.auth.uid;
}
```

## Console Logs

When usage is tracked:
```
📊 Chat count incremented
```

When limit is reached:
```
⚠️ Quiz generation limit reached
❌ Free plan limit reached (1 quiz). Upgrade to Pro for unlimited quizzes!
```

## Testing

### Test Free Tier Limits:

1. **Create a free tier user** (or ensure user.plan === 'free')

2. **Test Chat Limit**:
   - Send message 1 → Should work
   - Send message 2 → Should work
   - Send message 3 → Should work
   - Send message 4 → Should be blocked with error toast

3. **Test Quiz Limit**:
   - Generate quiz 1 → Should work
   - Generate quiz 2 → Should be blocked with error toast

4. **Check Firestore**:
   - Go to Firebase Console → Firestore
   - Check `user_usage` collection
   - Find your user document
   - Verify counts are correct

### Test Pro Tier (Unlimited):

1. **Upgrade to Pro** (set user.plan = 'pro')
2. Send 10+ messages → All should work
3. Generate 5+ quizzes → All should work

## Resetting Usage (Admin Only)

To reset a user's usage counts:

1. Go to Firebase Console → Firestore
2. Find `user_usage` collection
3. Find user's document
4. Edit fields:
   - Set `chatCount` to 0
   - Set `quizCount` to 0
5. Save

Or delete the document entirely (will be recreated on next use).

## Important Notes

1. **Initialization**: Usage document is auto-created on first use
2. **Pro Users**: No limits, no tracking needed
3. **Error Handling**: If tracking fails, allows action (fail-open)
4. **Persistence**: Counts survive logout/login
5. **Per User**: Each user has their own independent limits

## Future Enhancements

Could add:
- Daily/weekly limits (reset every day/week)
- Usage analytics dashboard
- Email notifications when approaching limit
- Grace period after reaching limit
- Temporary limit increases

