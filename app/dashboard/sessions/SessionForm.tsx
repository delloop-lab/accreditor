"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const COACHING_TYPES = [
  { label: "Individual", value: "individual" },
  { label: "Team", value: "team" },
  { label: "Mentor", value: "mentor" },
  { label: "Other", value: "other" },
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

type Client = {
  id: string;
  name: string;
  email: string;
};

export type SessionData = {
  clientId: string;
  clientName: string;
  date: string;
  finishDate: string;
  duration: number;
  types: string[];
  paymentType: "paid" | "proBono";
  paymentAmount?: number;
  focusArea: string;
  keyOutcomes: string;
  clientProgress: string;
  coachingTools: string[];
  icfCompetencies: string[];
  additionalNotes: string;
};

export default function SessionForm({ 
  onSubmit, 
  initialData, 
  isEditing = false 
}: { 
  onSubmit: (data: SessionData) => void;
  initialData?: SessionData;
  isEditing?: boolean;
}) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [duration, setDuration] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [paymentType, setPaymentType] = useState<"paid" | "proBono">("paid");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [keyOutcomes, setKeyOutcomes] = useState("");
  const [clientProgress, setClientProgress] = useState("");
  const [coachingToolInput, setCoachingToolInput] = useState("");
  const [coachingTools, setCoachingTools] = useState<string[]>([]);
  const [icfCompetencies, setIcfCompetencies] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("clients")
          .select("id, name, email")
          .eq("user_id", user.id)
          .order("name", { ascending: true });

        if (!error && data) {
          setClients(data);
        } else {
          setClients([]);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
      setLoading(false);
    };

    fetchClients();
  }, [router]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setClientId(initialData.clientId);
      setClientName(initialData.clientName);
      setDate(initialData.date);
      setFinishDate(initialData.finishDate);
      setDuration(initialData.duration.toString());
      setTypes(initialData.types);
      setPaymentType(initialData.paymentType);
      setPaymentAmount(initialData.paymentAmount?.toString() || "");
      setFocusArea(initialData.focusArea);
      setKeyOutcomes(initialData.keyOutcomes);
      setClientProgress(initialData.clientProgress);
      setCoachingTools(initialData.coachingTools);
      setIcfCompetencies(initialData.icfCompetencies);
      setAdditionalNotes(initialData.additionalNotes);
    }
  }, [initialData, isEditing]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClientId = e.target.value;
    setClientId(selectedClientId);
    
    if (selectedClientId === "new") {
      router.push("/dashboard/clients/add");
      return;
    }
    
    const selectedClient = clients.find(client => client.id === selectedClientId);
    setClientName(selectedClient ? selectedClient.name : "");
  };

  const handleTypeChange = (type: string) => {
    setTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleCompetencyChange = (competency: string) => {
    setIcfCompetencies(prev =>
      prev.includes(competency)
        ? prev.filter(c => c !== competency)
        : [...prev, competency]
    );
  };

  const handleAddCoachingTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (coachingToolInput.trim() && !coachingTools.includes(coachingToolInput.trim())) {
      setCoachingTools(prev => [...prev, coachingToolInput.trim()]);
      setCoachingToolInput("");
    }
  };

  const handleRemoveCoachingTool = (tool: string) => {
    setCoachingTools(prev => prev.filter(t => t !== tool));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !date || !duration || types.length === 0) return;
    onSubmit({
      clientId,
      clientName,
      date,
      finishDate,
      duration: Number(duration),
      types,
      paymentType,
      paymentAmount: paymentAmount ? Number(paymentAmount) : undefined,
      focusArea,
      keyOutcomes,
      clientProgress,
      coachingTools,
      icfCompetencies,
      additionalNotes,
    });
    setClientId("");
    setClientName("");
    setDate("");
    setFinishDate("");
    setDuration("");
    setTypes([]);
    setPaymentType("paid");
    setPaymentAmount("");
    setFocusArea("");
    setKeyOutcomes("");
    setClientProgress("");
    setCoachingToolInput("");
    setCoachingTools([]);
    setIcfCompetencies([]);
    setAdditionalNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">{isEditing ? 'Edit Session' : 'Session Details'}</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Client *</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={clientId || ""}
            onChange={handleClientChange}
            required
          >
            <option value="" disabled>Select a client or add a new one</option>
            {loading ? (
              <option value="">Loading clients...</option>
            ) : clients.length === 0 ? (
              <option value="new">No clients found. Add a new client.</option>
            ) : (
              <>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
                <option value="new">Add New Client</option>
              </>
            )}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Session Date *</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Finish Date *</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={finishDate} onChange={e => setFinishDate(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Duration (minutes) *</label>
          <input type="number" min="1" className="w-full border rounded px-3 py-2" value={duration} onChange={e => setDuration(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Session Type *</label>
          <select className="w-full border rounded px-3 py-2" value={types[0] || ""} onChange={e => setTypes([e.target.value])} required>
            <option value="" disabled>Select session type</option>
            {COACHING_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Payment Type</label>
          <select className="w-full border rounded px-3 py-2" value={paymentType} onChange={e => setPaymentType(e.target.value as "paid" | "proBono")}> 
            <option value="paid">Paid</option>
            <option value="proBono">Pro Bono</option>
          </select>
        </div>
        {paymentType === "paid" && (
          <div>
            <label className="block font-medium mb-1">Payment Amount ($)</label>
            <input 
              type="number" 
              min="0" 
              step="0.01" 
              className="w-full border rounded px-3 py-2" 
              value={paymentAmount} 
              onChange={e => setPaymentAmount(e.target.value)} 
              placeholder="0.00"
            />
          </div>
        )}
      </div>
      
      {/* Session Content - Only shown in Advanced mode */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Session Content</h3>
          <div className="mb-2">
            <label className="block font-medium mb-1">Focus Area</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={focusArea} onChange={e => setFocusArea(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block font-medium mb-1">Key Outcomes</label>
            <textarea className="w-full border rounded px-3 py-2" value={keyOutcomes} onChange={e => setKeyOutcomes(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Client Progress</label>
            <textarea className="w-full border rounded px-3 py-2" value={clientProgress} onChange={e => setClientProgress(e.target.value)} />
          </div>
        </div>
      )}
      
      {/* Coaching Tools & Techniques - Only shown in Advanced mode */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Coaching Tools & Techniques</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2"
              placeholder="Add coaching tool or technique"
              value={coachingToolInput}
              onChange={e => setCoachingToolInput(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              onClick={handleAddCoachingTool}
              type="button"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {coachingTools.map(tool => (
              <span key={tool} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
                {tool}
                <button type="button" className="ml-1 text-blue-700 hover:text-red-500" onClick={() => handleRemoveCoachingTool(tool)}>&times;</button>
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* ICF Core Competencies - Only shown in Advanced mode */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">ICF Core Competencies Demonstrated</h3>
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
      )}
      {/* Additional Notes */}
      <div>
        <label className="block font-medium mb-1">Additional Notes</label>
        <textarea className="w-full border rounded px-3 py-2" value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} />
      </div>
      <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-2 rounded shadow hover:from-blue-600 hover:to-green-600 transition font-semibold text-lg">{isEditing ? 'Update Session' : 'Save Session'}</button>
    </form>
  );
} 