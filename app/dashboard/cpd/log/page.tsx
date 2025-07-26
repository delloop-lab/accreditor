"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AcademicCapIcon, CalendarIcon, ClockIcon, DocumentIcon, CheckCircleIcon, BuildingOfficeIcon, BookOpenIcon, ArrowDownTrayIcon, PencilIcon } from "@heroicons/react/24/outline";
import { exportCPDToCSV, exportCPDToXLSX, testExport } from "@/lib/exportUtils";

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
  documentType?: string;
  supportingDocument?: string;
  certificateProof?: string; // Keep for backward compatibility
  user_id: string;
};

function CPDLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cpdEntries, setCpdEntries] = useState<CPDEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const highlightedRef = useRef<HTMLDivElement>(null);

  const toggleCard = (cpdId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cpdId)) {
        newSet.delete(cpdId);
      } else {
        newSet.add(cpdId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    console.log('CPD Log - Highlight ID from URL:', highlightId);
    if (highlightId) {
      setHighlightedId(highlightId);
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('CPD Log - Highlighted ID state:', highlightedId);
    console.log('CPD Log - CPD entries:', cpdEntries.map(e => ({ id: e.id, title: e.title })));
    if (highlightedId && highlightedRef.current) {
      // Scroll to the highlighted element with a slight delay to ensure rendering
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500);
    }
  }, [highlightedId, cpdEntries]);

  useEffect(() => {
    const fetchCPD = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from("cpd")
          .select("*")
          .eq("user_id", user.id)
          .order("activity_date", { ascending: false });
        
        if (!error && data) {
          // Map snake_case to camelCase with null checks
          const mapped = data.map((item: any) => ({
            id: item.id || "",
            title: item.title || "",
            date: item.activity_date || "",
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
          setCpdEntries(mapped);
        } else {
          setCpdEntries([]);
        }
      } catch (error) {
        console.error('Error fetching CPD:', error);
        setCpdEntries([]);
      }
      setLoading(false);
    };
    fetchCPD();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading CPD entries...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">CPD Log</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => testExport()}
            className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Test Export
          </button>
          <button
            onClick={() => exportCPDToCSV(cpdEntries, `cpd-data-${new Date().toISOString().split('T')[0]}`)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportCPDToXLSX(cpdEntries, `cpd-data-${new Date().toISOString().split('T')[0]}`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>
      
      {cpdEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No CPD activities logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cpdEntries.map((entry) => {
            const isHighlighted = highlightedId && (
              entry.id === highlightedId || 
              `cpd-${cpdEntries.indexOf(entry)}` === highlightedId
            );
            const isExpanded = expandedCards.has(entry.id);
            
            return (
              <div 
                key={entry.id} 
                ref={isHighlighted ? highlightedRef : null}
                className={`bg-white rounded-xl shadow-lg border transition-all duration-300 cursor-pointer hover:shadow-xl ${
                  isHighlighted 
                    ? 'ring-4 ring-purple-500 ring-opacity-50 bg-purple-50' 
                    : ''
                }`}
                onClick={() => toggleCard(entry.id)}
              >
                {/* Compact Header - Always Visible */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">{entry.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {entry.hours}h
                        </span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                          {entry.cpdType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600">
                        {entry.providerOrganization}
                      </div>
                      {(entry.supportingDocument || entry.certificateProof) && (
                        <a 
                          href={entry.supportingDocument || entry.certificateProof} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DocumentIcon className="h-4 w-4" />
                          {entry.documentType || "Document"}
                        </a>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/cpd/edit/${entry.id}`);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit CPD"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <div className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details - Only visible when expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="pt-4 space-y-4">
                      {/* Learning Method */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                          Learning Method
                        </h3>
                        {entry.learningMethod ? (
                          <p className="text-gray-700 bg-white p-3 rounded border">{entry.learningMethod}</p>
                        ) : (
                          <p className="text-gray-500 text-sm">No learning method specified</p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                          Description
                        </h3>
                        {entry.description ? (
                          <p className="text-gray-700 bg-white p-3 rounded border">{entry.description}</p>
                        ) : (
                          <p className="text-gray-500 text-sm">No description provided</p>
                        )}
                      </div>

                      {/* Key Learnings */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                          Key Learnings
                        </h3>
                        {entry.keyLearnings ? (
                          <p className="text-gray-700 bg-white p-3 rounded border whitespace-pre-wrap">{entry.keyLearnings}</p>
                        ) : (
                          <p className="text-gray-500 text-sm">No key learnings specified</p>
                        )}
                      </div>

                      {/* Application to Practice */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                          Application to Practice
                        </h3>
                        {entry.applicationToPractice ? (
                          <p className="text-gray-700 bg-white p-3 rounded border whitespace-pre-wrap">{entry.applicationToPractice}</p>
                        ) : (
                          <p className="text-gray-500 text-sm">No application to practice specified</p>
                        )}
                      </div>

                      {/* ICF Competencies */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                          ICF Competencies
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {entry.icfCompetencies.length > 0 ? (
                            entry.icfCompetencies.map((competency, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                                {competency}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">No ICF competencies specified</span>
                          )}
                        </div>
                      </div>

                      {/* Certificate Proof */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                          Certificate Proof
                        </h3>
                        {entry.certificateProof ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={entry.certificateProof} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                            >
                              <DocumentIcon className="h-4 w-4" />
                              View Certificate
                            </a>
                            <span className="text-green-600 text-sm">✓ Certificate uploaded</span>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No certificate uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CPDLogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CPD log...</p>
        </div>
      </div>
    }>
      <CPDLogContent />
    </Suspense>
  );
} 