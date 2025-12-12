import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero 
        title="Privacy Policy" 
        crumbs={[
          { label: "Home", href: "/" }, 
          { label: "Privacy Policy", href: "/privacy" }
        ]} 
      />
      
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-8">Privacy Policy</h1>
              <p className="text-gray-600 mb-8 text-lg">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Introduction</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Guangzhou Swift Logistics (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, and services (collectively, the &quot;Services&quot;).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    By using our Services, you consent to the data practices described in this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access or use our Services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Information We Collect</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Create an account or register for our Services</li>
                    <li>Place orders for shipping services</li>
                    <li>Subscribe to our newsletter</li>
                    <li>Contact us for customer support</li>
                    <li>Participate in surveys or promotions</li>
                    <li>Use our tracking and delivery services</li>
                  </ul>
                  
                  <p className="text-gray-700 leading-relaxed mb-4">This information may include:</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Name, email address, phone number, and mailing address</li>
                    <li>Account credentials (username and password)</li>
                    <li>Payment information (credit card details, billing address)</li>
                    <li>Shipping and delivery addresses</li>
                    <li>Package contents and shipping preferences</li>
                    <li>Profile pictures and other uploaded content</li>
                    <li>Communication preferences and marketing consent</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Automatically Collected Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We automatically collect certain information when you use our Services:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (pages visited, time spent, features used)</li>
                    <li>Location data (with your permission)</li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>Log files and analytics data</li>
                    <li>Mobile device identifiers and advertising IDs</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Third-Party Information</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We may receive information about you from third parties, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Social media platforms when you connect your accounts</li>
                    <li>Business partners and service providers</li>
                    <li>Public databases and government records</li>
                    <li>Marketing and advertising partners</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">3. How We Use Your Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We use the information we collect for various purposes, including:
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Service Provision</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Processing and fulfilling your shipping orders</li>
                    <li>Providing tracking and delivery notifications</li>
                    <li>Managing your account and preferences</li>
                    <li>Processing payments and billing</li>
                    <li>Providing customer support and assistance</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Communication</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Sending service-related notifications and updates</li>
                    <li>Responding to your inquiries and support requests</li>
                    <li>Sending marketing communications (with your consent)</li>
                    <li>Providing newsletters and promotional materials</li>
                    <li>Conducting surveys and feedback collection</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Business Operations</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Improving our Services and user experience</li>
                    <li>Conducting research and analytics</li>
                    <li>Developing new products and features</li>
                    <li>Preventing fraud and ensuring security</li>
                    <li>Complying with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Information Sharing and Disclosure</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We may share your information in the following circumstances:
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Service Providers</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We may share your information with third-party service providers who assist us in operating our Services, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Payment processors and financial institutions</li>
                    <li>Shipping and logistics partners</li>
                    <li>Customer support and communication platforms</li>
                    <li>Analytics and marketing service providers</li>
                    <li>Cloud storage and data processing services</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Business Transfers</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity as part of the transaction.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Legal Requirements</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We may disclose your information if required to do so by law or in response to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Court orders, subpoenas, or legal process</li>
                    <li>Government investigations or regulatory requests</li>
                    <li>Protection of our rights, property, or safety</li>
                    <li>Protection of our users&apos; rights, property, or safety</li>
                    <li>Prevention of fraud or illegal activities</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">4.4 Consent</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We may share your information with your explicit consent or at your direction.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Data Security</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Secure servers and data centers</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication systems</li>
                    <li>Employee training on data protection</li>
                    <li>Incident response and breach notification procedures</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Data Retention</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Our retention periods are based on:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>The nature of the information and the purpose for which it was collected</li>
                    <li>Legal and regulatory requirements</li>
                    <li>Business needs and operational requirements</li>
                    <li>Your consent and preferences</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    When we no longer need your personal information, we will securely delete or anonymize it.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Your Rights and Choices</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Depending on your location, you may have certain rights regarding your personal information:
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Access and Portability</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You have the right to access and receive a copy of your personal information in a structured, machine-readable format.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Correction and Updates</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You can update or correct your personal information through your account settings or by contacting us directly.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">7.3 Deletion</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You may request the deletion of your personal information, subject to certain legal and operational requirements.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">7.4 Marketing Communications</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You can opt out of marketing communications at any time by:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Clicking the unsubscribe link in our emails</li>
                    <li>Updating your communication preferences in your account</li>
                    <li>Contacting us directly</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">7.5 Cookies and Tracking</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You can control cookies and tracking technologies through your browser settings or our cookie preference center.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">8. International Data Transfers</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your personal information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws than your jurisdiction.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    When we transfer your personal information internationally, we ensure appropriate safeguards are in place, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Standard contractual clauses approved by relevant authorities</li>
                    <li>Adequacy decisions by data protection authorities</li>
                    <li>Certification schemes and codes of conduct</li>
                    <li>Your explicit consent where required</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Children&apos;s Privacy</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    If we discover that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Third-Party Services</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our Services may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third parties. We encourage you to review the privacy policies of any third-party services you access.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Some third-party services we may use include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Social media platforms (Facebook, Twitter, Instagram)</li>
                    <li>Analytics services (Analytics data)</li>
                    <li>Payment processors (Alipay, WeChat Pay)</li>
                    <li>Email marketing services (Email js)</li>
                    <li>Customer support tools (Customer support tools)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Changes to This Privacy Policy</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Posting the updated Privacy Policy on our website</li>
                    <li>Sending you an email notification</li>
                    <li>Providing notice through our Services</li>
                    <li>Other appropriate means as required by law</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    Your continued use of our Services after any changes to this Privacy Policy constitutes your acceptance of the updated terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Data Protection Officer</strong></p>
                    <p className="text-gray-700 mb-2"><strong>Guangzhou Swift Logistics (GSL)</strong></p>
                    <p className="text-gray-700 mb-2">Email: privacy@guangzhouswiftlogistics.com</p>
                    <p className="text-gray-700 mb-2">Phone: +86 138 2408 8001</p>
                    <p className="text-gray-700 mb-2">Address: 1000 Nanshan Road, Nanshan District, Guangzhou, China</p>
                    <p className="text-gray-700">Response Time: We will respond to your inquiry within 30 days</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">13. Regulatory Compliance</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This Privacy Policy is designed to comply with applicable data protection laws, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>General Data Protection Regulation (GDPR) - European Union</li>
                    <li>California Consumer Privacy Act (CCPA) - California, USA</li>
                    <li>Personal Data Protection Law - United Arab Emirates</li>
                    <li>Other applicable local and international privacy laws</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    If you believe we have not handled your personal information in accordance with applicable laws, you have the right to lodge a complaint with the relevant data protection authority.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
