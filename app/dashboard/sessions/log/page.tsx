"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ClockIcon, UserIcon, CalendarIcon, CurrencyDollarIcon, CheckCircleIcon, ArrowDownTrayIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon, ArrowUpTrayIcon, TrashIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { exportSessionsToICFLog } from "@/lib/exportUtils";
import { formatNumberForDisplay, parseNumberFromLocale, parseNumberWithCurrency, LocaleInfo } from "@/lib/numberUtils";
import * as XLSX from 'xlsx';

type SessionEntry = {
  id: string;
  clientName: string;
  clientEmail?: string; // Add client email field
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
  is_calendly_only?: boolean;
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
  const [filteredSessions, setFilteredSessions] = useState<SessionEntry[]>([]);
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
  const [deleteClientWithSession, setDeleteClientWithSession] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [backupCreated, setBackupCreated] = useState(false);
  
  // Search functionality
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchParams1, setSearchParams] = useState({
    clientName: '',
    startDate: '',
    endDate: '',
    type: '',
    paymentType: ''
  });
  
  // Bulk delete functionality
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleteAssociatedClients, setDeleteAssociatedClients] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Currency symbols mapping
  const CURRENCY_SYMBOLS: { [key: string]: string } = {
    "USD": "$",
    "EUR": "â‚¬",
    "GBP": "Â£",
    "CAD": "C$",
    "AUD": "A$",
    "JPY": "Â¥",
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

  const applyFilters = () => {
    let result = [...sessions];
    
    // Apply clientName filter
    if (searchParams1.clientName.trim()) {
      result = result.filter(session => 
        session.clientName.toLowerCase().includes(searchParams1.clientName.toLowerCase())
      );
    }
    
    // Apply date range filters
    if (searchParams1.startDate) {
      result = result.filter(session => session.date >= searchParams1.startDate);
    }
    
    if (searchParams1.endDate) {
      result = result.filter(session => session.date <= searchParams1.endDate);
    }
    
    // Apply session type filter
    if (searchParams1.type) {
      result = result.filter(session => 
        session.types && session.types.some(t => t.toLowerCase().includes(searchParams1.type.toLowerCase()))
      );
    }
    
    // Apply payment type filter
    if (searchParams1.paymentType) {
      result = result.filter(session => 
        session.paymentType.toLowerCase() === searchParams1.paymentType.toLowerCase()
      );
    }
    
    return result;
  };
  
  const getSortedSessions = () => {
    // First apply filters, then sort
    const filtered = applyFilters();
    
    return filtered.sort((a, b) => {
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
      const importResult = await processImportedData(data);
      
      if (importResult.sessions.length > 0) {
        const { sessionsAdded, clientsAdded, sessionsSkipped } = await saveImportedSessions(importResult);
        
        // Construct success message
        let successMessage = `Successfully imported ${sessionsAdded} sessions!`;
        
        // Add information about duplicates if any were skipped
        if (sessionsSkipped > 0) {
          successMessage += ` ${sessionsSkipped} duplicate session${sessionsSkipped === 1 ? '' : 's'} ${sessionsSkipped === 1 ? 'was' : 'were'} detected and skipped.`;
        }
        
        if (clientsAdded > 0) {
          successMessage += ` Added ${clientsAdded} new client${clientsAdded === 1 ? '' : 's'} to your client list.`;
        }
        if (backupSuccess) {
          successMessage += ' A backup of your existing sessions has been created.';
        } else {
          successMessage += ' Warning: Backup creation failed.';
        }
        
        // Set message type to warning if we skipped everything
        const messageType = (sessionsSkipped > 0 && sessionsAdded === 0) ? 'error' : 'success';
        
        setImportMessage({
          type: messageType,
          message: successMessage
        });
        
        // Refresh the sessions list if any were added
        if (sessionsAdded > 0) {
          fetchSessions();
        }
      } else {
        setImportMessage({
          type: 'error',
          message: 'No valid sessions found in the file. Please check the format.'
        });
      }
    } catch (error) {
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

  // Interface for client data extracted from spreadsheet
interface ImportedClientData {
  name: string;
  email: string;
  contact_info?: string;
}

// Interface for processed session data with client reference
interface ProcessedSessionData {
  client_name: string;
  date: string;
  finish_date: string | null;
  duration: number;
  types: string[];
  number_in_group: number;
  paymenttype: string;
  payment_amount: number | null;
  focus_area: string;
  key_outcomes: string;
  client_progress: string;
  coaching_tools: string[];
  icf_competencies: string[];
  additional_notes: string;
  user_id: string;
}

// Result interface containing both sessions and clients
interface ImportProcessResult {
  sessions: ProcessedSessionData[];
  clients: ImportedClientData[];
}

const processImportedData = async (data: any[]): Promise<ImportProcessResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    
    // Track unique clients to avoid duplicates
    const uniqueClients = new Map<string, ImportedClientData>();
    
    // Debug the spreadsheet structure to see what client fields are available
    if (data.length > 0) {
      
      // Specifically check for Contact Information field
      if (data[0]['Contact Information']) {
      } else {
        // Try to find any field that might contain contact info
        const possibleContactFields = Object.keys(data[0]).filter(key => 
          key.toLowerCase().includes('contact') || 
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('phone')
        );
        
        if (possibleContactFields.length > 0) {
          possibleContactFields.forEach(field => {
          });
        }
      }
    }

    const processedSessions = data
      .filter(row => {
        // Filter out rows that don't have required data
        const clientName = row['Client Name'];
        const startDate = row['Start Date'];
        const paidHours = parseFloat(row['Paid hours'] || '0');
        const proBonoHours = parseFloat(row['Pro-bono hours'] || '0');
        
        
        // Must have client name and either start date or hours
        const isValid = clientName && (startDate || paidHours > 0 || proBonoHours > 0);
        if (!isValid) {
        }
        return isValid;
      })
      .map(row => {
        try {
          // Parse dates
          const startDate = parseDate(row['Start Date']);
          const endDate = row['End Date'] ? parseDate(row['End Date']) : null;
          
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
          
          // Look for payment amount in various possible column names
          const paymentAmountColumns = [
            'Payment Amount', 'Payment', 'Amount', 'Fee', 'Rate', 'Cost',
            'Paid Amount', 'Payment Fee', 'Session Fee', 'Hourly Rate'
          ];
          
          let rawPaymentAmount = null;
          for (const col of paymentAmountColumns) {
            if (row[col] && row[col] !== '' && row[col] !== null) {
              rawPaymentAmount = row[col];
              break;
            }
          }
          
          // Parse payment amount using locale-aware parsing if found
          if (rawPaymentAmount !== null) {
            const localeInfo: LocaleInfo = { 
              country: profile?.country || 'US', 
              currency: profile?.currency || 'USD' 
            };
            const parseResult = parseNumberWithCurrency(String(rawPaymentAmount), localeInfo);
            if (parseResult.value !== null && !parseResult.error) {
              paymentAmount = parseResult.value;
            } else {
            }
          }
          
          if (paidHours > 0 && proBonoHours === 0) {
            paymentType = 'paid';
          } else if (paidHours > 0 && proBonoHours > 0) {
            paymentType = 'paidAndProBono';
          } else if (proBonoHours > 0) {
            paymentType = 'proBono';
          }
          
          // Determine session type
          const sessionType = row['Individual/Group']?.toLowerCase() || 'individual';
          const numberInGroup = parseInt(row['Number in Group'] || '1');
          
          // Extract client information
          const clientName = row['Client Name']?.trim();
          
          // Extract contact information which might contain email
          let contactInfo = '';
          let clientEmail = '';
          
          // Debug all fields in the row to find where email might be
          Object.entries(row).forEach(([key, value]) => {
            if (typeof value === 'string' && value.includes('@')) {
            }
          });
          
          // First try to get Contact Information
          if (row['Contact Information'] && typeof row['Contact Information'] === 'string') {
            contactInfo = row['Contact Information'].trim();
            
            // Try to extract email from contact information if it looks like an email
            if (contactInfo.includes('@')) {
              // Better regex to extract email from text
              const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
              const emailMatch = contactInfo.match(emailRegex);
              if (emailMatch && emailMatch.length > 0) {
                clientEmail = emailMatch[0];
              } else {
              }
            }
          } else {
          }
          
          // If we didn't find an email in Contact Information, try direct email fields
          if (!clientEmail) {
            const emailFieldNames = ['Email', 'email', 'Client Email', 'Contact Email', 'E-mail'];
            for (const fieldName of emailFieldNames) {
              if (row[fieldName] && typeof row[fieldName] === 'string' && row[fieldName].includes('@')) {
                clientEmail = row[fieldName].trim();
                break;
              }
            }
          }
          
          // Try other possible contact fields if we didn't get anything
          if (!contactInfo) {
            const possibleContactFields = ['Contact Info', 'Phone', 'Contact', 'Notes'];
            for (const field of possibleContactFields) {
              if (row[field] && typeof row[field] === 'string') {
                contactInfo = row[field].trim();
                if (contactInfo) break;
              }
            }
          }
          
          // If we still don't have an email, try explicit email fields
          if (!clientEmail) {
            const possibleEmailFields = ['Client Email', 'Email', 'email', 'Contact Email', 'E-mail', 'e-mail'];
            for (const field of possibleEmailFields) {
              if (row[field] && typeof row[field] === 'string') {
                clientEmail = row[field].trim();
                if (clientEmail) break;
              }
            }
          }
          
          // Store unique client if we have enough information
          if (clientName) {
            // Use email as key if available, otherwise use name
            const clientKey = clientEmail || clientName;
            
            if (!uniqueClients.has(clientKey)) {
              const clientData = {
                name: clientName,
                email: contactInfo, // Use Contact Information directly as the email
                contact_info: contactInfo
              };
              
              uniqueClients.set(clientKey, clientData);
            }
          }
          
          const sessionData: ProcessedSessionData = {
            client_name: clientName,
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
            additional_notes: contactInfo ? `Contact: ${contactInfo}` : '',
            user_id: user.id
          };
          
          return sessionData;
        } catch (error) {
          return null;
        }
      })
      .filter(session => session !== null) as ProcessedSessionData[]; // Remove any null sessions from processing errors
      
    return {
      sessions: processedSessions,
      clients: Array.from(uniqueClients.values())
    };
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr || dateStr.toString().trim() === '') {
      return new Date().toISOString().split('T')[0];
    }
    
    const dateString = dateStr.toString().trim();
    
    // Check if it's an Excel serial number (numeric value)
    const numericValue = parseFloat(dateString);
    if (!isNaN(numericValue) && numericValue > 0 && numericValue < 100000) {
      // Excel serial numbers start from January 1, 1900
      // Convert Excel serial number to JavaScript date
      const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const targetDate = new Date(excelEpoch.getTime() + (numericValue - 1) * millisecondsPerDay);
      
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
        return result;
      } else {
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
        return result;
      } else {
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
        return result;
      } else {
      }
    }
    
    // Try parsing YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Try standard date parsing as fallback
    const date = new Date(dateString);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
      const result = date.toISOString().split('T')[0];
      return result;
    }
    
    // If all else fails, log the error and return today's date
    return new Date().toISOString().split('T')[0];
  };

  // Check if a client exists and return their ID if found
