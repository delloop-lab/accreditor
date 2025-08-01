export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h1>
          
          <div className="prose max-w-none space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What is icflog.com?</h2>
              <p className="text-gray-700">
                ICF Log is a professional logging and tracking site for coaches. It helps you record your coaching sessions, CPD activities, mentoring and supervision hours in one secure, structured location — aligned with ICF credentialing requirements.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Is this platform officially endorsed by the International Coaching Federation (ICF)?</h2>
              <p className="text-gray-700">
                No. ICF Log is an independent tool developed to support coaches who are working toward or maintaining their ICF credentials. We are not affiliated with or endorsed by the ICF.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Can I use this to apply for or renew my ICF credential?</h2>
              <p className="text-gray-700">
                Yes — the information you log can be used to support your application or renewal. However, it's your responsibility to ensure the data meets the latest ICF requirements. You can export your logs at any time for submission.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. What types of activities can I track?</h2>
              <p className="text-gray-700 mb-3">You can log:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Coaching sessions (paid, pro bono, peer)</li>
                <li>CPD hours (training, courses, webinars)</li>
                <li>Mentoring sessions</li>
                <li>Supervision hours</li>
              </ul>
              <p className="text-gray-700 mt-3">…and other professional development activities.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Can I export my logs?</h2>
              <p className="text-gray-700">
                Yes. You can export your data at any time in a structured format (e.g. CSV or PDF) for your records or credentialing submission.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Is my data secure?</h2>
              <p className="text-gray-700">
                Absolutely. Your data is encrypted and stored in GDPR-compliant infrastructure. Only you have access to your records unless you choose to share them.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Do you store client data?</h2>
              <p className="text-gray-700">
                No. ICF Log is designed for your professional development records. We strongly advise against including any personally identifiable information (PII) or sensitive details about your clients.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Can I track mentor coaching and supervision separately?</h2>
              <p className="text-gray-700">
                Yes. The platform allows you to log both mentoring and supervision sessions separately so you can easily see how many hours you've completed in each category.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. What happens if I cancel my account?</h2>
              <p className="text-gray-700">
                If you're on a paid plan and cancel, you'll retain access until the end of your billing cycle. You can export your data before cancellation. After that, your account and data may be deleted after a grace period.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Is there a mobile app?</h2>
              <p className="text-gray-700">
                ICFLog.com is fully responsive and optimised for mobile use, so you can log sessions, CPD hours, and mentoring activities straight from your phone or tablet.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. How do I contact support?</h2>
              <p className="text-gray-700">
                You can email us anytime at <a href="mailto:hello@icflog.com" className="text-blue-600 hover:text-blue-800">hello@icflog.com</a>. We aim to respond within 48 hours, most times much faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}