import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

const TermsOfService = () => {
  const { t } = useTranslation('english');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              Welcome to Pocket Penny. By accessing or using our personal finance management application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page. Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Pocket Penny is a personal finance management application that allows you to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage budget categories</li>
              <li>Track expenses and income</li>
              <li>Set financial goals and monitor progress</li>
              <li>Integrate with Gmail for automatic transaction detection (optional)</li>
              <li>Manage multi-currency transactions</li>
              <li>Generate financial reports and insights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
            <p className="mb-4">
              To use our Service, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h3 className="text-xl font-semibold mb-3">3.2 Account Security</h3>
            <p className="mb-4">
              You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Use a strong password and keep it confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Not share your account with others</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Account Termination</h3>
            <p>
              You may terminate your account at any time through the application settings. We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent or illegal activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
            <p className="mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload or transmit viruses, malware, or other malicious code</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
              <li>Use automated systems to access the Service without our permission</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or harvest any information from the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Financial Data and Accuracy</h2>
            <p className="mb-4">
              You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>You are solely responsible for the accuracy of the financial data you enter into the Service</li>
              <li>The Service is a tool to help you manage your finances but does not provide financial advice</li>
              <li>We are not responsible for any financial decisions you make based on the information in the Service</li>
              <li>You should verify all financial information and consult with qualified financial professionals for advice</li>
              <li>Currency conversion rates are provided for convenience and may not reflect real-time market rates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Gmail Integration</h2>
            <p className="mb-4">
              If you choose to integrate your Gmail account:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>You grant us permission to access transaction-related emails in your Gmail account</li>
              <li>You understand that we will only read emails related to financial transactions</li>
              <li>You can revoke this access at any time from your settings</li>
              <li>You acknowledge that automatic transaction creation may not be 100% accurate and should be reviewed</li>
              <li>You are responsible for reviewing and verifying all automatically created transactions</li>
            </ul>
            <p>
              Our use of information received from Gmail APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by Pocket Penny and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              You retain ownership of the financial data you input into the Service. By using the Service, you grant us a limited license to use, store, and process your data solely to provide the Service to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="mb-4">
              Our Service may contain links to third-party websites or services that are not owned or controlled by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
            </p>
            <p>
              We integrate with third-party services including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google Gmail (for email integration)</li>
              <li>Authentication providers (Google OAuth)</li>
              <li>Currency exchange rate providers</li>
              <li>Cloud hosting and database services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
              <li>That the Service will be uninterrupted, secure, or error-free</li>
              <li>That defects will be corrected</li>
              <li>That the Service or servers are free of viruses or harmful components</li>
              <li>The accuracy, reliability, or currency of any information provided through the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL POCKET PENNY, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
              <li>Damages resulting from unauthorized access to or use of our servers and/or any personal information stored therein</li>
              <li>Interruption or cessation of transmission to or from the Service</li>
              <li>Bugs, viruses, or other harmful code that may be transmitted to or through the Service</li>
              <li>Errors or omissions in any content or for any loss or damage incurred as a result of the use of any content posted, emailed, transmitted, or otherwise made available through the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Pocket Penny and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Service, your violation of these Terms, or your violation of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Data Backup and Loss</h2>
            <p className="mb-4">
              While we take reasonable measures to back up your data, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We are not responsible for any loss of data</li>
              <li>You should maintain your own backup copies of important financial information</li>
              <li>Technical issues, including but not limited to server failures, may result in temporary or permanent data loss</li>
              <li>We recommend regularly exporting your data for your own records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Service Modifications and Termination</h2>
            <p className="mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or discontinue the Service (or any part thereof) temporarily or permanently</li>
              <li>Refuse service to anyone for any reason at any time</li>
              <li>Remove or edit content at our sole discretion</li>
              <li>Limit the features available to certain users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Pocket Penny operates, without regard to its conflict of law provisions.
            </p>
            <p>
              Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except that either party may seek injunctive or other equitable relief in any court of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Pocket Penny regarding the use of the Service and supersede all prior agreements and understandings, whether written or oral.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul className="list-none space-y-1">
              <li>Email: support@pocketpenny.site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">18. Acknowledgment</h2>
            <p>
              BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
            </p>
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

export default TermsOfService;
