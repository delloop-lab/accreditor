# GitHub Actions Cron Setup Guide

This guide explains how to set up GitHub Actions to automatically process scheduled reminder emails.

## Step 1: Create the Workflow File

The workflow file has been created at `.github/workflows/send-scheduled-emails.yml`

## Step 2: Set Up GitHub Secrets

You need to add two secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets:

#### 1. `CRON_SECRET_KEY`
- **Name**: `CRON_SECRET_KEY`
- **Value**: A random secret key (e.g., generate with: `openssl rand -hex 32`)
- **Purpose**: Authenticates the cron job to your API

#### 2. `APP_URL`
- **Name**: `APP_URL`
- **Value**: Your production app URL (e.g., `https://icflog.com`)
- **Purpose**: The base URL where your API is hosted

## Step 3: Update Your Environment Variables

Make sure your production environment has the same `CRON_SECRET_KEY`:

```env
CRON_SECRET_KEY=your-secret-key-here
```

## Step 4: Schedule Configuration

The workflow is currently set to run **daily at 9 AM UTC**.

To change the schedule, edit `.github/workflows/send-scheduled-emails.yml`:

```yaml
schedule:
  - cron: '0 9 * * *'  # Daily at 9 AM UTC
```

### Common Cron Schedules:

- **Daily at 9 AM UTC**: `'0 9 * * *'`
- **Monthly on 1st at 9 AM UTC**: `'0 9 1 * *'`
- **Every Monday at 9 AM UTC**: `'0 9 * * 1'`
- **Every 6 hours**: `'0 */6 * * *'`
- **Every 15 minutes**: `'*/15 * * * *'`

### Cron Format:
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

## Step 5: Test the Workflow

1. Go to **Actions** tab in your GitHub repository
2. Click **Process Scheduled Emails** workflow
3. Click **Run workflow** → **Run workflow** (manual trigger)
4. Check the logs to see if it worked

## Step 6: How It Works

1. GitHub Actions runs the workflow on schedule
2. It makes a POST request to your API endpoint
3. Your API checks for scheduled emails due to be sent
4. It sends emails to recipients
5. Updates the status in the database

## Troubleshooting

### Workflow not running?
- Check that the workflow file is in `.github/workflows/` directory
- Verify the cron syntax is correct
- GitHub Actions may have delays (up to 15 minutes)

### 401/403 Errors?
- Verify `CRON_SECRET_KEY` matches in both GitHub Secrets and your app's environment
- Check that the `APP_URL` secret is correct
- Ensure your API endpoint accepts the Authorization header

### Emails not sending?
- Check the workflow logs in GitHub Actions
- Verify scheduled emails exist in your database
- Check your Resend API key is configured correctly

## Manual Trigger

You can manually trigger the workflow anytime:
1. Go to **Actions** tab
2. Select **Process Scheduled Emails**
3. Click **Run workflow**

## Notes

- GitHub Actions cron jobs run in UTC time
- Free tier: 2,000 minutes/month (plenty for daily runs)
- Workflows run on GitHub's servers, not your app server
- The workflow just calls your API - your app does the actual work


