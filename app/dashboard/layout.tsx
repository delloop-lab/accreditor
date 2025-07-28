"use client";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  HomeIcon,
  UserIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ViewColumnsIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleHomeClick = () => {
    // Navigate to landing page
    console.log('Logo clicked - navigating to landing page');
    router.push('/landing');
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b shadow-sm p-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleHomeClick}
          title="Go to landing page"
        >
          <img 
            src="/icflog.png" 
            alt="ICF Log" 
            className="h-8 w-auto"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">ICF Log</div>
                                  <div className="text-xs text-gray-500">Beta 0.9.480</div>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-72 bg-white border-r shadow-sm p-4">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="mb-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleHomeClick}
            title="Go to landing page"
          >
            <img 
              src="/icflog.png" 
              alt="ICF Log" 
              className="h-16 w-auto"
            />
          </div>
          <div className="text-xs text-gray-500">ICF Log</div>
          <div className="text-xs text-gray-500">ICF Compliance Made Simple</div>
                        <div className="text-xs text-gray-400 mt-1">Beta 0.9.480</div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <Link 
            href="/landing"
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 w-full text-left"
            title="Go to landing page"
          >
            <HomeIcon className="h-5 w-5 text-green-600" /> Home
          </Link>
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 w-full text-left"
            title="Go to dashboard and refresh data"
          >
            <ChartBarIcon className="h-5 w-5 text-blue-600" /> Dashboard
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <UserIcon className="h-5 w-5 text-purple-600" /> Profile
          </Link>
          <Link href="/dashboard/clients" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <UserGroupIcon className="h-5 w-5 text-orange-600" /> Clients
          </Link>
          
          {/* Sessions Section */}
          <Link href="/dashboard/sessions" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <ClockIcon className="h-5 w-5 text-teal-600" /> Log Session
          </Link>
          <Link href="/dashboard/sessions/log" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 ml-4">
            <ClipboardDocumentListIcon className="h-5 w-5 text-teal-500" /> Sessions Log
          </Link>
          
          {/* CPD Section */}
          <Link href="/dashboard/cpd" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <AcademicCapIcon className="h-5 w-5 text-indigo-600" /> CPD Learning
          </Link>
          <Link href="/dashboard/cpd/log" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 ml-4">
            <DocumentTextIcon className="h-5 w-5 text-indigo-500" /> CPD Log
          </Link>
          
          <Link href="/dashboard/reports" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <PresentationChartLineIcon className="h-5 w-5 text-emerald-600" /> Reports
          </Link>
          
          <a 
            href="mailto:Hello@icflog.com?subject=ICF Log - Help Request"
            className="flex items-center gap-2 p-2 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 w-full text-left mt-4"
            title="Contact support"
          >
            <EnvelopeIcon className="h-5 w-5 text-blue-600" /> Contact
          </a>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded hover:bg-red-50 text-red-600 hover:text-red-700 w-full text-left mt-4"
            title="Sign out and return to login"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" /> Sign Out
          </button>
        </nav>


      </aside>
        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 bg-opacity-40 backdrop-blur-sm transition-all duration-300"
            onClick={closeMobileMenu}
          />
          
          {/* Mobile Menu */}
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl border-r border-gray-100 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div 
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    handleHomeClick();
                    closeMobileMenu();
                  }}
                  title="Go to landing page"
                >
                  <img 
                    src="/icflog.png" 
                    alt="ICF Log" 
                    className="h-5 w-auto"
                  />
                  <div>
                    <div className="text-xs font-medium text-gray-900">ICF Log</div>
                    <div className="text-xs text-gray-400">Beta 0.9.480</div>
                  </div>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto bg-gradient-to-b from-transparent to-gray-50 min-h-0">
                <Link 
                  href="/landing"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <HomeIcon className="h-4 w-4 text-green-600" /> Home
                </Link>
                <Link 
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <ChartBarIcon className="h-4 w-4 text-blue-600" /> Dashboard
                </Link>
                <Link 
                  href="/dashboard/profile" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <UserIcon className="h-4 w-4 text-purple-600" /> Profile
                </Link>
                <Link 
                  href="/dashboard/clients" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <UserGroupIcon className="h-4 w-4 text-orange-600" /> Clients
                </Link>
                
                {/* Sessions Section */}
                <Link 
                  href="/dashboard/sessions" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm font-medium"
                >
                  <ClockIcon className="h-4 w-4 text-teal-600" /> Log Session
                </Link>
                <Link 
                  href="/dashboard/sessions/log" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-1.5 pl-6 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-xs text-gray-600"
                >
                  <ClipboardDocumentListIcon className="h-3.5 w-3.5 text-teal-500" /> Sessions Log
                </Link>
                
                {/* CPD Section */}
                <Link 
                  href="/dashboard/cpd" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm font-medium"
                >
                  <AcademicCapIcon className="h-4 w-4 text-indigo-600" /> CPD Learning
                </Link>
                <Link 
                  href="/dashboard/cpd/log" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-1.5 pl-6 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-xs text-gray-600"
                >
                  <DocumentTextIcon className="h-3.5 w-3.5 text-indigo-500" /> CPD Log
                </Link>
                
                <Link 
                  href="/dashboard/reports" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <PresentationChartLineIcon className="h-4 w-4 text-emerald-600" /> Reports
                </Link>
                
                <a 
                  href="mailto:Hello@icflog.com?subject=ICF Log - Help Request"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 w-full text-left transition-colors text-sm"
                  title="Contact support"
                >
                  <EnvelopeIcon className="h-4 w-4 text-blue-600" /> Contact
                </a>
              </nav>

              {/* Mobile Sign Out Button - Always Visible */}
              <div className="p-2 border-t border-gray-200 bg-white mt-auto">
                <button 
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 bg-red-600 text-white hover:bg-red-700 w-full text-sm"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500">
        <p>Copyright (c) 2025 The Novita Group Pty Ltd.</p>
        <p className="mt-1">Note: This app is independently developed and is not associated with the International Coaching Federation (ICF) in any way.</p>
      </footer>
    </div>
  );
} 