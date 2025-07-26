"use client";
import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export default function SupabaseStatus() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  if (isConfigured === null) {
    return null; // Still checking
  }

  if (!isConfigured) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Supabase Not Configured
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                This application requires Supabase to be properly configured. Please set the following environment variables:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li><code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
              </ul>
              <p className="mt-2">
                For local development, create a <code className="bg-red-100 px-1 rounded">.env.local</code> file. 
                For production, add these variables to your deployment platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null; // Supabase is configured, no need to show anything
} 