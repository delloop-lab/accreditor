"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Force dynamic rendering to avoid any build-time Supabase issues
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://icflog.com/auth/reset",
      });

      if (error) {
        if (error.message === "Mock client") {
          setError(
            "Supabase is not configured. Please add your Supabase credentials to the environment variables."
          );
        } else {
          setError(error.message);
        }
      } else {
        setMessage(
          "If an account exists for that email, a password reset link has been sent."
        );
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
          <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
          <p className="text-gray-600 text-sm">
            Enter the email associated with your account and we&apos;ll send you
            a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
            disabled={loading}
          >
            {loading ? "Sending reset link..." : "Send reset link"}
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

