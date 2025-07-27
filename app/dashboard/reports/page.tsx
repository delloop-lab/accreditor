"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  AcademicCapIcon, 
  ClockIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";

type ICFCompetency = {
  name: string;
  hours: number;
  target: number;
  color: string;
  description: string;
};

type CPDEntry = {
  id: string;
  title: string;
  date: string;
  hours: number;
  cpdType: string;
  learningMethod: string;
  providerOrganization: string;
  description: string;
  keyLearnings: string;
  applicationToPractice: string;
  icfCompetencies: string[];
  certificateProof: string;
  user_id: string;
};

type SessionEntry = {
  id: string;
  client_name: string;
  date: string;
  duration: number;
  notes: string;
  types: string[];
  payment_type: string;
  payment_amount: number;
  additional_notes: string;
  user_id: string;
};

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cpdEntries, setCpdEntries] = useState<CPDEntry[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [currentYearHours, setCurrentYearHours] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentYearSessions, setCurrentYearSessions] = useState(0);
  const [currentYearSessionHours, setCurrentYearSessionHours] = useState(0);
  const [competencyBreakdown, setCompetencyBreakdown] = useState<ICFCompetency[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentYearCpdHours, setCurrentYearCpdHours] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  const ICF_COMPETENCIES: ICFCompetency[] = [
    {
      name: "Demonstrates Ethical Practice",
      hours: 0,
      target: 5,
      color: "bg-blue-500",
      description: "Maintains high ethical standards and professional boundaries"
    },
    {
      name: "Embodies a Coaching Mindset",
      hours: 0,
      target: 5,
      color: "bg-green-500",
      description: "Develops and maintains a coaching mindset and presence"
    },
    {
      name: "Establishes and Maintains Agreements",
      hours: 0,
      target: 5,
      color: "bg-purple-500",
      description: "Partners with clients to establish clear agreements"
    },
    {
      name: "Cultivates Trust and Safety",
      hours: 0,
      target: 5,
      color: "bg-yellow-500",
      description: "Creates a safe, supportive environment for coaching"
    },
    {
      name: "Maintains Presence",
      hours: 0,
      target: 5,
      color: "bg-pink-500",
      description: "Maintains focus, curiosity, and flexibility during coaching"
    },
    {
      name: "Listens Actively",
      hours: 0,
      target: 5,
      color: "bg-indigo-500",
      description: "Focuses on what the client is and is not saying"
    },
    {
      name: "Evokes Awareness",
      hours: 0,
      target: 5,
      color: "bg-red-500",
      description: "Facilitates client insight and learning"
    },
    {
      name: "Facilitates Client Growth",
      hours: 0,
      target: 5,
      color: "bg-orange-500",
      description: "Partners with clients to transform learning into action"
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
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

        // Fetch CPD data
        const { data: cpdData, error: cpdError } = await supabase
          .from("cpd")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        // Fetch Sessions data
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        // Use real data only
        let entries: CPDEntry[] = [];
        if (!cpdError && cpdData) {
          entries = cpdData.map((item: any) => ({
            id: item.id || "",
            title: item.title || "",
            date: item.date || "",
            hours: item.hours || 0,
            cpdType: item.cpd_type || "",
            learningMethod: item.learning_method || "",
            providerOrganization: item.provider_organization || "",
            description: item.description || "",
            keyLearnings: item.key_learnings || "",
            applicationToPractice: item.application_to_practice || "",
            icfCompetencies: Array.isArray(item.icf_competencies) ? item.icf_competencies : [],
            certificateProof: item.certificate_proof || "",
            user_id: item.user_id || "",
          }));
        } else {
          entries = [];
        }

        let sessionEntries: SessionEntry[] = [];
        if (!sessionError && sessionData) {
          sessionEntries = sessionData.map((item: any) => ({
            id: item.id || "",
            client_name: item.client_name || "",
            date: item.date || "",
            duration: item.duration || 0,
            notes: item.notes || "",
            types: Array.isArray(item.types) ? item.types : [],
            payment_type: item.payment_type || "",
            payment_amount: item.payment_amount || 0,
            additional_notes: item.additional_notes || "",
            user_id: item.user_id || "",
          }));
        } else {
          sessionEntries = [];
        }

        setCpdEntries(entries);
        setSessions(sessionEntries);

        // Calculate totals and breakdowns
        const total = entries.reduce((sum: number, entry: CPDEntry) => sum + entry.hours, 0);
        setTotalHours(total);

        const currentYear = new Date().getFullYear();
        const currentYearTotal = entries
          .filter((entry: CPDEntry) => new Date(entry.date).getFullYear() === currentYear)
          .reduce((sum: number, entry: CPDEntry) => sum + entry.hours, 0);
        setCurrentYearHours(currentYearTotal);
        setCurrentYearCpdHours(currentYearTotal);

        // Calculate session metrics
        setTotalSessions(sessionEntries.length);
        const currentYearSessionsTotal = sessionEntries
          .filter((session: SessionEntry) => new Date(session.date).getFullYear() === currentYear)
          .length;
        setCurrentYearSessions(currentYearSessionsTotal);
        
        // Calculate current year session hours
        const currentYearSessionHoursTotal = sessionEntries
          .filter((session: SessionEntry) => new Date(session.date).getFullYear() === currentYear)
          .reduce((sum: number, session: SessionEntry) => sum + (session.duration / 60), 0);
        setCurrentYearSessionHours(Math.round(currentYearSessionHoursTotal * 10) / 10); // Round to 1 decimal place

        // Calculate competency breakdown
        const competencyHours: { [key: string]: number } = {};
        ICF_COMPETENCIES.forEach(comp => {
          competencyHours[comp.name] = 0;
        });
        
        entries.forEach((entry: CPDEntry) => {
          entry.icfCompetencies.forEach((competency: string) => {
            if (competency in competencyHours) {
              competencyHours[competency] += entry.hours;
            }
          });
        });

        const breakdown = ICF_COMPETENCIES.map(comp => ({
          ...comp,
          hours: competencyHours[comp.name] || 0
        }));
        setCompetencyBreakdown(breakdown);

      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    if (percentage >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusIcon = (current: number, target: number) => {
    if (current >= target) return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    if (current >= target * 0.75) return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
    return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
  };

  const handleCardClick = (cardType: string) => {
    setSelectedCard(selectedCard === cardType ? null : cardType);
  };

  const handleCpdClick = (cpdId: string) => {
    router.push(`/dashboard/cpd/log?highlight=${cpdId}`);
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/dashboard/sessions/log?highlight=${sessionId}`);
  };

  const isProfileComplete = () => {
    return profile && profile.name && profile.name.trim() !== '';
  };

  const generateICFReport = () => {
    setIsGeneratingReport(true);
    
    const currentYearSessions = sessions.filter(session => 
      new Date(session.date).getFullYear() === currentYear
    );
    
    const currentYearCpd = cpdEntries.filter(entry => 
      new Date(entry.date).getFullYear() === currentYear
    );

    const reportData = {
      coachName: profile?.name || 'Coach',
      icfLevel: profile?.icf_level || 'Not specified',
      reportYear: currentYear,
      generatedDate: new Date().toLocaleDateString(),
      
      // Session Summary
      totalSessions: currentYearSessions.length,
      totalSessionHours: currentYearSessionHours,
             sessions: currentYearSessions.map(session => ({
         date: new Date(session.date).toLocaleDateString(),
         clientName: session.client_name,
         duration: (session.duration / 60).toFixed(1) + 'h',
         sessionType: session.types.length > 0 ? session.types[0] : 'Individual',
         notes: session.notes || session.additional_notes || ''
       })),
       
       // CPD Summary
       totalCpdActivities: currentYearCpd.length,
       totalCpdHours: currentYearCpdHours,
       cpdActivities: currentYearCpd.map(entry => ({
         date: new Date(entry.date).toLocaleDateString(),
         title: entry.title,
         description: entry.description,
         duration: entry.hours + 'h',
         category: entry.cpdType,
         competencies: entry.icfCompetencies.length || 0
       }))
    };

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ICF Credential Renewal Report - ${reportData.coachName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .summary-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .summary-card { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; }
        .summary-card.cpd { border-left-color: #8b5cf6; }
        .section-title { color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .activity-item { background: white; padding: 15px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #e5e7eb; }
        .activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .activity-date { color: #6b7280; font-size: 14px; }
        .activity-duration { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .activity-category { background: #f3e8ff; color: #7c3aed; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .icf-logo { text-align: center; margin-bottom: 20px; }
        .icf-logo img { max-width: 200px; }
        @media print { body { max-width: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>ICF Credential Renewal Report</h1>
        <p><strong>Coach:</strong> ${reportData.coachName}</p>
        <p><strong>ICF Level:</strong> ${reportData.icfLevel.toUpperCase()}</p>
        <p><strong>Report Period:</strong> ${reportData.reportYear}</p>
        <p><strong>Generated:</strong> ${reportData.generatedDate}</p>
    </div>

    <div class="summary-section">
        <h2 class="section-title">Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Coaching Sessions</h3>
                <p><strong>Total Sessions:</strong> ${reportData.totalSessions}</p>
                <p><strong>Total Hours:</strong> ${reportData.totalSessionHours}h</p>
            </div>
            <div class="summary-card cpd">
                <h3>CPD Activities</h3>
                <p><strong>Total Activities:</strong> ${reportData.totalCpdActivities}</p>
                <p><strong>Total Hours:</strong> ${reportData.totalCpdHours}h</p>
            </div>
        </div>
    </div>

    <div class="section-title">Coaching Sessions (${reportData.reportYear})</div>
    ${reportData.sessions.map(session => `
        <div class="activity-item">
            <div class="activity-header">
                <strong>${session.clientName}</strong>
                <div>
                    <span class="activity-duration">${session.duration}</span>
                    <span class="activity-category">${session.sessionType}</span>
                </div>
            </div>
            <div class="activity-date">${session.date}</div>
            ${session.notes ? `<p style="margin-top: 8px; font-style: italic;">${session.notes}</p>` : ''}
        </div>
    `).join('')}

    <div class="section-title">CPD Activities (${reportData.reportYear})</div>
    ${reportData.cpdActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-header">
                <strong>${activity.title}</strong>
                <div>
                    <span class="activity-duration">${activity.duration}</span>
                    <span class="activity-category">${activity.category}</span>
                </div>
            </div>
            <div class="activity-date">${activity.date}</div>
            <p style="margin-top: 8px;">${activity.description}</p>
            ${activity.competencies > 0 ? `<p style="margin-top: 4px; color: #6b7280;"><small>Competencies: ${activity.competencies}</small></p>` : ''}
        </div>
    `).join('')}

    <div class="footer">
                        <p>This report was generated by IFC Log - Professional Coaching Log & CPD Tracker</p>
        <p>For ICF credential renewal purposes</p>
    </div>
</body>
</html>`;

    // Create a blob and download the report
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ICF_Report_${reportData.coachName}_${currentYear}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setIsGeneratingReport(false);
  };

  const renderDetailView = () => {
    if (!selectedCard) return null;

    switch (selectedCard) {
      case 'cpd':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Current Year CPD Details</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Progress Summary</h3>
                    <p className="text-2xl font-bold text-blue-600">{currentYearHours}h / 40h</p>
                    <p className="text-sm text-blue-700">
                      {currentYearHours >= 40 ? "Target achieved!" : `${40 - currentYearHours}h remaining`}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Activities Breakdown</h3>
                    <p className="text-2xl font-bold text-green-600">{cpdEntries.length}</p>
                    <p className="text-sm text-green-700">CPD activities this year</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Recent Activities</h3>
                  {cpdEntries.slice(0, 10).map((entry, index) => (
                    <div key={entry.id || index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{entry.title}</h4>
                          <p className="text-sm text-gray-600">{entry.providerOrganization}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{entry.hours}h</p>
                          <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'sessionProgress':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Session Progress Details</h2>
                  <button onClick={() => setSelectedCard(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Session Summary</h3>
                    <p className="text-2xl font-bold text-blue-600">{currentYearSessionHours}h</p>
                    <p className="text-sm text-blue-700">Total coaching hours this year</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Annual Goal</h3>
                    <p className="text-2xl font-bold text-green-600">100h</p>
                    <p className="text-sm text-green-700">Target coaching hours</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Recent Sessions This Year</h3>
                  {sessions
                    .filter((session) => new Date(session.date).getFullYear() === new Date().getFullYear())
                    .slice(0, 10)
                    .map((session, index) => (
                    <div key={session.id || index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{session.client_name}</h4>
                          <p className="text-sm text-gray-600">{session.notes}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{(session.duration / 60).toFixed(1)}h</p>
                          <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">CPD Activities Overview</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{cpdEntries.length}</p>
                    <p className="text-sm text-purple-700">Total Activities</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{totalHours}h</p>
                    <p className="text-sm text-blue-700">Total Hours</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{currentYearHours}h</p>
                    <p className="text-sm text-green-700">This Year</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">All CPD Activities</h3>
                  {cpdEntries.map((entry, index) => (
                    <div key={entry.id || index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{entry.title}</h4>
                          <p className="text-sm text-gray-600">{entry.providerOrganization}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                              {entry.cpdType}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{entry.hours}h</p>
                          <p className="text-xs text-gray-500">
                            {entry.icfCompetencies.length} competencies
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'currentYearSessions':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Current Year Sessions Details</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Session Summary</h3>
                    <p className="text-2xl font-bold text-green-600">{currentYearSessionHours}h</p>
                    <p className="text-sm text-green-700">Total coaching hours this year</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Sessions Breakdown</h3>
                    <p className="text-2xl font-bold text-blue-600">{currentYearSessions}</p>
                    <p className="text-sm text-blue-700">Sessions completed this year</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Recent Sessions This Year</h3>
                  {sessions
                    .filter((session) => new Date(session.date).getFullYear() === new Date().getFullYear())
                    .slice(0, 10)
                    .map((session, index) => (
                    <div key={session.id || index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{session.client_name}</h4>
                          <p className="text-sm text-gray-600">{session.notes}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{(session.duration / 60).toFixed(1)}h</p>
                          <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'sessions':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Coaching Sessions Overview</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-indigo-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-600">{totalSessions}</p>
                    <p className="text-sm text-indigo-700">Total Sessions</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{currentYearSessions}</p>
                    <p className="text-sm text-blue-700">This Year</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {sessions.reduce((sum, s) => sum + s.duration, 0)}min
                    </p>
                    <p className="text-sm text-green-700">Total Duration</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">All Sessions</h3>
                  {sessions.map((session, index) => (
                    <div key={session.id || index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{session.client_name}</h4>
                          <p className="text-sm text-gray-600">{session.notes}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              {session.payment_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{session.duration}min</p>
                          <p className="text-xs text-gray-500">
                            {session.types.length} types
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'renewal':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">ICF Renewal Status</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className={`p-6 rounded-lg ${currentYearHours >= 40 ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <h3 className={`font-semibold mb-2 ${currentYearHours >= 40 ? 'text-green-900' : 'text-orange-900'}`}>
                      Renewal Status
                    </h3>
                    <p className={`text-3xl font-bold ${currentYearHours >= 40 ? 'text-green-600' : 'text-orange-600'}`}>
                      {currentYearHours >= 40 ? "Complete" : "In Progress"}
                    </p>
                    <p className={`text-sm ${currentYearHours >= 40 ? 'text-green-700' : 'text-orange-700'}`}>
                      {currentYearHours >= 40 ? "Ready for credential renewal" : `${40 - currentYearHours}h still needed`}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Progress Summary</h3>
                    <p className="text-3xl font-bold text-blue-600">{currentYearHours}h</p>
                    <p className="text-sm text-blue-700">of 40 hours completed</p>
                    <div className="mt-3">
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((currentYearHours / 40) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Requirements Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">ICF Requirements</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Minimum 40 CPD hours per year</li>
                        <li>• At least 24 hours must be in ICF Core Competencies</li>
                        <li>• Maximum 16 hours can be in Resource Development</li>
                        <li>• All activities must be documented</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Progress</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {currentYearHours} hours completed</li>
                        <li>• {cpdEntries.length} activities logged</li>
                        <li>• {currentYearSessions} sessions this year</li>
                        <li>• {currentYearHours >= 40 ? "Ready for renewal" : "More hours needed"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ICF Compliance Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ICF Compliance Report</h1>
            <p className="text-gray-600">Track your progress toward ICF credential renewal requirements</p>
          </div>
        </div>
        
        {/* Export ICF Report Button */}
        <div className="flex gap-3">
          <button
            onClick={generateICFReport}
            disabled={isGeneratingReport || !isProfileComplete()}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isProfileComplete() ? "Complete your profile first" : "Generate ICF credential renewal report"}
          >
            <EnvelopeIcon className="h-5 w-5" />
            {isGeneratingReport ? "Generating..." : "Export ICF Report"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        {/* Current Year CPD card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={() => handleCardClick('cpd')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-2 rounded-full">
              <AcademicCapIcon className="h-6 w-6 text-red-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Current Year CPD</h3>
          <p className="text-2xl font-bold text-gray-900">{currentYearCpdHours}h / 40h</p>
          <p className="text-sm text-gray-500 mt-1">ICF requirement</p>
          <p className="text-xs text-gray-500 mt-2 text-center">Click for details</p>
        </div>

        {/* Session Progress card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={() => handleCardClick('sessionProgress')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Session Progress</h3>
          <p className="text-2xl font-bold text-gray-900">{currentYearSessionHours}h / 100h</p>
          <p className="text-sm text-gray-500 mt-1">Annual goal</p>
          <p className="text-xs text-gray-500 mt-2 text-center">Click for details</p>
        </div>

        {/* Activities Logged card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={() => handleCardClick('activities')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Activities Logged</h3>
          <p className="text-2xl font-bold text-gray-900">{cpdEntries.length} CPD activities</p>
          <p className="text-sm text-gray-500 mt-1">This year</p>
          <p className="text-xs text-gray-500 mt-2 text-center">Click for details</p>
        </div>

        {/* Current Year Sessions card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={() => handleCardClick('currentYearSessions')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-2 rounded-full">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Current Year Sessions</h3>
          <p className="text-2xl font-bold text-gray-900">{currentYearSessionHours}h</p>
          <p className="text-sm text-gray-500 mt-1">Coaching hours</p>
          <p className="text-xs text-gray-500 mt-2 text-center">Click for details</p>
        </div>

        {/* Total Sessions card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={() => handleCardClick('sessions')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-2 rounded-full">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Sessions</h3>
          <p className="text-2xl font-bold text-gray-900">{sessions.length} All time</p>
          <p className="text-sm text-gray-500 mt-1">Coaching sessions</p>
          <p className="text-xs text-gray-500 mt-2 text-center">Click for details</p>
        </div>

        {/* Renewal Status card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={() => handleCardClick('renewal')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-2 rounded-full">
              <CalendarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-orange-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Renewal Status</h3>
          <p className="text-2xl font-bold text-gray-900">
            {currentYearCpdHours >= 40 ? 'Complete' : 'In Progress'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {currentYearCpdHours >= 40 ? 'Requirements met' : `${40 - currentYearCpdHours}h needed`}
          </p>
          <p className="text-xs text-gray-500 mt-2 text-center">Click for details</p>
        </div>
      </div>

      {/* Detail View Modal */}
      {renderDetailView()}

      {/* Recent CPD Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6 border mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent CPD Activities</h2>
        <div className="space-y-4">
          {cpdEntries.slice(0, 5).map((entry, index) => (
            <div 
              key={entry.id || index} 
              className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleCpdClick(entry.id || `cpd-${index}`)}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                <p className="text-sm text-gray-600">{entry.providerOrganization}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {entry.hours}h
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                    {entry.cpdType}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{entry.hours}h</div>
                <div className="text-xs text-gray-500">
                  {entry.icfCompetencies.length} competencies
                </div>
              </div>
            </div>
          ))}
        </div>
        {cpdEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No CPD activities logged yet.
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Coaching Sessions</h2>
        <div className="space-y-4">
          {sessions.slice(0, 5).map((session, index) => (
            <div 
              key={session.id || index} 
              className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleSessionClick(session.id || `session-${index}`)}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{session.client_name}</h3>
                <p className="text-sm text-gray-600">{session.notes}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(session.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {session.duration}min
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    {session.payment_type}
                  </span>
                </div>
                {session.types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.types.map((type, typeIndex) => (
                      <span key={typeIndex} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{session.duration}min</div>
                <div className="text-xs text-gray-500">
                  {getCurrencySymbol(profile?.currency || "USD")} {session.payment_amount}
                </div>
              </div>
            </div>
          ))}
        </div>
        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No coaching sessions logged yet.
          </div>
        )}
      </div>
    </div>
  );
} 