# Calendly Integration Guide

This guide explains how to integrate Calendly with your ICF Log application.

## Overview

The integration includes:
1. **Calendly Widget Component** - Embed Calendly scheduling widget in your app
2. **Calendar Page** - User-facing page to manage bookings
3. **Webhook Handler** - Automatically sync Calendly bookings with your sessions table

## Setup Instructions

### 1. Get Your Calendly URL

1. Log in to your Calendly account
2. Go to **Settings** → **Event Types**
3. Select an event type (or create a new one)
4. Copy the **Share Link** (e.g., `https://calendly.com/your-username/30min`)

### 2. Add Calendly URL to User Profile

Users can add their Calendly URL in the Calendar page (`/dashboard/calendar`), or you can add it directly to the database:

```sql
-- Add calendly_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;

-- Update a user's Calendly URL
UPDATE profiles 
SET calendly_url = 'https://calendly.com/your-username/30min'
WHERE email = 'user@example.com';
```

### 3. Set Up Calendly Webhooks (Optional but Recommended)

To automatically sync bookings with your sessions table:

1. **Get Calendly API Token:**
   - Go to Calendly → **Settings** → **Integrations** → **API & Webhooks**
   - Generate an API token
   - Add it to `.env.local`:
     ```
     CALENDLY_API_TOKEN=your-api-token-here
     CALENDLY_SIGNING_KEY=your-signing-key-here
     ```

2. **Create Webhook in Calendly:**
   - Go to **Settings** → **Integrations** → **Webhooks**
   - Click **Create Webhook**
   - Webhook URL: `https://yourdomain.com/api/webhooks/calendly`
   - Events to subscribe:
     - `invitee.created` - When someone books a session
     - `invitee.canceled` - When someone cancels a session
   - Copy the signing key and add to `.env.local`

3. **Add Environment Variables:**
   ```env
   CALENDLY_API_TOKEN=your-api-token-here
   CALENDLY_SIGNING_KEY=your-signing-key-here
   ```

### 4. Update Database Schema

Add columns to store Calendly booking information:

```sql
-- Add Calendly-related columns to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS calendly_event_uri TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS calendly_invitee_uri TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS calendly_booking_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_calendly_invitee_uri 
ON sessions(calendly_invitee_uri);
```

### 5. Add Calendar Link to Navigation

Update `app/dashboard/layout.tsx` to add a Calendar menu item:

```tsx
<Link href="/dashboard/calendar" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
  <CalendarIcon className="h-5 w-5 text-blue-600" /> Calendar
</Link>
```

## Usage

### For Users

1. Navigate to `/dashboard/calendar`
2. Enter your Calendly URL in the settings section
3. Click "Save"
4. The Calendly widget will appear, allowing clients to book sessions
5. When bookings are made, they automatically sync to your sessions log

### For Admins

- View all bookings in the sessions log
- Bookings from Calendly are marked with a note indicating they were scheduled via Calendly
- Canceled bookings are also tracked

## Features

### ✅ What's Included

- **Embed Widget** - Full Calendly scheduling widget embedded in your app
- **User Prefill** - Automatically fills in user's name and email
- **UTM Tracking** - Tracks bookings from your app
- **Webhook Sync** - Automatically creates session records from bookings
- **Cancel Handling** - Tracks canceled bookings

### 🔄 How It Works

1. User configures their Calendly URL in the Calendar page
2. Calendly widget is displayed with their scheduling link
3. When someone books a session:
   - Calendly sends a webhook to `/api/webhooks/calendly`
   - The webhook handler creates a session record
   - Session appears in the user's sessions log
4. When someone cancels:
   - Calendly sends a cancellation webhook
   - The session is marked as canceled

## Customization

### Customize Widget Appearance

Edit `app/components/CalendlyWidget.tsx`:

```tsx
<CalendlyWidget
  url={calendlyUrl}
  pageSettings={{
    backgroundColor: '#ffffff',
    primaryColor: '#2563eb', // Your brand color
    textColor: '#1f2937',
    hideEventTypeDetails: false,
  }}
/>
```

### Customize Session Creation

Edit `app/api/webhooks/calendly/route.ts` in the `handleInviteeCreated` function to customize how sessions are created from bookings.

## Troubleshooting

### Widget Not Showing

- Check that the Calendly URL is correct
- Ensure the URL is publicly accessible
- Check browser console for errors

### Webhooks Not Working

- Verify webhook URL is accessible (not localhost)
- Check Calendly webhook settings
- Verify signing key matches
- Check server logs for errors

### Sessions Not Being Created

- Verify webhook is receiving events (check logs)
- Ensure user email matches Calendly invitee email
- Check database permissions
- Verify session insert is working

## API Reference

### CalendlyWidget Component Props

```typescript
interface CalendlyWidgetProps {
  url: string; // Required: Calendly event URL
  prefill?: {
    name?: string;
    email?: string;
  };
  utm?: {
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  pageSettings?: {
    backgroundColor?: string;
    hideEventTypeDetails?: boolean;
    hideLandingPageDetails?: boolean;
    primaryColor?: string;
    textColor?: string;
  };
  style?: {
    minWidth?: string;
    height?: string;
  };
}
```

## Security Notes

- Webhook signature verification is recommended for production
- Store Calendly API tokens securely in environment variables
- Use HTTPS for webhook endpoints
- Validate webhook payloads before processing

## Next Steps

- Add calendar sync with Google Calendar/Outlook
- Add email notifications for new bookings
- Add calendar view of all sessions
- Add conflict detection


