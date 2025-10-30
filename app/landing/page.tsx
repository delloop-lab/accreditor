"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from "next/link";
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  ChartBarIcon,
  UserIcon,
  UserGroupIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.warn('Auth check failed:', error);
        // Fail silently for auth errors
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 text-gray-900">
      {/* Mobile Header */}
      <header className="md:hidden bg-white md:bg-white/90 md:backdrop-blur-sm shadow-sm border-b border-gray-200 px-4 py-4 mb-4 rounded-lg w-full">
        <div className="flex items-center justify-center">
          <img
            src="/icfLOGO4.png"
            alt="ICF Log"
            className="h-40 w-auto"
          />
        </div>
      </header>

      {/* Mobile Title */}
      <div className="md:hidden w-full max-w-4xl text-center mb-4 px-4">
        <p className="text-lg text-gray-600 font-medium mb-2">
          Track your ICF Credentialing requirements in one place with ease.
        </p>
        <p className="text-base text-gray-700 leading-relaxed mb-4">
          Support your coaching practice and maintain your ICF credentials.
        </p>
      </div>
      
      {/* Welcome back section for logged-in users - Mobile */}
      {!loading && isLoggedIn && (
        <section className="md:hidden w-full max-w-md text-center bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur-sm rounded-xl shadow-lg p-2 sm:p-3 md:p-4 mb-4 border border-green-200 mx-auto">
          <h2 className="text-lg font-bold mb-1 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Welcome back!
          </h2>
          <p className="text-sm text-gray-700 mb-2 leading-relaxed">
            You're already logged in. Head to your dashboard to continue.
          </p>
          <div className="flex justify-center items-center">
            <a
              href="/dashboard"
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-1.5 px-4 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Go to Dashboard
            </a>
          </div>
        </section>
      )}
      
      {/* CTA Section - Only show for non-logged-in users - Mobile */}
      {!loading && !isLoggedIn && (
        <section className="md:hidden w-full max-w-md text-center bg-white rounded-xl shadow-lg p-3 mb-4 border border-gray-100 mx-auto">
          <h2 className="text-lg font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Streamline your ICF compliance process
          </h2>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            Begin using ICF Log today to support your coaching journey.
          </p>
          <div className="flex justify-center items-center">
            <a
              href="/login"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-5 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Get Started Today
            </a>
          </div>
        </section>
      )}


      {/* Desktop Header with Logo */}
      <header className="hidden md:block w-full max-w-4xl text-center mb-2 sm:mb-4">
        <div className="flex items-center justify-center mb-0">
          <img 
            src="/icfLOGO4.png" 
            alt="ICF Log" 
            className="logo-size-150"
          />
        </div>
        <p className="text-lg sm:text-xl text-gray-600 font-medium mb-2 sm:mb-3">
          Track your ICF Credentialing requirements in one place with ease.
        </p>
        <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed px-4">
          Support your coaching practice and maintain your ICF credentials.
        </p>
      </header>

      {/* Welcome back section for logged-in users - Desktop */}
      {!loading && isLoggedIn && (
        <section className="w-full max-w-3xl text-center bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-6 border border-green-200 mx-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Welcome back!
          </h2>
          <p className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3 leading-relaxed">
            You're already logged in. Head to your dashboard to continue managing your coaching practice.
          </p>
          <div className="flex justify-center items-center">
            <a
              href="/dashboard"
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-1.5 sm:py-2 px-4 sm:px-5 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Go to Dashboard
            </a>
          </div>
        </section>
      )}

      {/* CTA Section - Only show for non-logged-in users - Desktop */}
      {!loading && !isLoggedIn && (
        <section className="hidden md:block w-full max-w-3xl text-center bg-white md:bg-white/80 md:backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 md:mb-6 border border-gray-100 mx-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Streamline your ICF compliance process
          </h2>
          <p className="text-base sm:text-lg text-gray-700 mb-3 sm:mb-4 leading-relaxed">
            Begin using ICF Log today to support your professional coaching journey.
          </p>
          <div className="flex justify-center items-center">
            <a
              href="/login"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 sm:py-3 px-5 sm:px-6 rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started Today
            </a>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="w-full max-w-3xl bg-white md:bg-white/80 md:backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-5 md:p-6 mb-3 sm:mb-4 md:mb-6 border border-gray-100 mx-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Designed for ICF-Credentialed Coaches
        </h2>
        <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
          <p>
            ICF Log is a dedicated application built to help you stay organised and compliant with the International Coaching Federation (ICF) credentialing requirements. 
            Log coaching sessions, track Continuing Professional Development (CPD) activities, and generate documentation to support your credential renewal.
            Whether you're working toward your <span className="font-semibold text-blue-600">ACC</span>, <span className="font-semibold text-purple-600">PCC</span>, or <span className="font-semibold text-indigo-600">MCC</span>, ICF Log simplifies the administrative side of your practice, so you can focus on what matters most: <span className="font-semibold text-green-600">coaching</span>.
          </p>
        </div>
      </section>
      
      {/* Mobile Special Launch Offer */}
      <div className="md:hidden w-full max-w-md bg-white rounded-xl shadow-lg p-3 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mx-auto mb-4">
        <div className="text-center">
          <button
            onClick={() => setShowOfferModal(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-1.5 sm:py-2 px-4 sm:px-5 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Special Launch Offer
          </button>
        </div>
      </div>

      {/* Desktop Special Launch Offer */}
      <div 
        className="hidden md:block w-full max-w-3xl bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mb-3 sm:mb-4 md:mb-6 mx-auto"
      >
        <div className="text-center">
          <button
            onClick={() => setShowOfferModal(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-1.5 sm:py-2 px-4 sm:px-5 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Special Launch Offer
          </button>
        </div>
      </div>



      {/* Features Grid */}
      <section className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6 px-4">
                  <div className="bg-white md:bg-white/80 md:backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">Session Logging</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Easily record client coaching sessions with all required details for ICF compliance, including date, duration, client type, and session notes.
          </p>
        </div>

                  <div className="bg-white md:bg-white/80 md:backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">CPD Tracking</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Document your learning and development activities, including workshops, courses, supervision, and self-directed learning.
          </p>
        </div>

                  <div className="bg-white md:bg-white/80 md:backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">Accreditation Documentation</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Generate a professional summary document of your logged hours and CPD history for submission to the ICF during renewal.
          </p>
        </div>

                  <div className="bg-white md:bg-white/80 md:backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2zM10 7h10V5H10v2zM10 11h10V9H10v2zM10 15h10v-2H10v2zM10 19h10v-2H10v2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">Automated Reminders</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Receive gentle reminders to log sessions and maintain your CPD record, helping you stay on track between renewals.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center mt-4 sm:mt-6 md:mt-8 px-4">
        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
            <Link href="/privacy" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline">
              Terms & Conditions
            </Link>
            <Link href="/disclaimer" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline">
              Disclaimer
            </Link>
            <Link href="/faq" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline">
              FAQ
            </Link>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
            &copy; {new Date().getFullYear()} ICF Log. Supporting professional coaches worldwide.
          </p>
          <p className="text-xs text-gray-400">
            Independent development - Not affiliated with the International Coaching Federation (ICF)
          </p>
        </div>
      </footer>

      {/* Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 md:bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[70vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-4">
              <div className="flex justify-end items-center mb-4">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="text-center py-6">
                <h4 className="text-2xl font-bold text-gray-900 mb-4">
                  Exclusive Launch offer for ICF Coaches
                </h4>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-4">
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    Get 6 months free access
                  </p>
                  <p className="text-lg text-gray-700 font-medium mb-2">
                    No credit card needed
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">
                    Valid for a limited time only
                  </p>
                </div>
                <div className="flex justify-center">
                  <a
                    href="/register"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Claim Your Free 6 Months
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 