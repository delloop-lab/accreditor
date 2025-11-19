"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const COACHING_HOURS_REQUIRED = 100; // Example ICF requirement
const CPD_HOURS_REQUIRED = 40; // Example ICF requirement

export default function ProgressSummary() {
  const [coachingHours, setCoachingHours] = useState(0);
  const [cpdHours, setCpdHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTotals = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Sessions
      const { data: sessions } = await supabase
        .from("sessions")
        .select("duration")
        .eq("user_id", user.id);
      const coachingTotal = sessions
        ? sessions.reduce((sum: number, s: any) => sum + ((s.duration || 0) / 60), 0)
        : 0;
      setCoachingHours(coachingTotal);
      // CPD (exclude non-ICF CCE hours)
      const { data: cpd } = await supabase
        .from("cpd")
        .select("hours, icf_cce_hours")
        .eq("user_id", user.id);
      const cpdTotal = cpd ? cpd.reduce((sum: number, c: any) => {
        // Only count hours if icf_cce_hours is true or null/undefined (default to true)
        const isIcfCceHours = c.icf_cce_hours !== false;
        return sum + (isIcfCceHours ? (Number(c.hours) || 0) : 0);
      }, 0) : 0;
      setCpdHours(cpdTotal);
      setLoading(false);
    };
    fetchTotals();
  }, []);

  if (loading) return <div>Loading progress...</div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium">Coaching Hours</span>
          <span>{coachingHours} / {COACHING_HOURS_REQUIRED}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all"
            style={{ width: `${Math.min(100, (coachingHours / COACHING_HOURS_REQUIRED) * 100)}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium">CPD Hours</span>
          <span>{cpdHours} / {CPD_HOURS_REQUIRED}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full transition-all"
            style={{ width: `${Math.min(100, (cpdHours / CPD_HOURS_REQUIRED) * 100)}%` }}
          />
        </div>
      </div>
      <div className="text-sm text-gray-500 mt-4">
        ICF requirements: {COACHING_HOURS_REQUIRED} coaching hours, {CPD_HOURS_REQUIRED} CPD hours for renewal.
      </div>
    </div>
  );
} 