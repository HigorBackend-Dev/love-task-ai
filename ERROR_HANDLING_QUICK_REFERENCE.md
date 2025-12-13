# Error Handling Quick Reference

## 🎯 Quick Implementation Guide

### For Developers: How to Use Error Handling

#### 1. Import the Error Message System
```typescript
import { getErrorMessage } from '@/lib/error-messages';
```

#### 2. Use in Try-Catch Blocks
```typescript
try {
  // Your operation
  await operation();
} catch (error) {
  const message = getErrorMessage(error);
  toast({
    title: 'Operation Failed',
    description: message,
    variant: 'destructive'
  });
}
```

#### 3. Validate Before Operation
```typescript
if (!input.trim()) {
  setError('Input cannot be empty.');
  return; // Don't proceed
}
```

---

## 📋 Error Handling by File

### src/lib/error-messages.ts
**Purpose:** Centralized error message mapping  
**Key Functions:**
- `getErrorMessage(error)` → Returns user-friendly message
- `isAuthError(error)` → Checks if authentication error
- `isNetworkError(error)` → Checks if network error
- `isValidationError(error)` → Checks if validation error

### src/pages/Auth.tsx
**Protected with:**
- Email format validation
- Password length validation (6+ chars)
- Password confirmation matching
- Clear error display with Alert component
- Error clearing on input change

### src/contexts/AuthContext.tsx
**Provides:**
- `error` state for auth errors
- `clearError()` function
- Validation in signUp/signIn
- Structured error responses

### src/hooks/useTasks.ts
**Protected operations:**
- `createTask()` - Title validation
- `updateTask()` - Title validation + re-enhancement
- `enhanceTask()` - Timeout handling + fallback
- `suggestEdit()` - Prompt validation
- `deleteTask()` - Error handling
- `toggleComplete()` - Operation errors

### src/components/TaskForm.tsx
**Validation:**
- Empty title check
- Character limit (200)
- Inline error display
- Loading states

### src/components/TaskItem.tsx
**Validation:**
- Edit mode title validation
- AI suggestion prompt validation
- Inline error alerts
- Better UI feedback

### src/pages/Dashboard.tsx
**Error Display:**
- Auth error banner at top
- Sign out error handling
- Dismissable alerts

### src/pages/Settings.tsx
**Validation:**
- Profile photo: type + size
- Profile form: required fields + email format
- Password change: length + match
- Separate error states per section

---

## ✅ User-Facing Error Messages

### Authentication
| Scenario | Message |
|----------|---------|
| Invalid email format | "Please enter a valid email address." |
| Password < 6 chars | "Password must be at least 6 characters long." |
| Passwords don't match | "Passwords do not match. Please try again." |
| Wrong credentials | "Invalid email or password. Please try again." |
| Email not confirmed | "Please confirm your email before logging in." |
| Email already used | "Email already registered. Please use another email." |

### Tasks
| Scenario | Message |
|----------|---------|
| Empty title | "Task title cannot be empty." |
| Title too long | "Task title must be less than 200 characters." |
| Network error | "Check your connection to Supabase." |
| AI timeout | "AI Enhancement Failed: Could not enhance task..." |
| Permission denied | "You don't have permission to modify this task." |

### Settings
| Scenario | Message |
|----------|---------|
| Non-image file | "Please select an image file (JPG, PNG, etc)." |
| File too large | "Image must be smaller than 5MB." |
| Empty name | "Full name cannot be empty." |
| Invalid email | "Please enter a valid email address." |
| Short password | "Password must be at least 6 characters long." |
| Password mismatch | "Passwords do not match. Please try again." |

---

## 🔄 Error Flow Diagram

```
User Action
    ↓
Input Validation
    ↓ (Invalid)
Show Error Alert
    ↓ (Valid)
Attempt Operation
    ↓ (Error)
Catch Exception
    ↓
Get Error Message
    ↓
Display Toast
    ↓ (Success)
Show Success Toast
    ↓
Clear Form / Update UI
```

---

## 🎨 UI Components Used

### Alert Component
```tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>{errorMessage}</AlertDescription>
</Alert>
```

### Toast Notification
```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: 'Operation Status',
  description: 'Detailed message here',
  variant: 'destructive' // for errors only
});
```

---

## 📝 Validation Patterns

### Required Field
```typescript
if (!value.trim()) {
  setError('This field is required.');
  return;
}
```

