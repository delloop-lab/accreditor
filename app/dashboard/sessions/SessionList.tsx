"use client";
import { SessionData } from "./SessionForm";

export default function SessionList({ sessions, onDelete, onCardClick }: { sessions: SessionData[]; onDelete: (idx: number) => void; onCardClick?: (idx: number) => void }) {
  if (sessions.length === 0) {
    return <div className="text-gray-500 text-center mt-8">No sessions logged yet.</div>;
  }
  return (
    <div className="mt-6 space-y-4">
      {sessions.map((session, idx) => (
        <div
          key={idx}
          className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:shadow-lg transition"
          onClick={() => onCardClick && onCardClick(idx)}
        >
          <div>
            <div className="font-semibold text-blue-700">{session.clientName}</div>
            <div className="text-sm text-gray-500">{session.date} &bull; {session.duration} min</div>
            <div className="text-sm text-gray-500">Type: {session.types.join(", ")}</div>
            <div className="text-sm text-gray-500">Payment: {session.paymentType === "paid" ? "Paid" : "Pro Bono"}</div>
            {session.notes && <div className="text-sm mt-1">Notes: {session.notes}</div>}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(idx); }}
            className="text-red-500 hover:underline text-sm self-end md:self-auto"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
} 