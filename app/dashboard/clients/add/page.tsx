"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { UserIcon, ArrowLeftIcon, ExclamationTriangleIcon, XMarkIcon, DocumentArrowUpIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function AddClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if consent checkbox is checked
    if (!consentGiven) {
      setShowWarningModal(true);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: clientData, error: insertError } = await supabase
        .from("clients")
        .insert([
          {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            notes: formData.notes.trim() || null,
            user_id: user.id
          }
        ])
        .select();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // If documents were selected, upload them
      if (selectedFiles.length > 0 && clientData && clientData.length > 0) {
        const clientId = clientData[0].id;
        const uploadErrors: string[] = [];
        
        // Upload all files
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          try {
            // Check file size (limit to 10MB)
            if (file.size > 10 * 1024 * 1024) {
              uploadErrors.push(`${file.name}: File too large. Maximum size is 10MB.`);
              continue;
            }

            // Sanitize filename and ensure uniqueness
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `clients/${user.id}/${clientId}/${Date.now()}_${i}_${sanitizedName}`;
            
            // Upload file to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('certificates')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              uploadErrors.push(`${file.name}: ${uploadError.message}`);
              continue;
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
              
              const { error: dbError } = await supabase
                .from('client_documents')
                .insert([documentData]);

              if (dbError) {
                console.error('Error saving document metadata:', dbError);
                uploadErrors.push(`${file.name}: Failed to save metadata`);
              }
            }
          } catch (uploadError) {
            console.error('Document upload error:', uploadError);
            uploadErrors.push(`${file.name}: Upload failed`);
          }
        }

        // Show errors if any, but still redirect since client was created
        if (uploadErrors.length > 0) {
          const successCount = selectedFiles.length - uploadErrors.length;
          if (successCount > 0) {
            setError(`Client created. ${successCount} document(s) uploaded successfully. Some documents failed: ${uploadErrors.join('; ')}`);
          } else {
            setError(`Client created but document uploads failed: ${uploadErrors.join('; ')}`);
          }
        }
      }

      router.push("/dashboard/clients");
    } catch (error) {
      console.error('Error adding client:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <UserIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Add New Client</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter client's full name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="client@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">Multiple coaches can share clients with the same email address</p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1-555-0123"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes about this client..."
            />
          </div>

          {/* Document Upload */}
          <div>
            <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
              Documents (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="document-upload"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                  Upload Documents
                </label>
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      // Validate all files
                      const validFiles: File[] = [];
                      const errors: string[] = [];
                      
                      files.forEach(file => {
                        // Check file size (limit to 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                          errors.push(`${file.name}: File too large. Maximum size is 10MB.`);
                        } else {
                          validFiles.push(file);
                        }
                      });
                      
                      if (errors.length > 0) {
                        setError(errors.join(' '));
                      } else {
                        setError(""); // Clear any previous errors
                      }
                      
                      // Add new files to existing ones
                      setSelectedFiles(prev => [...prev, ...validFiles]);
                    }
                  }}
                />
                {selectedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    title="Remove all documents"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <DocumentArrowUpIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                        title="Remove this document"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Upload multiple supporting documents (PDF, DOC, DOCX, TXT, JPG, PNG). Maximum size per file: 10MB.
              </p>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                <strong>The client has agreed to have their hours logged</strong>
                <br />
                <span className="text-gray-600 text-xs">
                  Required for ICF accreditation compliance
                </span>
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding Client..." : "Add Client"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 md:bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">Client Consent Required</h3>
              <button
                onClick={() => setShowWarningModal(false)}
                className="ml-auto p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="text-sm text-gray-700 space-y-3 mb-6">
              <p>
                <strong>Clients need to agree to have their hours logged for the International Coaching Federation (ICF) accreditation process.</strong>
              </p>
              <p>
                The ICF requires coaches to maintain a coaching log that includes client names and contact information, along with the dates and number of paid and pro bono hours for each client.
              </p>
              <p>
                Clients must provide consent, which can be verbal, for their information to be included.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWarningModal(false)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 