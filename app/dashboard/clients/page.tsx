"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CalendlyWidget from "@/app/components/CalendlyWidget";
import { 
  UserIcon, 
  PlusIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CheckIcon, 
  TrashIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  last_activity?: string;
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingClients, setDeletingClients] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState({ current: 0, total: 0 });
  const [profile, setProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("all");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  const [selectedClientForBooking, setSelectedClientForBooking] = useState<Client | null>(null);
  const [calendlyUrl, setCalendlyUrl] = useState<string>("");

  // Effect for filtering and sorting
  useEffect(() => {
    // Skip if no clients or loading
    if (loading || clients.length === 0) return;
    
    // Filter clients based on search term
    let filtered = clients;
    if (searchTerm.trim()) {
      filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort clients based on selected option
    filtered = [...filtered].sort((a, b) => {
      switch(sortOption) {
        case "all":
          return 0; // No sorting, keep original order from the database
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "activity-desc":
          // For recent activity
          const aActivity = a.last_activity ? new Date(a.last_activity).getTime() : new Date(a.created_at).getTime();
          const bActivity = b.last_activity ? new Date(b.last_activity).getTime() : new Date(b.created_at).getTime();
          return bActivity - aActivity;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    setFilteredClients(filtered);
  }, [clients, searchTerm, sortOption, loading]);

  // Handle selection of individual clients
  const toggleClientSelection = (clientId: string, e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent navigation to client page
    
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  // Handle select all functionality
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible clients
      setSelectedClients(filteredClients.map(client => client.id));
    } else {
      // Deselect all
      setSelectedClients([]);
    }
  };
  
  // Batch process deletion to avoid URL length limitations
  const batchProcess = async (
    items: string[], 
    processFn: (batch: string[]) => Promise<any>, 
    batchSize = 10,
    progressFn?: (current: number, total: number) => void
  ) => {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    let results = [];
    let processedItems = 0;
    const totalItems = items.length;
    
    for (const batch of batches) {
      const result = await processFn(batch);
      results.push(result);
      
      processedItems += batch.length;
      if (progressFn) {
        progressFn(processedItems, totalItems);
      }
    }
    
    return results;
  };

  // Delete selected clients and their associated sessions
  const deleteSelectedClients = async () => {
    if (selectedClients.length === 0) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedClients.length} selected client(s)? This will also delete all associated sessions.`);
    if (!confirmDelete) return;
    
    try {
      // Start a loading state and set up progress
      setDeletingClients(true);
      setDeletionProgress({ current: 0, total: selectedClients.length * 2 }); // *2 because we're doing two operations per client
      
      // Update progress function
      const updateProgress = (current: number, total: number) => {
        // For sessions deletion, we'll count from 0 to total
        setDeletionProgress({ current, total: selectedClients.length * 2 });
      };
      
      // Delete sessions in batches to avoid URL length limitations
      const deleteSessionsBatch = async (clientIdBatch: string[]) => {
        const { error } = await supabase
          .from("sessions")
          .delete()
          .in("client_id", clientIdBatch);
        
        if (error) {
          throw new Error(`Error deleting sessions: ${error.message}`);
        }
        return true;
      };
      
      try {
        // Process session deletion in batches with progress tracking
        await batchProcess(selectedClients, deleteSessionsBatch, 10, updateProgress);
      } catch (error: any) {
        console.error("Error deleting sessions:", error);
        alert(error.message || "Error deleting associated sessions");
        setDeletingClients(false);
        setDeletionProgress({ current: 0, total: 0 });
        return;
      }
      
      // Delete clients in batches too for consistency
      const deleteClientsBatch = async (clientIdBatch: string[]) => {
        const { error } = await supabase
          .from("clients")
          .delete()
          .in("id", clientIdBatch);
        
        if (error) {
          throw new Error(`Error deleting clients: ${error.message}`);
        }
        return true;
      };
      
      // Update progress function for clients (continuing from sessions)
      const updateClientProgress = (current: number, total: number) => {
        // For client deletion, we'll count from selectedClients.length to selectedClients.length*2
        setDeletionProgress({ 
          current: selectedClients.length + current, 
          total: selectedClients.length * 2 
        });
      };
      
      try {
        // Process client deletion in batches with progress tracking
        await batchProcess(selectedClients, deleteClientsBatch, 10, updateClientProgress);
      } catch (error: any) {
        console.error("Error deleting clients:", error);
        alert(error.message || "Error deleting clients");
        setDeletingClients(false);
        setDeletionProgress({ current: 0, total: 0 });
        return;
      }
      
      // Remove deleted clients from state
      setClients(prevClients => 
        prevClients.filter(client => !selectedClients.includes(client.id))
      );
      setFilteredClients(prevClients => 
        prevClients.filter(client => !selectedClients.includes(client.id))
      );
      setSelectedClients([]);
      
      // Success message
      alert(`Successfully deleted ${selectedClients.length} client(s) and their associated sessions.`);
      
    } catch (error) {
      console.error("Error in deletion process:", error);
      alert("An unexpected error occurred during deletion");
    } finally {
      setDeletingClients(false);
      setDeletionProgress({ current: 0, total: 0 });
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
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
          // Set Calendly URL from profile
          if (profileData.calendly_url) {
            setCalendlyUrl(profileData.calendly_url);
          }
        } else {
          setProfile(null);
        }

        const { data, error } = await supabase
          .from("clients")
          .select("*, last_activity")
          .eq("user_id", user.id)
          .order("name", { ascending: true });

        if (!error && data) {
          setClients(data);
          setFilteredClients(data);
        } else {
          setClients([]);
          setFilteredClients([]);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
      setLoading(false);
    };

    fetchClients();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        </div>
        <button
          onClick={() => router.push('/dashboard/clients/add')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Client
        </button>
      </div>

      {/* Filter and Sort Controls */}
      {clients.length > 0 && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <input 
                type="text" 
                placeholder="Filter by name..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")} 
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select 
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="all">All</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="date-desc">Date Added (Newest)</option>
                <option value="date-asc">Date Added (Oldest)</option>
                <option value="activity-desc">Recent Activity</option>
              </select>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600"
                  checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                  onChange={toggleSelectAll}
                />
                <span className="text-sm font-medium text-gray-700">
                  {selectedClients.length === 0 
                    ? 'Select All' 
                    : selectedClients.length === filteredClients.length 
                      ? 'Deselect All' 
                      : `Selected ${selectedClients.length} of ${filteredClients.length}`}
                </span>
              </label>
            </div>
            
            {selectedClients.length > 0 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={deleteSelectedClients}
                  disabled={deletingClients}
                  className={`flex items-center gap-1 ${deletingClients ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white px-3 py-1 rounded-lg text-sm transition-colors`}
                >
                  {deletingClients ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {deletionProgress.total > 0 
                          ? `Deleting... ${Math.round((deletionProgress.current / deletionProgress.total) * 100)}%` 
                          : 'Deleting...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete Selected</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first client.</p>
          <button
            onClick={() => router.push('/dashboard/clients/add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Client
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border p-6">
          <div className="mb-4">
            <svg className="h-12 w-12 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching clients</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className={`bg-white rounded-xl shadow-lg p-6 border hover:shadow-xl transition-shadow cursor-pointer ${selectedClients.includes(client.id) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selectedClients.includes(client.id)}
                      onChange={(e) => {
                        e.stopPropagation(); // Prevent card click
                        toggleClientSelection(client.id, e);
                      }}
                      onClick={(e) => e.stopPropagation()} // Prevent card click
                    />
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  </div>
                  <div className="space-y-1">
                    {profile && profile.name && profile.name.trim() !== '' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4" />
                        <a 
                          href={`mailto:${client.email}`}
                          className="hover:text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {client.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 line-clamp-2">{client.notes}</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Added {new Date(client.created_at).toLocaleDateString()}
                </p>
                {calendlyUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Validate client has at least name or email before opening modal
                      if (!client.name && !client.email) {
                        alert('Client must have a name or email to book a session');
                        return;
                      }
                      setSelectedClientForBooking(client);
                      setShowCalendlyModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                    title="Book session with this client"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Book Session
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendly Modal */}
      {showCalendlyModal && selectedClientForBooking && calendlyUrl && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Book Session</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Scheduling with {selectedClientForBooking.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCalendlyModal(false);
                  setSelectedClientForBooking(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
              {calendlyUrl && calendlyUrl.trim() !== '' ? (
                <>
                  <CalendlyWidget
                    url={calendlyUrl}
                    prefill={selectedClientForBooking.name || selectedClientForBooking.email ? {
                      name: selectedClientForBooking.name?.trim() || undefined,
                      email: selectedClientForBooking.email?.trim() || undefined,
                    } : undefined}
                    utm={{
                      utmSource: "icflog",
                      utmMedium: "client_card",
                      utmCampaign: "coaching_session",
                      utmContent: `client_${selectedClientForBooking.id}`
                    }}
                    style={{
                      minWidth: '100%',
                      height: '700px'
                    }}
                  />
                  {/* Note: Console warnings from Calendly widget are normal and don't affect functionality */}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Calendly URL is not configured</p>
                  <p className="text-sm text-gray-400">Please configure your Calendly URL in the Calendar settings</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 