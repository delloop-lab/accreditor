"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Force dynamic rendering to avoid any build-time Supabase issues
export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Verify session is detected from URL on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Wait a moment for Supabase to process the URL hash
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError("Unable to verify reset link. Please request a new password reset email.");
          return;
        }
        
        if (!session) {
          setError("No valid session found. Please click the reset link from your email again.");
          return;
        }
        
        setSessionReady(true);
      } catch (err) {
        setError("An error occurred while verifying your reset link. Please try again.");
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!sessionReady) {
      setError("Please wait while we verify your reset link...");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        if (error.message === "Mock client") {
          setError(
            "Supabase is not configured. Please add your Supabase credentials to the environment variables."
          );
        } else {
          setError(
            error.message ||
              "Unable to update password. Your reset link may have expired. Please request a new reset email."
          );
        }
      } else {
        setMessage("Your password has been updated successfully.");
        // After a short delay, redirect to login
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-6">
        <div className="text-center">
          <img
            src="/icfLOGO4.png"
            alt="ICF Log"
            className="h-16 w-auto mx-auto mb-2.5"
          />
          <h1 className="text-2xl font-bold mb-2">Choose a new password</h1>
          <p className="text-gray-600 text-sm">
            Enter a strong new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter a new password"
              className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !sessionReady}
          >
            {loading ? "Updating password..." : !sessionReady ? "Verifying reset link..." : "Update password"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}

