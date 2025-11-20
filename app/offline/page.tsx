"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold text-gray-900">You&apos;re offline</h1>
        <p className="text-gray-600">
          ICF Log is still available with limited functionality. Reconnect to
          sync the latest bookings, sessions, and CPD entries.
        </p>
        <p className="text-sm text-gray-500">
          Once you&apos;re back online, refresh the page or use the button
          below to continue where you left off.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Retry connection
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

