"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  AcademicCapIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

interface MentoringSession {
  id: string;
  session_type: 'mentoring' | 'supervision';
  session_date: string;
  duration: number;
  provider_name: string;
  credential_level: string;
  delivery_type?: string;
  supervision_type?: string;
  focus_area: string;
  session_notes?: string;
  is_formal_supervision?: boolean;
  uploaded_file_name?: string;
  uploaded_file_path?: string;
  uploaded_file_size?: number;
}

export default function EditMentoringPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<MentoringSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Form state
  const [sessionType, setSessionType] = useState<'mentoring' | 'supervision'>("mentoring");
  const [formData, setFormData] = useState({
    date: "",
    duration: "",
    durationUnit: "minutes",
    providerName: "",
    credentialLevel: "",
    deliveryType: "individual",
    supervisionType: "one-on-one",
    focusArea: "",
    notes: "",
    isFormalSupervision: true,
    uploadedFile: null as File | null
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("mentoring_supervision")
          .select("*")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error('Error fetching session:', error);
          setError('Failed to load session');
          return;
        }

        if (data) {
          setSession(data);
          setSessionType(data.session_type);
          
          // Populate form with existing data
          const durationInMinutes = data.duration;
          let duration = durationInMinutes.toString();
          let durationUnit = "minutes";
          
          // Convert to hours if >= 60 minutes
          if (durationInMinutes >= 60 && durationInMinutes % 60 === 0) {
            duration = (durationInMinutes / 60).toString();
            durationUnit = "hours";
          }

          setFormData({
            date: data.session_date,
            duration: duration,
            durationUnit: durationUnit,
            providerName: data.provider_name,
            credentialLevel: data.credential_level || "",
            deliveryType: data.delivery_type || "individual",
            supervisionType: data.supervision_type || "one-on-one",
            focusArea: data.focus_area,
            notes: data.session_notes || "",
            isFormalSupervision: data.is_formal_supervision || true,
            uploadedFile: null
          });
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // Convert duration to minutes
      let durationInMinutes = parseInt(formData.duration);
      if (formData.durationUnit === "hours") {
        durationInMinutes = durationInMinutes * 60;
      }

      // Handle file upload if provided
      let uploadedFileName = session?.uploaded_file_name || "";
      let uploadedFilePath = session?.uploaded_file_path || "";
      let uploadedFileSize = session?.uploaded_file_size || 0;

      if (formData.uploadedFile) {
        try {
          // Sanitize filename
          const sanitizedName = formData.uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${user.id}/${Date.now()}_${sanitizedName}`;
          
          // Check file size (limit to 10MB)
          if (formData.uploadedFile.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB.');
            return;
          }

          // First check if bucket exists and we have access
          const { data: bucketData, error: bucketError } = await supabase.storage
            .from('certificates')
            .list('', { limit: 1 });
          
          if (bucketError) {
            console.error('Bucket access error:', bucketError);
            setError(`Storage bucket error: ${bucketError.message}`);
            return;
          } else {
            console.log('Bucket access successful, proceeding with upload...');
            
            // Upload to certificates bucket
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('certificates')
              .upload(fileName, formData.uploadedFile, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              setError(`Upload failed: ${uploadError.message}`);
              return;
            }

            if (uploadData) {
              const { data: urlData } = supabase.storage
                .from('certificates')
                .getPublicUrl(fileName);
              
              uploadedFileName = formData.uploadedFile.name;
              uploadedFilePath = urlData.publicUrl;
              uploadedFileSize = formData.uploadedFile.size;
              console.log('File uploaded successfully:', uploadedFilePath);
            }
          }
        } catch (error) {
          console.error('File upload error:', error);
          setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }

      // Update database
      const { error: dbError } = await supabase
        .from("mentoring_supervision")
        .update({
          session_type: sessionType,
          session_date: formData.date,
          duration: durationInMinutes,
          provider_name: formData.providerName,
          credential_level: formData.credentialLevel || null,
          delivery_type: sessionType === "mentoring" ? formData.deliveryType : null,
          supervision_type: sessionType === "supervision" ? formData.supervisionType : null,
          focus_area: formData.focusArea,
          session_notes: formData.notes || null,
          is_formal_supervision: sessionType === "supervision" ? formData.isFormalSupervision : null,
          uploaded_file_name: uploadedFileName || null,
          uploaded_file_path: uploadedFilePath || null,
          uploaded_file_size: uploadedFileSize || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (dbError) {
        console.error('Database error:', dbError);
        setError(`Failed to update session: ${dbError.message}`);
        return;
      }

      setSuccess("Session updated successfully!");
      
      // Redirect to log page after short delay
      setTimeout(() => {
        router.push('/dashboard/mentoring/log');
      }, 2000);

    } catch (error) {
      console.error('Error updating session:', error);
      setError('Failed to update session');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/mentoring/log")}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Back to Mentoring Log
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Session not found</div>
          <button
            onClick={() => router.push("/dashboard/mentoring/log")}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Back to Mentoring Log
          </button>
        </div>
      </div>
    );
  }

  const credentialOptions = [
    "ACC (Associate Certified Coach)",
    "PCC (Professional Certified Coach)", 
    "MCC (Master Certified Coach)",
    "Other ICF Credential",
    "Non-ICF Certified",
    "Student/Trainee"
  ];

  const deliveryOptions = [
    "individual",
    "group",
    "peer mentoring"
  ];

  const supervisionOptions = [
    "one-on-one",
    "group supervision",
    "peer supervision"
  ];

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/mentoring/log")}
            className="text-emerald-600 hover:text-emerald-800 mb-4 flex items-center gap-2"
          >
            ← Back to Mentoring Log
          </button>
                      <h1 className="text-2xl font-bold text-gray-900">Edit {sessionType === "mentoring" ? "Mentoring" : "Supervision"} Session</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XMarkIcon className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Session Type */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSessionType("mentoring")}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  sessionType === "mentoring"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <AcademicCapIcon className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Mentoring</div>
                <div className="text-sm text-gray-600">Guidance and support sessions</div>
              </button>
              <button
                type="button"
                onClick={() => setSessionType("supervision")}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  sessionType === "supervision"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <UserIcon className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Supervision</div>
                <div className="text-sm text-gray-600">Formal oversight sessions</div>
              </button>
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="inline w-4 h-4 mr-1" />
                  Session Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="inline w-4 h-4 mr-1" />
                  Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="1.5"
                    min="0.1"
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                  <select
                    value={formData.durationUnit}
                    onChange={(e) => handleInputChange('durationUnit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="minutes">minutes</option>
                    <option value="hours">hours</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {sessionType === "mentoring" ? "Mentor" : "Supervisor"} Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="inline w-4 h-4 mr-1" />
                  {sessionType === "mentoring" ? "Mentor" : "Supervisor"} Name
                </label>
                <input
                  type="text"
                  value={formData.providerName}
                  onChange={(e) => handleInputChange('providerName', e.target.value)}
                  placeholder={`Enter ${sessionType === "mentoring" ? "mentor" : "supervisor"} name`}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AcademicCapIcon className="inline w-4 h-4 mr-1" />
                  Credential Level
                </label>
                <select
                  value={formData.credentialLevel}
                  onChange={(e) => handleInputChange('credentialLevel', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select credential level</option>
                  {credentialOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Delivery/Supervision Type */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {sessionType === "mentoring" ? "Delivery Type" : "Supervision Type"}
            </h3>
            <div className="relative">
              <select
                value={sessionType === "mentoring" ? formData.deliveryType : formData.supervisionType}
                onChange={(e) => handleInputChange(
                  sessionType === "mentoring" ? 'deliveryType' : 'supervisionType', 
                  e.target.value
                )}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                required
              >
                {sessionType === "mentoring" ? (
                  <>
                    <option value="">Select delivery type</option>
                    {deliveryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="">Select supervision type</option>
                    {supervisionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Session Content */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Area
                </label>
                <input
                  type="text"
                  value={formData.focusArea}
                  onChange={(e) => handleInputChange('focusArea', e.target.value)}
                  placeholder="e.g., Goal setting, Leadership development, Time management"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Key discussion points, insights, and action items..."
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Supervision-specific: Formal Supervision Toggle */}
          {sessionType === "supervision" && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Mark as Formal Supervision</h3>
                  <p className="text-sm text-gray-600">Toggle off for peer supervision or informal sessions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFormalSupervision}
                    onChange={(e) => handleInputChange('isFormalSupervision', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer transition-colors ${formData.isFormalSupervision ? 'bg-emerald-600' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${formData.isFormalSupervision ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <PaperClipIcon className="inline w-5 h-5 mr-1" />
              Supporting Documentation (Optional)
            </h3>
            
            {/* Show existing file if available */}
            {session.uploaded_file_name && !formData.uploadedFile && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Current file: {session.uploaded_file_name}</span>
                  {session.uploaded_file_path && (
                    <a 
                      href={session.uploaded_file_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                    <span>{formData.uploadedFile ? 'Change file' : 'Upload a file'}</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleInputChange('uploadedFile', file);
                        }
                      }}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG up to 10MB
                </p>
                {formData.uploadedFile && (
                  <p className="text-sm text-emerald-600 font-medium">
                    Selected: {formData.uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/mentoring/log')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? 'Updating...' : 'Update Session'}
            </button>
          </div>
        </form>
    </div>
  );
} 