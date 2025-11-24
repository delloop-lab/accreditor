"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CalendlyWidget from "@/app/components/CalendlyWidget";
import { CalendarIcon, LinkIcon, Cog6ToothIcon, ClockIcon, UserIcon, ArrowRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export const dynamic = 'force-dynamic';

type UpcomingSession = {
  id: string;
  client_name: string;
  date: string;
  finish_date?: string;
  duration: number;
  notes?: string;
  calendly_booking_id?: string;
  is_calendly_only?: boolean; // Flag for Calendly API events
  email?: string; // Client email from Calendly
  session_type?: string; // Session type (individual, team, mentor, etc.)
};

export default function CalendarPage() {
  const router = useRouter();
  const [calendlyUrl, setCalendlyUrl] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchUpcomingSessions = useCallback(async () => {
    try {
      setLoadingUpcoming(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Get current time (now) to compare against session dates
      const now = new Date();
      const nowISO = now.toISOString();

      // Fetch sessions from database
      const { data: dbSessions, error: dbError } = await supabase
        .from('sessions')
        .select('id, client_name, date, finish_date, duration, notes, calendly_booking_id, types')
        .eq('user_id', user.id)
        .gte('date', nowISO)
        .order('date', { ascending: true })
        .limit(20);

      if (dbError) {
        console.error('[Calendar] Failed to load DB sessions', dbError);
      }

      // Fetch Calendly events via API
      let calendlySessions: UpcomingSession[] = [];
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch('/api/calendly/events', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            calendlySessions = (data.events || []).map((e: any) => ({
              ...e,
              is_calendly_only: true,
              email: e.email || undefined, // Ensure email is included
              session_type: e.session_type || 'individual' // Include session type
            }));
          } else {
            const errorData = await response.json();
            console.error('[Calendar] Calendly API error', {
              status: response.status,
              error: errorData?.error,
            });
            setApiError(errorData.error || `API returned status ${response.status}`);
          }
        }
      } catch (calendlyError) {
        console.error('[Calendar] Calendly fetch failed', calendlyError);
      }

      // Deduplicate: Filter out Calendly API sessions that are already in the database
      // This prevents showing the same booking twice
      const dbCalendlyIds = new Set(
        (dbSessions || [])
          .filter((s: any) => s.calendly_booking_id)
          .map((s: any) => s.calendly_booking_id)
      );
      
      const uniqueCalendlySessions = calendlySessions.filter(
        (cs: any) => !dbCalendlyIds.has(cs.calendly_booking_id)
      );
      
      // Combine sessions (database sessions take priority)
      const allSessions = [
        ...(dbSessions || []),
        ...uniqueCalendlySessions
      ];
      
      // Deduplicate by booking ID and date to catch any remaining duplicates
      const seenBookings = new Set<string>();
      const deduplicated = allSessions.filter(session => {
        const bookingKey = session.calendly_booking_id 
          ? `${session.calendly_booking_id}-${session.date}`
          : `${session.id}-${session.date}`;
        
        if (seenBookings.has(bookingKey)) {
          return false; // Duplicate
        }
        seenBookings.add(bookingKey);
        return true;
      });
      
      // Filter to ensure we only show sessions that haven't finished yet and aren't canceled
      const filtered = deduplicated.filter(session => {
        // Filter out canceled sessions (marked by webhook)
        if (session.notes && session.notes.includes('[CANCELED via Calendly]')) {
          return false;
        }
        
        const sessionDate = new Date(session.date);
        let endTime: Date;
        
        if (session.finish_date) {
          endTime = new Date(session.finish_date);
        } else if (session.duration) {
          endTime = new Date(sessionDate.getTime() + session.duration * 60000);
        } else {
          endTime = new Date(sessionDate.getTime() + 60 * 60000);
        }
        
        return endTime >= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10); // Limit to 10
      
      setUpcomingSessions(filtered);
      setApiError(null);
    } catch (error) {
      setUpcomingSessions([]);
      console.error('[Calendar] Upcoming booking load failed', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoadingUpcoming(false);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          // Set default Calendly URL from profile or environment
          setCalendlyUrl(profile.calendly_url || process.env.NEXT_PUBLIC_CALENDLY_URL || "");
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    fetchUpcomingSessions();
  }, [router, fetchUpcomingSessions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    // Otherwise show date and time
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleClientNameClick = async (e: React.MouseEvent, session: UpcomingSession) => {
    e.stopPropagation();
    
    // If this is a Calendly-only booking, check if client exists
    if (session.is_calendly_only && (session.client_name || session.email)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if client exists by email (preferred) or name
        let clientId: string | null = null;
        
        if (session.email) {
          const { data: emailMatch } = await supabase
            .from('clients')
            .select('id')
            .eq('email', session.email)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (emailMatch) {
            clientId = emailMatch.id;
          }
        }
        
        // If not found by email, try by name
        if (!clientId && session.client_name) {
          const { data: nameMatch } = await supabase
            .from('clients')
            .select('id')
            .eq('name', session.client_name)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (nameMatch) {
            clientId = nameMatch.id;
          }
        }

        // If client doesn't exist, navigate to add client page with pre-filled data
        if (!clientId) {
          const params = new URLSearchParams();
          if (session.client_name) params.set('name', session.client_name);
          if (session.email) params.set('email', session.email);
          router.push(`/dashboard/clients/add?${params.toString()}`);
          return;
        }

        // Client exists, navigate to client detail page
        router.push(`/dashboard/clients/${clientId}`);
      } catch (error) {
        console.error('[Calendar] Error checking client:', error);
        // Fallback to session log if there's an error
        router.push(`/dashboard/sessions/log?highlight=${session.id}`);
      }
    } else {
      // Regular session, check if client exists
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if client exists by name
        const { data: nameMatch } = await supabase
          .from('clients')
          .select('id')
          .eq('name', session.client_name)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (nameMatch) {
          router.push(`/dashboard/clients/${nameMatch.id}`);
        } else {
          alert(`No client record found for ${session.client_name}. Please add this client first.`);
        }
      } catch (error) {
        console.error('[Calendar] Error checking client:', error);
      }
    }
  };

  const handleSessionTypeClick = (e: React.MouseEvent, session: UpcomingSession) => {
    e.stopPropagation();
    // Navigate to edit session or session log
    if (session.id && session.id.trim() !== '') {
      if (session.id.startsWith('calendly-')) {
        // For Calendly-only sessions, navigate to session log with highlight
        router.push(`/dashboard/sessions/log?highlight=${session.id}`);
      } else {
        // For database sessions, navigate to edit page
        router.push(`/dashboard/sessions/edit/${session.id}`);
      }
    }
  };

  const handleSessionClick = (session: UpcomingSession) => {
    // Navigate to session log or edit page
    if (session.id && session.id.trim() !== '') {
      if (session.id.startsWith('calendly-')) {
        router.push(`/dashboard/sessions/log?highlight=${session.id}`);
      } else {
        router.push(`/dashboard/sessions/edit/${session.id}`);
      }
    }
  };

  const handleSaveCalendlyUrl = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ calendly_url: calendlyUrl })
        .eq('user_id', user.id);

      if (error) throw error;

      alert('Calendly URL saved successfully!');
    } catch (error) {
      alert('Failed to save Calendly URL');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="h-7 w-7 text-blue-600" />
          Schedule Sessions
        </h1>
        <p className="text-gray-600 mt-1">Manage your booking calendar and schedule coaching sessions</p>
      </div>


      {/* Upcoming Bookings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUpcomingSessions}
              disabled={loadingUpcoming}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh upcoming bookings"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loadingUpcoming ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {upcomingSessions.length > 0 && (
              <button
                onClick={() => router.push('/dashboard/sessions/log')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all sessions
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {loadingUpcoming ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : upcomingSessions.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No upcoming bookings scheduled</p>
            <p className="text-gray-400 text-xs mt-1">Bookings will appear here once scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <h3 
                      className="font-semibold text-gray-900 truncate hover:text-blue-600 hover:underline cursor-pointer"
                      onClick={(e) => handleClientNameClick(e, session)}
                      title="Click to view client details"
                    >
                      {session.client_name}
                    </h3>
                    {session.calendly_booking_id && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex-shrink-0">
                        Calendly
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 ml-6 flex-wrap">
                    {((session as any).session_type || ((session as any).types && (session as any).types.length > 0)) && (
                      <span 
                        className="flex items-center gap-1 cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={(e) => handleSessionTypeClick(e, session)}
                        title="Click to edit session"
                      >
                        <span className="font-medium">Type:</span>
                        <span className="capitalize">
                          {(session as any).session_type || 
                           ((session as any).types && (session as any).types[0]) || 
                           'individual'}
                        </span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      <span className="font-medium">Duration:</span>
                      {formatDuration(session.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(session.date)}
                    </span>
                  </div>
                  {session.notes && (
                    <p className="text-xs text-gray-500 mt-1 ml-6 truncate">{session.notes}</p>
                  )}
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-4" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendly URL Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Calendly Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="calendly-url" className="block text-sm font-medium text-gray-700 mb-2">
              Your Calendly URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="calendly-url"
                  type="text"
                  value={calendlyUrl}
                  onChange={(e) => setCalendlyUrl(e.target.value)}
                  placeholder="https://calendly.com/your-username/30min"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSaveCalendlyUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter your Calendly scheduling link. You can find this in your Calendly account settings.
            </p>
          </div>
        </div>
      </div>

      {/* Calendly Widget */}
      {calendlyUrl ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Book a Session</h2>
          <div className="flex justify-center">
            <CalendlyWidget
              url={calendlyUrl}
              prefill={userProfile?.name || userProfile?.email ? {
                name: userProfile?.name || undefined,
                email: userProfile?.email || undefined,
              } : undefined}
              utm={{
                utmSource: "icflog",
                utmMedium: "dashboard",
                utmCampaign: "coaching_session"
              }}
              style={{
                minWidth: '100%',
                height: '700px'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Calendly URL Configured</h3>
          <p className="text-gray-600 mb-6">
            Please add your Calendly URL above to enable session booking.
          </p>
          <a
            href="https://calendly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started with Calendly
          </a>
        </div>
      )}
    </div>
  );
}

