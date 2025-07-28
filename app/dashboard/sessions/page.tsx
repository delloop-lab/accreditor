"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionForm, { SessionData } from "./SessionForm";
import SessionList from "./SessionList";
import { supabase } from "@/lib/supabaseClient";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions from Supabase
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      if (!error && data) {
        // Map snake_case to camelCase
        const mapped = data.map((session: any) => ({
          clientName: session.client_name,
          date: session.date,
          duration: session.duration,
          additionalNotes: session.additional_notes || session.notes,
          types: session.types,
          paymentType: session.paymenttype,
          paymentAmount: session.payment_amount,
          focusArea: session.focus_area,
          keyOutcomes: session.key_outcomes,
          clientProgress: session.client_progress,
          coachingTools: session.coaching_tools || [],
          icfCompetencies: session.icf_competencies || [],
          user_id: session.user_id,
          id: session.id,
        }));
        setSessions(mapped);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  // Add session to Supabase
  const addSession = async (data: SessionData) => {
    console.log('Adding session with data:', data);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found');
      return;
    }
    
    // Validate required fields
    if (!data.clientName || !data.date || !data.types || data.types.length === 0) {
      console.error('Missing required fields:', { clientName: data.clientName, date: data.date, types: data.types });
      return;
    }
    
    const sessionData = {
      client_name: data.clientName,
      date: data.date,
      finish_date: data.finishDate || null,
      duration: data.duration || 0, // Use 0 as default instead of null
      notes: data.additionalNotes || '',
      types: data.types,
      paymenttype: data.paymentType,
      payment_amount: data.paymentAmount || null,
      focus_area: data.focusArea || '',
      key_outcomes: data.keyOutcomes || '',
      client_progress: data.clientProgress || '',
      coaching_tools: data.coachingTools || [],
      icf_competencies: data.icfCompetencies || [],
      user_id: user.id
    };
    
    console.log('Inserting session data:', sessionData);
    
    const { data: newSession, error } = await supabase
      .from("sessions")
      .insert([sessionData])
      .select()
      .single();
      
    if (error) {
      console.error('Error inserting session:', error);
      return;
    }
    
    if (newSession) {
      console.log('Session saved successfully:', newSession);
      // Map the new session to match the expected format
      const mappedSession = {
        clientName: newSession.client_name,
        date: newSession.date,
        duration: newSession.duration,
        additionalNotes: newSession.additional_notes || newSession.notes,
        types: newSession.types,
        paymentType: newSession.paymenttype,
        paymentAmount: newSession.payment_amount,
        focusArea: newSession.focus_area,
        keyOutcomes: newSession.key_outcomes,
        clientProgress: newSession.client_progress,
        coachingTools: newSession.coaching_tools || [],
        icfCompetencies: newSession.icf_competencies || [],
        user_id: newSession.user_id,
        id: newSession.id,
      };
      setSessions(prev => [mappedSession, ...prev]);
    }
  };

  // Delete session from Supabase
  const deleteSession = async (idx: number) => {
    const session = sessions[idx];
    if (!session) return;
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", session.id);
    if (!error) setSessions(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Client Sessions Log</h2>
      <SessionForm onSubmit={addSession} />
      {loading ? <div>Loading...</div> : <SessionList sessions={sessions} onDelete={deleteSession} onCardClick={(idx) => {
        const session = sessions[idx];
        if (session) {
          router.push(`/dashboard/sessions/edit/${session.id}`);
        }
      }} />}
    </div>
  );
} 