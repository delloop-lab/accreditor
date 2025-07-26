"use client";
import { useState, useEffect } from "react";
import { AcademicCapIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

const CPD_TYPES = [
  "Workshop",
  "Course", 
  "Supervision",
  "Reading",
  "Conference",
  "Webinar",
  "Mentoring",
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
  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [hours, setHours] = useState("2.5");
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
    }
  }, [initialData, isEditing]);

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
    });
    setTitle("");
    setActivityDate("");
    setHours("2.5");
    setCpdType("");
    setLearningMethod("");
    setProviderOrganization("");
    setDescription("");
    setKeyLearnings("");
    setApplicationToPractice("");
    setIcfCompetencies([]);
    setDocumentType("");
    setSupportingDocument("");
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
            className="w-full border rounded px-3 py-2" 
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
            className="w-full border rounded px-3 py-2" 
            value={activityDate} 
            onChange={e => setActivityDate(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Duration (hours) *</label>
          <input 
            type="number" 
            min="0.1" 
            step="0.1" 
            className="w-full border rounded px-3 py-2" 
            value={hours} 
            onChange={e => setHours(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label className="block font-medium mb-1">CPD Type *</label>
          <select 
            className="w-full border rounded px-3 py-2" 
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
          <label className="block font-medium mb-1">Learning Method</label>
          <select 
            className="w-full border rounded px-3 py-2" 
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
            className="w-full border rounded px-3 py-2" 
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
                  className="w-full border rounded px-3 py-2 h-24 resize-none" 
                  placeholder="Describe the learning activity, objectives, and content covered."
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Key Learnings</label>
                <textarea 
                  className="w-full border rounded px-3 py-2 h-24 resize-none" 
                  placeholder="What were your key insights and learnings from this activity?"
                  value={keyLearnings} 
                  onChange={e => setKeyLearnings(e.target.value)} 
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Application to Practice</label>
                <textarea 
                  className="w-full border rounded px-3 py-2 h-24 resize-none" 
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
            className="w-full border rounded px-3 py-2"
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