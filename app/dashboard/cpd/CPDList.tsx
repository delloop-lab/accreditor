"use client";
// Import CPDData type or define a compatible interface
type CPDListItem = {
  id?: string;
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
  supportingDocument: string | File;
  // ICF category fields
  coreCompetency?: boolean;
  resourceDevelopment?: boolean;
  coreCompetencyHours?: number;
  resourceDevelopmentHours?: number;
};

export default function CPDList({ cpd, onDelete, onCardClick }: { 
  cpd: CPDListItem[]; 
  onDelete: (idx: number) => void;
  onCardClick?: (idx: number) => void;
}) {
  if (cpd.length === 0) {
    return <div className="text-gray-500 text-center mt-8">No CPD activities logged yet.</div>;
  }
  return (
    <div className="mt-6 space-y-4">
      {cpd.map((item, idx) => (
        <div 
          key={idx} 
          className={`bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${
            onCardClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
          }`}
          onClick={() => onCardClick && onCardClick(idx)}
        >
          <div className="flex-1">
            <div className="font-semibold">{item.title || 'Untitled'}</div>
            <div className="text-sm text-gray-500">
              {item.activityDate && `${new Date(item.activityDate).toLocaleDateString()}`} 
              {item.hours && ` • ${item.hours} hours`}
            </div>
            {item.providerOrganization && (
              <div className="text-sm text-gray-500">Provider: {item.providerOrganization}</div>
            )}
            {item.cpdType && (
              <div className="text-sm text-gray-500">Type: {item.cpdType}</div>
            )}
            {item.description && <div className="text-sm mt-1">Description: {item.description}</div>}
            
            {/* ICF Category information */}
            {(item.coreCompetency || item.resourceDevelopment) && (
              <div className="flex flex-wrap gap-2 mt-1">
                {item.coreCompetency && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                    Core: {item.coreCompetencyHours}h
                  </span>
                )}
                {item.resourceDevelopment && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                    Resource: {item.resourceDevelopmentHours}h
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when clicking delete
              onDelete(idx);
            }}
            className="text-red-500 hover:underline text-sm self-end md:self-auto"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
} 