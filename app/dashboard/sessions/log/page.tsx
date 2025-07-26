"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ClockIcon, UserIcon, CalendarIcon, CurrencyDollarIcon, CheckCircleIcon, ArrowDownTrayIcon, PencilIcon } from "@heroicons/react/24/outline";
import { exportSessionsToCSV, exportSessionsToXLSX } from "@/lib/exportUtils";

type SessionEntry = {
  id: string;
  clientName: string;
  date: string;
  finishDate: string;
  duration: number;
  types: string[];
  paymentType: string;
  paymentAmount?: number;
  focusArea: string;
  keyOutcomes: string;
  clientProgress: string;
  coachingTools: string[];
  icfCompetencies: string[];
  additionalNotes: string;
  user_id: string;
};

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
};

export default function SessionsLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const highlightedRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<any>(null);

  const toggleCard = (sessionId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };





  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedId(highlightId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (highlightedId && highlightedRef.current) {
      // Scroll to the highlighted element with a slight delay to ensure rendering
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500);
    }
  }, [highlightedId, sessions]);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
        const { data, error } = await supabase
          .from("sessions")
          .select("id,client_name,date,duration,types,paymenttype,payment_amount,user_id")
          .eq("user_id", user.id)
          .order("date", { ascending: false });
        
        if (!error && data) {
          // Map snake_case to camelCase with null checks
          const mapped = data.map((session: any) => ({
            id: session.id || null,
            clientName: session.client_name || "",
            date: session.date || "",
            finishDate: "",
            duration: session.duration || 0,
            types: Array.isArray(session.types) ? session.types : [],
            paymentType: session.paymenttype || session.payment_type || "",
            paymentAmount: session.payment_amount,
            focusArea: "",
            keyOutcomes: "",
            clientProgress: "",
            coachingTools: [],
            icfCompetencies: [],
            additionalNotes: "",
            user_id: session.user_id || "",
          }));
          setSessions(mapped);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading sessions...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Sessions Log</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportSessionsToCSV(sessions, `sessions-data-${new Date().toISOString().split('T')[0]}`)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportSessionsToXLSX(sessions, `sessions-data-${new Date().toISOString().split('T')[0]}`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>
      
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No sessions logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isHighlighted = highlightedId && (
              session.id === highlightedId || 
              `session-${sessions.indexOf(session)}` === highlightedId
            );
            return (
              <div 
                key={session.id} 
                ref={isHighlighted ? highlightedRef : null}
                className={`bg-white rounded-xl shadow-lg border transition-all duration-300 cursor-pointer hover:shadow-xl ${
                  isHighlighted 
                    ? 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50' 
                    : ''
                }`}
                onClick={(e) => {
                  console.log('Card clicked, target:', e.target);
                  // Only navigate if the click is not on the client name or edit button
                  const target = (e.target as HTMLElement);
                  console.log('Target element:', target);
                  console.log('Is client name?', target.closest('h2[data-client-name]'));
                  console.log('Is edit button?', target.closest('button[title="Edit Session"]'));
                  
                  // Check if click is on client name or edit button
                  if (
                    target.closest('h2[data-client-name]') ||
                    target.closest('button[title="Edit Session"]')
                  ) {
                    console.log('Click blocked - going to client name or edit button');
                    return;
                  }
                  
                  // Check if click is inside the client name area
                  if (target.closest('[data-client-name]')) {
                    console.log('Click blocked - inside client name area');
                    return;
                  }
                  
                  console.log('Navigating to session edit:', session.id);
                  if (session.id && session.id.trim() !== '') {
                    router.push(`/dashboard/sessions/edit/${session.id}`);
                  }
                }}
              >
                {/* Compact Header - Always Visible */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    {/* Client name is a clickable link that opens the client modal */}
                                        <div className="inline-block">
                      <h2 
                        data-client-name
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                        onClick={(e) => { 
                          console.log('Client name clicked:', session.clientName);
                          e.preventDefault();
                          e.stopPropagation(); 
                          router.push(`/dashboard/clients/${session.clientName}`);
                        }}
                      >
                        {session.clientName}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {new Date(session.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {session.duration}min
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        session.paymentType === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {session.paymentType === 'paid' ? 'Paid' : 'Pro Bono'}
                        {session.paymentAmount && session.paymentType === 'paid' && ` - $${session.paymentAmount}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.types.length > 0 && (
                      <div className="flex gap-1">
                        {session.types.slice(0, 2).map((type, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            {type}
                          </span>
                        ))}
                        {session.types.length > 2 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            +{session.types.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (session.id && session.id.trim() !== '') {
                          router.push(`/dashboard/sessions/edit/${session.id}`);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Session"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
} 