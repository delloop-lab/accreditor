"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { UserIcon, PlusIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        const { data, error } = await supabase
          .from("clients")
          .select("*")
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Clients</h1>
        </div>
        <button
          onClick={() => router.push('/dashboard/clients/add')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first client.</p>
          <button
            onClick={() => router.push('/dashboard/clients/add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-lg p-6 border hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{client.name}</h3>
                  <div className="space-y-1">
                    {profile && profile.name && profile.name.trim() !== '' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4" />
                        <a 
                          href={`mailto:${client.email}`}
                          className="hover:text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {client.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 line-clamp-2">{client.notes}</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Added {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 