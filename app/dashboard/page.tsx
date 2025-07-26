"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PlusIcon, ClipboardDocumentListIcon, UserIcon, ClockIcon, AcademicCapIcon, LockClosedIcon, BookOpenIcon, ChartBarIcon, CheckBadgeIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Helper for session type badge color
const typeColor = (type: string) => {
  switch (type) {
    case "individual": return "bg-green-100 text-green-700";
    case "group": return "bg-blue-100 text-blue-700";
    case "team": return "bg-purple-100 text-purple-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

// Helper for CPD type badge color
const cpdTypeColor = (type: string) => {
  switch (type) {
    case "training": return "bg-blue-100 text-blue-700";
    case "workshop": return "bg-purple-100 text-purple-700";
    case "conference": return "bg-orange-100 text-orange-700";
    case "reading": return "bg-green-100 text-green-700";
    case "mentoring": return "bg-indigo-100 text-indigo-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

// Helper for ICF badge
const getICFBadge = (level: string) => {
  switch (level) {
    case "acc":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "ACC",
        text: "Associate Certified Coach",
        image: "/badges/AFF.png"
      };
    case "pcc":
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "PCC",
        text: "Professional Certified Coach",
        image: "/badges/PCF.png"
      };
    case "mcc":
      return {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: "MCC",
        text: "Master Certified Coach",
        image: "/badges/MCC.png"
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: "ICF",
        text: "ICF Member",
        image: "/badges/ICF.png"
      };
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [cpdActivities, setCpdActivities] = useState<any[]>([]);
  const [cpdHours, setCpdHours] = useState(20); // Placeholder
  const [thisMonthHours, setThisMonthHours] = useState(2); // Placeholder
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedCpd, setSelectedCpd] = useState<any>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCpdModal, setShowCpdModal] = useState(false);

  useEffect(() => {
    const getUserAndData = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          if (authError.message === 'Mock client') {
            setError('Supabase not configured. Please set up your environment variables.');
            setLoading(false);
            return;
          }
          router.replace("/login");
          setLoading(false);
          return;
        }
        
        if (!data.user) {
          router.replace("/login");
          setLoading(false);
          return;
        }
        
        setUser(data.user);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, icf_level")
          .eq("user_id", data.user.id)
          .single();
          
        if (!profileError && profileData) {
          setProfile(profileData);
        }
        
        // Fetch sessions (limit 3 recent)
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("id, client_name, date, duration, notes, types, paymenttype, focus_area, key_outcomes, client_progress, coaching_tools, icf_competencies, additional_notes")
          .eq("user_id", data.user.id)
          .order("date", { ascending: false })
          .limit(3);
          
        if (sessionError && sessionError.message !== 'Mock client') {
          console.error('Session fetch error:', sessionError);
        }
        
        // Use mock session data if no real data
        const mockSessionData = [
          {
            id: 'mock-session-1',
            clientName: "Sarah Johnson",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            types: ["executive"],
            paymentType: "paid",
            paymentAmount: 150,
            focusArea: "Career transition and leadership development",
            keyOutcomes: "Clarified career goals and developed action plan",
            clientProgress: "Made significant progress in identifying next steps",
            coachingTools: ["GROW model", "Values clarification"],
            icfCompetencies: ["Establishing Trust and Intimacy", "Coaching Presence"],
            additionalNotes: "Client is ready to take action on career transition"
          },
          {
            id: 'mock-session-2',
            clientName: "Michael Chen",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 45,
            types: ["life"],
            paymentType: "pro-bono",
            paymentAmount: 0,
            focusArea: "Work-life balance and stress management",
            keyOutcomes: "Identified stress triggers and coping strategies",
            clientProgress: "Started implementing new boundaries at work",
            coachingTools: ["Wheel of Life", "Stress assessment"],
            icfCompetencies: ["Active Listening", "Powerful Questioning"],
            additionalNotes: "Client committed to weekly self-care practices"
          },
          {
            id: 'mock-session-3',
            clientName: "Emma Rodriguez",
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 90,
            types: ["business"],
            paymentType: "paid",
            paymentAmount: 200,
            focusArea: "Team leadership and communication skills",
            keyOutcomes: "Developed communication strategy for team conflicts",
            clientProgress: "Successfully resolved recent team disagreement",
            coachingTools: ["Conflict resolution framework", "Communication models"],
            icfCompetencies: ["Designing Actions", "Managing Progress and Accountability"],
            additionalNotes: "Client showing strong leadership growth"
          }
        ];
        
        setSessions(sessionData || mockSessionData);
        
        // Fetch CPD activities (limit 3 recent)
        const { data: cpdData, error: cpdError } = await supabase
          .from("cpd")
          .select("id, title, activity_date, hours, description, cpd_type, certificate_proof")
          .eq("user_id", data.user.id)
          .order("activity_date", { ascending: false })
          .limit(3);
          
        if (cpdError && cpdError.message !== 'Mock client') {
          console.error('CPD fetch error:', cpdError);
        }
        
        // Use mock CPD data if no real data
        const mockCpdData = [
          {
            id: 'mock-cpd-1',
            title: "ICF Core Competencies Workshop",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            hours: 4,
            description: "Advanced workshop on ICF core competencies",
            cpdType: "workshop",
            certificate_link: "https://example.com/certificate1"
          },
          {
            id: 'mock-cpd-2',
            title: "Coaching Psychology Research",
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            hours: 2,
            description: "Reading latest research in coaching psychology",
            cpdType: "reading",
            certificate_link: "https://example.com/certificate2"
          },
          {
            id: 'mock-cpd-3',
            title: "Executive Coaching Conference",
            date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            hours: 8,
            description: "Annual executive coaching conference",
            cpdType: "conference",
            certificate_link: "https://example.com/certificate3"
          }
        ];
        
        // Map real data to match mock data structure
        const mappedCpdData = cpdData ? cpdData.map((item: any) => ({
          id: item.id,
          title: item.title,
          date: item.activity_date || item.date,
          hours: item.hours,
          description: item.description,
          cpdType: item.cpd_type || item.type || "workshop",
          certificate_link: item.certificate_proof || ""
        })) : null;
        
        setCpdActivities(mappedCpdData || mockCpdData);
      } catch (error) {
        console.error('Error in getUserAndData:', error);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    getUserAndData();
  }, [router]);

  const handleSessionClick = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId || s.id === `session-${sessionId}`);
    if (session) {
      setSelectedSession(session);
      setShowSessionModal(true);
    } else {
      router.push(`/dashboard/sessions/log?highlight=${sessionId}`);
    }
  };

  const handleCpdClick = (cpdId: string) => {
    const cpd = cpdActivities.find(c => c.id === cpdId || c.id === `cpd-${cpdId}`);
    if (cpd) {
      setSelectedCpd(cpd);
      setShowCpdModal(true);
    } else {
      router.push(`/dashboard/cpd/log?highlight=${cpdId}`);
    }
  };

  const closeSessionModal = () => {
    setShowSessionModal(false);
    setSelectedSession(null);
  };

  const closeCpdModal = () => {
    setShowCpdModal(false);
    setSelectedCpd(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Configuration Error
          </h2>
          
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Welcome and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.name ? profile.name.split(' ')[0] : 'Coach'}
            </h1>
            {profile?.icf_level && (
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold ${getICFBadge(profile.icf_level).color}`}>
                <CheckBadgeIcon className="h-4 w-4" />
                {getICFBadge(profile.icf_level).icon}
              </div>
            )}
          </div>
          <p className="text-gray-500">Track your coaching journey and maintain ICF compliance</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push('/dashboard/cpd')}
            className="flex items-center gap-2 bg-white border px-4 py-2 rounded shadow hover:bg-gray-50"
          >
            <AcademicCapIcon className="h-5 w-5" /> Add CPD
          </button>
          <button 
            onClick={() => router.push('/dashboard/sessions')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" /> Log Session
          </button>
          <button 
            onClick={() => router.push('/dashboard/reports')}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700"
          >
            <ChartBarIcon className="h-5 w-5" /> View Reports
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full"><UserIcon className="h-6 w-6 text-blue-600" /></div>
          <div>
            <div className="text-xs text-gray-500">Total Sessions</div>
            <div className="font-bold text-xl">{sessions.length}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full"><ClockIcon className="h-6 w-6 text-blue-600" /></div>
          <div>
            <div className="text-xs text-gray-500">This Month Hours</div>
            <div className="font-bold text-xl">{thisMonthHours}h</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <div className="bg-purple-100 p-2 rounded-full"><AcademicCapIcon className="h-6 w-6 text-purple-600" /></div>
          <div>
            <div className="text-xs text-gray-500">CPD Hours</div>
            <div className="font-bold text-xl">{cpdHours}h</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <div className="bg-green-100 p-2 rounded-full"><LockClosedIcon className="h-6 w-6 text-green-600" /></div>
          <div>
            <div className="text-xs text-gray-500">ICF Compliance</div>
            <div className="font-bold text-xl">In Progress</div>
          </div>
        </div>
      </div>
      
      {/* Recent Activities - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Sessions</h2>
            <button 
              onClick={() => router.push('/dashboard/sessions')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y">
            {sessions.length === 0 && <div className="text-gray-500 text-center py-8">No sessions logged yet.</div>}
            {sessions.map((session, idx) => (
              <div 
                key={session.id || idx} 
                className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => handleSessionClick(session.id || `session-${idx}`)}
              >
                <div>
                  <div className="font-semibold">{session.client_name || session.clientName}</div>
                  <div className="text-sm text-gray-500">{session.notes || session.focusArea || 'No notes'}</div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4" /> {session.duration} min</span>
                    <span>{session.date && new Date(session.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Array.isArray(session.types)
                    ? session.types.map((type: string) => (
                        <span key={type} className={`px-2 py-1 rounded text-xs font-semibold ${typeColor(type)}`}>{type}</span>
                      ))
                    : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent CPD */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent CPD</h2>
            <button 
              onClick={() => router.push('/dashboard/cpd')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y">
            {cpdActivities.length === 0 && <div className="text-gray-500 text-center py-8">No CPD activities logged yet.</div>}
            {cpdActivities.map((cpd, idx) => (
              <div 
                key={cpd.id || idx} 
                className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => handleCpdClick(cpd.id || `cpd-${idx}`)}
              >
                <div>
                  <div className="font-semibold">{cpd.title}</div>
                  <div className="text-sm text-gray-500">{cpd.description}</div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><BookOpenIcon className="h-4 w-4" /> {cpd.hours}h</span>
                    <span>{cpd.date && new Date(cpd.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${cpdTypeColor(cpd.cpdType)}`}>
                    {cpd.cpdType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Detail Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Session Details</h2>
              <button onClick={closeSessionModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <p className="font-semibold">{selectedSession.client_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p>{selectedSession.date ? formatDate(selectedSession.date) : 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p>{selectedSession.duration ? formatDuration(selectedSession.duration) : 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Session Type</label>
                  <p>{Array.isArray(selectedSession.types) ? selectedSession.types.join(', ') : selectedSession.types || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Type</label>
                  <p className="capitalize">{selectedSession.payment_type || selectedSession.paymentType || 'Not specified'}</p>
                </div>
                {selectedSession.payment_amount && selectedSession.payment_type === 'paid' && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Amount</label>
                    <p>${selectedSession.payment_amount}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Focus Area</label>
                  <p>{selectedSession.focus_area || selectedSession.focusArea || 'Not specified'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Key Outcomes</label>
                <p className="mt-1">{selectedSession.key_outcomes || selectedSession.keyOutcomes || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Client Progress</label>
                <p className="mt-1">{selectedSession.client_progress || selectedSession.clientProgress || 'Not specified'}</p>
              </div>
              
              {selectedSession.coaching_tools && selectedSession.coaching_tools.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Coaching Tools</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedSession.coaching_tools.map((tool: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedSession.icf_competencies && selectedSession.icf_competencies.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">ICF Competencies</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedSession.icf_competencies.map((comp: string, index: number) => (
                      <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Additional Notes</label>
                <p className="mt-1">{selectedSession.additional_notes || selectedSession.additionalNotes || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => router.push(`/dashboard/sessions/log?highlight=${selectedSession.id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                View in Log
              </button>
              <button
                onClick={closeSessionModal}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CPD Detail Modal */}
      {showCpdModal && selectedCpd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">CPD Activity Details</h2>
              <button onClick={closeCpdModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="font-semibold">{selectedCpd.title || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p>{selectedCpd.date ? formatDate(selectedCpd.date) : 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Hours</label>
                  <p>{selectedCpd.hours || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="capitalize">{selectedCpd.cpdType || selectedCpd.type || 'Not specified'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1">{selectedCpd.description || 'Not specified'}</p>
              </div>
              
              {selectedCpd.certificate_link && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Certificate Link</label>
                  <a 
                    href={selectedCpd.certificate_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline mt-1 block"
                  >
                    View Certificate
                  </a>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => router.push(`/dashboard/cpd/log?highlight=${selectedCpd.id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                View in Log
              </button>
              <button
                onClick={closeCpdModal}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 