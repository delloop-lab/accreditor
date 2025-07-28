"use client";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 text-gray-900">
      {/* Header with Logo */}
      <header className="w-full max-w-4xl text-center mb-6 sm:mb-8 md:mb-12">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <img 
            src="/icflog.png" 
            alt="ICF Log" 
            className="h-16 sm:h-20 md:h-24 w-auto"
          />
        </div>
        <p className="text-lg sm:text-xl text-gray-600 font-medium mb-2 sm:mb-3">
          Professional ICF Compliance Made Simple
        </p>
        <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed px-4">
          A professional tool to support your coaching practice and ICF credential maintenance.
        </p>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-3xl bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-12 border border-gray-100 mx-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Designed for ICF-Credentialed Coaches
        </h2>
        <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed space-y-2 sm:space-y-3">
          <p>
            ICF Log is a dedicated application built to help you stay organised and compliant with International Coaching Federation (ICF) requirements.
            Log coaching sessions, track Continuing Professional Development (CPD) activities, and generate documentation to support your credential renewal.
          </p>
          <p>
            Whether you're working toward your <span className="font-semibold text-blue-600">ACC</span>, <span className="font-semibold text-purple-600">PCC</span>, or <span className="font-semibold text-indigo-600">MCC</span>, ICF Log simplifies the administrative side of your practice — so you can focus on what matters most: <span className="font-semibold text-green-600">coaching</span>.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12 px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center mb-2 sm:mb-3">
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

        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center mb-2 sm:mb-3">
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

        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center mb-2 sm:mb-3">
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

        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center mb-2 sm:mb-3">
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

      {/* CTA Section */}
      <section className="w-full max-w-3xl text-center bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100 mx-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Streamline your ICF compliance process
        </h2>
        <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 leading-relaxed">
          Begin using ICF Log today to support your professional coaching journey.
        </p>
        <div className="flex justify-center items-center">
          <a
            href="/login"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 sm:py-3 px-5 sm:px-6 rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Access the Application
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center mt-8 sm:mt-10 md:mt-12 px-4">
        <div className="border-t border-gray-200 pt-4 sm:pt-6">
          <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
            &copy; {new Date().getFullYear()} ICF Log. Supporting professional coaches worldwide.
          </p>
          <p className="text-xs text-gray-400">
            Independent development - Not affiliated with the International Coaching Federation (ICF)
          </p>
        </div>
      </footer>
    </main>
  );
} 