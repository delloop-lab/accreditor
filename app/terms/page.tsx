export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Terms and Conditions
          </h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> 1st August 2025
          </p>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              These Terms and Conditions ("Terms") govern your use of ICFlog.com (the "Service"), operated by [Your Company/Entity Name]. By accessing or using the Service, you agree to be bound by these Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Service Description</h2>
            <p className="text-gray-700 mb-6">
              ICFlog.com provides a digital logging tool for coaching professionals to track coaching sessions, CPD activities, mentoring and supervision hours, and related professional development activities. The Service is intended to assist in managing and maintaining compliance with the International Coaching Federation (ICF) credentialing requirements.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. User Responsibilities</h2>
            <p className="text-gray-700 mb-4">By using the Service, you agree:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>To provide accurate and lawful information</li>
              <li>Not to store sensitive personal data belonging to your clients</li>
              <li>To maintain the confidentiality of your login credentials</li>
              <li>Not to misuse, duplicate, or reverse-engineer the Service</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Account and Termination</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to suspend or terminate access to the Service if there is a breach of these Terms. You may terminate your use of the Service at any time.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Intellectual Property</h2>
            <p className="text-gray-700 mb-6">
              All content, code, design elements, and branding on ICFlog.com are the intellectual property of [Your Company]. Users are granted a limited, non-transferable license to use the Service for personal or organisational purposes only.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              To the maximum extent permitted by law, ICFlog.com shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}