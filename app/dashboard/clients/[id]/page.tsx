"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CalendlyWidget from "@/app/components/CalendlyWidget";
import { UserIcon, EnvelopeIcon, PhoneIcon, ArrowLeftIcon, PencilIcon, TrashIcon, CalendarIcon } from "@heroicons/react/24/outline";

type ClientDocument = {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  created_at: string;
};

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  user_id: string;
  documents?: ClientDocument[];
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState<string>("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Test storage bucket access
  useEffect(() => {
    const testStorageAccess = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('certificates')
          .list('clients', { limit: 1 });
        
        if (error) {
          setUploadError(`Storage bucket not accessible: ${error.message}. Please check your Supabase storage configuration.`);
        } else {
          setUploadError(null);
        }
      } catch (error) {
        setUploadError('Storage test failed. Please check your Supabase configuration.');
      }
    };
    
    testStorageAccess();
  }, []);
  
  // Handle uploading a document
  const handleUploadDocument = async (file: File) => {
    setUploadLoading(true);
    setUploadError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !client) {
        setUploadError('Authentication error or client not found');
        setUploadLoading(false);
        return;
      }
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File too large. Maximum size is 10MB.');
        setUploadLoading(false);
        return;
      }
      
      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `clients/${user.id}/${clientId}/${Date.now()}_${sanitizedName}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        setUploadError(`Upload failed: ${uploadError.message}`);
        setUploadLoading(false);
        return;
      }
      
      if (uploadData) {
        // Get file URL
        const { data: urlData } = supabase.storage
          .from('certificates')
          .getPublicUrl(fileName);
        
        // Save document metadata to database
        const documentData = {
          client_id: clientId,
          user_id: user.id,
          name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_url: urlData.publicUrl,
          created_at: new Date().toISOString()
        };
        
        const { data, error: dbError } = await supabase
          .from('client_documents')
          .insert([documentData])
          .select();
        
        if (dbError) {
          setUploadError(`Error saving document metadata: ${dbError.message}`);
        } else if (data) {
          // Add document to state
          const newDocument: ClientDocument = {
            id: data[0].id,
            name: file.name,
            file_path: fileName,
            file_size: file.size,
            created_at: new Date().toISOString()
          };
          
          setDocuments(prev => [...prev, newDocument]);
        }
      }
    } catch (error) {
      setUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadLoading(false);
    }
  };
  
  // Handle downloading a document
  const handleDownloadDocument = async (clientDocument: ClientDocument) => {
    try {
      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('certificates')
        .download(clientDocument.file_path);
      
      if (error) {
        alert('Error downloading file');
        return;
      }
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = clientDocument.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download document');
    }
  };
  
  // Handle deleting a document
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      return;
    }
    
    try {
      // First get the document to retrieve the file path
      const { data: docData, error: docError } = await supabase
        .from('client_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();
      
      if (docError) {
        alert('Failed to delete document');
        return;
      }
      
      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('certificates')
        .remove([docData.file_path]);
      
      if (storageError) {
        alert('Failed to delete file from storage');
        return;
      }
      
      // Delete the document metadata from database
      const { error: dbError } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentId);
      
      if (dbError) {
        alert('Failed to delete document metadata');
        return;
      }
      
      // Remove document from state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      alert('Failed to delete document');
    }
  };
  
  // Fetch client data and documents
  useEffect(() => {
    const fetchClient = async () => {
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

        // @ts-ignore: Supabase type workaround for .eq
        const { data, error } = await ((supabase as any)
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .eq("user_id", user.id)
          .single());

        if (!error && data) {
          setClient(data);
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            notes: data.notes || ''
          });
          
          // Fetch client documents
          const { data: documentsData, error: documentsError } = await supabase
            .from('client_documents')
            .select('*')
            .eq('client_id', clientId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (!documentsError && documentsData) {
            // Map to ClientDocument type
            const mappedDocs: ClientDocument[] = documentsData.map(doc => ({
              id: doc.id,
              name: doc.name,
              file_path: doc.file_path,
              file_size: doc.file_size,
              created_at: doc.created_at
            }));
            
            setDocuments(mappedDocs);
          } else {
            setDocuments([]);
          }
        } else {
          // Use mock data for demo
          const mockClient = {
            id: clientId,
            name: 'Claire Schillaci',
            email: 'claire@schillaci.me',
            phone: '+351937596665',
            notes: 'She is great!',
            created_at: new Date().toISOString(),
            user_id: user.id
          };
          setClient(mockClient);
          setFormData({
            name: mockClient.name,
            email: mockClient.email,
            phone: mockClient.phone,
            notes: mockClient.notes
          });
        }
      } catch (error) {
        setError('Failed to load client details');
      }
      setLoading(false);
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("clients")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes
        })
        .eq("id", clientId)
        .eq("user_id", user.id);

      if (!error) {
        setClient(prev => prev ? { ...prev, ...formData } : null);
        setEditing(false);
      } else {
        setError('Failed to update client');
      }
    } catch (error) {
      setError('Failed to update client');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      setDeleting(false);
      setShowDeleteModal(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First verify the client belongs to the user, then delete
      const { data: clientCheck, error: checkError } = await supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("user_id", user.id)
        .single();

      if (checkError || !clientCheck) {
        setError('Client not found or access denied');
        setDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (!error) {
        router.push('/dashboard/clients');
      } else {
        setError('Failed to delete client');
      }
    } catch (error) {
      setError('Failed to delete client');
    }
    setDeleting(false);
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/clients')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
          <p className="text-gray-600 mb-6">The client you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard/clients')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/clients')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Clients
            </button>
            <div className="flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Client Details</h1>
            </div>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: client.name || '',
                      email: client.email || '',
                      phone: client.phone || '',
                      notes: client.notes || ''
                    });
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Book Session Button */}
        {calendlyUrl && client && (
          <div className="mb-6">
            <button
              onClick={() => {
                // Validate client has at least name or email before opening modal
                if (!client.name && !client.email) {
                  setError('Client must have a name or email to book a session');
                  return;
                }
                setShowCalendlyModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <CalendarIcon className="h-5 w-5" />
              Book Session with {client.name || 'Client'}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Client Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{client.name}</p>
              )}
            </div>

            {/* Email */}
            {profile && profile.name && profile.name.trim() !== '' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <a 
                      href={`mailto:${client.email}`}
                      className="text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <p className="text-gray-900">{client.phone || 'Not provided'}</p>
                </div>
              )}
            </div>

            {/* Created Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Added</label>
              <p className="text-gray-900">{new Date(client.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            {editing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about this client..."
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {client.notes || 'No notes added'}
              </p>
            )}
          </div>
          
          {/* Documents Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Client Documents, Contracts etc</label>
              {editing && (
                <label 
                  htmlFor="document-upload" 
                  className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload Document
                  <input 
                    id="document-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadDocument(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            
            {/* Document List */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {uploadError && (
                <div className="bg-red-50 border-b border-red-100 p-3">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
              
              {/* If there are no documents, show a message */}
              {documents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {uploadLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mb-2"></div>
                      <p>Uploading document...</p>
                    </div>
                  ) : (
                    'No documents uploaded yet.'
                  )}
                </div>
              ) : (
                <div>
                  {documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{document.name}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded on {new Date(document.created_at).toLocaleDateString()} â€¢ {formatFileSize(document.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800" 
                          title="Download"
                          onClick={() => handleDownloadDocument(document)}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        {editing && (
                          <button 
                            className="p-1 text-red-600 hover:text-red-800" 
                            title="Delete"
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this client? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendly Modal */}
      {showCalendlyModal && client && calendlyUrl && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Book Session</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Scheduling with {client.name}
                </p>
              </div>
              <button
                onClick={() => setShowCalendlyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
              {calendlyUrl && calendlyUrl.trim() !== '' ? (
                <CalendlyWidget
                  url={calendlyUrl}
                  prefill={client.name || client.email ? {
                    name: client.name?.trim() || undefined,
                    email: client.email?.trim() || undefined,
                  } : undefined}
                  utm={{
                    utmSource: "icflog",
                    utmMedium: "client_detail",
                    utmCampaign: "coaching_session",
                    utmContent: `client_${client.id}`
                  }}
                  style={{
                    minWidth: '100%',
                    height: '700px'
                  }}
                />
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
    </>
  );
} 