const findExistingClient = async (clientName: string, clientEmail: string, userId: string): Promise<string | null> => {
    try {
      // First try to find by email if available (more reliable)
      if (clientEmail) {
        const { data: emailMatch, error: emailError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', clientEmail)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!emailError && emailMatch) {
          return emailMatch.id;
        }
      }
      
      // Then try to find by name (less reliable, could have duplicates)
      const { data: nameMatch, error: nameError } = await supabase
        .from('clients')
        .select('id')
        .eq('name', clientName)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!nameError && nameMatch) {
        return nameMatch.id;
      }
      
      return null; // Client not found
    } catch (error) {
      return null;
    }
  };
  
  // Check if a session with similar properties already exists
  const findExistingSession = async (session: ProcessedSessionData, userId: string): Promise<boolean> => {
    try {
      // We'll use a combination of client_name, date, and duration to identify potential duplicates
      const { data, error } = await supabase
        .from('sessions')
        .select('id')
        .eq('client_name', session.client_name)
        .eq('date', session.date)
        .eq('duration', session.duration)
        .eq('user_id', userId);
        
      if (error) {
        return false; // If there's an error, we'll assume it's not a duplicate
      }
      
      // If we found any sessions matching these criteria, it's likely a duplicate
      if (data && data.length > 0) {
        return true;
      }
      
      return false; // No duplicates found
    } catch (error) {
      return false;
    }
  };
  
  // Create a new client and return the ID
  const createNewClient = async (client: ImportedClientData, userId: string): Promise<string | null> => {
    try {
      // Ensure we have at least a name
      if (!client.name) return null;
      
      
      const clientData = {
        name: client.name,
        email: client.contact_info || '', // Use contact_info directly as the email
        notes: `Auto-created from session import on ${new Date().toLocaleDateString()}.`,
        user_id: userId
      };
      
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select('id')
        .single();
      
      if (error) {
        return null;
      }
      
      return data.id;
    } catch (error) {
      return null;
    }
  };

  // Process clients and sessions, creating new clients as needed
  const saveImportedSessions = async (importData: ImportProcessResult): Promise<{sessionsAdded: number, clientsAdded: number, sessionsSkipped: number}> => {
    const { sessions, clients } = importData;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    let clientsAdded = 0;
    let sessionsSkipped = 0;
    
    // Process each client
    for (const client of clients) {
      // Skip if we don't have a name
      if (!client.name) {
        continue;
      }
      
      
      // Check if client already exists - use contact_info as email
      const existingClientId = await findExistingClient(client.name, client.contact_info || '', user.id);
      
      // If client doesn't exist, create a new one
      if (!existingClientId) {
        const newClientId = await createNewClient(client, user.id);
        if (newClientId) {
          clientsAdded++;
        } else {
        }
      } else {
      }
    }
    
    
    // Filter out duplicate sessions
    const uniqueSessions = [];
    for (const session of sessions) {
      // Check if this session already exists
      const isDuplicate = await findExistingSession(session, user.id);
      
      if (isDuplicate) {
        sessionsSkipped++;
      } else {
        uniqueSessions.push(session);
      }
    }
    
    
    // If no unique sessions to insert, just return the stats
    if (uniqueSessions.length === 0) {
      return {
        sessionsAdded: 0,
        clientsAdded,
        sessionsSkipped
      };
    }
    
    // Debug the session structure before inserting
    
    // Insert only unique sessions
    const { data, error } = await supabase
      .from('sessions')
      .insert(uniqueSessions);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return {
      sessionsAdded: uniqueSessions.length,
      clientsAdded,
      sessionsSkipped
    };
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
        return;
      }

      // Find the session to get client name
      const sessionToDeleteData = sessions.find(s => s.id === sessionToDelete);
      if (!sessionToDeleteData) {
        return;
      }

      // Delete the session
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionToDelete)
        .eq("user_id", user.id);

      if (error) {
        alert('Failed to delete session');
        return;
      }

      // Delete associated client if requested
      if (deleteClientWithSession && sessionToDeleteData.clientName) {
        // First find the client ID
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("name", sessionToDeleteData.clientName)
          .eq("user_id", user.id);
        
        if (clientData && clientData.length > 0) {
          // Delete all sessions for this client first
          const { error: sessionsError } = await supabase
            .from("sessions")
            .delete()
            .eq("client_id", clientData[0].id)
            .eq("user_id", user.id);
            
          if (sessionsError) {
          }
          
          // Then delete the client
          const { error: clientError } = await supabase
            .from("clients")
            .delete()
            .eq("id", clientData[0].id)
            .eq("user_id", user.id);
          
          if (clientError) {
          } else {
            // Show success message for client deletion
            setImportMessage({
              type: 'success',
              message: `Successfully deleted session and client: ${sessionToDeleteData.clientName}`
            });
          }
        }
      }

      // Remove the session from the local state
      setSessions(prev => prev.filter(session => session.id !== sessionToDelete));
      
      if (!deleteClientWithSession) {
        // Only show this message if we didn't show the client deletion success message
        setImportMessage({
          type: 'success',
          message: 'Session deleted successfully'
        });
      }
    } catch (error) {
      alert('Failed to delete session');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSessionToDelete(null);
      setDeleteClientWithSession(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };
  
  // Bulk delete functions
  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      // Clear selections when exiting selection mode
      setSelectedSessions(new Set());
    }
  };
  
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };
  
  const selectAllSessions = () => {
    const allIds = getSortedSessions().map(session => session.id);
    setSelectedSessions(new Set(allIds));
  };
  
  const clearAllSelections = () => {
    setSelectedSessions(new Set());
  };
  
  const handleBulkDeleteConfirm = async () => {
    if (selectedSessions.size === 0) return;
    
    setBulkDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      
      // Get client names from selected sessions if we need to delete clients too
      let clientsToDelete = new Set<string>();
      if (deleteAssociatedClients) {
        const selectedSessionsArray = Array.from(selectedSessions);
        const selectedSessionsData = sessions.filter(s => selectedSessionsArray.includes(s.id));
        selectedSessionsData.forEach(session => {
          if (session.clientName) {
            clientsToDelete.add(session.clientName);
          }
        });
      }
      
      // Delete the selected sessions
      const { error } = await supabase
        .from("sessions")
        .delete()
        .in("id", Array.from(selectedSessions))
        .eq("user_id", user.id);
      
      if (error) {
        alert('Failed to delete sessions');
        return;
      }
      
      // Delete associated clients if requested
      if (deleteAssociatedClients && clientsToDelete.size > 0) {
        for (const clientName of clientsToDelete) {
          // First find the client ID
          const { data: clientData } = await supabase
            .from("clients")
            .select("id")
            .eq("name", clientName)
            .eq("user_id", user.id);
          
          if (clientData && clientData.length > 0) {
            // Delete the client
            const { error: clientError } = await supabase
              .from("clients")
              .delete()
              .eq("id", clientData[0].id)
              .eq("user_id", user.id);
            
            if (clientError) {
            }
          }
        }
      }
      
      // Remove the deleted sessions from the local state
      setSessions(prev => prev.filter(session => !selectedSessions.has(session.id)));
      
      // Exit selection mode
      setSelectionMode(false);
      setSelectedSessions(new Set());
      
      // Show success message
      setImportMessage({
        type: 'success',
        message: `Successfully deleted ${selectedSessions.size} sessions${deleteAssociatedClients ? ' and their associated clients' : ''}.`
      });
      
    } catch (error) {
      alert('Failed to delete sessions');
    } finally {
      setBulkDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };
  
  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
  };
  
  // Function to find client ID by name before navigation
  const findClientAndNavigate = async (clientName: string, session?: SessionEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Search for client by name
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id')
        .eq('name', clientName)
        .eq('user_id', user.id);
      
      if (error) {
        return;
      }
      
      if (clients && clients.length > 0) {
        // Navigate to the client's page using their ID
        router.push(`/dashboard/clients/${clients[0].id}`);
      } else {
        // If it's a Calendly booking, try to create the client automatically
        if (session?.is_calendly_only && session.clientEmail) {
          try {
            const { data: newClient, error: createError } = await supabase
              .from('clients')
              .insert({
                name: clientName,
                email: session.clientEmail,
                phone: '',
                notes: `Created from Calendly booking`,
                user_id: user.id
              })
              .select('id')
              .single();
            
            if (!createError && newClient) {
              router.push(`/dashboard/clients/${newClient.id}`);
            } else {
              alert(`No client record found for ${clientName}. Please add this client manually.`);
            }
          } catch (createErr) {
            alert(`No client record found for ${clientName}. Please add this client manually.`);
          }
        } else {
          // If no client found with that name, show a message
          alert(`No client record found for ${clientName}. Try adding this client first.`);
        }
      }
    } catch (error) {
    }
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
      
      // First fetch sessions from database
      const { data, error } = await supabase
        .from("sessions")
        .select("id,client_name,date,duration,types,number_in_group,paymenttype,payment_amount,focus_area,key_outcomes,client_progress,coaching_tools,icf_competencies,additional_notes,user_id,finish_date,calendly_booking_id")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      
      // Also fetch Calendly bookings
      let calendlySessions: any[] = [];
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch('/api/calendly/events', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const calendlyData = await response.json();
            calendlySessions = (calendlyData.events || []).map((e: any) => ({
              id: e.id,
              client_name: e.client_name || 'Calendly Booking',
              date: e.date,
              finish_date: e.finish_date || e.date,
              duration: e.duration || 0,
              types: [],
              paymenttype: '',
              payment_amount: null,
              focus_area: '',
              key_outcomes: '',
              client_progress: '',
              coaching_tools: [],
              icf_competencies: [],
              additional_notes: e.notes || 'Scheduled via Calendly',
              user_id: user.id,
              calendly_booking_id: e.calendly_booking_id,
              is_calendly_only: true
            }));
          }
        }
      } catch (calendlyError) {
        // Silently fail - Calendly bookings are optional
      }
      
      // Combine database sessions with Calendly bookings
      // Filter out Calendly bookings that are already in the database (by calendly_booking_id)
      const dbCalendlyIds = new Set(
        (data || [])
          .filter((s: any) => s.calendly_booking_id)
          .map((s: any) => s.calendly_booking_id)
      );
      
      const uniqueCalendlySessions = calendlySessions.filter(
        (cs: any) => !dbCalendlyIds.has(cs.calendly_booking_id)
      );
      
      // Combine all sessions
      const allSessions = [...(data || []), ...uniqueCalendlySessions];
      
      // Then fetch client emails for each session
      if (!error && allSessions.length > 0) {
        // Get unique client names
        const clientNames = [...new Set(allSessions.map((session: any) => session.client_name))];
        
        // Fetch client data for these names
        const { data: clientsData } = await supabase
          .from("clients")
          .select("name,email")
          .in("name", clientNames)
          .eq("user_id", user.id);
        
        // Create a map of client names to emails
        const clientEmailMap = new Map();
        if (clientsData) {
          clientsData.forEach((client: any) => {
            clientEmailMap.set(client.name, client.email);
          });
        }
      
        // Map snake_case to camelCase with null checks
        const mapped = allSessions.map((session: any) => ({
          id: session.id || null,
          clientName: session.client_name || "",
          clientEmail: session.email || clientEmailMap.get(session.client_name) || "",
          date: session.date || "",
          finishDate: session.finish_date || "",
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
          is_calendly_only: session.is_calendly_only || false,
        }));
        
        // Sort by date descending
        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setSessions(mapped);
      }
    } catch (error) {
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

  // Effect to update filtered sessions when search params or sessions change
  useEffect(() => {
    if (!loading) {
      setFilteredSessions(applyFilters());
    }
  }, [searchParams1, sessions, loading]);

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
          {/* Add search toggle button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${searchOpen ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Advanced Search</span>
          </button>
          {/* Selection mode toggle */}
          {sessions.length > 0 && (
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${selectionMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">{selectionMode ? "Exit Selection" : "Select Sessions"}</span>
              <span className="sm:hidden">{selectionMode ? "Exit" : "Select"}</span>
            </button>
          )}
          
          {/* Bulk delete button - only visible in selection mode */}
          {selectionMode && selectedSessions.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Delete ({selectedSessions.size})</span>
            </button>
          )}
          
          {/* Selection controls - only visible in selection mode */}
          {selectionMode && sessions.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={selectAllSessions}
                className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                <span className="hidden sm:inline">Select All</span>
                <span className="sm:hidden">All</span>
              </button>
              {selectedSessions.size > 0 && (
                <button
                  onClick={clearAllSelections}
                  className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <span className="hidden sm:inline">Clear</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              )}
            </div>
          )}
          
          {/* Regular controls - hidden in selection mode */}
          {!selectionMode && (
            <>
              <button
                onClick={toggleSortOrder}
                className="flex items-center justify-center gap-1.5 bg-gray-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sort by Date {sortOrder === 'asc' ? 'â†‘' : 'â†“'}</span>
                <span className="sm:hidden">Sort {sortOrder === 'asc' ? 'â†‘' : 'â†“'}</span>
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
                className="flex items-center justify-center gap-1.5 bg-purple-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{importing ? "Importing..." : "Import ICF Spreadsheet"}</span>
                <span className="sm:hidden">{importing ? "Importing..." : "Import"}</span>
              </button>

              <a
                href="https://coachingfederation.org/wp-content/uploads/2024/12/icf-cs-client-coaching-log-template.xlsx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Download ICF Sample Spreadsheet</span>
                <span className="sm:hidden">Sample</span>
              </a>

              <button
                onClick={() => exportSessionsToICFLog(sessions, `ICF-Client-Coaching-Log-${new Date().toISOString().split('T')[0]}`)}
                className="flex items-center justify-center gap-1.5 bg-yellow-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-xs sm:text-sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Export ICF Format</span>
                <span className="sm:hidden">Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Advanced Search Panel */}
      {searchOpen && (
        <div className="fixed inset-0 z-40 bg-gray-800 bg-opacity-75 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h2 className="text-xl font-semibold">Advanced Search</h2>
              <button 
                onClick={() => setSearchOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Name */}
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by client name"
                    value={searchParams1.clientName}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, clientName: e.target.value }))}
                  />
                </div>
                
                {/* Session Type */}
                <div>
                  <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-1">
                    Session Type
                  </label>
                  <input
                    id="sessionType"
                    type="text"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. individual, group"
                    value={searchParams1.type}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, type: e.target.value }))}
                  />
                </div>
                
                {/* Date Range */}
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={searchParams1.startDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={searchParams1.endDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                
                {/* Payment Type */}
                <div>
                  <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <select
                    id="paymentType"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={searchParams1.paymentType}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, paymentType: e.target.value }))}
                  >
                    <option value="">All Payment Types</option>
                    <option value="paid">Paid</option>
                    <option value="proBono">Pro Bono</option>
                    <option value="paidAndProBono">Paid & Pro Bono</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setSearchParams({
                      clientName: '',
                      startDate: '',
                      endDate: '',
                      type: '',
                      paymentType: ''
                    });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Active Filters Summary */}
      {(searchParams1.clientName || searchParams1.startDate || searchParams1.endDate || searchParams1.type || searchParams1.paymentType) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm text-blue-700 font-medium mb-1">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {searchParams1.clientName && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Client: {searchParams1.clientName}
                  </span>
                )}
                {searchParams1.type && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Type: {searchParams1.type}
                  </span>
                )}
                {searchParams1.startDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    From: {searchParams1.startDate}
                  </span>
                )}
                {searchParams1.endDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    To: {searchParams1.endDate}
                  </span>
                )}
                {searchParams1.paymentType && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Payment: {searchParams1.paymentType === 'paid' ? 'Paid' : searchParams1.paymentType === 'proBono' ? 'Pro Bono' : 'Paid & Pro Bono'}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => {
                setSearchParams({
                  clientName: '',
                  startDate: '',
                  endDate: '',
                  type: '',
                  paymentType: ''
                });
              }}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
      
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
                <li>Automatically add new clients to your client list</li>
                <li>Create a backup of your existing sessions</li>
                <li>Not delete any existing sessions or clients</li>
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
      ) : getSortedSessions().length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border p-6">
          <div className="mb-4">
            <svg className="h-12 w-12 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching sessions</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
          <button
            onClick={() => {
              setSearchParams({
                clientName: '',
                startDate: '',
                endDate: '',
                type: '',
                paymentType: ''
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </button>
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
                className={`bg-white rounded-xl shadow-lg border transition-all duration-300 ${!selectionMode ? 'cursor-pointer' : ''} hover:shadow-xl ${
                  isHighlighted 
                    ? 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50' 
                    : ''
                } ${
                  selectionMode && selectedSessions.has(session.id)
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : ''
                }`}
                onClick={(e) => {
                  // In selection mode, clicking the card toggles selection
                  if (selectionMode) {
                    toggleSessionSelection(session.id);
                    return;
                  }
                  // Only navigate if the click is not on the client name or edit button
                  const target = (e.target as HTMLElement);
                  
                  // Check if click is on client name or edit button
                  if (
                    target.closest('h2[data-client-name]') ||
                    target.closest('button[title="Edit Session"]')
                  ) {
                    return;
                  }
                  
                  // Check if click is inside the client name area
                  if (target.closest('[data-client-name]')) {
                    return;
                  }
                  
                  if (session.id && session.id.trim() !== '') {
                    router.push(`/dashboard/sessions/edit/${session.id}`);
                  }
                }}
              >
                {/* Compact Header - Always Visible */}
                <div className="p-4 flex items-center justify-between">
                  {/* Selection checkbox - only visible in selection mode */}
                  {selectionMode && (
                    <div className="mr-3">
                      <input 
                        type="checkbox" 
                        checked={selectedSessions.has(session.id)}
                        onChange={() => toggleSessionSelection(session.id)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()} // Prevent card click handler
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    {/* Client name is a clickable link that opens the client modal */}
                                        <div className="inline-block">
                      <h2 
                        data-client-name
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                        onClick={(e) => { 
                          e.preventDefault();
                          e.stopPropagation(); 
                          findClientAndNavigate(session.clientName, session);
                        }}
                      >
                        {session.clientName}
                        {(session as any).is_calendly_only && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Calendly
                          </span>
                        )}
                      </h2>
                      {session.clientEmail && (
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {session.clientEmail}
                          </span>
                        </div>
                      )}
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
                      {session.paymentType && session.paymentType.trim() !== '' && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold self-start ${
                          session.paymentType === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : session.paymentType === 'paidAndProBono'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          {session.paymentType === 'paid' 
                            ? 'Paid' 
                            : session.paymentType === 'paidAndProBono' 
                              ? 'Paid & ProBono' 
                              : 'Pro Bono'}
                          {session.paymentAmount && (session.paymentType === 'paid' || session.paymentType === 'paidAndProBono') && ` - ${formatNumberForDisplay(session.paymentAmount, { country: profile?.country || 'US', currency: profile?.currency || 'USD' }, { style: 'currency' })}`}
                        </span>
                      )}
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
                        title={session.id?.startsWith('calendly-') ? 'Edit Calendly session (will save to database)' : 'Edit Session'}
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
            <p className="mb-4">Are you sure you want to delete this session? This action cannot be undone.</p>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={deleteClientWithSession}
                  onChange={(e) => setDeleteClientWithSession(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium">Also delete the client associated with this session</span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-6">
                Warning: This will delete the client record associated with this session, including all documents and other sessions for this client.
              </p>
            </div>
            
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
      
      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Bulk Deletion</h2>
            <p className="mb-4">Are you sure you want to delete {selectedSessions.size} selected sessions? This action cannot be undone.</p>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={deleteAssociatedClients}
                  onChange={(e) => setDeleteAssociatedClients(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium">Also delete associated clients</span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-6">
                Warning: This will delete all client records associated with these sessions, including any documents and other sessions for those clients.
              </p>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={handleBulkDeleteCancel}
                disabled={bulkDeleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleBulkDeleteConfirm}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? 'Deleting...' : `Delete ${selectedSessions.size} Sessions`}
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
