"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserUsage, type UsageData } from "@/lib/usageUtils";
import {
  CheckIcon,
  XMarkIcon,
  CreditCardIcon,
  StarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const dynamic = 'force-dynamic';

export default function SubscriptionPage() {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const usageData = await getUserUsage();
        setUsage(usageData);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const handleUpgrade = (plan: string) => {
    // For now, redirect to your Stripe payment link
    if (plan === 'starter') {
      window.open('https://buy.stripe.com/test_cNi3cx51I5rwgAS0Cu7EQ00', '_blank');
    } else {
      // Add Pro plan link when available
      console.log('Pro plan not yet configured');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="/icflog.png"
                alt="ICF Log"
                className="h-12 w-auto mr-3"
              />
              <span className="text-xl font-bold text-gray-900">ICF Log</span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            You've reached your free limit!
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Continue Your Coaching Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {usage && (
              <>You've used all {usage.totalUsage} of your free entries ({usage.totalCPD} CPD + {usage.totalSessions} Sessions). </>
            )}
            Upgrade to unlimited access and unlock powerful features designed for professional coaches.
          </p>
          
          {usage && (
            <div className="bg-white rounded-lg shadow-sm border p-6 max-w-md mx-auto mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Your Current Usage</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">CPD Entries:</span>
                  <span className="font-medium">{usage.totalCPD}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coaching Sessions:</span>
                  <span className="font-medium">{usage.totalSessions}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-emerald-600">{usage.totalUsage} / 10</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Basic Package */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-center py-2 text-sm font-medium">
              Most Popular
            </div>
            <div className="p-8 pt-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic Package</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $7.00<span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="text-gray-600">Perfect for growing coaches</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited CPD entries</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited coaching sessions</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Basic reporting & analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Export your data</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">ICF compliance tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade('starter')}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Upgrade to Basic
              </button>
            </div>
          </div>

          {/* Annual Plan */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 relative">
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual Plan</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $70<span className="text-lg text-gray-500">/year</span>
                </div>
                <p className="text-gray-600">Perfect for growing coaches</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited CPD entries</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited coaching sessions</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Basic reporting & analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Export your data</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">ICF compliance tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade('pro')}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                <StarIcon className="h-5 w-5 mr-2" />
                Upgrade to Annual
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <div className="text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Time</h3>
            <p className="text-gray-600">Streamline your CPD tracking and session management with our intuitive interface.</p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600">Comprehensive analytics to help you understand your coaching journey and growth.</p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentArrowDownIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Compliant</h3>
            <p className="text-gray-600">Ensure ICF compliance with automated tracking and professional reporting.</p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Have questions? <a href="mailto:hello@icflog.com" className="text-emerald-600 hover:text-emerald-700">Contact our support team</a>
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 