import { NextRequest, NextResponse } from 'next/server';
import stripe, { STRIPE_CONFIG } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { session_id, customer_id } = await request.json();

    let customerId = customer_id;

    // If session_id provided, get customer from session
    if (session_id && !customer_id) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
      customerId = checkoutSession.customer as string;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id or session_id is required' },
        { status: 400 }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${STRIPE_CONFIG.appUrl}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 