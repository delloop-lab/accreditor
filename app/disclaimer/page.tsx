export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Disclaimer
          </h1>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              The information and tools provided on ICFlog.com are intended for general professional use by coaching practitioners. While the platform is designed to support International Coaching Federation (ICF) credentialing efforts, we make no guarantees regarding acceptance, compliance, or audit outcomes by ICF or other accrediting bodies.
            </p>
            
            <p className="text-gray-700 mb-6">
              ICFlog.com is not affiliated with or endorsed by the International Coaching Federation.
            </p>
            
            <p className="text-gray-700 mb-6">
              The platform is not intended for the storage of sensitive client data or any data that could be considered protected health information (PHI) under applicable laws.
            </p>
            
            <p className="text-gray-700 mb-6">
              Users are solely responsible for ensuring their use of the platform complies with local data protection regulations, professional codes of conduct, and ICF guidelines.
            </p>
            
            <p className="text-gray-700 mb-6">
              For questions, please contact us at: <a href="mailto:hello@icflog.com" className="text-blue-600 hover:text-blue-800">hello@icflog.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}