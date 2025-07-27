"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { testSupabaseConnection, testAuthSettings } from "@/lib/supabaseTest";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(0);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) return;
    
    // Rate limiting - prevent submissions within 30 seconds
    const now = Date.now();
    if (now - lastAttempt < 30000) {
      const remainingSeconds = Math.ceil((30000 - (now - lastAttempt)) / 1000);
      setError(`Please wait ${remainingSeconds} seconds before trying again.`);
      return;
    }
    
    setLastAttempt(now);
    setLoading(true);
    setError("");
    
    // Basic validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    
    try {
      // Try registration without email redirect first
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password
      });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          setError('Too many registration attempts. Please wait a few minutes before trying again.');
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          // Try alternative registration method
          setError('Registration failed. This might be due to email confirmation settings. Please check your Supabase dashboard and disable email confirmation temporarily.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link to complete registration.');
        } else if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else {
          setError(error.message);
        }
      } else if (data.user && !data.session) {
        // Email confirmation required
        setError('Please check your email and click the confirmation link to complete registration.');
      } else if (data.session) {
        // Auto sign-in successful
        router.push("/dashboard");
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagnosticInfo("Running diagnostics...");
    
    const connectionTest = await testSupabaseConnection();
    const authTest = await testAuthSettings();
    
    let diagnostic = "=== Supabase Diagnostics ===\n\n";
    diagnostic += `Connection Test: ${connectionTest.success ? '✅ PASS' : '❌ FAIL'}\n`;
    if (!connectionTest.success) {
      diagnostic += `Error: ${connectionTest.error}\n`;
      diagnostic += `Details: ${connectionTest.details}\n\n`;
    }
    
    diagnostic += `Auth Test: ${authTest.success ? '✅ PASS' : '❌ FAIL'}\n`;
    if (!authTest.success) {
      diagnostic += `Error: ${authTest.error}\n`;
      diagnostic += `Details: ${authTest.details}\n\n`;
    }
    
    diagnostic += "=== Common Solutions ===\n";
    diagnostic += "1. Check your .env.local file has correct Supabase credentials\n";
    diagnostic += "2. Ensure your Supabase project is active\n";
    diagnostic += "3. Check if email confirmation is enabled in Supabase Auth settings\n";
    diagnostic += "4. Verify the 'profiles' table exists in your database\n";
    diagnostic += "5. Check Row Level Security (RLS) policies\n";
    
    setDiagnosticInfo(diagnostic);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow w-full max-w-sm space-y-6">
        <div className="text-center">
          <img 
            src="/ifclog.png" 
            alt="ICFlog" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-4">Register</h1>
        </div>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-2 py-2 border rounded focus:outline-none focus:ring"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="text-center text-sm mt-2">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </p>
        
        {/* Demo mode hint */}
        {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <p className="font-medium mb-1">Demo Mode</p>
            <p>Since Supabase isn't configured, registration may not work. Please set up your environment variables.</p>
          </div>
        )}
        
        {/* Diagnostic button */}
        <button
          type="button"
          onClick={runDiagnostics}
          className="w-full mt-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition text-sm"
        >
          Run Supabase Diagnostics
        </button>
        
        {/* Diagnostic results */}
        {diagnosticInfo && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs">
            <pre className="whitespace-pre-wrap text-gray-800">{diagnosticInfo}</pre>
          </div>
        )}
      </form>
    </div>
  );
} 