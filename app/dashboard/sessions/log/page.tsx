"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ClockIcon, UserIcon, CalendarIcon, CurrencyDollarIcon, CheckCircleIcon, ArrowDownTrayIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon, ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { exportSessionsToICFLog } from "@/lib/exportUtils";
import * as XLSX from 'xlsx';

type SessionEntry = {
  id: string;
  clientName: string;
  date: string;
  finishDate: string;
  duration: number;
  types: string[];
  numberInGroup?: number;
  paymentType: string;
  paymentAmount?: number | null;
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

function SessionsLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const highlightedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [backupCreated, setBackupCreated] = useState(false);

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

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getSortedSessions = () => {
    return [...sessions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  const createBackup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create backup of current sessions
      const { data: currentSessions, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // Store backup in localStorage with timestamp
      const backupData = {
        timestamp: new Date().toISOString(),
        sessions: currentSessions || [],
        user_id: user.id
      };

      localStorage.setItem(`sessions_backup_${user.id}_${Date.now()}`, JSON.stringify(backupData));
      setBackupCreated(true);
      
      return true;
    } catch (error) {
      console.error('Backup creation failed:', error);
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store the file and show warning
    setPendingImportFile(file);
    setShowImportWarning(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (!pendingImportFile) return;

    setImporting(true);
    setImportMessage(null);
    setShowImportWarning(false);

    try {
      // Create backup first
      const backupSuccess = await createBackup();
      
      const data = await readExcelFile(pendingImportFile);
      const importedSessions = await processImportedData(data);
      
      if (importedSessions.length > 0) {
        await saveImportedSessions(importedSessions);
        setImportMessage({
          type: 'success',
          message: `Successfully imported ${importedSessions.length} sessions! ${backupSuccess ? 'A backup of your existing sessions has been created.' : 'Warning: Backup creation failed.'}`
        });
        // Refresh the sessions list
        fetchSessions();
      } else {
        setImportMessage({
          type: 'error',
          message: 'No valid sessions found in the file. Please check the format.'
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportMessage({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setImporting(false);
      setPendingImportFile(null);
      setBackupCreated(false);
    }
  };

  const handleImportCancel = () => {
    setShowImportWarning(false);
    setPendingImportFile(null);
    setBackupCreated(false);
  };



  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Find the actual headers row (skip title rows)
          let headerRowIndex = 0;
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row && row.length > 0 && 
                (row[0] === 'Client Name' || 
                 row[0]?.toString().toLowerCase().includes('client name'))) {
              headerRowIndex = i;
              break;
            }
          }
          
          const headers = jsonData[headerRowIndex] as string[];
          const rows = jsonData.slice(headerRowIndex + 1) as any[][];
          
          const result = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const processImportedData = async (data: any[]): Promise<any[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('Processing imported data:', data);

    return data
      .filter(row => {
        // Filter out rows that don't have required data
        const clientName = row['Client Name'];
        const startDate = row['Start Date'];
        const paidHours = parseFloat(row['Paid hours'] || '0');
        const proBonoHours = parseFloat(row['Pro-bono hours'] || '0');
        
        console.log('Filtering row:', { clientName, startDate, paidHours, proBonoHours });
        
        // Must have client name and either start date or hours
        const isValid = clientName && (startDate || paidHours > 0 || proBonoHours > 0);
        if (!isValid) {
          console.log('Skipping invalid row:', row);
        }
        return isValid;
      })
      .map(row => {
        try {
          // Parse dates
          const startDate = parseDate(row['Start Date']);
          const endDate = row['End Date'] ? parseDate(row['End Date']) : null;
          
          console.log('Parsed dates for row:', {
            originalStartDate: row['Start Date'],
            parsedStartDate: startDate,
            originalEndDate: row['End Date'],
            parsedEndDate: endDate
          });
          
          // Both Paid hours and Pro-bono hours are duration in hours
          const paidHours = parseFloat(row['Paid hours'] || '0');
          const proBonoHours = parseFloat(row['Pro-bono hours'] || '0');
          const totalHours = paidHours + proBonoHours;
          
          // Determine payment type based on which hours are present
          let paymentType = 'proBono';
          let paymentAmount = null;
          
          if (paidHours > 0 && proBonoHours === 0) {
            paymentType = 'paid';
            paymentAmount = null; // No payment amount, just duration
          } else if (proBonoHours > 0) {
            paymentType = 'proBono';
            paymentAmount = null; // No payment amount, just duration
          }
          
          // Determine session type
          const sessionType = row['Individual/Group']?.toLowerCase() || 'individual';
          const numberInGroup = parseInt(row['Number in Group'] || '1');
          
          const sessionData = {
            client_name: row['Client Name'],
            date: startDate,
            finish_date: endDate,
            duration: totalHours * 60, // Convert total hours to minutes
            types: [sessionType],
            number_in_group: numberInGroup,
            paymenttype: paymentType,
            payment_amount: paymentAmount,
            focus_area: '',
            key_outcomes: '',
            client_progress: '',
            coaching_tools: [],
            icf_competencies: [],
            additional_notes: row['Contact Information'] ? `Contact: ${row['Contact Information']}` : '',
            user_id: user.id
          };
          
          console.log('Created session data:', sessionData);
          return sessionData;
        } catch (error) {
          console.error('Error processing row:', row, error);
          return null;
        }
      })
      .filter(session => session !== null); // Remove any null sessions from processing errors
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr || dateStr.toString().trim() === '') {
      console.warn('Empty date string, using today\'s date');
      return new Date().toISOString().split('T')[0];
    }
    
    const dateString = dateStr.toString().trim();
    console.log('Parsing date:', dateString);
    
    // Check if it's an Excel serial number (numeric value)
    const numericValue = parseFloat(dateString);
    if (!isNaN(numericValue) && numericValue > 0 && numericValue < 100000) {
      // Excel serial numbers start from January 1, 1900
      // Convert Excel serial number to JavaScript date
      const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const targetDate = new Date(excelEpoch.getTime() + (numericValue - 1) * millisecondsPerDay);
      
      console.log('Excel serial number conversion:', {
        originalValue: dateString,
        numericValue: numericValue,
        targetDate: targetDate.toISOString(),
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        day: targetDate.getDate()
      });
      
      // Validate the resulting date
      if (targetDate.getFullYear() >= 1900 && targetDate.getFullYear() <= 2100) {
        const result = targetDate.toISOString().split('T')[0];
        console.log('Successfully parsed Excel serial number:', dateString, '->', result);
        return result;
      } else {
        console.warn('Invalid Excel serial number resulting in invalid year:', targetDate.getFullYear());
      }
    }
    
    // Try parsing DD/MM/YY or DD/MM/YYYY format first
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      
      // Handle 2-digit years
      if (year < 100) {
        year = 2000 + year;
      }
      
      // Validate the date components
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = day.toString().padStart(2, '0');
        const result = `${year}-${paddedMonth}-${paddedDay}`;
        console.log('Successfully parsed DD/MM/YYYY format:', dateString, '->', result);
        return result;
      } else {
        console.warn('Invalid date components:', { day, month, year });
      }
    }
    
    // Try parsing MM/DD/YYYY format (US format)
    const usParts = dateString.split('/');
    if (usParts.length === 3) {
      const month = parseInt(usParts[0]);
      const day = parseInt(usParts[1]);
      let year = parseInt(usParts[2]);
      
      // Handle 2-digit years
      if (year < 100) {
        year = 2000 + year;
      }
      
      // Validate the date components
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = day.toString().padStart(2, '0');
        const result = `${year}-${paddedMonth}-${paddedDay}`;
        console.log('Successfully parsed MM/DD/YYYY format:', dateString, '->', result);
        return result;
      } else {
        console.warn('Invalid US date components:', { month, day, year });
      }
    }
    
    // Try parsing YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.log('Already in YYYY-MM-DD format:', dateString);
      return dateString;
    }
    
    // Try standard date parsing as fallback
    const date = new Date(dateString);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
      const result = date.toISOString().split('T')[0];
      console.log('Successfully parsed with Date constructor:', dateString, '->', result);
      return result;
    }
    
    // If all else fails, log the error and return today's date
    console.error('Failed to parse date:', dateString, 'using today\'s date');
    return new Date().toISOString().split('T')[0];
  };

  const saveImportedSessions = async (sessions: any[]) => {
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessions);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  };

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionToDelete)
        .eq("user_id", user.id);

      if (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session');
        return;
      }

      // Remove the session from the local state
      setSessions(prev => prev.filter(session => session.id !== sessionToDelete));
      console.log('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSessionToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };

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
        .select("id,client_name,date,duration,types,number_in_group,paymenttype,payment_amount,focus_area,key_outcomes,client_progress,coaching_tools,icf_competencies,additional_notes,user_id")
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
          numberInGroup: session.number_in_group,
          paymentType: session.paymenttype || session.payment_type || "",
          paymentAmount: session.payment_amount,
          focusArea: session.focus_area || "",
          keyOutcomes: session.key_outcomes || "",
          clientProgress: session.client_progress || "",
          coachingTools: session.coaching_tools || [],
          icfCompetencies: session.icf_competencies || [],
          additionalNotes: session.additional_notes || "",
          user_id: session.user_id || "",
        }));
        setSessions(mapped);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
    setLoading(false);
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
    fetchSessions();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading sessions...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Sessions Log</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={toggleSortOrder}
            className="flex items-center justify-center gap-2 bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sort by Date {sortOrder === 'asc' ? '↑' : '↓'}</span>
            <span className="sm:hidden">Sort {sortOrder === 'asc' ? '↑' : '↓'}</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{importing ? "Importing..." : "Import ICF Spreadsheet"}</span>
            <span className="sm:hidden">{importing ? "Importing..." : "Import"}</span>
          </button>

          <button
            onClick={() => exportSessionsToICFLog(sessions, `ICF-Client-Coaching-Log-${new Date().toISOString().split('T')[0]}`)}
            className="flex items-center justify-center gap-2 bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Export ICF Format</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {importMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          importMessage.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {importMessage.message}
        </div>
      )}

      {/* Import Warning Modal */}
      {showImportWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Import Warning</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                You are about to import sessions from an ICF spreadsheet. This will:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>Add new sessions to your Sessions Log</li>
                <li>Create a backup of your existing sessions</li>
                <li>Not delete any existing sessions</li>
              </ul>
              <p className="text-sm text-gray-500">
                <strong>File:</strong> {pendingImportFile?.name}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImportCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={importing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import Sessions"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No sessions logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {getSortedSessions().map((session, index) => {
            const isHighlighted = highlightedId && (
              session.id === highlightedId || 
              `session-${index}` === highlightedId
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {session.duration}min
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold self-start ${
                        session.paymentType === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {session.paymentType === 'paid' ? 'Paid' : 'Pro Bono'}
                        {session.paymentAmount && session.paymentType === 'paid' && ` - ${getCurrencySymbol(profile?.currency || 'USD')}${session.paymentAmount}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    {session.types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleCard(session.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title={expandedCards.has(session.id) ? "Collapse Details" : "Expand Details"}
                      >
                        {expandedCards.has(session.id) ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (session.id && session.id.trim() !== '') {
                            router.push(`/dashboard/sessions/edit/${session.id}`);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Session"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (session.id && session.id.trim() !== '') {
                            handleDeleteClick(session.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Session"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content - Show when card is expanded */}
                {expandedCards.has(session.id) && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="pt-4 space-y-3">
                      {session.focusArea && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Focus Area</h4>
                          <p className="text-sm text-gray-600">{session.focusArea}</p>
                        </div>
                      )}
                      
                      {session.keyOutcomes && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Key Outcomes</h4>
                          <p className="text-sm text-gray-600">{session.keyOutcomes}</p>
                        </div>
                      )}
                      
                      {session.clientProgress && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Client Progress</h4>
                          <p className="text-sm text-gray-600">{session.clientProgress}</p>
                        </div>
                      )}
                      
                      {session.coachingTools && session.coachingTools.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Coaching Tools</h4>
                          <div className="flex flex-wrap gap-1">
                            {session.coachingTools.map((tool, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {session.icfCompetencies && session.icfCompetencies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">ICF Core Competencies</h4>
                          <div className="flex flex-wrap gap-1">
                            {session.icfCompetencies.map((competency, idx) => (
                              <span key={idx} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                                {competency}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {session.additionalNotes && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Additional Notes</h4>
                          <p className="text-sm text-gray-600">{session.additionalNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this session? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={handleDeleteCancel}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default function SessionsLogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions log...</p>
        </div>
      </div>
    }>
      <SessionsLogContent />
    </Suspense>
  );
} 