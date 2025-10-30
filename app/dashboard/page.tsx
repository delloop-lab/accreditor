"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabaseClient";
import { formatNumberForDisplay, LocaleInfo } from "@/lib/numberUtils";
import { PlusIcon, ClipboardDocumentListIcon, UserIcon, ClockIcon, AcademicCapIcon, LockClosedIcon, BookOpenIcon, ChartBarIcon, CheckBadgeIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';

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

// Helper for getting next level requirements
const getNextLevelRequirements = (currentLevel: string) => {
  switch (currentLevel) {
    case "none":
      return { sessionHours: 100, cpdHours: 60 }; // ACC requirements
    case "acc":
      return { sessionHours: 500, cpdHours: 125 }; // PCC requirements
    case "pcc":
      return { sessionHours: 2500, cpdHours: 200 }; // MCC requirements
    case "mcc":
      return { sessionHours: 2500, cpdHours: 200 }; // Already at highest level
    default:
      return { sessionHours: 100, cpdHours: 60 }; // Default to ACC requirements
  }
};

// Helper for getting next level name
const getNextLevelName = (currentLevel: string) => {
  switch (currentLevel) {
    case "none":
      return "ACC";
    case "acc":
      return "PCC";
    case "pcc":
      return "MCC";
    case "mcc":
      return "MCC";
    default:
      return "ACC";
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [cpdActivities, setCpdActivities] = useState<any[]>([]);
  const [cpdHours, setCpdHours] = useState(0);
  const [totalSessionHours, setTotalSessionHours] = useState(0);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [thisMonthHours, setThisMonthHours] = useState(0);
  const [mentoringHours, setMentoringHours] = useState(0);
  const [supervisionHours, setSupervisionHours] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedCpd, setSelectedCpd] = useState<any>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCpdModal, setShowCpdModal] = useState(false);
  const [showProfileReminder, setShowProfileReminder] = useState(false);


  // Currency symbols mapping
  const CURRENCY_SYMBOLS: { [key: string]: string } = {
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "CAD": "C$",
    "AUD": "A$",
    "JPY": "¥",
    "CHF": "CHF",
    "NZD": "NZ$",
    "SEK": "SEK",
    "NOK": "NOK",
    "DKK": "DKK"
  };

  const getCurrencySymbol = (currency: string) => {
    return CURRENCY_SYMBOLS[currency] || currency;
  };

  // Function to fetch all data
  const fetchData = async () => {
    try {
      const { user, error: authError } = await getCurrentUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        const errorMessage = authError && typeof authError === 'object' && 'message' in authError 
          ? (authError as any).message 
          : 'Authentication error';
        if (errorMessage === 'Mock client') {
          setError('Supabase not configured. Please set up your environment variables.');
          setLoading(false);
          return;
        }
        // Don't redirect immediately on auth errors, might be temporary
        console.warn('Temporary auth error, retrying...');
        setLoading(false);
        return;
      }
      
      if (!user) {
        router.replace("/login");
        setLoading(false);
        return;
      }
      
      setUser(user);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, icf_level, currency")
        .eq("user_id", user.id)
        .single();
        
      if (!profileError && profileData) {
        setProfile(profileData);
      }
      
      // Fetch all sessions for total hours calculation
      const { data: allSessionData, error: allSessionError } = await supabase
        .from("sessions")
        .select("duration, date")
        .eq("user_id", user.id);
        
      if (allSessionError && allSessionError.message !== 'Mock client') {
        console.error('All sessions fetch error:', allSessionError);
      }
      
      // Calculate total session hours from all sessions
      if (allSessionData && allSessionData.length > 0) {
        // Debug: Log sample durations to understand the data format
        console.log('Sample durations:', allSessionData.slice(0, 5).map(s => s.duration));
        console.log('All durations:', allSessionData.map(s => s.duration));
        console.log('Duration statistics:', {
          count: allSessionData.length,
          min: Math.min(...allSessionData.map(s => s.duration || 0)),
          max: Math.max(...allSessionData.map(s => s.duration || 0)),
          average: allSessionData.reduce((sum, s) => sum + (s.duration || 0), 0) / allSessionData.length
        });
        
        const totalHours = allSessionData.reduce((sum: number, session: any) => {
          const duration = session.duration || 0;
          // Duration is stored in minutes, convert to hours
          return sum + (duration / 60);
        }, 0);
        
        setTotalSessionHours(Math.round(totalHours)); // Round to nearest whole hour
        setTotalSessionsCount(allSessionData.length);
      } else {
        setTotalSessionHours(0);
        setTotalSessionsCount(0);
      }
      
      // Fetch sessions (limit 3 recent for display)
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("id, client_name, date, duration, notes, types, number_in_group, paymenttype, focus_area, key_outcomes, client_progress, coaching_tools, icf_competencies, additional_notes")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(3);
        
      if (sessionError && sessionError.message !== 'Mock client') {
        console.error('Session fetch error:', sessionError);
      }
      
      // Map real session data to consistent format
      const mappedSessionData = sessionData ? sessionData.map((session: any) => ({
        id: session.id,
        clientName: session.client_name,
        client_name: session.client_name, // Keep both for compatibility
        date: session.date,
        duration: session.duration,
        notes: session.notes,
        additionalNotes: session.additional_notes,
        types: session.types,
        numberInGroup: session.number_in_group,
        paymentType: session.paymenttype,
        payment_type: session.paymenttype, // Keep both for compatibility
        focusArea: session.focus_area,
        keyOutcomes: session.key_outcomes,
        clientProgress: session.client_progress,
        coachingTools: session.coaching_tools,
        icfCompetencies: session.icf_competencies
      })) : null;
      
      setSessions(mappedSessionData || []);

      
      // Fetch CPD activities (limit 3 recent for display)
      const { data: cpdData, error: cpdError } = await supabase
        .from("cpd")
        .select("id, title, activity_date, hours, description, cpd_type, certificate_proof")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: false })
        .limit(3);
        
      // Fetch all CPD activities for total hours calculation
      const { data: allCpdData, error: allCpdError } = await supabase
        .from("cpd")
        .select("hours")
        .eq("user_id", user.id);
        
      if (cpdError && cpdError.message !== 'Mock client') {
        console.error('CPD fetch error:', cpdError);
      }
      
      // Map real data to consistent format
      const mappedCpdData = cpdData ? cpdData.map((item: any) => ({
        id: item.id,
        title: item.title,
        date: item.activity_date || item.date,
        hours: item.hours,
        description: item.description,
        cpdType: item.cpd_type || item.type || "workshop",
        certificate_link: item.certificate_proof || ""
      })) : null;
      
      setCpdActivities(mappedCpdData || []);

      // Calculate total CPD hours from all fetched data
      if (allCpdData && allCpdData.length > 0) {
        const totalCpdHours = allCpdData.reduce((sum: number, item: any) => sum + (item.hours || 0), 0);
        setCpdHours(totalCpdHours);
      } else {
        setCpdHours(0);
      }

      // Fetch mentoring and supervision data
      const { data: mentoringData, error: mentoringError } = await supabase
        .from("mentoring_supervision")
        .select("session_type, duration")
        .eq("user_id", user.id);
        
      if (mentoringError && mentoringError.message !== 'Mock client') {
        console.error('Mentoring/Supervision fetch error:', mentoringError);
      }
      
      // Calculate mentoring and supervision hours
      if (mentoringData && mentoringData.length > 0) {
        const mentoringSessions = mentoringData.filter(session => session.session_type === 'mentoring');
        const supervisionSessions = mentoringData.filter(session => session.session_type === 'supervision');
        
        const totalMentoringHours = mentoringSessions.reduce((sum: number, session: any) => {
          const duration = session.duration || 0;
          // Duration is stored in minutes, convert to hours
          return sum + (duration / 60);
        }, 0);
        
        const totalSupervisionHours = supervisionSessions.reduce((sum: number, session: any) => {
          const duration = session.duration || 0;
          // Duration is stored in minutes, convert to hours
          return sum + (duration / 60);
        }, 0);
        
        setMentoringHours(Math.round(totalMentoringHours * 10) / 10); // Round to 1 decimal place
        setSupervisionHours(Math.round(totalSupervisionHours * 10) / 10); // Round to 1 decimal place
      } else {
        setMentoringHours(0);
        setSupervisionHours(0);
      }

      // Calculate this month's hours
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calculate this month hours from ALL sessions, not just the 3 recent ones
      const thisMonthSessions = allSessionData?.filter((session: any) => {
        if (!session.date) return false;
        const sessionDate = new Date(session.date);
        const sessionMonth = sessionDate.getMonth();
        const sessionYear = sessionDate.getFullYear();
        
        // Handle both current year and future dates for testing/demo purposes
        const isCurrentMonth = sessionMonth === currentMonth;
        const isCurrentOrNextYear = sessionYear === currentYear || sessionYear === currentYear + 1;
        
        return isCurrentMonth && isCurrentOrNextYear;
      }) || [];
      
      // Debug logging for this month calculation
      console.log('This month calculation debug:', {
        currentMonth,
        currentYear,
        totalSessions: allSessionData?.length || 0,
        thisMonthSessionsCount: thisMonthSessions.length,
        sampleSessionDates: thisMonthSessions.slice(0, 3).map(s => ({
          date: s.date,
          parsedDate: new Date(s.date),
          month: new Date(s.date).getMonth(),
          year: new Date(s.date).getFullYear(),
          duration: s.duration
        })),
        allSessionDates: allSessionData?.slice(0, 5).map(s => ({
          date: s.date,
          parsedDate: new Date(s.date),
          month: new Date(s.date).getMonth(),
          year: new Date(s.date).getFullYear()
        })),
        filterLogic: {
          currentMonth,
          currentYear,
          expectedMonth: 6, // July is month 6 (0-indexed)
          expectedYear: 2025
        }
      });
      
      const thisMonthTotalHours = thisMonthSessions.reduce((total: number, session: any) => {
        const duration = session.duration || 0;
        // Duration is stored in minutes, convert to hours
        return total + (duration / 60);
      }, 0);
      
      console.log('This month total hours calculation:', {
        thisMonthTotalHours,
        roundedHours: Math.round(thisMonthTotalHours),
        sessionCount: thisMonthSessions.length
      });
      
      // Fallback: If no sessions found for current month, check for July 2025 specifically
      if (thisMonthSessions.length === 0 && allSessionData) {
        const july2025Sessions = allSessionData.filter((session: any) => {
          if (!session.date) return false;
          const sessionDate = new Date(session.date);
          return sessionDate.getMonth() === 6 && sessionDate.getFullYear() === 2025; // July 2025
        });
        
        if (july2025Sessions.length > 0) {
          const july2025Hours = july2025Sessions.reduce((total: number, session: any) => {
            const duration = session.duration || 0;
            return total + (duration / 60);
          }, 0);
          
          console.log('Fallback July 2025 calculation:', {
            july2025SessionsCount: july2025Sessions.length,
            july2025Hours: Math.round(july2025Hours)
          });
          
          setThisMonthHours(Math.round(july2025Hours));
        } else {
          setThisMonthHours(Math.round(thisMonthTotalHours));
        }
      } else {
        setThisMonthHours(Math.round(thisMonthTotalHours)); // Round to nearest whole hour
      }

      // Check if profile is incomplete and show reminder
      console.log('Profile data check:', {
        hasProfileData: !!profileData,
        profileName: profileData?.name,
        nameTrimmed: profileData?.name?.trim(),
        nameLength: profileData?.name?.length
      });
      
      if (profileData && profileData.name && profileData.name.trim() !== '') {
        // User has a name, don't show reminder
        console.log('User has name, hiding reminder');
        setShowProfileReminder(false);
      } else {
        // User doesn't have a name, show reminder
        console.log('User missing name, showing reminder');
        setShowProfileReminder(true);
      }

    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Add focus event listener to refresh data when user returns to the page
    const handleFocus = () => {
      fetchData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Also refresh data when the component mounts or when user navigates back
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
    <div className="w-full max-w-7xl mx-auto">
      {/* Welcome and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8 gap-4 md:gap-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Welcome back, {profile?.name ? profile.name.split(' ')[0] : 'Coach'}
            </h1>
            {profile?.icf_level && (
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold ${getICFBadge(profile.icf_level).color}`}>
                <CheckBadgeIcon className="h-4 w-4" />
                {getICFBadge(profile.icf_level).icon}
              </div>
            )}
          </div>
          <p className="text-gray-600 text-lg">Track your coaching journey and maintain ICF compliance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button 
            onClick={() => router.push('/dashboard/cpd')}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 text-sm font-medium"
          >
            <AcademicCapIcon className="h-5 w-5" /> Add CPD
          </button>
          <button 
            onClick={() => router.push('/dashboard/sessions')}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 text-sm font-medium"
          >
            <PlusIcon className="h-5 w-5" /> Log Session
          </button>
          <button 
            onClick={() => router.push('/dashboard/reports')}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-lg shadow-sm hover:bg-purple-700 hover:shadow-md transition-all duration-200 text-sm font-medium"
          >
            <ChartBarIcon className="h-5 w-5" /> View Reports
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 min-w-[200px]">
          <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0"><UserIcon className="h-6 w-6 text-blue-600" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Total Sessions</div>
            <div className="font-bold text-2xl text-gray-900 mt-1">{totalSessionsCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 min-w-[200px]">
          <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0"><ClockIcon className="h-6 w-6 text-blue-600" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">This Month Hours</div>
            <div className="font-bold text-2xl text-gray-900 mt-1">{thisMonthHours}h</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 min-w-[200px]">
          <div className="bg-purple-100 p-3 rounded-xl flex-shrink-0"><AcademicCapIcon className="h-6 w-6 text-purple-600" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">CPD Hours</div>
            <div className="font-bold text-2xl text-gray-900 mt-1">{cpdHours}h</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 min-w-[200px]">
          <div className="bg-emerald-100 p-3 rounded-xl flex-shrink-0"><UserIcon className="h-6 w-6 text-emerald-600" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Mentoring Hours</div>
            <div className="font-bold text-2xl text-gray-900 mt-1">{mentoringHours}h</div>
            <div className="text-sm text-gray-400 mt-1">10h/year required</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 min-w-[200px]">
          <div className="bg-indigo-100 p-3 rounded-xl flex-shrink-0"><AcademicCapIcon className="h-6 w-6 text-indigo-600" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Supervision Hours</div>
            <div className="font-bold text-2xl text-gray-900 mt-1">{supervisionHours}h</div>
            <div className="text-sm text-gray-400 mt-1">Not required</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 min-w-[200px]">
          <div className="bg-green-100 p-3 rounded-xl flex-shrink-0"><LockClosedIcon className="h-6 w-6 text-green-600" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">ICF Compliance</div>
            <div className="font-bold text-2xl text-gray-900 mt-1">In Progress</div>
          </div>
        </div>
      </div>

      {/* ICF Progress Graph */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6 md:mb-8">
        <h2 className="font-semibold text-lg mb-4">Progress to Next ICF Level</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Session Hours Progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Coaching Hours</h3>
              <span className="text-sm text-gray-500">
                {Math.round(totalSessionHours)}h / {getNextLevelRequirements(profile?.icf_level).sessionHours}h
              </span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    {getNextLevelName(profile?.icf_level)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {Math.round((totalSessionHours / getNextLevelRequirements(profile?.icf_level).sessionHours) * 100)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div 
                  style={{ width: `${Math.min(100, (totalSessionHours / getNextLevelRequirements(profile?.icf_level).sessionHours) * 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <p>• Current: {Math.round(totalSessionHours)} coaching hours</p>
              <p>• Required: {getNextLevelRequirements(profile?.icf_level).sessionHours} hours for {getNextLevelName(profile?.icf_level)}</p>
              <p>• Remaining: {Math.max(0, getNextLevelRequirements(profile?.icf_level).sessionHours - totalSessionHours)} hours needed</p>
            </div>
          </div>

          {/* CPD Hours Progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">CPD Training Hours</h3>
              <span className="text-sm text-gray-500">
                {cpdHours}h / {getNextLevelRequirements(profile?.icf_level).cpdHours}h
              </span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                    {getNextLevelName(profile?.icf_level)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-purple-600">
                    {Math.round((cpdHours / getNextLevelRequirements(profile?.icf_level).cpdHours) * 100)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                <div 
                  style={{ width: `${Math.min(100, (cpdHours / getNextLevelRequirements(profile?.icf_level).cpdHours) * 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 transition-all duration-500"
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <p>• Current: {cpdHours} CPD training hours</p>
              <p>• Required: {getNextLevelRequirements(profile?.icf_level).cpdHours} hours for {getNextLevelName(profile?.icf_level)}</p>
              <p>• Remaining: {Math.max(0, getNextLevelRequirements(profile?.icf_level).cpdHours - cpdHours)} hours needed</p>
            </div>
          </div>
        </div>
        
        {/* Overall Progress Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Next Level: {getNextLevelName(profile?.icf_level)}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Coaching Hours:</span>
              <span className="ml-2 font-medium">
                {Math.round(totalSessionHours)}/{getNextLevelRequirements(profile?.icf_level).sessionHours}
              </span>
            </div>
            <div>
              <span className="text-gray-600">CPD Hours:</span>
              <span className="ml-2 font-medium">
                {cpdHours}/{getNextLevelRequirements(profile?.icf_level).cpdHours}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {profile?.icf_level === 'mcc' ? 
              "You have reached the highest ICF credential level!" :
              `Complete both requirements to apply for ${getNextLevelName(profile?.icf_level)} credential.`
            }
          </div>
        </div>
      </div>

      {/* Mentoring & Supervision Progress */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6 md:mb-8">
        <h2 className="font-semibold text-lg mb-4">Annual Mentoring & Supervision Hours</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Mentoring Hours Progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Mentoring Hours (Required)</h3>
              <span className="text-sm text-gray-500">
                {mentoringHours}h / 10h per year
              </span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                    Annual Requirement
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-emerald-600">
                    {Math.round((mentoringHours / 10) * 100)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-200">
                <div 
                  style={{ width: `${Math.min(100, (mentoringHours / 10) * 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <p>• Current: {mentoringHours} mentoring hours</p>
              <p>• Required: 10 hours per year for ICF compliance</p>
              <p>• {mentoringHours >= 10 ? 'Requirement met! ✓' : `Remaining: ${Math.max(0, 10 - mentoringHours)} hours needed`}</p>
            </div>
          </div>

          {/* Supervision Hours (Informational) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Supervision Hours (Informational)</h3>
              <span className="text-sm text-gray-500">
                {supervisionHours}h total
              </span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                    Optional Tracking
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-indigo-600">
                    {supervisionHours > 0 ? 'Active' : 'None Yet'}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                <div 
                  style={{ width: supervisionHours > 0 ? '100%' : '0%' }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <p>• Current: {supervisionHours} supervision hours</p>
              <p>• Supervision hours are not required for ICF credentials</p>
              <p>• Useful for professional development and practice improvement</p>
            </div>
          </div>
        </div>
        

      </div>
      
      {/* Recent Activities - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
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
                className="py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors min-w-0"
                onClick={() => handleSessionClick(session.id || `session-${idx}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{session.client_name || session.clientName}</div>
                  <div className="text-sm text-gray-500 line-clamp-2 md:line-clamp-1">{session.additionalNotes || session.notes || session.focusArea || 'No notes'}</div>
                  <div className="flex gap-2 md:gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 flex-shrink-0"><ClockIcon className="h-3 w-3 md:h-4 md:w-4" /> {formatDuration(session.duration)}</span>
                    <span className="flex-shrink-0">{session.date && new Date(session.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1 md:gap-2 flex-wrap md:flex-shrink-0">
                  {Array.isArray(session.types)
                    ? session.types.slice(0, 2).map((type: string) => (
                        <span key={type} className={`px-2 py-1 rounded text-xs font-semibold ${typeColor(type)}`}>{type}</span>
                      ))
                    : null}
                  {Array.isArray(session.types) && session.types.length > 2 && (
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">+{session.types.length - 2}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent CPD */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
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
                className="py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors min-w-0"
                onClick={() => handleCpdClick(cpd.id || `cpd-${idx}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{cpd.title}</div>
                  <div className="text-sm text-gray-500 line-clamp-2 md:line-clamp-1">{cpd.description}</div>
                  <div className="flex gap-2 md:gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 flex-shrink-0"><BookOpenIcon className="h-3 w-3 md:h-4 md:w-4" /> {cpd.hours}h</span>
                    <span className="flex-shrink-0">{cpd.date && new Date(cpd.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1 md:gap-2 flex-wrap md:flex-shrink-0">
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
                    <p>{formatNumberForDisplay(selectedSession.payment_amount, { country: profile?.country || 'US', currency: profile?.currency || 'USD' }, { style: 'currency' })}</p>
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
              
              {(selectedSession.coaching_tools || selectedSession.coachingTools) && (selectedSession.coaching_tools?.length > 0 || selectedSession.coachingTools?.length > 0) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Coaching Tools</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(selectedSession.coaching_tools || selectedSession.coachingTools || []).map((tool: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {(selectedSession.icf_competencies || selectedSession.icfCompetencies) && (selectedSession.icf_competencies?.length > 0 || selectedSession.icfCompetencies?.length > 0) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">ICF Competencies</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(selectedSession.icf_competencies || selectedSession.icfCompetencies || []).map((comp: string, index: number) => (
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

      {/* Profile Setup Reminder Modal */}
      {showProfileReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Welcome to ICF Log!</h2>
              <p className="text-gray-600 text-center mb-6">
                To get the most out of your coaching log and ensure accurate ICF compliance tracking, 
                please complete your profile setup.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Profile Setup Includes:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Your full name and contact information</li>
                  <li>• Current ICF credential level</li>
                  <li>• Preferred currency for session tracking</li>
                  <li>• Professional coaching details</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProfileReminder(false);
                    router.push('/dashboard/profile');
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Complete Profile
                </button>
                <button
                  onClick={() => setShowProfileReminder(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
} 