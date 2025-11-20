import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    // Get user's Calendly URL from profile
    const supabase = createServerSupabaseClient(request);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('calendly_url, calendly_access_token')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
    }
    // Try OAuth token first, fallback to API token
    const hasOAuthToken = !!profile?.calendly_access_token;
    const envToken = process.env.CALENDLY_API_TOKEN;
    const hasEnvToken = !!envToken;
    const calendlyApiToken = (profile?.calendly_access_token || envToken)?.trim();

    if (!calendlyApiToken) {
      return NextResponse.json({ 
        error: 'Calendly API token not configured. Please set CALENDLY_API_TOKEN in .env.local or connect via OAuth.',
        events: []
      });
    }


    // Get user's Calendly UUID first
    const authHeader = `Bearer ${calendlyApiToken}`;
    
    const userResponse = await fetch(`https://api.calendly.com/users/me`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return NextResponse.json({ 
        error: `Failed to fetch Calendly user (${userResponse.status}): ${errorText}`,
        events: []
      });
    }

    const userData = await userResponse.json();
    const userUri = userData.resource.uri;

    // Fetch upcoming scheduled events
    const now = new Date().toISOString();
    const eventsUrl = `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${now}`;
    
    const eventsResponse = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${calendlyApiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      return NextResponse.json({ 
        error: 'Failed to fetch Calendly events',
        events: []
      });
    }

    const eventsData = await eventsResponse.json();
    const scheduledEvents = eventsData.collection || [];

    // Process events - fetch invitees to get client details
    const allSessions: any[] = [];
    
    for (const event of scheduledEvents.slice(0, 20)) { // Limit to 20 events
      try {
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        // Fetch invitees to get the actual client name and email
        let clientName = 'Unknown Client';
        let clientEmail = '';
        
        try {
          // Extract event UUID from the event URI
          // Event URI format: https://api.calendly.com/scheduled_events/{uuid}
          const eventUuid = event.uri.split('/').pop();
          const inviteesUrl = `https://api.calendly.com/scheduled_events/${eventUuid}/invitees`;
          
          
          const inviteesResponse = await fetch(inviteesUrl, {
            headers: {
              'Authorization': `Bearer ${calendlyApiToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (inviteesResponse.ok) {
            const inviteesData = await inviteesResponse.json();
            const invitees = inviteesData.collection || [];
            if (invitees.length > 0) {
              // Get the host email from event_memberships
              const hostEmail = event.event_memberships?.[0]?.user_email;
              
              // Find the invitee (client) - it's the one who is NOT the host
              // Check both direct properties and nested structure
              const invitee = invitees.find((inv: any) => {
                const inviteeEmail = inv.email || inv.invitee?.email || inv.profile?.email;
                return inviteeEmail && inviteeEmail !== hostEmail;
              }) || invitees[0]; // Fallback to first invitee if no match
              
              if (invitee) {
                // Try multiple possible paths for name and email
                const inviteeName = invitee.name || invitee.invitee?.name || invitee.profile?.name || invitee.text || '';
                const inviteeEmail = invitee.email || invitee.invitee?.email || invitee.profile?.email || '';
                
                if (inviteeName && inviteeName.trim() !== '') {
                  clientName = inviteeName.trim();
                } else if (inviteeEmail && inviteeEmail.includes('@')) {
                  clientName = inviteeEmail.split('@')[0];
                }
                if (inviteeEmail && inviteeEmail.includes('@')) {
                  clientEmail = inviteeEmail.trim();
                }
              }
            } else {
            }
          } else {
            const errorText = await inviteesResponse.text();
          }
        } catch (inviteeError) {
        }

        // Add session - use client name if available, otherwise use event name as fallback
        // This way we still show the booking even if we can't get invitee details
        allSessions.push({
          id: `calendly-${event.uri.split('/').pop()}`,
          client_name: clientName !== 'Unknown Client' ? clientName : `Calendly Booking - ${event.name}`,
          email: clientEmail,
          date: event.start_time,
          finish_date: event.end_time,
          duration: durationMinutes,
          notes: `Scheduled via Calendly - ${event.name}`,
          calendly_booking_id: event.uri.split('/').pop(),
          calendly_event_uri: event.uri,
          is_calendly_only: true
        });
      } catch (err) {
      }
    }

    return NextResponse.json({ events: allSessions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', events: [] },
      { status: 500 }
    );
  }
}

