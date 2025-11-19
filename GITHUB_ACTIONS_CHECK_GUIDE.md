# How to Check GitHub Actions Cron Job

## Step-by-Step Guide

### 1. Navigate to Your GitHub Repository

1. Go to **GitHub.com**
2. Find and open your repository (e.g., `your-username/accreditor`)

### 2. Go to Actions Tab

1. Click on the **"Actions"** tab at the top of your repository
   - It's next to "Code", "Issues", "Pull requests", etc.

### 3. Find Your Workflow

1. In the left sidebar, look for **"Process Scheduled Emails"** workflow
2. Click on it to see all runs

### 4. Check Workflow Status

You'll see a list of workflow runs with:
- ✅ **Green checkmark** = Success
- ❌ **Red X** = Failed
- 🟡 **Yellow circle** = In progress
- ⚪ **Gray circle** = Queued/Pending

### 5. View Workflow Details

1. Click on any workflow run to see details
2. Click on **"process-emails"** job (left sidebar)
3. Click on **"Call Process Scheduled Emails API"** step
4. You'll see:
   - The API response
   - Any errors
   - Execution time

### 6. Check Scheduled Runs

**To see when it will run next:**
- GitHub Actions shows scheduled runs in the workflow list
- Look for runs with a clock icon ⏰ (scheduled runs)
- The cron runs every 15 minutes, so you should see many scheduled runs

### 7. Manual Test

**To test immediately:**
1. Go to Actions → "Process Scheduled Emails"
2. Click **"Run workflow"** button (top right)
3. Click **"Run workflow"** again in the dropdown
4. Watch it execute in real-time

## What to Look For

### ✅ Good Signs:
- Workflow runs appearing every ~15 minutes
- Green checkmarks (success)
- API response showing "processed: X" or "No scheduled emails to process"
- No error messages

### ❌ Warning Signs:
- Red X marks (failures)
- Error messages about authentication
- "404 Not Found" errors (wrong URL)
- "403 Forbidden" errors (wrong secret key)

## Common Issues & Fixes

### Issue: No workflow runs showing
**Fix:** Make sure the workflow file is committed and pushed to your repository

### Issue: Workflow failing with 401/403
**Fix:** 
- Check that `CRON_SECRET_KEY` in GitHub Secrets matches your `.env`
- Check that `APP_URL` in GitHub Secrets is correct

### Issue: Workflow not running on schedule
**Fix:**
- GitHub Actions can have delays (up to 15 minutes)
- Make sure the workflow file is in `.github/workflows/` directory
- Verify the cron syntax: `*/15 * * * *`

## Quick Checklist

- [ ] Workflow file exists: `.github/workflows/send-scheduled-emails.yml`
- [ ] File is committed and pushed to GitHub
- [ ] GitHub Secrets are set: `CRON_SECRET_KEY` and `APP_URL`
- [ ] Workflow appears in Actions tab
- [ ] Can manually trigger workflow
- [ ] Workflow runs successfully when triggered

## Visual Guide

```
GitHub Repository
├── Code (tab)
├── Issues (tab)
├── Pull requests (tab)
├── Actions (tab) ← CLICK HERE
│   ├── All workflows
│   ├── Process Scheduled Emails ← YOUR WORKFLOW
│   │   ├── [Latest run] ← CLICK TO SEE DETAILS
│   │   │   ├── process-emails (job)
│   │   │   │   └── Call Process Scheduled Emails API ← SEE OUTPUT HERE
│   │   │   └── Run workflow (button) ← MANUAL TRIGGER
```

## Testing Right Now

1. **Go to**: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. **Find**: "Process Scheduled Emails" workflow
3. **Click**: "Run workflow" button
4. **Watch**: It should complete in a few seconds
5. **Check**: The logs should show the API response

## Need Help?

If you can't find the Actions tab or workflow:
1. Make sure you're logged into GitHub
2. Make sure you have access to the repository
3. Check that the workflow file was pushed to the `main` or `master` branch
4. Try refreshing the page


