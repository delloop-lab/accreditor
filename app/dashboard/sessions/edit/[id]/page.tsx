"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SessionForm, { SessionData } from "../../SessionForm";

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Check if this is a Calendly-only session (not in database yet)
        const isCalendlyOnly = sessionId.startsWith('calendly-');
        
        if (isCalendlyOnly) {
          // Fetch from Calendly API
          try {
            // Get session token for authentication
            const { data: { session: authSession } } = await supabase.auth.getSession();
            if (!authSession) {
              setError('Authentication required');
              setLoading(false);
              return;
            }

            const response = await fetch('/api/calendly/events', {
              headers: {
                'Authorization': `Bearer ${authSession.access_token}`
              }
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to fetch Calendly events');
            }
            
            const responseData = await response.json();
            // The API returns { events: [...] }
            const calendlySessions = responseData.events || [];
            const calendlySession = calendlySessions.find((s: any) => s.id === sessionId);
            
            if (calendlySession) {
              // Transform Calendly session to SessionData
              // Only include data that actually comes from Calendly - don't auto-fill other fields
              const sessionData: SessionData = {
                clientId: '',
                clientName: calendlySession.client_name || '',
                date: calendlySession.date,
                finishDate: calendlySession.finish_date || '',
                duration: calendlySession.duration || 0,
                types: [], // Leave empty - user will select
                numberInGroup: undefined,
                paymentType: '', // Leave empty - user will set payment type
                paymentAmount: null,
                focusArea: '',
                keyOutcomes: '',
                clientProgress: '',
                coachingTools: [],
                icfCompetencies: [],
                additionalNotes: '', // Leave empty - user will add notes if needed
              };
              setSession(sessionData);
            } else {
              setError('Calendly session not found');
            }
          } catch (calendlyError) {
            setError('Failed to load Calendly session');
          }
          setLoading(false);
          return;
        }

        // Regular database session
        const { data, error } = await supabase
          .from("sessions")
          .select("id,client_id,client_name,date,finish_date,duration,types,number_in_group,paymenttype,payment_amount,focus_area,key_outcomes,client_progress,coaching_tools,icf_competencies,additional_notes,user_id")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          setError('Failed to load session');
          return;
        }

        if (data) {
          // Transform the data to match SessionData type
          const sessionData: SessionData = {
            clientId: '', // Don't set clientId for editing - let user select from dropdown
            clientName: data.client_name || '',
            date: data.date,
            finishDate: data.finish_date || '',
            duration: data.duration,
            types: data.types || [],
            numberInGroup: data.number_in_group,
            paymentType: data.paymenttype,
            paymentAmount: data.payment_amount,
            focusArea: data.focus_area || '',
            keyOutcomes: data.key_outcomes || '',
            clientProgress: data.client_progress || '',
            coachingTools: data.coaching_tools || [],
            icfCompetencies: data.icf_competencies || [],
            additionalNotes: data.additional_notes || '',
          };
          setSession(sessionData);
        }
      } catch (error) {
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, router]);

  const handleUpdateSession = async (updatedData: SessionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // Check if this is a Calendly-only session (needs to be created, not updated)
      const isCalendlyOnly = sessionId.startsWith('calendly-');
      
      if (isCalendlyOnly) {
        // Create a new session record in the database
        const { error } = await supabase
          .from("sessions")
          .insert({
            user_id: user.id,
            client_name: updatedData.clientName,
            date: updatedData.date,
            finish_date: updatedData.finishDate || null,
            duration: updatedData.duration,
            types: updatedData.types,
            number_in_group: updatedData.numberInGroup,
            paymenttype: updatedData.paymentType,
            payment_amount: updatedData.paymentAmount || null,
            focus_area: updatedData.focusArea,
            key_outcomes: updatedData.keyOutcomes,
            client_progress: updatedData.clientProgress,
            coaching_tools: updatedData.coachingTools,
            icf_competencies: updatedData.icfCompetencies,
            additional_notes: updatedData.additionalNotes,
            calendly_booking_id: sessionId.replace('calendly-', ''), // Store the Calendly booking ID
          });

        if (error) {
          setError('Failed to save session');
          return;
        }

        // Redirect back to sessions log
        router.push("/dashboard/sessions/log");
        return;
      }

      // Regular update for existing database session
      const { error } = await supabase
        .from("sessions")
        .update({
          client_name: updatedData.clientName,
          date: updatedData.date,
          finish_date: updatedData.finishDate || null,
          duration: updatedData.duration,
          types: updatedData.types,
          number_in_group: updatedData.numberInGroup,
          paymenttype: updatedData.paymentType,
          payment_amount: updatedData.paymentAmount || null,
          focus_area: updatedData.focusArea,
          key_outcomes: updatedData.keyOutcomes,
          client_progress: updatedData.clientProgress,
          coaching_tools: updatedData.coachingTools,
          icf_competencies: updatedData.icfCompetencies,
          additional_notes: updatedData.additionalNotes,
        })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (error) {
        setError('Failed to update session');
        return;
      }

      // Redirect back to sessions log
      router.push("/dashboard/sessions/log");
    } catch (error) {
      setError('Failed to update session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/sessions/log")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Session not found</div>
          <button
            onClick={() => router.push("/dashboard/sessions/log")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/sessions/log")}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            â† Back to Sessions
          </button>
                      <h1 className="text-2xl font-bold text-gray-900">Edit Session</h1>
        </div>
        
        <SessionForm 
          onSubmit={handleUpdateSession}
          initialData={session}
          isEditing={true}
        />
    </div>
  );
} 
