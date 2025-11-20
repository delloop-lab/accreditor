# Calendly Production Setup Guide

## ✅ What Needs to Be Updated for Production

### 1. Vercel Environment Variables

Go to your Vercel project dashboard → Settings → Environment Variables and add/update:

```env
CALENDLY_REDIRECT_URI=https://your-production-domain.com/api/auth/calendly/callback
```

**Replace `your-production-domain.com` with your actual Vercel production domain** (e.g., `icflog.vercel.app` or your custom domain).

### 2. Calendly OAuth Settings

1. Go to [Calendly](https://calendly.com) → **Settings** → **Integrations** → **OAuth**
2. In the **Redirect URIs** section, add your production URL:
   ```
   https://your-production-domain.com/api/auth/calendly/callback
   ```
3. **Keep** your development URL if you still need it:
   ```
   http://localhost:3000/api/auth/calendly/callback
   ```
4. Click **Save**

### 3. Calendly Webhook Settings (if using webhooks)

1. Go to [Calendly](https://calendly.com) → **Settings** → **Integrations** → **Webhooks**
2. For each webhook you've created:
   - Click **Edit** on the webhook
   - Update the **Webhook URL** to:
     ```
     https://your-production-domain.com/api/webhooks/calendly
     ```
   - Click **Save**

## 🔍 How to Find Your Production Domain

### Option 1: Check Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Domains**
4. Your production domain will be listed (e.g., `accreditor.vercel.app`)

### Option 2: Check After Deployment
After deploying, Vercel will show you the deployment URL in the dashboard.

### Option 3: Custom Domain
If you've set up a custom domain, use that instead (e.g., `icflog.com`).

## 📝 Quick Checklist

- [ ] Updated `CALENDLY_REDIRECT_URI` in Vercel environment variables
- [ ] Added production redirect URI in Calendly OAuth settings
- [ ] Updated webhook URLs in Calendly (if using webhooks)
- [ ] Redeployed to Vercel (if needed)
- [ ] Tested OAuth flow in production
- [ ] Tested webhook delivery (if using webhooks)

## 🧪 Testing

After updating:

1. **Test OAuth Flow:**
   - Go to your production site: `https://your-domain.com/dashboard/calendar`
   - Click "Connect Calendly" or similar
   - Complete the OAuth flow
   - Verify you're redirected back to your production site

2. **Test Webhooks (if using):**
   - Create a test booking in Calendly
   - Check your Vercel logs to see if the webhook was received
   - Verify the session was created in your database

## ⚠️ Important Notes

- **The code already handles dynamic URLs** - it uses `request.nextUrl.origin` as a fallback
- **You can have both dev and prod URLs** in Calendly settings
- **Environment variables in Vercel** are per-environment (Production, Preview, Development)
- **Webhook URLs must be HTTPS** in production (Calendly requires this)

## 🔄 After Making Changes

1. **Redeploy** your Vercel project (or wait for auto-deploy from GitHub)
2. **Test** the OAuth flow in production
3. **Monitor** Vercel logs for any errors

---

**Need Help?**
- Check Vercel logs: Dashboard → Your Project → Deployments → Click deployment → Logs
- Check Calendly webhook delivery: Settings → Integrations → Webhooks → Click webhook → View delivery logs

