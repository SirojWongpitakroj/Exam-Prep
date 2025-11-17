# 📋 File Selection Limits by Plan

## Summary

Users can now select (check) files based on their subscription plan:
- **Free Plan**: Can check **only 1 file** at a time
- **Pro Plan**: Can check **unlimited files**

---

## 🎯 How It Works

### Free Tier Users

**Limit**: 1 file selection

**Behavior**:
1. User can check one checkbox
2. When trying to check a second file:
   - ❌ Checkbox doesn't check
   - 🔔 Toast notification appears:
     ```
     "Free plan allows only 1 file to be selected at a time. 
     Upgrade to Pro for unlimited selections!"
     ```
3. User must uncheck the first file before checking another

**Visual Indicator**:
- Header shows: `Select 1 file`

### Pro Tier Users

**Limit**: Unlimited

**Behavior**:
1. User can check multiple checkboxes
2. All checked files are sent to webhook
3. No restrictions

**Visual Indicator**:
- No limit text shown

---

## 📊 User Flow

### Free User Scenario:

```
Upload 3 files:
[ ] biology_notes.pdf
[ ] chemistry.pdf
[ ] physics.pdf

User clicks checkbox on biology_notes.pdf
↓
[✓] biology_notes.pdf  ← Checked!
[ ] chemistry.pdf
[ ] physics.pdf

User tries to click checkbox on chemistry.pdf
↓
[✓] biology_notes.pdf  ← Still checked
[ ] chemistry.pdf      ← Doesn't check!
[ ] physics.pdf

🔔 Toast: "Free plan allows only 1 file..."

User unchecks biology_notes.pdf
↓
[ ] biology_notes.pdf  ← Unchecked
[ ] chemistry.pdf
[ ] physics.pdf

User clicks checkbox on chemistry.pdf
↓
[ ] biology_notes.pdf
[✓] chemistry.pdf      ← Now it checks!
[ ] physics.pdf
```

### Pro User Scenario:

```
Upload 3 files:
[ ] biology_notes.pdf
[ ] chemistry.pdf
[ ] physics.pdf

User clicks all 3 checkboxes
↓
[✓] biology_notes.pdf  ← All checked!
[✓] chemistry.pdf      ← All checked!
[✓] physics.pdf        ← All checked!

✅ All 3 files sent to webhook
```

---

## 🔧 Technical Implementation

### Code Location
**File**: `src/components/FileUploadSidebar.tsx`

### Key Function: `toggleFileCheck`

```typescript
const toggleFileCheck = (id: string) => {
  setFiles((prev) => {
    const fileToToggle = prev.find(f => f.id === id);
    if (!fileToToggle) return prev;

    const isChecking = !fileToToggle.checked;
    
    // For free tier users, limit to 1 checked file
    if (user?.plan === 'free' && isChecking) {
      const currentlyCheckedCount = prev.filter(f => f.checked && f.id !== id).length;
      
      if (currentlyCheckedCount >= 1) {
        toast.error('Free plan allows only 1 file to be selected at a time. Upgrade to Pro for unlimited selections!');
        return prev; // Don't change state
      }
    }

    // Toggle the checkbox
    const updatedFiles = prev.map((file) =>
      file.id === id ? { ...file, checked: !file.checked } : file
    );
    saveFilesToStorage(updatedFiles);
    return updatedFiles;
  });
};
```

### Logic Flow:

1. **Check user's plan** (`user?.plan`)
2. **Count currently checked files**
3. **If free user** AND **trying to check** AND **already has 1 checked**:
   - Show error toast
   - Return without changing state
4. **Otherwise**: Toggle checkbox normally

---

## 🎨 UI Elements

### Visual Indicators

#### Free Plan:
```
┌─────────────────────────────────┐
│ Uploaded Files    Select 1 file │ ← Limit indicator
├─────────────────────────────────┤
│ [✓] biology_notes.pdf           │
│ [ ] chemistry.pdf               │
│ [ ] physics.pdf                 │
└─────────────────────────────────┘
```

