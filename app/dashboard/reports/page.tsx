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
  number_in_group?: number;
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
  
  // Mentoring/Supervision tracking
  const [mentoringHours, setMentoringHours] = useState(0);
  const [supervisionHours, setSupervisionHours] = useState(0);
  const [totalRenewalHours, setTotalRenewalHours] = useState(0);

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

        // Fetch Mentoring/Supervision data
        const { data: mentoringData, error: mentoringError } = await supabase
          .from("mentoring_supervision")
          .select("*")
          .eq("user_id", user.id)
          .order("session_date", { ascending: false });

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
            number_in_group: item.number_in_group,
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
        
        // Calculate total session hours (matching dashboard calculation - all sessions, not just current year)
        const totalSessionHoursAllTime = sessionEntries
          .reduce((sum: number, session: SessionEntry) => sum + (session.duration / 60), 0);
        setCurrentYearSessionHours(Math.round(totalSessionHoursAllTime)); // Round to nearest whole hour to match dashboard

        // Calculate mentoring and supervision hours (current year for ICF renewal)
        let mentoringEntries: any[] = [];
        if (!mentoringError && mentoringData) {
          mentoringEntries = mentoringData;
        }

        const currentYearMentoringHours = mentoringEntries
          .filter((entry: any) => {
            const entryYear = new Date(entry.session_date).getFullYear();
            return entryYear === currentYear && entry.session_type === 'mentoring';
          })
          .reduce((sum: number, entry: any) => sum + (entry.duration / 60), 0);
        
        const currentYearSupervisionHours = mentoringEntries
          .filter((entry: any) => {
            const entryYear = new Date(entry.session_date).getFullYear();
            return entryYear === currentYear && entry.session_type === 'supervision';
          })
          .reduce((sum: number, entry: any) => sum + (entry.duration / 60), 0);

        setMentoringHours(Math.round(currentYearMentoringHours));
        setSupervisionHours(Math.round(currentYearSupervisionHours));
        
        // Calculate total renewal hours (CPD + mentoring + supervision for 3-year cycle)
        const total3YearRenewalHours = currentYearTotal + currentYearMentoringHours + currentYearSupervisionHours;
        setTotalRenewalHours(total3YearRenewalHours);

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
      })),
      
      // Enhanced Activity Summary
      mentoringHours: mentoringHours,
      supervisionHours: supervisionHours,
      totalMentoringSupervision: (mentoringHours + supervisionHours).toFixed(1),
      nextLevelRequirements: getNextLevelRequirements(profile?.icf_level || "none"),
      upgradeProgress: {
        sessionProgress: ((currentYearSessionHours / getNextLevelRequirements(profile?.icf_level || "none").sessionHours) * 100).toFixed(1),
        cpdProgress: ((currentYearCpdHours / getNextLevelRequirements(profile?.icf_level || "none").cpdHours) * 100).toFixed(1),
        isComplete: currentYearSessionHours >= getNextLevelRequirements(profile?.icf_level || "none").sessionHours && 
                   currentYearCpdHours >= getNextLevelRequirements(profile?.icf_level || "none").cpdHours
      },
      renewalStatus: {
        totalHours: totalRenewalHours,
        isComplete: totalRenewalHours >= 40,
        remaining: Math.max(0, 40 - totalRenewalHours).toFixed(1)
      },
      recentActivity: {
        lastSession: currentYearSessions.length > 0 ? 
          new Date(Math.max(...currentYearSessions.map(s => new Date(s.date).getTime()))).toLocaleDateString() : 'None',
        lastCpd: currentYearCpd.length > 0 ? 
          new Date(Math.max(...currentYearCpd.map(c => new Date(c.date).getTime()))).toLocaleDateString() : 'None',
        averageSessionsPerMonth: (currentYearSessions.length / 12).toFixed(1),
        mostActiveMonth: (() => {
          const monthCounts: { [key: string]: number } = {};
          currentYearSessions.forEach(session => {
            const month = new Date(session.date).toLocaleDateString('en-US', { month: 'long' });
            monthCounts[month] = (monthCounts[month] || 0) + 1;
          });
          return Object.keys(monthCounts).length > 0 ? 
            Object.keys(monthCounts).reduce((a, b) => monthCounts[a] > monthCounts[b] ? a : b) : 'None';
        })()
      }
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
        <h2 class="section-title">Summary of Current Activity (${reportData.reportYear})</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Coaching Sessions</h3>
                <p><strong>Total Sessions:</strong> ${reportData.totalSessions}</p>
                <p><strong>Total Hours:</strong> ${reportData.totalSessionHours}h</p>
                <p><strong>Avg/Month:</strong> ${reportData.recentActivity.averageSessionsPerMonth} sessions</p>
                <p><strong>Most Active Month:</strong> ${reportData.recentActivity.mostActiveMonth}</p>
            </div>
            <div class="summary-card cpd">
                <h3>CPD Activities</h3>
                <p><strong>Total Activities:</strong> ${reportData.totalCpdActivities}</p>
                <p><strong>Total Hours:</strong> ${reportData.totalCpdHours}h</p>
                <p><strong>Mentoring:</strong> ${reportData.mentoringHours}h</p>
                <p><strong>Supervision:</strong> ${reportData.supervisionHours}h</p>
            </div>
        </div>
        
        <div class="summary-grid" style="margin-top: 20px;">
            <div class="summary-card">
                <h3>ICF Credential Progress</h3>
                <p><strong>Current Level:</strong> ${reportData.icfLevel.toUpperCase()}</p>
                <p><strong>Session Progress:</strong> ${reportData.upgradeProgress.sessionProgress}% (${reportData.totalSessionHours}h / ${reportData.nextLevelRequirements.sessionHours}h)</p>
                <p><strong>CPD Progress:</strong> ${reportData.upgradeProgress.cpdProgress}% (${reportData.totalCpdHours}h / ${reportData.nextLevelRequirements.cpdHours}h)</p>
                <p><strong>Status:</strong> <span style="color: ${reportData.upgradeProgress.isComplete ? '#059669' : '#d97706'}; font-weight: bold;">${reportData.upgradeProgress.isComplete ? 'Requirements Met' : 'In Progress'}</span></p>
            </div>
            <div class="summary-card cpd">
                <h3>ICF Renewal Status (3-Year Cycle)</h3>
                <p><strong>Total CCE Hours:</strong> ${reportData.renewalStatus.totalHours}h / 40h</p>
                <p><strong>Progress:</strong> ${((reportData.renewalStatus.totalHours / 40) * 100).toFixed(1)}%</p>
                <p><strong>Status:</strong> <span style="color: ${reportData.renewalStatus.isComplete ? '#059669' : '#d97706'}; font-weight: bold;">${reportData.renewalStatus.isComplete ? 'Complete' : 'In Progress'}</span></p>
                ${!reportData.renewalStatus.isComplete ? `<p><strong>Remaining:</strong> ${reportData.renewalStatus.remaining}h needed</p>` : ''}
            </div>
        </div>
        
        <div class="summary-card" style="margin-top: 20px;">
            <h3>Recent Activity Highlights</h3>
            <p><strong>Last Coaching Session:</strong> ${reportData.recentActivity.lastSession}</p>
            <p><strong>Last CPD Activity:</strong> ${reportData.recentActivity.lastCpd}</p>
            <p><strong>Total Professional Development:</strong> ${reportData.totalMentoringSupervision}h (Mentoring + Supervision)</p>
            <p><strong>Report Generated:</strong> ${reportData.generatedDate}</p>
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
                         <p>This report was generated by ICF Log Beta V0.9.460 - Professional Coaching Log & CPD Tracker</p>
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
                    <p className="text-2xl font-bold text-blue-600">{currentYearHours}h / {getNextLevelRequirements(profile?.icf_level || "none").cpdHours}h</p>
                    <p className="text-sm text-blue-700">
                      {currentYearHours >= getNextLevelRequirements(profile?.icf_level || "none").cpdHours ? "Target achieved!" : `${getNextLevelRequirements(profile?.icf_level || "none").cpdHours - currentYearHours}h remaining`}
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
                    <p className="text-sm text-blue-700">Total coaching hours (all time)</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Next ICF Level Goal</h3>
                    <p className="text-2xl font-bold text-green-600">{getNextLevelRequirements(profile?.icf_level || "none").sessionHours}h</p>
                    <p className="text-sm text-green-700">Required for next credential</p>
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
                      {Math.round(sessions.reduce((sum, s) => sum + (s.duration / 60), 0))}h
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

      case 'upgrade':
        const nextLevel = getNextLevelRequirements(profile?.icf_level || "none");
        const isComplete = currentYearSessionHours >= nextLevel.sessionHours && currentYearCpdHours >= nextLevel.cpdHours;
        const totalRequired = nextLevel.sessionHours + nextLevel.cpdHours;
        const totalCompleted = currentYearSessionHours + currentYearCpdHours;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">ICF Upgrade Status</h2>
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
                  <div className={`p-6 rounded-lg ${isComplete ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <h3 className={`font-semibold mb-2 ${isComplete ? 'text-green-900' : 'text-orange-900'}`}>
                      Upgrade Status
                    </h3>
                    <p className={`text-3xl font-bold ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                      {isComplete ? "Complete" : "In Progress"}
                    </p>
                    <p className={`text-sm ${isComplete ? 'text-green-700' : 'text-orange-700'}`}>
                      {isComplete ? "Ready for next ICF level" : 
                        `${Math.max(0, nextLevel.sessionHours - currentYearSessionHours)}h coaching + ${Math.max(0, nextLevel.cpdHours - currentYearCpdHours)}h CPD needed`}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Progress Summary</h3>
                    <p className="text-3xl font-bold text-blue-600">{currentYearSessionHours}h + {currentYearCpdHours}h</p>
                    <p className="text-sm text-blue-700">of {nextLevel.sessionHours}h coaching + {nextLevel.cpdHours}h CPD required</p>
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-blue-700 mb-1">
                          <span>Coaching Hours</span>
                          <span>{currentYearSessionHours}/{nextLevel.sessionHours}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((currentYearSessionHours / nextLevel.sessionHours) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-blue-700 mb-1">
                          <span>CPD Hours</span>
                          <span>{currentYearCpdHours}/{nextLevel.cpdHours}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((currentYearCpdHours / nextLevel.cpdHours) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Upgrade Requirements Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Next ICF Level Requirements</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {nextLevel.sessionHours} coaching hours required</li>
                        <li>• {nextLevel.cpdHours} CPD/education hours required</li>
                        <li>• Current level: {profile?.icf_level?.toUpperCase() || "Not specified"}</li>
                        <li>• Target level: {profile?.icf_level === "none" ? "ACC" : profile?.icf_level === "acc" ? "PCC" : profile?.icf_level === "pcc" ? "MCC" : "Highest level reached"}</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Progress</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {currentYearSessionHours} coaching hours completed</li>
                        <li>• {currentYearCpdHours} CPD hours completed</li>
                        <li>• {currentYearSessions} sessions logged this year</li>
                        <li>• {isComplete ? "Ready for next ICF level" : "Requirements still in progress"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'mentoring':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Mentoring & Supervision Details</h2>
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
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Mentoring Hours</h3>
                    <p className="text-3xl font-bold text-green-600">{mentoringHours}h</p>
                    <p className="text-sm text-green-700">Current year mentoring sessions</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Supervision Hours</h3>
                    <p className="text-3xl font-bold text-blue-600">{supervisionHours}h</p>
                    <p className="text-sm text-blue-700">Current year supervision sessions</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">About Mentoring & Supervision</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Mentoring</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Professional development sessions</li>
                        <li>• Skills enhancement and guidance</li>
                        <li>• Career development support</li>
                        <li>• Learning from experienced coaches</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Supervision</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Review of coaching practice</li>
                        <li>• Quality assurance sessions</li>
                        <li>• Professional oversight</li>
                        <li>• Ethical practice maintenance</li>
                      </ul>
                    </div>
                  </div>
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
                  <h2 className="text-2xl font-bold text-gray-900">ICF Credential Renewal Status</h2>
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
                  <div className={`p-6 rounded-lg ${totalRenewalHours >= 40 ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <h3 className={`font-semibold mb-2 ${totalRenewalHours >= 40 ? 'text-green-900' : 'text-orange-900'}`}>
                      3-Year Renewal Status
                    </h3>
                    <p className={`text-3xl font-bold ${totalRenewalHours >= 40 ? 'text-green-600' : 'text-orange-600'}`}>
                      {totalRenewalHours >= 40 ? "Complete" : "In Progress"}
                    </p>
                    <p className={`text-sm ${totalRenewalHours >= 40 ? 'text-green-700' : 'text-orange-700'}`}>
                      {totalRenewalHours >= 40 ? "Ready for credential renewal" : `${Math.max(0, 40 - totalRenewalHours).toFixed(1)}h still needed`}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Progress Summary</h3>
                    <p className="text-3xl font-bold text-blue-600">{totalRenewalHours.toFixed(1)}h</p>
                    <p className="text-sm text-blue-700">of 40 hours completed in 3-year cycle</p>
                    <div className="mt-3">
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((totalRenewalHours / 40) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      CPD: {currentYearCpdHours}h | Mentoring: {mentoringHours}h | Supervision: {supervisionHours}h
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">ICF 3-Year Renewal Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Requirements (Every 3 Years)</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 40 CCE credits total over 3 years</li>
                        <li>• 24 credits in Core Competencies</li>
                        <li>• 3 credits in Coach Ethics</li>
                        <li>• 16 credits in Resource Development/Core Competencies</li>
                        <li>• Additional mentor coaching for ACC holders</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Progress</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {totalRenewalHours.toFixed(1)} total hours completed</li>
                        <li>• {currentYearCpdHours} CPD hours logged</li>
                        <li>• {mentoringHours} mentoring hours logged</li>
                        <li>• {supervisionHours} supervision hours logged</li>
                        <li>• {totalRenewalHours >= 40 ? "Ready for renewal" : "More hours needed"}</li>
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
            <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ICF Compliance Report</h1>
            <p className="text-sm sm:text-base text-gray-600">Track your progress toward ICF credential renewal requirements</p>
          </div>
        </div>
        
        {/* Export ICF Report Button */}
        <div className="flex gap-3">
          <button
            onClick={generateICFReport}
            disabled={isGeneratingReport || !isProfileComplete()}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title={!isProfileComplete() ? "Complete your profile first" : "Generate ICF credential renewal report"}
          >
            <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">{isGeneratingReport ? "Generating..." : "Export ICF Report"}</span>
            <span className="sm:hidden">{isGeneratingReport ? "Generating..." : "Export"}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
        {/* Current Year CPD card */}
        <div 
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
          onClick={() => handleCardClick('cpd')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Current Year CPD</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-900">{currentYearCpdHours}h</span>
              <span className="text-2xl text-gray-400">/ {getNextLevelRequirements(profile?.icf_level || "none").cpdHours}h</span>
            </div>
            <p className="text-sm text-gray-600">Annual requirement</p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-blue-600 font-medium">Click for details</p>
            </div>
          </div>
        </div>

        {/* Session Progress card */}
        <div 
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
          onClick={() => handleCardClick('sessionProgress')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Total Coaching Hours</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-900">{currentYearSessionHours}h</span>
              <span className="text-2xl text-gray-400">/ {getNextLevelRequirements(profile?.icf_level || "none").sessionHours}h</span>
            </div>
            <p className="text-sm text-gray-600">For ICF credential</p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-blue-600 font-medium">Click for details</p>
            </div>
          </div>
        </div>

        {/* Activities Logged card */}
        <div 
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
          onClick={() => handleCardClick('activities')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="bg-green-50 p-4 rounded-xl group-hover:bg-green-100 transition-colors">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Activities Logged</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-900">{cpdEntries.length}</span>
              <span className="text-lg text-gray-600">CPD activities</span>
            </div>
            <p className="text-sm text-gray-600">This year</p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-green-600 font-medium">Click for details</p>
            </div>
          </div>
        </div>

        {/* Mentoring/Supervision card */}
        <div 
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 cursor-pointer hover:shadow-lg hover:border-purple-200 transition-all duration-300 group"
          onClick={() => handleCardClick('mentoring')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="bg-purple-50 p-4 rounded-xl group-hover:bg-purple-100 transition-colors">
              <AcademicCapIcon className="h-8 w-8 text-purple-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Professional Development</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-900">{(mentoringHours + supervisionHours).toFixed(1)}h</span>
            </div>
            <p className="text-sm text-gray-600">Mentoring & Supervision this year</p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-purple-600 font-medium">Click for details</p>
            </div>
          </div>
        </div>

        {/* Total Sessions card */}
        <div 
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 cursor-pointer hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group"
          onClick={() => handleCardClick('sessions')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="bg-indigo-50 p-4 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <UserIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Total Sessions</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-900">{sessions.length}</span>
              <span className="text-lg text-gray-600">All time</span>
            </div>
            <p className="text-sm text-gray-600">Coaching sessions</p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-indigo-600 font-medium">Click for details</p>
            </div>
          </div>
        </div>

        {/* Upgrade Status card */}
        <div 
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 cursor-pointer hover:shadow-lg hover:border-orange-200 transition-all duration-300 group"
          onClick={() => handleCardClick('upgrade')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="bg-orange-50 p-4 rounded-xl group-hover:bg-orange-100 transition-colors">
              <CalendarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Upgrade Status</h3>
            <div className="flex items-center space-x-2">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                (currentYearSessionHours >= getNextLevelRequirements(profile?.icf_level || "none").sessionHours && 
                  currentYearCpdHours >= getNextLevelRequirements(profile?.icf_level || "none").cpdHours) 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
              }`}>
                {(currentYearSessionHours >= getNextLevelRequirements(profile?.icf_level || "none").sessionHours && 
                  currentYearCpdHours >= getNextLevelRequirements(profile?.icf_level || "none").cpdHours) ? 'Complete' : 'In Progress'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {(currentYearSessionHours >= getNextLevelRequirements(profile?.icf_level || "none").sessionHours && 
                currentYearCpdHours >= getNextLevelRequirements(profile?.icf_level || "none").cpdHours) ? 'Requirements met for next level' : 
                'Working toward next ICF credential'}
            </p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-orange-600 font-medium">Click for details</p>
            </div>
          </div>
        </div>

        {/* ICF Renewal Status card (3-year cycle) */}
        <div 
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 cursor-pointer hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group"
          onClick={() => handleCardClick('renewal')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="bg-indigo-50 p-4 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <CheckCircleIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Renewal Status</h3>
            <div className="flex items-center space-x-2">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                totalRenewalHours >= 40 
                ? 'bg-green-100 text-green-800' 
                : 'bg-indigo-100 text-indigo-800'
              }`}>
                {totalRenewalHours >= 40 ? 'Complete' : 'In Progress'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {totalRenewalHours >= 40 ? '40h 3-year requirement met' : `${Math.max(0, 40 - totalRenewalHours).toFixed(1)}h needed for 3-year cycle`}
            </p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-indigo-600 font-medium">Click for details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {renderDetailView()}

      {/* Recent CPD Activities */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Recent CPD Activities</h2>
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