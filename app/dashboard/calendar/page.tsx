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
        .select('id, client_name, date, finish_date, duration, notes, calendly_booking_id')
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
              is_calendly_only: true
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

      // Combine and filter sessions
      const allSessions = [
        ...(dbSessions || []),
        ...calendlySessions
      ];
      
      // Filter to ensure we only show sessions that haven't finished yet
      const filtered = allSessions.filter(session => {
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

  const handleSessionClick = (sessionId: string) => {
    router.push(`/dashboard/sessions/log?highlight=${sessionId}`);
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
                onClick={() => handleSessionClick(session.id)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 truncate">{session.client_name}</h3>
                    {session.calendly_booking_id && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex-shrink-0">
                        Calendly
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 ml-6">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(session.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {formatDuration(session.duration)}
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

