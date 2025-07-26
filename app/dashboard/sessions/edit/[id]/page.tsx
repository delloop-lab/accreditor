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

        const { data, error } = await supabase
          .from("sessions")
          .select("id,client_id,client_name,date,finish_date,duration,types,paymenttype,payment_amount,additional_notes,user_id")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error('Error fetching session:', error);
          setError('Failed to load session');
          return;
        }

        if (data) {
          // Transform the data to match SessionData type
          const sessionData: SessionData = {
            clientId: data.client_id || '',
            clientName: data.client_name || '',
            date: data.date,
            finishDate: data.finish_date || '',
            duration: data.duration,
            types: data.types || [],
            paymentType: data.paymenttype,
            paymentAmount: data.payment_amount,
            focusArea: '',
            keyOutcomes: '',
            clientProgress: '',
            coachingTools: [],
            icfCompetencies: [],
            additionalNotes: data.additional_notes || '',
          };
          setSession(sessionData);
        }
      } catch (error) {
        console.error('Error:', error);
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

      const { error } = await supabase
        .from("sessions")
        .update({
          client_id: updatedData.clientId,
          client_name: updatedData.clientName,
          date: updatedData.date,
          finish_date: updatedData.finishDate,
          duration: updatedData.duration,
          types: updatedData.types,
          paymenttype: updatedData.paymentType,
          payment_amount: updatedData.paymentAmount,
          additional_notes: updatedData.additionalNotes,
        })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (error) {
        console.error('Error updating session:', error);
        setError('Failed to update session');
        return;
      }

      // Redirect back to sessions log
      router.push("/dashboard/sessions/log");
    } catch (error) {
      console.error('Error:', error);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/sessions/log")}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Sessions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Session</h1>
        </div>
        
        <SessionForm 
          onSubmit={handleUpdateSession}
          initialData={session}
          isEditing={true}
        />
      </div>
    </div>
  );
} 