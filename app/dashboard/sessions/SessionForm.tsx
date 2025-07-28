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
  duration?: number;
  types: string[];
  numberInGroup?: number;
  paymentType: "paid" | "proBono";
  paymentAmount?: number | null;
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
  const [userCurrency, setUserCurrency] = useState("USD");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [duration, setDuration] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [numberInGroup, setNumberInGroup] = useState("1");
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

  // Currency symbols mapping
  const CURRENCY_SYMBOLS: { [key: string]: string } = {
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "CAD": "C$",
    "AUD": "A$",
    "JPY": "¥",
    "CHF": "CHF",
    "NZD": "NZ$",
    "SEK": "SEK",
    "NOK": "NOK",
    "DKK": "DKK"
  };

  const getCurrencySymbol = (currency: string) => {
    return CURRENCY_SYMBOLS[currency] || currency;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Fetch user profile to get currency preference
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("currency")
          .eq("user_id", user.id)
          .single();

        if (!profileError && profileData?.currency) {
          setUserCurrency(profileData.currency);
        }

        // Fetch clients
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
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setClientId(initialData.clientId);
      setClientName(initialData.clientName);
      setDate(initialData.date);
      setFinishDate(initialData.finishDate);
      setDuration(initialData.duration?.toString() || "");
      setTypes(initialData.types);
      setNumberInGroup(initialData.numberInGroup?.toString() || "1");
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
    console.log('Form submission - clientId:', clientId, 'clientName:', clientName, 'date:', date, 'types:', types);
    
    if (!clientName || !date || types.length === 0) {
      console.error('Form validation failed:', { clientName, date, types });
      return;
    }
    
    const sessionData = {
      clientId,
      clientName,
      date,
      finishDate,
      duration: duration ? Number(duration) : undefined,
      types,
      numberInGroup: numberInGroup ? Number(numberInGroup) : 1,
      paymentType,
      paymentAmount: paymentAmount && paymentAmount.trim() !== '' ? Number(paymentAmount) : null,
      focusArea,
      keyOutcomes,
      clientProgress,
      coachingTools,
      icfCompetencies,
      additionalNotes,
    };
    
    console.log('Submitting session data:', sessionData);
    onSubmit(sessionData);
    setClientId("");
    setClientName("");
    setDate("");
    setFinishDate("");
    setDuration("");
    setTypes([]);
    setNumberInGroup("1");
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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{isEditing ? 'Edit Session' : 'Session Details'}</h2>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showAdvanced
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showAdvanced ? 'Basic Mode' : 'Advanced Mode'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Client *</label>
          {isEditing ? (
            <input
              type="text"
              className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Enter client name"
              required
            />
          ) : (
            <select
              className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          )}
        </div>
        <div>
          <label className="block font-medium mb-1">Session Date *</label>
          <input type="date" className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Finish Date</label>
          <input type="date" className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={finishDate} onChange={e => setFinishDate(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium mb-1">Duration (minutes)</label>
          <input type="number" min="1" className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={duration} onChange={e => setDuration(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium mb-1">Session Type *</label>
          <select className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={types[0] || ""} onChange={e => setTypes([e.target.value])} required>
            <option value="" disabled>Select session type</option>
            {COACHING_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Number in Group</label>
          <input 
            type="number" 
            min="1" 
            className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={numberInGroup} 
            onChange={e => setNumberInGroup(e.target.value)} 
            placeholder="1"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Payment Type</label>
          <select className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={paymentType} onChange={e => setPaymentType(e.target.value as "paid" | "proBono")}> 
            <option value="paid">Paid</option>
            <option value="proBono">Pro Bono</option>
          </select>
        </div>
        {paymentType === "paid" && (
          <div>
            <label className="block font-medium mb-1">Payment Amount ({getCurrencySymbol(userCurrency)})</label>
            <input 
              type="number" 
              min="0" 
              step="0.01" 
              className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={paymentAmount} 
              onChange={e => setPaymentAmount(e.target.value)} 
              placeholder="0.00"
            />
          </div>
        )}
      </div>
      
      {/* Session Content - Only shown in Advanced mode */}
      {showAdvanced && (
        <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 text-sm sm:text-base">Session Content</h3>
          <div className="space-y-3">
            <div>
              <label className="block font-medium mb-1 text-sm">Focus Area</label>
              <input 
                type="text" 
                className="w-full border border-gray-400 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                value={focusArea} 
                onChange={e => setFocusArea(e.target.value)} 
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm">Key Outcomes</label>
              <textarea 
                className="w-full border border-gray-400 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                rows={3}
                value={keyOutcomes} 
                onChange={e => setKeyOutcomes(e.target.value)} 
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm">Client Progress</label>
              <textarea 
                className="w-full border border-gray-400 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                rows={3}
                value={clientProgress} 
                onChange={e => setClientProgress(e.target.value)} 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Coaching Tools & Techniques - Only shown in Advanced mode */}
      {showAdvanced && (
        <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 text-sm sm:text-base">Coaching Tools & Techniques</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              className="flex-1 border border-gray-400 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Add coaching tool or technique"
              value={coachingToolInput}
              onChange={e => setCoachingToolInput(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 transition text-sm whitespace-nowrap"
              onClick={handleAddCoachingTool}
              type="button"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {coachingTools.map(tool => (
              <span key={tool} className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 text-xs sm:text-sm">
                {tool}
                <button type="button" className="ml-1 text-blue-700 hover:text-red-500 text-sm" onClick={() => handleRemoveCoachingTool(tool)}>&times;</button>
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* ICF Core Competencies - Only shown in Advanced mode */}
      {showAdvanced && (
        <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 text-sm sm:text-base">ICF Core Competencies Demonstrated</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {ICF_COMPETENCIES.map(comp => (
              <label key={comp} className="flex items-start gap-2 font-medium text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={icfCompetencies.includes(comp)}
                  onChange={() => handleCompetencyChange(comp)}
                  className="mt-0.5 flex-shrink-0"
                />
                <span className="leading-tight">{comp}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {/* Additional Notes */}
      <div>
        <label className="block font-medium mb-1 text-sm">Additional Notes</label>
        <textarea 
          className="w-full border border-gray-400 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
          rows={3}
          value={additionalNotes} 
          onChange={e => setAdditionalNotes(e.target.value)} 
        />
      </div>
      <button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 sm:py-2 rounded shadow hover:from-blue-600 hover:to-green-600 transition font-semibold text-base sm:text-lg"
      >
        {isEditing ? 'Update Session' : 'Save Session'}
      </button>
    </form>
  );
} 