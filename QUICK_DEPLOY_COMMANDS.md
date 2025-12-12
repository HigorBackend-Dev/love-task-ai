# Quick Command Reference

## Deploy the Fix (Copy-Paste Ready)

### For Windows PowerShell
```powershell
cd "c:\Users\pf388\OneDrive\Documents\love-task-ai"
npx supabase functions deploy enhance-task
```

### For Windows Command Prompt
```cmd
cd c:\Users\pf388\OneDrive\Documents\love-task-ai
npx supabase functions deploy enhance-task
```

## Verify Deployment

### Check Function Status
```bash
npx supabase functions list
```
Look for `enhance-task` with recent `UPDATED_AT` time.

### View Function Logs (Real-Time)
```bash
npx supabase functions logs enhance-task --follow
```
Press `Ctrl+C` to stop.

### View Recent Logs
```bash
npx supabase functions logs enhance-task -n 50
```
Shows last 50 log entries.

## Optional: Configure N8N (If Available)

### Set N8N Webhook URL
```bash
npx supabase secrets set N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/enhance-task"
```

### View All Secrets
```bash
npx supabase secrets list
```

## Troubleshooting Commands

### Force Redeploy (If Stuck)
```bash
npx supabase functions deploy enhance-task --force
```

### Check Function Details
```bash
npx supabase functions describe enhance-task
```

### View Full Function Code
```bash
npx supabase functions download enhance-task
```

## Testing Steps

After deployment, test with these steps:

1. **Open your application** in browser
2. **Go to Dashboard** (click the Dashboard link)
3. **Create a new task** or click "Enhance" on existing task
4. **Expected result**:
   - ✅ Task title updates
   - ✅ Toast notification: "Task improved!"
   - ✅ No error messages
   - ✅ Logs show success

## One-Line Test Deploy

If you want to test everything in sequence:

```bash
cd c:\Users\pf388\OneDrive\Documents\love-task-ai && npx supabase functions deploy enhance-task && npx supabase functions list | grep enhance-task
```

This will:
1. Navigate to project
2. Deploy the function
3. Show the deployment status

## If Something Breaks

### Revert to Previous Version
Unfortunately, you can't revert the actual code directly. Instead:
1. Fix the code in `supabase/functions/enhance-task/index.ts`
2. Run `npx supabase functions deploy enhance-task --force`

### Emergency: Clear Function Cache
```bash
npx supabase functions delete enhance-task
npx supabase functions deploy enhance-task
```

## Live Monitoring Setup

### Terminal 1: Deploy Changes
```bash
npx supabase functions deploy enhance-task
```

### Terminal 2: Watch Logs
```bash
npx supabase functions logs enhance-task --follow
```

### Terminal 3: Test in App
1. Open application in browser
2. Click Enhance button
3. Watch terminal 2 for logs
4. Check application for success/error

## Database Connection (For Direct Testing)

If you need to verify database changes:

```bash
# Connect to local Supabase database
psql -U postgres -h localhost -p 54322 -d postgres
```

Password: `postgres`

Then query tasks:
```sql
SELECT id, title, enhanced_title, status FROM tasks LIMIT 10;
```

## Environment Info Commands

### Show Supabase Version
```bash
npx supabase --version
```

### Show Project Info
```bash
npx supabase projects list
```

### Show Local Supabase Status
```bash
npx supabase status
```

## Script: Full Deployment + Test

Save as `deploy.sh` (on macOS/Linux) or `deploy.ps1` (on Windows PowerShell):

### PowerShell Version (Windows)
```powershell
# deploy.ps1
cd "c:\Users\pf388\OneDrive\Documents\love-task-ai"

Write-Host "🚀 Deploying enhance-task function..." -ForegroundColor Cyan
npx supabase functions deploy enhance-task

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📋 Function status:" -ForegroundColor Cyan
npx supabase functions list | Select-String "enhance-task"

Write-Host "`n📊 Recent logs:" -ForegroundColor Cyan
npx supabase functions logs enhance-task -n 5

Write-Host "`n🎉 Deployment finished! Test your app now." -ForegroundColor Green
```

Run with:
```powershell
.\deploy.ps1
```

## Quick Checklist

```
☐ Run: npx supabase functions deploy enhance-task
☐ Wait for completion (should say "✓ Deployed")
☐ Verify: npx supabase functions list
☐ Check logs: npx supabase functions logs enhance-task -n 10
☐ Test in app: Click Enhance button
☐ Verify: Task title updates, no errors
☐ Success! 🎉
```

---

**Most Important Command:**
```bash
npx supabase functions deploy enhance-task
```

Run this from the project directory, wait for it to finish, then test your app!
