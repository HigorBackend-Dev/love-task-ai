# Quick Deployment Checklist

## Pre-Deployment (Verify Everything is Ready)
- [ ] Edge Function code updated: `supabase/functions/enhance-task/index.ts` ✅
- [ ] Mock fallback added ✅
- [ ] Error handling improved ✅
- [ ] useTasks.ts error messages updated ✅

## Deployment Command
```bash
npx supabase functions deploy enhance-task
```

## Post-Deployment Verification

### Verify Deployment Succeeded
```bash
npx supabase functions list
# Check that enhance-task UPDATED_AT timestamp is recent
```

### Test in Application
1. **Navigate to Dashboard**
2. **Create or open any task**
3. **Click "Enhance" button** (appears on task items)
   - ✓ Should show success toast: "Task improved!"
   - ✓ Task title should update immediately
   - ✗ Should NOT show "Error enhancing task" error
4. **Click "Get Suggestion" button** (if available)
   - ✓ Should return a suggestion
   - ✗ Should NOT show 500 error

### Check Browser Console
- ✓ Should see: `[enhance-task] N8N_WEBHOOK_URL not configured`
- ✓ Should see: Success response with enhanced_title
- ✗ Should NOT see: FunctionsHttpError 500

### Check Supabase Function Logs
```bash
npx supabase functions logs enhance-task --follow
```

Look for successful entries like:
```
[enhance-task] Processing task abc123: "Sample title" (mode: enhance)
[enhance-task] N8N_WEBHOOK_URL not configured - using mock enhancement for development
[enhance-task] Extracted enhanced title: "Sample title (Clarify and refine)"
[enhance-task] Task abc123 enhanced successfully
```

## Troubleshooting

### Still Getting 500 Errors?
1. **Clear browser cache** (Ctrl+Shift+Del)
2. **Hard refresh** the application (Ctrl+Shift+R)
3. **Redeploy the function**:
   ```bash
   npx supabase functions deploy enhance-task --force
   ```
4. **Check the function was actually updated**:
   ```bash
   npx supabase functions describe enhance-task
   ```

### No Enhancement Appearing?
1. Check browser console for errors (F12)
2. Check Supabase function logs
3. Verify the response actually contains `enhanced_title`

### Getting Different Errors?
- **400 Bad Request**: Function received incomplete parameters
- **502 Bad Gateway**: N8N webhook error (if configured)
- **503 Service Unavailable**: Network error to N8N (if configured)
- **500 Internal Error**: Something unexpected happened

## Success Indicators
✅ **Enhanced status**: Task title shows improvement (e.g., "Sample task (Clarify and refine)")
✅ **Toast notification**: "Task improved!" message appears
✅ **Database updated**: Task title persisted in Supabase
✅ **No 500 errors**: No error notifications appear
✅ **Function logs**: Shows successful processing

## If Everything Works!
🎉 The 500 error issue is resolved!

Next step: If you have N8N configured, set the webhook URL:
```bash
npx supabase secrets set N8N_WEBHOOK_URL="https://your-n8n-url/webhook/..."
```

This will use real AI enhancements instead of mock suggestions.
