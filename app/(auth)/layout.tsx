"use client";
import { ReactNode, useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon, HomeIcon, ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/react/24/outline";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-sm border-b px-4 py-3">
        <div className="flex flex-col items-center space-y-4 py-2">
          <Link href="/landing">
            <img
              src="/icfLOGO4.png"
              alt="ICF Log"
              className="h-32 w-auto"
            />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-8 w-8 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen md:min-h-screen pt-24 md:pt-0">
        <div className="w-full max-w-md px-4">
          {children}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 md:bg-opacity-50"
            onClick={closeMobileMenu}
          />
          
          {/* Menu Panel */}
          <div className="relative flex flex-col w-80 h-full bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
              <div className="flex items-center gap-3">
                <img
                  src="/icfLOGO4.png"
                  alt="ICF Log"
                  className="h-12 w-auto"
                />
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600" />
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
                href="/login"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 text-blue-600" /> Login
              </Link>
              
              <Link 
                href="/register"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 w-full text-left transition-colors text-sm"
              >
                <UserIcon className="h-4 w-4 text-purple-600" /> Register
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}