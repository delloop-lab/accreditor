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
          additionalNotes: session.notes,
          types: session.types,
          paymentType: session.paymenttype,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newSession, error } = await supabase
      .from("sessions")
      .insert([{ 
        client_id: data.clientId,
        client_name: data.clientName,
        date: data.date,
        finish_date: data.finishDate,
        duration: data.duration,
        notes: data.additionalNotes,
        types: data.types,
        paymenttype: data.paymentType,
        payment_amount: data.paymentAmount,
        focus_area: data.focusArea,
        key_outcomes: data.keyOutcomes,
        client_progress: data.clientProgress,
        coaching_tools: data.coachingTools,
        icf_competencies: data.icfCompetencies,
        user_id: user.id
      }])
      .select()
      .single();
    if (!error && newSession) setSessions(prev => [newSession, ...prev]);
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