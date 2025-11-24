import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabaseServer';

// Helper function to infer session type from event name
function inferSessionType(eventName: string): string {
  const nameLower = eventName.toLowerCase();
  if (nameLower.includes('team') || nameLower.includes('group')) {
    return 'team';
  }
  if (nameLower.includes('mentor') || nameLower.includes('mentoring')) {
    return 'mentor';
  }
  // Default to individual for one-on-one sessions
  return 'individual';
}

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
        const calculatedDurationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        // Fetch event type details to get duration and name
        let eventTypeName = event.name || 'Unknown';
        let eventTypeDuration = calculatedDurationMinutes; // Fallback to calculated duration
        let sessionType = 'individual'; // Default session type
        
        if (event.event_type && event.event_type.uri) {
          try {
            const eventTypeResponse = await fetch(event.event_type.uri, {
              headers: {
                'Authorization': `Bearer ${calendlyApiToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (eventTypeResponse.ok) {
              const eventTypeData = await eventTypeResponse.json();
              eventTypeName = eventTypeData.resource?.name || eventTypeName;
              // Event type duration is in seconds, convert to minutes
              if (eventTypeData.resource?.duration) {
                eventTypeDuration = Math.round(eventTypeData.resource.duration / 60);
              }
              // Infer session type from event type name
              sessionType = inferSessionType(eventTypeName);
            }
          } catch (eventTypeError) {
            // Fallback to calculated duration and event name
            sessionType = inferSessionType(eventTypeName);
          }
        } else {
          // If no event_type URI, infer from event name
          sessionType = inferSessionType(eventTypeName);
        }
        
        // Check if event URI contains "one-to-one" or similar patterns
        const eventUriLower = event.uri.toLowerCase();
        const isOneToOne = eventUriLower.includes('one-to-one') || 
                          eventUriLower.includes('one-on-one') ||
                          eventUriLower.includes('1-on-1') ||
                          eventUriLower.includes('1-to-1');
        
        let numberInGroup: number | undefined = undefined;
        
        // Override session type and set number in group if one-to-one detected
        if (isOneToOne) {
          sessionType = 'individual';
          numberInGroup = 1;
        }
        
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
              
              // Filter out canceled invitees - only process active ones
              const activeInvitees = invitees.filter((inv: any) => {
                const status = inv.status || inv.invitee?.status || 'active';
                return status !== 'canceled';
              });
              
              // If all invitees are canceled, skip this event entirely
              if (activeInvitees.length === 0) {
                continue; // Skip to next event
              }
              
              // Find the invitee (client) - it's the one who is NOT the host
              // Check both direct properties and nested structure
              const invitee = activeInvitees.find((inv: any) => {
                const inviteeEmail = inv.email || inv.invitee?.email || inv.profile?.email;
                return inviteeEmail && inviteeEmail !== hostEmail;
              }) || activeInvitees[0]; // Fallback to first active invitee if no match
              
              if (invitee) {
                // Try multiple possible paths for name and email
                const inviteeName = invitee.name || invitee.invitee?.name || invitee.profile?.name || invitee.text || '';
                const inviteeEmail = invitee.email || invitee.invitee?.email || invitee.profile?.email || '';
                
                if (inviteeName && inviteeName.trim() !== '') {
                  clientName = inviteeName.trim();
                } else if (inviteeEmail && inviteeEmail.includes('@')) {
                  // Remove Gmail plus addressing (e.g., "user+tag" becomes "user")
                  const emailLocalPart = inviteeEmail.split('@')[0];
                  clientName = emailLocalPart.split('+')[0].trim();
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
        const sessionData: any = {
          id: `calendly-${event.uri.split('/').pop()}`,
          client_name: clientName !== 'Unknown Client' ? clientName : `Calendly Booking - ${eventTypeName}`,
          email: clientEmail,
          date: event.start_time,
          finish_date: event.end_time,
          duration: eventTypeDuration, // Use event type duration instead of calculated
          notes: `Scheduled via Calendly - ${eventTypeName}`,
          calendly_booking_id: event.uri.split('/').pop(),
          calendly_event_uri: event.uri,
          calendly_event_type_name: eventTypeName, // Store event type name for reference
          session_type: sessionType, // Store inferred session type
          is_calendly_only: true
        };
        
        // Add number_in_group if one-to-one detected
        if (numberInGroup !== undefined) {
          sessionData.number_in_group = numberInGroup;
        }
        
        allSessions.push(sessionData);
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

