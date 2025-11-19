# Calendly OAuth Setup Guide

This guide explains how to set up Calendly OAuth authentication and configure the required credentials.

## What You Need

From Calendly → Settings → Integrations → OAuth:

1. **Client ID** - Your OAuth application client ID
2. **Client Secret** - Your OAuth application secret (keep this secure!)
3. **Webhook Signing Key** - Used to verify webhook requests (from Webhooks section)

## Step 1: Add Credentials to Environment Variables

Add these to your `.env.local` file:

```env
# Calendly OAuth Credentials
CALENDLY_CLIENT_ID=your-client-id-here
CALENDLY_CLIENT_SECRET=your-client-secret-here

# Calendly Webhook Signing Key (from Webhooks section)
CALENDLY_SIGNING_KEY=your-webhook-signing-key-here

# Calendly API Token (optional - for direct API access)
CALENDLY_API_TOKEN=your-api-token-here

# Redirect URI (use your production domain)
CALENDLY_REDIRECT_URI=https://yourdomain.com/api/auth/calendly/callback
```

**For Development:**
```env
CALENDLY_REDIRECT_URI=http://localhost:3000/api/auth/calendly/callback
```

**For Production:**
```env
CALENDLY_REDIRECT_URI=https://icflog.com/api/auth/calendly/callback
```

## Step 2: Configure Redirect URI in Calendly

1. Go to Calendly → Settings → Integrations → OAuth
2. Add your Redirect URI:
   - **Development**: `http://localhost:3000/api/auth/calendly/callback`
   - **Production**: `https://yourdomain.com/api/auth/calendly/callback`

## Step 3: Database Schema Update

Add columns to store OAuth tokens (if not already added):

```sql
-- Add Calendly OAuth token columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_refresh_token TEXT;
```

## How It Works

1. **OAuth Flow**: Users authenticate with Calendly and grant your app access
2. **Token Storage**: Access and refresh tokens are stored in the user's profile
3. **Webhook Verification**: Webhook signing key verifies that webhooks are from Calendly
4. **API Access**: Use the stored tokens or API token to fetch Calendly data

## Security Notes

- **Never commit** `.env.local` to version control
- **Client Secret** and **Signing Key** are sensitive - keep them secure
- Consider encrypting stored tokens in the database
- Use HTTPS in production

## Testing

1. After adding credentials, restart your development server
2. Navigate to `/dashboard/calendar`
3. The OAuth flow will be triggered when needed
4. Check browser console for any errors