### Email Format
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  setError('Please enter a valid email address.');
  return;
}
```

### Minimum Length
```typescript
if (password.length < 6) {
  setError('Password must be at least 6 characters long.');
  return;
}
```

### Maximum Length
```typescript
if (title.length > 200) {
  setError('Title must be less than 200 characters.');
  return;
}
```

### Matching Fields
```typescript
if (password !== confirmPassword) {
  setError('Passwords do not match.');
  return;
}
```

---

## 🧪 Testing Error States

### Test Form Validation
```typescript
// Leave field empty → should show required message
// Enter invalid format → should show format message
// Enter valid data → should allow submission
// Click input after error → error should clear
```

### Test API Errors
```typescript
// Disconnect network → should show network error
// Invalid credentials → should show auth error
// Permission denied → should show permission message
// Timeout → should show timeout message
```

### Test Success States
```typescript
// Valid submission → should show success toast
// Form should clear
// State should update
// No error alerts visible
```

---

## 🔍 Debugging Tips

### Check Error Message
```typescript
console.log(getErrorMessage(error));
```

### Check Error Type
```typescript
console.log(error instanceof Error);
console.log(isAuthError(error));
console.log(isNetworkError(error));
console.log(isValidationError(error));
```

### Check State
```typescript
console.log('Error state:', error);
console.log('Loading state:', isLoading);
console.log('Form data:', formData);
```

---

## 📚 File Locations

| Component | Path |
|-----------|------|
| Error Messages | `src/lib/error-messages.ts` |
| Auth Context | `src/contexts/AuthContext.tsx` |
| Auth Pages | `src/pages/Auth.tsx` |
| Dashboard | `src/pages/Dashboard.tsx` |
| Settings | `src/pages/Settings.tsx` |
| Tasks Hook | `src/hooks/useTasks.ts` |
| Task Form | `src/components/TaskForm.tsx` |
| Task Item | `src/components/TaskItem.tsx` |
| Documentation | `ERROR_HANDLING_DOCUMENTATION.md` |

---

## ⚡ Common Patterns

### Pattern 1: Form Validation + Error Display
```typescript
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null); // Clear previous error

  // Validate
  if (!input.trim()) {
    setError('Input required.');
    return;
  }

  try {
    await operation(input);
    setInput(''); // Clear on success
    toast({ title: 'Success' });
  } catch (err) {
    setError(getErrorMessage(err));
  }
};

// In JSX:
{error && <Alert variant="destructive">...{error}...</Alert>}
```

### Pattern 2: API Operation with Loading
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    const result = await api.call();
    toast({ title: 'Success', description: 'Done' });
  } catch (error) {
    toast({
      title: 'Failed',
      description: getErrorMessage(error),
      variant: 'destructive'
    });
  } finally {
    setIsLoading(false);
  }
};
```

### Pattern 3: Multiple Form Fields with Validation
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  // Validate all fields
  if (!field1) { setError('Field 1 required'); return; }
  if (!field2) { setError('Field 2 required'); return; }
  if (field1.length < 3) { setError('Field 1 too short'); return; }

  // Proceed with operation
  try {
    await operation();
  } catch (err) {
    setError(getErrorMessage(err));
  }
};
```

---

## 🚀 Best Practices

### DO ✅
- ✅ Validate input BEFORE operation
- ✅ Use `getErrorMessage()` for consistency
- ✅ Clear errors on input change
- ✅ Show loading states during operations
- ✅ Log technical details to console
- ✅ Show success feedback
- ✅ Disable submit button during operation

### DON'T ❌
- ❌ Show raw error codes to users
- ❌ Use generic "Error occurred" messages
- ❌ Leave loading states indefinitely
- ❌ Allow double submission
- ❌ Lose error messages on page navigation
- ❌ Mix validation and operation errors
- ❌ Show errors without ways to fix them

---

## 📞 Support

If you encounter an error that's not in the error-messages.ts mapping:

1. **Add it to ERROR_MESSAGES:**
   ```typescript
   'Error code or text': 'User-friendly message',
   ```

2. **Test the new mapping:**
   ```typescript
   const msg = getErrorMessage(newError);
   console.log(msg); // Should show your new message
   ```

3. **Document it in this guide**

---

**Last Updated:** Implementation Complete  
**Version:** 1.0  
**Status:** Production Ready ✅
