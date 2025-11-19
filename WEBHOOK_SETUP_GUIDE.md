# Webhook Setup Guide

This guide explains how to set up webhooks for your application, including Calendly and Stripe webhooks.

## What are Webhooks?

Webhooks are HTTP callbacks that allow external services (like Calendly, Stripe) to notify your application when specific events occur. Instead of polling for updates, your app receives real-time notifications.

## General Webhook Setup Steps

### 1. Create Webhook Endpoint

Create an API route in Next.js that can receive POST requests:

```typescript
// app/api/webhooks/service-name/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the webhook signature (security)
    // 2. Parse the webhook payload
    // 3. Process the event
    // 4. Return success response
    
    const body = await request.text();
    const signature = request.headers.get('x-signature');
    
    // Verify signature here
    
    const event = JSON.parse(body);
    
    // Handle different event types
    switch (event.type) {
      case 'event.type.1':
        // Handle event type 1
        break;
      case 'event.type.2':
        // Handle event type 2
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### 2. Make Endpoint Publicly Accessible

Your webhook endpoint must be:
- **Publicly accessible** (not behind authentication)
- **HTTPS** (required by most services)
- **Reachable** from the internet (not localhost)

### 3. Configure in External Service

Go to the external service's webhook settings and:
- Add your webhook URL: `https://yourdomain.com/api/webhooks/service-name`
- Select events to subscribe to
- Copy the signing secret/key

### 4. Add Environment Variables

Add webhook secrets to `.env.local`:

```env
WEBHOOK_SECRET_KEY=your-secret-key-here
SERVICE_API_KEY=your-api-key-here
```

## Calendly Webhook Setup

### Step 1: Get Calendly API Token

1. Log in to [Calendly](https://calendly.com)
2. Go to **Settings** → **Integrations** → **API & Webhooks**
3. Click **Generate New Token**
4. Copy the token (you'll only see it once!)

### Step 2: Create Webhook in Calendly

1. In Calendly, go to **Settings** → **Integrations** → **Webhooks**
2. Click **+ Create Webhook**
3. Fill in the details:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/calendly`
   - **Events to subscribe**:
     - ✅ `invitee.created` - When someone books
     - ✅ `invitee.canceled` - When someone cancels
   - **Signing Key**: Copy this - you'll need it!
4. Click **Create Webhook**

### Step 3: Add Environment Variables

Add to `.env.local`:

```env
CALENDLY_API_TOKEN=your-calendly-api-token
CALENDLY_SIGNING_KEY=your-webhook-signing-key
```

### Step 4: Test the Webhook

1. **Test locally using ngrok** (for development):
   ```bash
   # Install ngrok: https://ngrok.com/
   ngrok http 3000
   
   # Use the ngrok URL in Calendly webhook settings:
   # https://abc123.ngrok.io/api/webhooks/calendly
   ```

2. **Test in production**:
   - Make a test booking in Calendly
   - Check your server logs for the webhook event
   - Verify a session was created in your database

### Step 5: Verify Webhook Signature

The webhook handler already includes signature verification:

```typescript
// In app/api/webhooks/calendly/route.ts
const signature = request.headers.get('calendly-webhook-signature') || '';
const isValid = verifyCalendlySignature(body, signature, calendlySigningKey);
```

## Stripe Webhook Setup

### Step 1: Get Stripe Webhook Secret

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
5. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 2: Add Environment Variable

```env
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 3: Test with Stripe CLI (Local Development)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
```

## Testing Webhooks Locally

### Option 1: Use ngrok (Recommended)

```bash
# Install ngrok
npm install -g ngrok
# or download from https://ngrok.com/

# Start your Next.js dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this URL in your webhook configuration:
# https://abc123.ngrok.io/api/webhooks/calendly
```

### Option 2: Use Stripe CLI (for Stripe only)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Option 3: Use RequestBin (for testing)

1. Go to [RequestBin](https://requestbin.com)
2. Create a bin
3. Use the bin URL temporarily to see webhook payloads
4. Copy the structure to your handler

## Webhook Security Best Practices

### 1. Always Verify Signatures

```typescript
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${digest}`)
  );
}
```

### 2. Use HTTPS Only

- Never use HTTP for webhooks in production
- Most services require HTTPS

### 3. Validate Payloads

```typescript
// Validate required fields
if (!event.payload || !event.payload.email) {
  return NextResponse.json(
    { error: 'Invalid payload' },
    { status: 400 }
  );
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  // Process webhook
} catch (error) {
  console.error('Webhook error:', error);
  // Log to error tracking service
  // Return 200 to prevent retries for fatal errors
  // or 500 to allow retries for transient errors
  return NextResponse.json(
    { error: 'Processing failed' },
    { status: 500 }
  );
}
```

### 5. Idempotency

Handle duplicate events:

```typescript
// Check if event already processed
const existingSession = await supabase
  .from('sessions')
  .select('id')
  .eq('calendly_booking_id', event.payload.uri.split('/').pop())
  .single();

if (existingSession) {
  // Already processed, skip
  return NextResponse.json({ received: true });
}
```

## Common Webhook Events

### Calendly Events

- `invitee.created` - New booking
- `invitee.canceled` - Booking canceled
- `invitee.updated` - Booking updated

### Stripe Events

- `checkout.session.completed` - Payment successful
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Invoice paid
- `invoice.payment_failed` - Payment failed

## Debugging Webhooks

### 1. Log Everything

```typescript
console.log('Webhook received:', {
  headers: Object.fromEntries(request.headers),
  body: await request.text(),
  timestamp: new Date().toISOString()
});
```

### 2. Check Webhook Status

Most services provide webhook delivery logs:
- **Calendly**: Settings → Integrations → Webhooks → View logs
- **Stripe**: Dashboard → Developers → Webhooks → View logs

### 3. Use Webhook Testing Tools

- [Webhook.site](https://webhook.site) - See webhook payloads
- [RequestBin](https://requestbin.com) - Test webhook endpoints
- [Postman](https://postman.com) - Manually send webhook payloads

### 4. Common Issues

**Issue**: Webhook not received
- ✅ Check URL is correct and publicly accessible
- ✅ Verify HTTPS (not HTTP)
- ✅ Check firewall/security settings
- ✅ Verify webhook is enabled in service

**Issue**: Signature verification fails
- ✅ Check signing secret is correct
- ✅ Verify payload hasn't been modified
- ✅ Ensure you're using the raw body (not parsed)

**Issue**: 500 errors
- ✅ Check server logs
- ✅ Verify database connections
- ✅ Check environment variables
- ✅ Validate payload structure

## Example: Complete Webhook Handler

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body (important for signature verification)
    const body = await request.text();
    
    // 2. Get signature from headers
    const signature = request.headers.get('x-webhook-signature') || '';
    
    // 3. Verify signature
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      const isValid = verifySignature(body, signature, secret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }
    
    // 4. Parse payload
    const event = JSON.parse(body);
    
    // 5. Handle event
    switch (event.type) {
      case 'event.type':
        await handleEvent(event);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    // 6. Return success
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${digest}`)
  );
}

async function handleEvent(event: any) {
  // Your event handling logic here
  console.log('Processing event:', event.type);
}
```

## Next Steps

1. ✅ Set up Calendly webhook (see above)
2. ✅ Test with ngrok locally
3. ✅ Deploy to production
4. ✅ Monitor webhook logs
5. ✅ Add error alerting

## Resources

- [Calendly Webhooks Docs](https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhooks)
- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [ngrok Documentation](https://ngrok.com/docs)


