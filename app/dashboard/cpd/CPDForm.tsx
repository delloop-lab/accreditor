"use client";
import { useState, useEffect } from "react";
import { AcademicCapIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { updateLastEntryDate, useDatePickerDefault } from "@/lib/dateUtils";

const CPD_TYPES = [
  "Workshop",
  "Course", 
  "Reading",
  "Conference",
  "Webinar",
  "Other",
];

const LEARNING_METHODS = [
  "In-Person",
  "Online",
  "Hybrid",
  "Self-Study",
  "Group Learning",
  "One-on-One",
  "Other",
];

const ICF_COMPETENCIES = [
  "Demonstrates Ethical Practice",
  "Embodies a Coaching Mindset", 
  "Establishes and Maintains Agreements",
  "Cultivates Trust and Safety",
  "Maintains Presence",
  "Listens Actively",
  "Evokes Awareness",
  "Facilitates Client Growth",
];

const DOCUMENT_TYPES = [
  "Certificate",
  "Transcript",
  "Receipt",
  "Attendance Record",
  "Reading Notes",
  "Reflection Journal",
  "Assessment Results",
  "Other",
];

export type CPDData = {
  title: string;
  activityDate: string;
  hours: number;
  cpdType: string;
  learningMethod: string;
  providerOrganization: string;
  description: string;
  keyLearnings: string;
  applicationToPractice: string;
  icfCompetencies: string[];
  documentType: string;
  supportingDocument: File | string; // Can be File object or URL string
  // ICF category fields
  coreCompetency: boolean;
  resourceDevelopment: boolean;
  coreCompetencyHours: number;
  resourceDevelopmentHours: number;
  // ICF CCE Hours
  icfCceHours?: boolean | null; // true = yes, false = no, null/undefined = not set
};

export default function CPDForm({ 
  onSubmit, 
  initialData, 
  isEditing = false 
}: { 
  onSubmit: (data: CPDData) => void;
  initialData?: CPDData;
  isEditing?: boolean;
}) {
  const datePickerProps = useDatePickerDefault();
  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [hours, setHours] = useState("");
  const [cpdType, setCpdType] = useState("");
  const [learningMethod, setLearningMethod] = useState("");
  const [providerOrganization, setProviderOrganization] = useState("");
  const [description, setDescription] = useState("");
  const [keyLearnings, setKeyLearnings] = useState("");
  const [applicationToPractice, setApplicationToPractice] = useState("");
  const [icfCompetencies, setIcfCompetencies] = useState<string[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [supportingDocument, setSupportingDocument] = useState<File | string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // ICF category states
  const [coreCompetency, setCoreCompetency] = useState(true); // Default to Core Competency
  const [resourceDevelopment, setResourceDevelopment] = useState(false);
  const [coreCompetencyHours, setCoreCompetencyHours] = useState("");
  const [resourceDevelopmentHours, setResourceDevelopmentHours] = useState("");
  // ICF CCE Hours state - default to Yes (true)
  const [icfCceHours, setIcfCceHours] = useState<boolean | null>(true); // true = yes (default), false = no


  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setTitle(initialData.title);
      setActivityDate(initialData.activityDate);
      setHours(initialData.hours.toString());
      setCpdType(initialData.cpdType);
      setLearningMethod(initialData.learningMethod);
      setProviderOrganization(initialData.providerOrganization);
      setDescription(initialData.description);
      setKeyLearnings(initialData.keyLearnings);
      setApplicationToPractice(initialData.applicationToPractice);
      setIcfCompetencies(initialData.icfCompetencies);
      setDocumentType(initialData.documentType);
      setSupportingDocument(initialData.supportingDocument);
      
      // ICF category fields
      if (initialData.coreCompetency !== undefined) {
        setCoreCompetency(initialData.coreCompetency);
      }
      if (initialData.resourceDevelopment !== undefined) {
        setResourceDevelopment(initialData.resourceDevelopment);
      }
      if (initialData.coreCompetencyHours !== undefined) {
        setCoreCompetencyHours(initialData.coreCompetencyHours.toString());
      }
      if (initialData.resourceDevelopmentHours !== undefined) {
        setResourceDevelopmentHours(initialData.resourceDevelopmentHours.toString());
      }
      // ICF CCE Hours
      if (initialData.icfCceHours !== undefined && initialData.icfCceHours !== null) {
        setIcfCceHours(initialData.icfCceHours);
      }
    }
  }, [initialData, isEditing]);

  // Update hours distribution when total hours or categories change
  useEffect(() => {
    const totalHours = parseFloat(hours) || 0;
    
    // If only one category is selected, all hours go to that category
    if (coreCompetency && !resourceDevelopment) {
      setCoreCompetencyHours(hours);
      setResourceDevelopmentHours("");
    } else if (!coreCompetency && resourceDevelopment) {
      setCoreCompetencyHours("");
      setResourceDevelopmentHours(hours);
    } 
    // If both categories are selected but no distribution set yet, split hours equally
    else if (coreCompetency && resourceDevelopment) {
      const halfHours = (totalHours / 2).toFixed(1);
      
      // Only auto-split if user hasn't manually set values
      if (!coreCompetencyHours && !resourceDevelopmentHours) {
        setCoreCompetencyHours(halfHours);
        setResourceDevelopmentHours(halfHours);
      }
    }
    // If no categories selected, clear hours
    else {
      setCoreCompetencyHours("");
      setResourceDevelopmentHours("");
    }
  }, [hours, coreCompetency, resourceDevelopment]);
  
  // Validate that split hours don't exceed total hours
  useEffect(() => {
    const totalHours = parseFloat(hours) || 0;
    const coreHours = parseFloat(coreCompetencyHours) || 0;
    const resourceHours = parseFloat(resourceDevelopmentHours) || 0;
    
    // If sum exceeds total, adjust the last changed value
    if (coreHours + resourceHours > totalHours) {
      // Determine which was changed last and adjust it
      // This is a simplification - in a real app you might track which field changed last
      if (coreCompetency && resourceDevelopment) {
        const maxAllowed = Math.max(0, totalHours - resourceHours);
        setCoreCompetencyHours(maxAllowed.toFixed(1));
      }
    }
  }, [hours, coreCompetencyHours, resourceDevelopmentHours]);

  const handleCompetencyChange = (competency: string) => {
    setIcfCompetencies(prev =>
      prev.includes(competency)
        ? prev.filter(c => c !== competency)
        : [...prev, competency]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !activityDate || !hours || !cpdType) return;
    
    // Validate that at least one category is selected
    if (!coreCompetency && !resourceDevelopment) {
      alert("Please select at least one ICF category (Core Competency or Resource Development)");
      return;
    }
    
    // Validate that hours are distributed correctly when both categories are selected
    if (coreCompetency && resourceDevelopment) {
      const totalHours = parseFloat(hours) || 0;
      const coreHours = parseFloat(coreCompetencyHours) || 0;
      const resourceHours = parseFloat(resourceDevelopmentHours) || 0;
      
      // Check if hours add up correctly
      if (Math.abs((coreHours + resourceHours) - totalHours) > 0.01) { // Using small epsilon for float comparison
        alert("The sum of Core Competency and Resource Development hours must equal the total hours");
        return;
      }
    }
    
    // Update the last entry date in localStorage when submitting a new entry
    updateLastEntryDate(activityDate);
    
    onSubmit({
      title,
      activityDate,
      hours: Number(hours),
      cpdType,
      learningMethod,
      providerOrganization,
      description,
      keyLearnings,
      applicationToPractice,
      icfCompetencies,
      documentType,
      supportingDocument,
      // ICF category fields
      coreCompetency,
      resourceDevelopment,
      coreCompetencyHours: coreCompetency ? Number(coreCompetencyHours) || Number(hours) : 0,
      resourceDevelopmentHours: resourceDevelopment ? Number(resourceDevelopmentHours) || Number(hours) : 0,
      // ICF CCE Hours
      icfCceHours,
    });
    
    // Reset form fields
    setTitle("");
    setActivityDate("");
    setHours("");
    setCpdType("");
    setLearningMethod("");
    setProviderOrganization("");
    setDescription("");
    setKeyLearnings("");
    setApplicationToPractice("");
    setIcfCompetencies([]);
    setDocumentType("");
    setSupportingDocument("");
    // Reset ICF category fields
    setCoreCompetency(true);
    setResourceDevelopment(false);
    setCoreCompetencyHours("");
    setResourceDevelopmentHours("");
    // Reset ICF CCE Hours (default to Yes)
    setIcfCceHours(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">{isEditing ? 'Edit CPD Activity' : 'CPD Activity Details'}</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showAdvanced
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showAdvanced ? 'Basic Mode' : 'Advanced Mode'}
        </button>
      </div>
      {/* Activity Details - Basic Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Activity Title *</label>
          <input 
            type="text" 
            className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Enter the title of your learning activity"
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Activity Date *</label>
          <input 
            type="date" 
            className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={activityDate} 
            onChange={e => setActivityDate(e.target.value)}
            onFocus={datePickerProps.onFocus}
            required 
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Total Duration (hrs) *</label>
          <input 
            type="number" 
            min="0.1" 
            step="0.1" 
            className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="e.g. 1.5"
            value={hours} 
            onChange={e => setHours(e.target.value)} 
            required
          />
        </div>
        
        {/* ICF Category Selection */}
        <div>
          <label className="block font-medium mb-2">ICF Category *</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={coreCompetency}
                onChange={e => setCoreCompetency(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Core Competency</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={resourceDevelopment}
                onChange={e => setResourceDevelopment(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Resource Development</span>
            </label>
          </div>
        </div>
        
        {/* Hours Distribution - Show fields based on selected categories */}
        {(coreCompetency || resourceDevelopment) && (
          <>
            {coreCompetency && (
              <div>
                <label className="block font-medium mb-1">Core Competency Hours</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={coreCompetencyHours} 
                  onChange={e => setCoreCompetencyHours(e.target.value)}
                />
              </div>
            )}
            {resourceDevelopment && (
              <div>
                <label className="block font-medium mb-1">Resource Development Hours</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={resourceDevelopmentHours} 
                  onChange={e => setResourceDevelopmentHours(e.target.value)}
                />
                {coreCompetency && resourceDevelopment && (
                  <p className="text-xs text-gray-500 mt-1">Total hours must equal {hours}</p>
                )}
              </div>
            )}
          </>
        )}
        <div>
          <label className="block font-medium mb-1">CPD Type *</label>
          <select 
            className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={cpdType} 
            onChange={e => setCpdType(e.target.value)} 
            required
          >
            <option value="" disabled>Select CPD type</option>
            {CPD_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-2">ICF CCE Hours?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="icfCceHours"
                checked={icfCceHours === true}
                onChange={() => setIcfCceHours(true)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="icfCceHours"
                checked={icfCceHours === false}
                onChange={() => setIcfCceHours(false)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span>No</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Learning Method</label>
          <select 
            className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={learningMethod} 
            onChange={e => setLearningMethod(e.target.value)}
          >
            <option value="" disabled>Select learning method</option>
            {LEARNING_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Provider/Organization</label>
          <input 
            type="text" 
            className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Name of the training provider or organization"
            value={providerOrganization} 
            onChange={e => setProviderOrganization(e.target.value)} 
          />
        </div>
      </div>
      {/* Advanced Section */}
      {showAdvanced && (
        <>
          {/* Activity Details - Text Areas */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-4">Activity Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea 
                  className="w-full border border-gray-400 rounded px-3 py-2 h-24 resize-none bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Describe the learning activity, objectives, and content covered."
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Key Learnings</label>
                <textarea 
                  className="w-full border border-gray-400 rounded px-3 py-2 h-24 resize-none bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="What were your key insights and learnings from this activity?"
                  value={keyLearnings} 
                  onChange={e => setKeyLearnings(e.target.value)} 
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Application to Practice</label>
                <textarea 
                  className="w-full border border-gray-400 rounded px-3 py-2 h-24 resize-none bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="How will you apply these learnings to your coaching practice?"
                  value={applicationToPractice} 
                  onChange={e => setApplicationToPractice(e.target.value)} 
                />
              </div>
            </div>
          </div>
          {/* ICF Competencies */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-4">ICF Competencies Developed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ICF_COMPETENCIES.map(comp => (
                <label key={comp} className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={icfCompetencies.includes(comp)}
                    onChange={() => handleCompetencyChange(comp)}
                  />
                  {comp}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      {/* Supporting Document Upload - Always visible */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-4">Supporting Document</h3>
        {/* Document Type Selection */}
        <div className="mb-4">
          <label className="block font-medium mb-2">Document Type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select document type...</option>
            {DOCUMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="text-center">
          <button
            type="button"
            className="flex items-center gap-2 mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg px-6 py-4 hover:border-purple-400 transition"
            onClick={() => document.getElementById('document-upload')?.click()}
          >
            <ArrowUpTrayIcon className="h-6 w-6 text-gray-400" />
            <span className="text-gray-600">
              {documentType ? `Upload ${documentType}` : "Upload Document"}
            </span>
          </button>
          <input
            id="document-upload"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSupportingDocument(file);
              }
            }}
          />
          <p className="text-sm text-gray-500 mt-2">
            Upload supporting documentation (PDF, JPG, PNG, DOC, DOCX, TXT).
          </p>
          {supportingDocument && (
            <p className="text-sm text-green-600 mt-2">
              ✓ {typeof supportingDocument === 'string' ? supportingDocument : supportingDocument.name}
            </p>
          )}
        </div>
      </div>
      <button 
        type="submit" 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg shadow hover:from-purple-600 hover:to-pink-600 transition font-semibold text-lg flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h-1v5.586l-2.293-2.293z"/>
        </svg>
        {isEditing ? 'Update CPD Learning' : 'Save CPD Learning'}
      </button>
    </form>
  );
} 