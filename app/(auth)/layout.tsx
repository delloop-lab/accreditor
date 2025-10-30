"use client";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md px-4">
          {children}
        </div>
      </div>
    </div>
  );
}