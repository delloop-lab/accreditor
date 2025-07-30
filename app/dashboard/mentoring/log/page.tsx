"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

interface MentoringSession {
  id: string;
  session_type: 'mentoring' | 'supervision';
  session_date: string;
  duration: number;
  provider_name: string;
  credential_level: string;
  delivery_type?: string;
  supervision_type?: string;
  focus_area: string;
  session_notes?: string;
  is_formal_supervision?: boolean;
  uploaded_file_name?: string;
  uploaded_file_path?: string;
  created_at: string;
}

function MentoringLogContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mentoring" | "supervision">("all");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("mentoring_supervision")
        .select("*")
        .eq("user_id", user.id)
        .order("session_date", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
        setError("Failed to load sessions");
      } else {
        setSessions(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while loading sessions");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const { error } = await supabase
        .from("mentoring_supervision")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting session:", error);
        setError("Failed to delete session");
      } else {
        setSessions(sessions.filter(session => session.id !== id));
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while deleting the session");
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.focus_area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || session.session_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mentoring & Supervision Log
            </h1>
            <p className="text-gray-600">
              View and manage your mentoring and supervision sessions
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/mentoring')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Session
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Sessions
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by provider name or focus area..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | "mentoring" | "supervision")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Sessions</option>
              <option value="mentoring">Mentoring Only</option>
              <option value="supervision">Supervision Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterType !== "all" ? "No matching sessions found" : "No sessions yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterType !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Start by adding your first mentoring or supervision session"
            }
          </p>
          {(!searchTerm && filterType === "all") && (
            <button
              onClick={() => router.push('/dashboard/mentoring')}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Add Your First Session
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.session_type === 'mentoring' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {session.session_type === 'mentoring' ? 'Mentoring' : 'Supervision'}
                    </span>
                    {session.session_type === 'supervision' && session.is_formal_supervision && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Formal
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(session.session_date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      {formatDuration(session.duration)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      {session.provider_name}
                      {session.credential_level && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {session.credential_level}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900 mb-1">Focus Area</h3>
                    <p className="text-sm text-gray-600">{session.focus_area}</p>
                  </div>

                  {session.session_notes && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{session.session_notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {session.session_type === 'mentoring' 
                        ? session.delivery_type 
                        : session.supervision_type
                      }
                    </span>
                    {session.uploaded_file_name && (
                      <span className="flex items-center gap-1">
                        <DocumentTextIcon className="h-3 w-3" />
                        File attached
                      </span>
                    )}
                    <span>Added {formatDate(session.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => router.push(`/dashboard/mentoring/edit/${session.id}`)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit session"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete session"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {sessions.length > 0 && (
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {sessions.length}
              </div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sessions.filter(s => s.session_type === 'mentoring').length}
              </div>
              <div className="text-sm text-gray-600">Mentoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sessions.filter(s => s.session_type === 'supervision').length}
              </div>
              <div className="text-sm text-gray-600">Supervision</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatDuration(sessions.reduce((total, session) => total + session.duration, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Duration</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MentoringLogPage() {
  return <MentoringLogContent />;
} 