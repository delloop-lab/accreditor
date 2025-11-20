import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabaseServer';
import crypto from 'crypto';

// Calendly webhook signature verification
function verifyCalendlySignature(
  payload: string,
  signature: string,
  signingKey: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', signingKey);
    const digest = hmac.update(payload).digest('base64');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('calendly-webhook-signature') || '';

    // Verify webhook signature (optional but recommended)
    // Get your Calendly signing key from environment variables
    const calendlySigningKey = process.env.CALENDLY_SIGNING_KEY;
    
    if (calendlySigningKey && signature) {
      const isValid = verifyCalendlySignature(body, signature, calendlySigningKey);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);

    // Handle different Calendly event types
    switch (event.event) {
      case 'invitee.created':
        await handleInviteeCreated(event);
        break;
      case 'invitee.canceled':
        await handleInviteeCanceled(event);
        break;
      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleInviteeCreated(event: any) {
  const supabase = createServiceRoleSupabaseClient();
  
  try {
    const invitee = event.payload;
    const eventDetails = event.payload.event_type;
    
    // Extract information from Calendly event
    const inviteeEmail = invitee.email;
    const inviteeName = invitee.name || inviteeEmail.split('@')[0];
    const eventStartTime = invitee.event_start_time;
    const eventEndTime = invitee.event_end_time;
    const eventUri = invitee.event;
    const inviteeUri = invitee.uri;
    
    // Calculate duration in minutes
    const startTime = new Date(eventStartTime);
    const endTime = new Date(eventEndTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Find the coach/user who owns this Calendly account
    // We need to match the event URI to a user's calendly_url
    // Extract the Calendly username from the event URI (e.g., https://calendly.com/username/event-type)
    const eventUriMatch = eventUri.match(/https?:\/\/calendly\.com\/([^\/]+)/);
    const calendlyUsername = eventUriMatch ? eventUriMatch[1] : null;
    
    // Find user by matching their calendly_url to the event URI
    // First try to find by matching the calendly_url pattern
    let profile = null;
    
    if (calendlyUsername) {
      // Try to find user whose calendly_url contains this username
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, calendly_url')
        .not('calendly_url', 'is', null);
      
      if (profiles) {
        profile = profiles.find(p => 
          p.calendly_url && (
            p.calendly_url.includes(calendlyUsername) ||
            p.calendly_url.includes(eventUri.split('/').slice(0, -1).join('/'))
          )
        );
      }
    }
    
    // Fallback: if we can't find by Calendly URL, log for manual review
    if (!profile) {
      // For now, we'll need to manually associate bookings
      // TODO: Implement better matching logic or require webhook configuration per user
      return;
    }
    

    // Create a session record from the Calendly booking
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: profile.user_id,
        client_name: inviteeName,
        date: eventStartTime,
        finish_date: eventEndTime,
        duration: durationMinutes,
        notes: `Scheduled via Calendly. Event URI: ${eventUri}`,
        types: ['one-on-one'], // Default, can be customized
        paymenttype: 'scheduled',
        calendly_event_uri: eventUri,
        calendly_invitee_uri: inviteeUri,
        calendly_booking_id: invitee.uri.split('/').pop(),
      });

    if (sessionError) {
      throw sessionError;
    }

  } catch (error) {
    throw error;
  }
}

async function handleInviteeCanceled(event: any) {
  const supabase = createServiceRoleSupabaseClient();
  
  try {
    const invitee = event.payload;
    const inviteeUri = invitee.uri;
    
    // Find and update the session if it exists
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('calendly_invitee_uri', inviteeUri)
      .single();

    if (session) {
      // Optionally mark as canceled or delete
      await supabase
        .from('sessions')
        .update({ 
          notes: (session.notes || '') + ' [CANCELED via Calendly]',
          // Or delete: .delete() instead of .update()
        })
        .eq('id', session.id);
    }

  } catch (error) {
    throw error;
  }
}

// Handle GET requests for webhook verification (if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Calendly webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

