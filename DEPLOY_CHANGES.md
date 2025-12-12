# Deploying Edge Function Changes

## Current Status
The `enhance-task` Edge Function has been updated with:
- ✅ Mock enhancement fallback (when N8N_WEBHOOK_URL is not configured)
- ✅ Proper parameter handling for `user_prompt` and `mode`
- ✅ Better error handling with specific HTTP status codes
- ✅ 30-second timeout protection

## Local Testing (Before Deployment)

### 1. Start Supabase Local Environment
```bash
supabase start
```

Wait for all services to be ready. You should see output like:
```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

### 2. Test Edge Function Locally
The Edge Function will use the mock fallback since N8N_WEBHOOK_URL won't be set locally.

Open your app and:
1. Click "Enhance" on any task
   - Expected: Task title gets enhanced with a suggestion like "(Clarify and refine)"
   - No 500 error should appear
2. Click "Get Suggestion" on any task
   - Expected: Shows the enhancement suggestion
   - Should return the mock enhanced title

### 3. Monitor Edge Function Logs
```bash
supabase functions list
supabase functions logs enhance-task --follow
```

You should see logs like:
```
[enhance-task] Processing task xyz123: "Sample task" (mode: suggest)
[enhance-task] N8N_WEBHOOK_URL not configured - using mock enhancement for development
```

## Production Deployment

### Method 1: Using Supabase CLI

```bash
# Log in to your Supabase account
supabase login

# Link to your remote project
supabase link --project-ref cnwnixdqjetjqoxuavsr

# Deploy the function
supabase functions deploy enhance-task
```

### Method 2: Set N8N Webhook URL (Optional - For Full AI Features)

If you have an N8N instance running:

```bash
# Set the environment variable in your Supabase project
supabase secrets set N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/enhance-task"
```

## Verifying Deployment

After deployment, test in the deployed application:

1. **Without N8N configured (should use mock):**
   - Click Enhance → Should show mock enhancement
   - Check browser console for network response from Edge Function

2. **With N8N configured:**
   - Click Enhance → Should call N8N and return real enhancement
   - Check Supabase logs for N8N interaction

## Troubleshooting

### Issue: Still getting 500 errors after deployment
1. Check that the function was actually deployed:
   ```bash
   supabase functions list
   ```
2. Check the deployment logs:
   ```bash
   supabase functions logs enhance-task
   ```

### Issue: Mock enhancement not appearing
1. Verify N8N_WEBHOOK_URL is truly not set:
   ```bash
   supabase secrets list
   ```
2. Check browser console for error messages

### Issue: N8N webhook not being called (if configured)
1. Verify the webhook URL is correct:
   ```bash
   supabase secrets list
   ```
2. Check Edge Function logs for the N8N_WEBHOOK_URL being logged
3. Verify N8N instance is running and webhook exists

## Response Format Examples

### Success Response (Mock or Real)
```json
{
  "success": true,
  "enhanced_title": "Sample task (Clarify and refine)",
  "source": "mock_development"
}
```

### Success Response (Real N8N)
```json
{
  "success": true,
  "enhanced_title": "Implement user authentication system with secure JWT tokens"
}
```

### Error Response (No Parameters)
```json
{
  "success": false,
  "error": "Missing required fields: taskId and title",
  "status": 400
}
```

### Error Response (N8N Not Responding)
```json
{
  "success": false,
  "error": "Failed to connect to N8N webhook: connection timeout",
  "suggestion": "Check that N8N_WEBHOOK_URL is valid and N8N service is running",
  "status": 503
}
```

## Files Modified
- `supabase/functions/enhance-task/index.ts` - Added mock fallback and improved error handling
- `src/hooks/useTasks.ts` - Better error messages mentioning N8N webhook

## Next Steps
1. Deploy the function (Method 1 or 2 above)
2. Test locally first
3. Test in production
4. Monitor logs for any issues
5. (Optional) Configure N8N webhook URL for full AI features
