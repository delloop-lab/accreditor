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

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-gray-700" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white">
          <div className="flex flex-col h-full p-6 pt-20">
            <Link
              href="/register"
              onClick={toggleMobileMenu}
              className="mb-4 px-6 py-3 bg-green-600 text-white rounded-lg text-center font-semibold hover:bg-green-700 transition-colors"
            >
              Get Started
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={toggleMobileMenu}
                className="mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={toggleMobileMenu}
                className="mb-4 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg text-center font-semibold hover:bg-blue-50 transition-colors"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/faq"
              onClick={toggleMobileMenu}
              className="mb-2 px-6 py-2 text-gray-700 text-center hover:text-green-600 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/privacy"
              onClick={toggleMobileMenu}
              className="mb-2 px-6 py-2 text-gray-700 text-center hover:text-green-600 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <img src="/icfLOGO4.png" alt="ICF Log" className="h-16 w-auto" />
          <Link href="/faq" className="text-gray-700 hover:text-green-600 transition-colors">
            FAQ
          </Link>
          <Link href="/privacy" className="text-gray-700 hover:text-green-600 transition-colors">
            Privacy Policy
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            ICF Compliance Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Track your coaching hours, CPD activities, and stay compliant with ICF requirements. 
            All in one simple, intuitive dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
            {!isLoggedIn && (
              <Link
                href="/login"
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Everything You Need for ICF Compliance
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <ClockIcon className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Session Logging</h3>
            <p className="text-gray-600">
              Easily log your coaching sessions with all the details needed for ICF compliance.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <AcademicCapIcon className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">CPD Tracking</h3>
            <p className="text-gray-600">
              Track your Continuing Professional Development activities in one organized place.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <PresentationChartLineIcon className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Reports & Analytics</h3>
            <p className="text-gray-600">
              Generate comprehensive reports for your ICF credential renewal.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join coaches worldwide who trust ICF Log for their compliance tracking.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-green-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Your Free Trial
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <img src="/icfLOGO4.png" alt="ICF Log" className="h-12 w-auto mb-4" />
              <p className="text-gray-400">
                ICF Compliance Made Simple
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <a
                href="mailto:Hello@icflog.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Hello@icflog.com
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ICF Log. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

