import { NextRequest, NextResponse } from 'next/server';
import stripe, { STRIPE_CONFIG } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'customer.subscription.trial_will_end':
        await handleSubscriptionTrialWillEnd(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('Subscription created:', subscription.id);
  
  // Get customer details
  const customer = await stripe.customers.retrieve(subscription.customer);
  
  if (customer.deleted) {
    console.error('Customer was deleted');
    return;
  }

  // Update user profile with subscription info
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: subscription.customer,
      subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_plan: subscription.metadata?.lookup_key || 'unknown',
      subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('email', customer.email);

  if (error) {
    console.error('Error updating user subscription:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id);
  
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_customer_id', subscription.customer);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Subscription deleted:', subscription.id);
  
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_id: null,
    })
    .eq('stripe_customer_id', subscription.customer);

  if (error) {
    console.error('Error canceling subscription:', error);
  }
}

async function handleSubscriptionTrialWillEnd(subscription: any) {
  console.log('Subscription trial will end:', subscription.id);
  // Add logic to notify user about trial ending
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('Invoice payment succeeded:', invoice.id);
  // Add logic for successful payment
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log('Invoice payment failed:', invoice.id);
  // Add logic for failed payment (notify user, etc.)
} 