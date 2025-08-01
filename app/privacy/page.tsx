export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> August 1st 2025
          </p>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              This Privacy Policy explains how ICFlog.com ("we", "our", or "us") collects, uses, and protects your information. We are committed to maintaining the confidentiality and security of your personal data in accordance with applicable data protection laws, including the EU General Data Protection Regulation (GDPR).
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">We may collect and process the following information:</p>
            <p className="text-gray-700 mb-3"><strong>Account Information:</strong> Your name, email address, password (encrypted), and any profile information you choose to provide.</p>
            <p className="text-gray-700 mb-3"><strong>Usage Data:</strong> Logs of coaching sessions, Continuing Professional Development (CPD) activities, mentoring and supervision sessions, and other data you voluntarily input.</p>
            <p className="text-gray-700 mb-3"><strong>Technical Data:</strong> Device and browser information, IP address, and interaction with our platform.</p>
            <p className="text-gray-700 mb-6"><strong>Cookies:</strong> Functional and analytical cookies may be used to improve your user experience.</p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Provide and maintain access to our platform and services</li>
              <li>Enable logging and tracking of your professional coaching activities</li>
              <li>Communicate service-related updates</li>
              <li>Ensure platform security and improve performance</li>
            </ul>
            <p className="text-gray-700 mb-6">
              We do not sell, rent, or share your data with third parties, except when legally required.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Data Security</h2>
            <p className="text-gray-700 mb-6">
              All data is stored securely using modern encryption protocols. Access is restricted to authorised personnel only. Backups are regularly maintained, and infrastructure is hosted in GDPR-compliant regions.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Your Rights (GDPR)</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Access, correct, or delete your data</li>
              <li>Export your personal records</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="text-gray-700 mb-6">
              To exercise any of these rights, contact us at: <a href="mailto:hello@icflog.com" className="text-blue-600 hover:text-blue-800">hello@icflog.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}