#### Pro Plan:
```
┌─────────────────────────────────┐
│ Uploaded Files                  │ ← No limit shown
├─────────────────────────────────┤
│ [✓] biology_notes.pdf           │
│ [✓] chemistry.pdf               │
│ [✓] physics.pdf                 │
└─────────────────────────────────┘
```

---

## 📤 Impact on Webhook

### Free User (1 file checked):
```json
{
  "message": "Explain this",
  "user_id": "user-123",
  "userPlan": "free",
  "checkedFiles": [
    {
      "fileName": "biology_notes.pdf",
      "fileType": "application/pdf"
    }
  ]
}
```

### Pro User (3 files checked):
```json
{
  "message": "Explain this",
  "user_id": "user-456",
  "userPlan": "pro",
  "checkedFiles": [
    {
      "fileName": "biology_notes.pdf",
      "fileType": "application/pdf"
    },
    {
      "fileName": "chemistry.pdf",
      "fileType": "application/pdf"
    },
    {
      "fileName": "physics.pdf",
      "fileType": "application/pdf"
    }
  ]
}
```

---

## 🧪 Testing

### Test 1: Free User Single Selection

1. Login with free account
2. Upload 2 files
3. Check first file ✅
4. Try to check second file
5. **Expected**: Error toast, second file not checked

### Test 2: Free User Can Switch

1. Have 1 file checked
2. Uncheck it
3. Check a different file
4. **Expected**: Works fine, only 1 checked at a time

### Test 3: Pro User Multiple Selection

1. Login with pro account (or upgrade to pro)
2. Upload 3+ files
3. Check all files
4. **Expected**: All files checked, no errors

### Test 4: Plan Change

1. Start as free user with 3 files uploaded and 1 checked
2. Upgrade to pro plan
3. Try checking more files
4. **Expected**: Can now check multiple files

---

## 💡 User Experience Benefits

### Clear Limitations
- ✅ Users immediately see their plan limitations
- ✅ Error message explains why and offers upgrade

### Upgrade Incentive
- 💰 Free users see benefit of Pro plan
- 💰 Error message mentions "Upgrade to Pro"
- 💰 Natural conversion point

### Prevents Confusion
- ✅ Visual indicator shows limit
- ✅ Can't accidentally select multiple (free)
- ✅ Immediate feedback via toast

---

## 🔄 Related Features

### Works Together With:

1. **File Upload Limits**
   - Free: Max 3 PDFs, 5 images, 1 CSV
   - Pro: Unlimited

2. **Webhook Integration**
   - Sends only checked files
   - Plan info included in payload

3. **Plan Upgrade Flow**
   - Toast message links to upgrade
   - `/pricing` page shows benefits

---

## 📝 Edge Cases Handled

### Scenario 1: User Downgrades from Pro to Free
- If user already has 3 files checked
- Downgrade to free
- Result: Existing checks remain until user changes them
- Next check attempt: Enforces 1-file limit

### Scenario 2: Page Reload
- Checked files persist in localStorage
- Plan check happens on every toggle
- Correct limits enforced

### Scenario 3: Multiple Tabs
- Each tab has independent state
- localStorage syncs checked files
- Plan limits enforced per action

---

## ✅ Success Criteria

Implementation is successful when:

- ✅ Free users can only check 1 file
- ✅ Pro users can check unlimited files
- ✅ Error toast shows for free users at limit
- ✅ Visual indicator shows "Select 1 file" for free
- ✅ Checked files sent to webhook correctly
- ✅ Plan change reflects immediately

---

## 🚀 Future Enhancements

Potential improvements:
- Show checked count: "1/1 selected" (free) vs "3 selected" (pro)
- Highlight which file is checked with different color
- Allow free users to "replace" selection in one click
- Add tooltip explaining the limit on hover

---

🎉 **Feature Complete!** File selection now respects plan limits.

