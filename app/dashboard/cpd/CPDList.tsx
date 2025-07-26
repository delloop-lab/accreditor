"use client";
import { CPDData } from "./CPDForm";

export default function CPDList({ cpd, onDelete }: { cpd: CPDData[]; onDelete: (idx: number) => void }) {
  if (cpd.length === 0) {
    return <div className="text-gray-500 text-center mt-8">No CPD activities logged yet.</div>;
  }
  return (
    <div className="mt-6 space-y-4">
      {cpd.map((item, idx) => (
        <div key={idx} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="font-semibold">{item.title}</div>
            <div className="text-sm text-gray-500">{item.activityDate} &bull; {item.hours} hours</div>
            <div className="text-sm text-gray-500">Provider: {item.providerOrganization}</div>
            <div className="text-sm text-gray-500">Type: {item.cpdType}</div>
            {item.description && <div className="text-sm mt-1">Description: {item.description}</div>}
          </div>
          <button
            onClick={() => onDelete(idx)}
            className="text-red-500 hover:underline text-sm self-end md:self-auto"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
} 