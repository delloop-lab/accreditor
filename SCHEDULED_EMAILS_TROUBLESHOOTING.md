# Scheduled Emails Troubleshooting Guide

## Issue: Email Not Sent at Scheduled Time

### Common Causes:

1. **Cron Job Frequency**
   - ✅ **FIXED**: Cron now runs every 15 minutes (was once per day)
   - The workflow checks for due emails every 15 minutes
   - Emails will be sent within 15 minutes of their scheduled time

2. **Timezone Mismatch**
   - Scheduled times are stored in UTC
   - When scheduling, make sure you account for your timezone
   - Example: If you want 2 PM EST, schedule for 7 PM UTC (EST is UTC-5)

3. **GitHub Actions Delay**
   - GitHub Actions can have up to 15-minute delays
   - Scheduled emails may be sent up to 15 minutes after the scheduled time

### How to Check:

1. **Check Scheduled Email Status**:
   - Go to Admin Dashboard → Email Reminders section
   - Look at "Scheduled Emails" list
   - Status should change from PENDING → SENT

2. **Check GitHub Actions**:
   - Go to GitHub → Actions tab
   - Check if "Process Scheduled Emails" is running
   - Look at logs for any errors

3. **Check Database**:
   ```sql
   SELECT 
     subject,
     status,
     scheduled_for,
     sent_count,
     failed_count,
     NOW() as current_time
   FROM scheduled_emails
   WHERE status = 'pending'
   ORDER BY scheduled_for;
   ```

### Testing:

1. **Schedule a Test Email**:
   - Schedule for 2-3 minutes from now
   - Wait 5 minutes
   - Check status in Admin Dashboard

2. **Manual Trigger**:
   - Go to GitHub → Actions
   - Click "Process Scheduled Emails"
   - Click "Run workflow"
   - Check logs

### Timezone Helper:

If you want to schedule for a specific local time:
- **EST/EDT**: Add 5 hours (EST) or 4 hours (EDT) to get UTC
- **PST/PDT**: Add 8 hours (PST) or 7 hours (PDT) to get UTC
- **GMT**: Same as UTC

Example: To send at 2 PM EST (UTC-5):
- Schedule for 7 PM UTC (2 PM + 5 hours)

### Current Cron Schedule:

- **Frequency**: Every 15 minutes
- **Cron Expression**: `*/15 * * * *`
- **Max Delay**: Up to 15 minutes after scheduled time


