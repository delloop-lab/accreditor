"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { updateLastEntryDate, useDatePickerDefault } from "@/lib/dateUtils";
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

export default function MentoringSupportForm() {
  const router = useRouter();
  const [sessionType, setSessionType] = useState("mentoring");
  const datePickerProps = useDatePickerDefault();
  
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    // Update the last entry date in localStorage when submitting a new entry
    updateLastEntryDate(formData.date);

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
      let uploadedFileName = "";
      let uploadedFilePath = "";
      let uploadedFileSize = 0;

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
            setError(`Storage bucket error: ${bucketError.message}`);
            return;
          } else {
            
            // Upload to certificates bucket
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('certificates')
              .upload(fileName, formData.uploadedFile, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
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
            }
          }
        } catch (error) {
          setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }

      // Save to database
      const { error: dbError } = await supabase
        .from("mentoring_supervision")
        .insert({
          user_id: user.id,
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
          uploaded_file_size: uploadedFileSize || null
        });

      if (dbError) {
        setError(`Failed to save session: ${dbError.message}`);
        return;
      }

      setSuccess("Session saved successfully!");
      
      // Reset form
      setFormData({
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
        uploadedFile: null
      });

      // Redirect to log page after short delay
      setTimeout(() => {
        router.push('/dashboard/mentoring/log');
      }, 2000);

    } catch (error) {
      setError(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const focusAreaSuggestions = [
    "Active Listening",
    "Direct Communication", 
    "Creating Awareness",
    "Designing Actions",
    "Managing Progress and Accountability",
    "Establishing and Maintaining Agreements",
    "Cultivating Trust and Safety",
    "Maintaining Presence",
    "Client boundaries",
    "Ethical dilemma",
    "Emotional reaction to client"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Mentoring/Supervision Session
        </h1>
        <p className="text-gray-600">
          {sessionType === "mentoring" 
            ? "Log your mentoring session details and reflections"
            : "Record your supervision session and key insights"
          }
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Session Type Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Session Type
          </label>
          <div className="relative">
            <select 
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="mentoring">Mentoring Session</option>
              <option value="supervision">Supervision Session</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date and Duration */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-1" />
                Date of {sessionType === "mentoring" ? "Session" : "Supervision"}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                onFocus={datePickerProps.onFocus}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="inline w-4 h-4 mr-1" />
                Duration
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="60"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
                <select
                  value={formData.durationUnit}
                  onChange={(e) => handleInputChange('durationUnit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
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
                {sessionType === "mentoring" ? "ICF Credential Level" : "Supervisor Credentials"} 
                {sessionType === "supervision" && <span className="text-gray-500"> (optional)</span>}
              </label>
              <select
                value={formData.credentialLevel}
                onChange={(e) => handleInputChange('credentialLevel', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                required={sessionType === "mentoring"}
              >
                <option value="">Select credential level</option>
                <option value="ACC">ACC (Associate Certified Coach)</option>
                <option value="PCC">PCC (Professional Certified Coach)</option>
                <option value="MCC">MCC (Master Certified Coach)</option>
                <option value="Unknown">Unknown</option>
                {sessionType === "supervision" && (
                  <option value="Other">Other Professional Credential</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Session Format */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Format</h3>
          
          {sessionType === "mentoring" ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Session Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="individual"
                    checked={formData.deliveryType === "individual"}
                    onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">â­˜ Individual (1:1)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="group"
                    checked={formData.deliveryType === "group"}
                    onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">â­˜ Group</span>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type of Supervision</label>
              <select
                value={formData.supervisionType}
                onChange={(e) => handleInputChange('supervisionType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="one-on-one">â­˜ 1:1 Supervision</option>
                <option value="group">â­˜ Group Supervision</option>
                <option value="peer">â­˜ Peer Supervision</option>
              </select>
            </div>
          )}
        </div>

        {/* Focus Area */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {sessionType === "mentoring" ? "Focus or Competency Area Covered" : "Focus or Topic Discussed"}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {sessionType === "mentoring" 
                ? "Primary competency or skill area focused on during the session"
                : "Main topic or issue discussed (e.g., client boundaries, ethical dilemma, emotional reactions)"
              }
            </label>
            <input
              type="text"
              value={formData.focusArea}
              onChange={(e) => handleInputChange('focusArea', e.target.value)}
              placeholder={sessionType === "mentoring" 
                ? "e.g., Active Listening, Direct Communication, Creating Awareness"
                : "e.g., Client boundaries issue, Ethical dilemma, Emotional reaction to client story"
              }
              list="focus-suggestions"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <datalist id="focus-suggestions">
              {focusAreaSuggestions.map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Notes/Reflections */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {sessionType === "mentoring" ? "Session Notes / Reflections" : "Reflection or Insights"}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="inline w-4 h-4 mr-1" />
              {sessionType === "mentoring" 
                ? "Key takeaways, insights, or action items from the session (optional)"
                : "Your reflections and insights from the supervision session (can be private)"
              }
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              placeholder={sessionType === "mentoring"
                ? "Describe what you learned, practiced, or plan to implement..."
                : "What insights did you gain? How will this impact your coaching practice?"
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 resize-vertical"
            />
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
            {sessionType === "mentoring" 
              ? "Upload Supporting Document (optional)"
              : "Upload Supporting Notes or Documents (optional)"
            }
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
            <input
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleInputChange('uploadedFile', e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <span className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                  Click to upload
                </span>
                <span className="text-sm text-gray-500"> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOCX, JPG up to 10MB
              </p>
            </label>
            {formData.uploadedFile && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {formData.uploadedFile.name}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white rounded-lg shadow transition font-semibold text-lg flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
            }`}
          >
            {loading ? (
              <>
                <div className="inline w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="inline w-5 h-5" />
                Save Session
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/mentoring/log')}
            className="w-full px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors flex items-center justify-center gap-2"
          >
            <XMarkIcon className="inline w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 
