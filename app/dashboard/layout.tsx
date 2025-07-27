"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  HomeIcon,
  UserIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleHomeClick = () => {
    // Navigate to dashboard and refresh data
    console.log('Home icon clicked - navigating to dashboard');
    router.push('/dashboard');
    window.location.reload();
  };

  const handleDashboardClick = () => {
    // Navigate to dashboard and refresh data
    console.log('Dashboard button clicked - navigating to dashboard');
    router.push('/dashboard');
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Error signing out:', error);
      }
      // Always redirect to login page directly instead of going through root
      router.push('/login');
    } catch (error) {
      console.warn('Error during logout:', error);
      // Fallback: redirect to login page
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-72 bg-white border-r shadow-sm p-4">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="mb-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleHomeClick}
            title="Go to dashboard and refresh data"
          >
            <img 
              src="/ifclog.png" 
              alt="IFC Log" 
              className="h-16 w-auto"
            />
          </div>
          <div className="text-xs text-gray-500">IFC Log - ICF Compliance Made Simple</div>
          <div className="text-xs text-gray-400 mt-1">Beta 0.9.450</div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 w-full text-left"
            title="Go to dashboard and refresh data"
          >
            <HomeIcon className="h-5 w-5" /> Dashboard
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <UserIcon className="h-5 w-5" /> Profile
          </Link>
          <Link href="/dashboard/clients" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <UserIcon className="h-5 w-5" /> Clients
          </Link>
          <Link href="/dashboard/sessions" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <UserIcon className="h-5 w-5" /> Log Session
          </Link>
          <Link href="/dashboard/sessions/log" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 ml-4">
            <ClipboardDocumentListIcon className="h-5 w-5" /> Sessions Log
          </Link>
          <Link href="/dashboard/cpd" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <AcademicCapIcon className="h-5 w-5" /> CPD Learning
          </Link>
          <Link href="/dashboard/cpd/log" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 ml-4">
            <ClipboardDocumentListIcon className="h-5 w-5" /> CPD Log
          </Link>
          <Link href="/dashboard/reports" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <ChartBarIcon className="h-5 w-5" /> Reports
          </Link>
        </nav>

        {/* Authentication Buttons */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <Link 
            href="/login"
            className="flex items-center gap-2 p-2 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 w-full text-left"
            title="Sign in to your account"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" /> Sign In
          </Link>
          <Link 
            href="/register"
            className="flex items-center gap-2 p-2 rounded hover:bg-green-50 text-green-600 hover:text-green-700 w-full text-left"
            title="Create a new account"
          >
            <UserIcon className="h-5 w-5" /> Register
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded hover:bg-red-50 text-red-600 hover:text-red-700 w-full text-left"
            title="Sign out and return to login"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>
        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500">
        <p>Copyright (c) 2025 The Novita Group Pty Ltd.</p>
        <p className="mt-1">Note: This app is independently developed and is not associated with the International Coaching Federation (ICF) in any way.</p>
      </footer>
    </div>
  );
} 