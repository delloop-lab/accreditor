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
        console.error('Error signing out:', error);
      } else {
        // Redirect to the root page which will then redirect to login
        router.push('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: redirect to root page
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r shadow-sm p-4">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="rounded-full bg-blue-100 p-3 mb-2 cursor-pointer hover:bg-blue-200 transition-colors"
            onClick={handleHomeClick}
            title="Go to dashboard and refresh data"
          >
            <HomeIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div className="font-bold text-lg">My Coaching Log</div>
          <div className="text-xs text-gray-500">ICF Compliance Made Simple</div>
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
        {/* Quick Stats */}
        <div className="mt-8">
          <div className="text-xs font-semibold text-gray-500 mb-2">QUICK STATS</div>
          <div className="mb-2 p-2 bg-blue-50 rounded flex flex-col">
            <span className="text-xs text-blue-700">This Month</span>
            <span className="font-bold text-lg">0</span>
            <span className="text-xs text-gray-500">coaching hours</span>
          </div>
          <div className="p-2 bg-purple-50 rounded flex flex-col">
            <span className="text-xs text-purple-700">CPD Progress</span>
            <span className="font-bold text-lg">0h</span>
            <span className="text-xs text-gray-500">of 40h required</span>
          </div>
        </div>
        {/* Logout Button */}
        <div className="mt-4 pt-4 border-t">
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
  );
} 