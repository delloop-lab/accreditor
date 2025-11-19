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
  documentType: string;
  supportingDocument: string;
  certificateProof?: string; // Keep for backward compatibility
  user_id: string;
  // ICF category fields
  coreCompetency: boolean;
  resourceDevelopment: boolean;
  coreCompetencyHours: number;
  resourceDevelopmentHours: number;
  // ICF CCE Hours
  icfCceHours?: boolean | null;
};

function CPDLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cpdEntries, setCpdEntries] = useState<CPDEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getSortedCPDEntries = () => {
    return [...cpdEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
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
            documentType: item.document_type || "",
            supportingDocument: item.supporting_document || "",
            certificateProof: item.certificate_proof || "", // Keep for backward compatibility
            user_id: item.user_id || "",
            // ICF category fields
            coreCompetency: item.core_competency || false,
            resourceDevelopment: item.resource_development || false,
            coreCompetencyHours: item.core_competency_hours || 0,
            resourceDevelopmentHours: item.resource_development_hours || 0,
            // ICF CCE Hours
            icfCceHours: item.icf_cce_hours !== null && item.icf_cce_hours !== undefined ? item.icf_cce_hours : true,
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-6 w-6 text-purple-600" />
          <h1 className="text-xl sm:text-2xl font-bold">CPD Log</h1>
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
          

          <button
            onClick={() => exportCPDToXLSX(cpdEntries, `cpd-data-${new Date().toISOString().split('T')[0]}`)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>
      
      {cpdEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No CPD activities logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {getSortedCPDEntries().map((entry, index) => {
            const isHighlighted = highlightedId && (
              entry.id === highlightedId || 
              `cpd-${index}` === highlightedId
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">{entry.title}</h2>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Date */}
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          
                          {/* Hours */}
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {entry.hours}h
                          </span>
                          
                          {/* Provider */}
                          {entry.providerOrganization && (
                            <span className="flex items-center gap-1">
                              <BuildingOfficeIcon className="h-4 w-4" />
                              {entry.providerOrganization}
                            </span>
                          )}
                        </div>
                        
                        {/* Type Badge */}
                        {entry.cpdType && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold self-start">
                            {entry.cpdType}
                          </span>
                        )}
                        
                        {/* ICF Category Badges */}
                        <div className="flex flex-wrap gap-1">
                          {entry.coreCompetency && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                              Core: {entry.coreCompetencyHours}h
                            </span>
                          )}
                          {entry.resourceDevelopment && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                              Resource: {entry.resourceDevelopmentHours}h
                            </span>
                          )}
                          {/* Non ICF CCE Hours Badge */}
                          {entry.icfCceHours === false && (
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-semibold">
                              Non ICF CCE Hours
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Description Preview */}
                      {entry.description && !isExpanded && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Document Link */}
                      {(entry.supportingDocument || entry.certificateProof) && (
                        <a 
                          href={entry.supportingDocument || entry.certificateProof} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DocumentIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">{entry.documentType || "Document"}</span>
                          <span className="sm:hidden">Doc</span>
                        </a>
                      )}
                      
                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/cpd/edit/${entry.id}`);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit CPD"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      {/* Expand/Collapse Indicator */}
                      <div className="text-gray-400 p-1">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details - Only visible when expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="pt-4 space-y-5">
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

                      {/* ICF Categories */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                          ICF Categories
                        </h3>
                        <div className="flex flex-wrap gap-3 bg-white p-3 rounded border">
                          {(entry.coreCompetency || entry.resourceDevelopment) ? (
                            <>
                              {entry.coreCompetency && (
                                <div className="flex items-center gap-2">
                                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                    Core Competency: {entry.coreCompetencyHours}h
                                  </span>
                                </div>
                              )}
                              {entry.resourceDevelopment && (
                                <div className="flex items-center gap-2">
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                    Resource Development: {entry.resourceDevelopmentHours}h
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-500 text-sm">No ICF categories specified</span>
                          )}
                        </div>
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
                              <span key={idx} className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
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