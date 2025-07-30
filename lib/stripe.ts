import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

export default stripe;

// Configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

// Subscription plans (you can modify these later)
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter Plan',
    priceId: 'price_starter', // You'll get this from Stripe dashboard
    lookupKey: 'starter_monthly',
    price: 20.00,
    interval: 'month',
    features: [
      'Basic coaching log',
      'CPD tracking',
      'Basic reports',
    ],
  },
  pro: {
    name: 'Pro Plan',
    priceId: 'price_pro', // You'll get this from Stripe dashboard
    lookupKey: 'pro_monthly',
    price: 50.00,
    interval: 'month',
    features: [
      'Advanced coaching log',
      'CPD tracking',
      'Advanced reports',
      'Export features',
      'Client management',
    ],
  },
};

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS; 