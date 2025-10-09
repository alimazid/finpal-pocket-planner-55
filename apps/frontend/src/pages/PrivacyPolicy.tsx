import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

const PrivacyPolicy = () => {
  const { t } = useTranslation('english');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Pocket Penny ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our personal finance management application.
            </p>
            <p>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Email address, password (encrypted), and profile preferences</li>
              <li><strong>Financial Data:</strong> Budget categories, budget amounts, transactions, and expense descriptions</li>
              <li><strong>Preferences:</strong> Language settings, currency preferences, and budget period configurations</li>
              <li><strong>Gmail Integration (Optional):</strong> With your explicit consent, we may access transaction-related emails to automatically create expense entries</li>
            </ul>
            <p className="mb-4">We also automatically collect certain information when you use our application:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> Information about how you interact with our application</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, and pages viewed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Process your transactions and budgets</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and fraudulent activity</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Gmail Integration</h2>
            <p className="mb-4">
              If you choose to connect your Gmail account, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Only access emails that contain transaction information (receipts, bank notifications, payment confirmations)</li>
              <li>Extract relevant transaction data (amount, date, merchant, description)</li>
              <li>Never store the full content of your emails</li>
              <li>Never send, delete, or modify your emails</li>
              <li>Use read-only access exclusively for transaction detection</li>
            </ul>
            <p>
              You can revoke Gmail access at any time from your application settings. All extracted transaction data will remain in your account unless you manually delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Encryption of sensitive data in transit using SSL/TLS</li>
              <li>Secure password hashing using industry-standard algorithms (bcrypt)</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure cloud infrastructure hosted on trusted providers</li>
            </ul>
            <p>
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. You can delete your account and all associated data at any time through the application settings. Upon deletion, your data will be permanently removed from our systems within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Sharing Your Information</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (e.g., hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition of all or a portion of our business</li>
              <li><strong>With Your Consent:</strong> With your explicit permission for any other purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Privacy Rights</h2>
            <p className="mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to our processing of your personal information</li>
              <li><strong>Restriction:</strong> Request restriction of processing your information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our application and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p>
              Our application is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our application, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Analytics and Usage Tracking</h2>
            <p className="mb-4">
              We use PostHog, a third-party analytics service, to collect and analyze information about how you use our application. This helps us improve our services and understand user behavior.
            </p>
            <p className="mb-4">
              <strong>Information Collected by PostHog:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>User actions and events (e.g., button clicks, page views, feature usage)</li>
              <li>Session recordings (with sensitive input fields like passwords masked)</li>
              <li>Device and browser information</li>
              <li>Technical data such as page load times and errors</li>
              <li>Anonymized user identifiers to track usage patterns</li>
            </ul>
            <p className="mb-4">
              <strong>How We Use This Data:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Understand which features are most valuable to users</li>
              <li>Identify and fix bugs and technical issues</li>
              <li>Improve user experience and application performance</li>
              <li>Analyze usage trends to guide product development</li>
            </ul>
            <p className="mb-4">
              PostHog stores data in secure cloud infrastructure with industry-standard security measures. For more information about PostHog's data practices, please visit their privacy policy at <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">https://posthog.com/privacy</a>.
            </p>
            <p>
              Analytics data is used solely for improving our application and is never sold or shared with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-none space-y-1">
              <li>Email: privacy@pocketpenny.site</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link to="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
