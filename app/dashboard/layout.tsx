"use client";
import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
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
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { isCurrentUserAdmin } from "@/lib/adminUtils";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isCurrentUserAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  const handleHomeClick = () => {
    // Navigate to landing page
    console.log('Logo clicked - navigating to landing page');
    router.push('/landing');
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
      <header className="md:hidden bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
                      <img
              src="/icfLOGO3.png"
              alt="ICF Log"
              className="h-18 w-auto"
            />
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
        </div>
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
              src="/icfLOGO3.png" 
              alt="ICF Log" 
              className="h-30 w-auto"
            />
          </div>
          
          <div className="text-xs text-gray-500">ICF Compliance Made Simple</div>
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
            title="Go to dashboard"
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
            <ClockIcon className="h-5 w-5 text-teal-600" /> Coaching Sessions
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
          
          {/* Mentoring/Supervision Section */}
          <Link href="/dashboard/mentoring" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <AcademicCapIcon className="h-5 w-5 text-purple-600" /> Mentoring/Supervision
          </Link>
          <Link href="/dashboard/mentoring/log" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 ml-4">
            <DocumentTextIcon className="h-5 w-5 text-purple-500" /> Sessions Log
          </Link>
          
          <Link href="/dashboard/reports" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
            <PresentationChartLineIcon className="h-5 w-5 text-emerald-600" /> Reports
          </Link>
          
          {/* Admin-only links */}
          {isAdmin && (
            <>
              <Link href="/dashboard/admin" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                <ViewColumnsIcon className="h-5 w-5 text-red-600" /> Admin Panel
              </Link>
              <Link href="/dashboard/admin/subscriptions" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                <CreditCardIcon className="h-5 w-5 text-purple-600" /> Subscriptions
              </Link>
            </>
          )}
          
          <a 
            href="mailto:Hello@icflog.com?subject=ICF Log - Help Request"
            className="flex items-center gap-2 p-2 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 w-full text-left mt-4"
            title="Contact support"
          >
            <EnvelopeIcon className="h-5 w-5 text-blue-600" /> Contact
          </a>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded hover:bg-red-50 text-red-600 hover:text-red-700 w-full text-left mt-auto"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-600" /> Sign Out
          </button>
        </nav>
      </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="min-h-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={closeMobileMenu}
            />
            
            {/* Menu Panel */}
            <div className="relative flex flex-col w-80 h-full bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
                <div className="flex items-center gap-3">
                              <img
              src="/icfLOGO3.png"
              alt="ICF Log"
              className="h-12 w-auto"
            />

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
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <ClockIcon className="h-4 w-4 text-teal-600" /> Coaching Sessions
                </Link>
                <Link 
                  href="/dashboard/sessions/log" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm ml-4"
                >
                  <ClipboardDocumentListIcon className="h-4 w-4 text-teal-500" /> Sessions Log
                </Link>
                
                {/* CPD Section */}
                <Link 
                  href="/dashboard/cpd" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <AcademicCapIcon className="h-4 w-4 text-indigo-600" /> CPD Learning
                </Link>
                <Link 
                  href="/dashboard/cpd/log" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm ml-4"
                >
                  <DocumentTextIcon className="h-4 w-4 text-indigo-500" /> CPD Log
                </Link>

                {/* Mentoring/Supervision Section */}
                <Link 
                  href="/dashboard/mentoring" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <AcademicCapIcon className="h-4 w-4 text-purple-600" /> Mentoring/Supervision
                </Link>
                                <Link 
                  href="/dashboard/mentoring/log"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm ml-4"
                >
                  <DocumentTextIcon className="h-4 w-4 text-purple-500" /> Sessions Log
                </Link>
                
                <Link 
                  href="/dashboard/reports" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                >
                  <PresentationChartLineIcon className="h-4 w-4 text-emerald-600" /> Reports
                </Link>
                
                {/* Admin-only links for mobile */}
                {isAdmin && (
                  <>
                    <Link 
                      href="/dashboard/admin" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                    >
                      <ViewColumnsIcon className="h-4 w-4 text-red-600" /> Admin Panel
                    </Link>
                    <Link 
                      href="/dashboard/admin/subscriptions" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
                    >
                      <CreditCardIcon className="h-4 w-4 text-purple-600" /> Subscriptions
                    </Link>
                  </>
                )}
                
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
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 w-full text-left transition-colors text-sm"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-600" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 