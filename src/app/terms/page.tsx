import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import Footer from "@/components/Footer";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero 
        title="Terms and Conditions" 
        crumbs={[
          { label: "Home", href: "/" }, 
          { label: "Terms and Conditions", href: "/terms" }
        ]} 
      />
      
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-8">Terms and Conditions</h1>
              <p className="text-gray-600 mb-8 text-lg">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    By accessing and using the services provided by Guangzhou Swift Logistics (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you accept and agree to be bound by the terms and provision of this agreement. These Terms and Conditions (&quot;Terms&quot;) govern your use of our website, mobile applications, and all related services (collectively, the &quot;Services&quot;).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    If you do not agree to abide by the above, please do not use this service. We reserve the right to modify these terms at any time, and such modifications shall be effective immediately upon posting of the modified terms on our website.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Description of Services</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Guangzhou Swift Logistics provides comprehensive logistics and security services including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Express and standard courier services</li>
                    <li>Air freight, ocean freight, and land freight services</li>
                    <li>Customs brokerage and clearance</li>
                    <li>Warehouse and distribution services</li>
                    <li>Security services including CCTV monitoring, cargo handling, and surveillance</li>
                    <li>Real-time package tracking and delivery notifications</li>
                    <li>Customer support and account management</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    Our services are available 24/7, Monday through Saturday, with emergency services available on Sundays and public holidays.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">3. User Accounts and Registration</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Creation</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    To access certain features of our Services, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account Security</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account or any other breach of security.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Account Termination</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to violation of these Terms or fraudulent activity.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Service Usage and Restrictions</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Permitted Use</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You may use our Services only for lawful purposes and in accordance with these Terms. You agree not to use the Services:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                    <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                    <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                    <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                    <li>To submit false or misleading information</li>
                    <li>To upload or transmit viruses or any other type of malicious code</li>
                    <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                    <li>For any obscene or immoral purpose</li>
                    <li>To interfere with or circumvent the security features of the Services</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Prohibited Items</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The following items are strictly prohibited from being shipped through our services:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Hazardous materials, explosives, or flammable substances</li>
                    <li>Illegal drugs, narcotics, or controlled substances</li>
                    <li>Weapons, ammunition, or firearms</li>
                    <li>Perishable goods without proper refrigeration</li>
                    <li>Live animals or plants</li>
                    <li>Currency, negotiable instruments, or precious metals</li>
                    <li>Human remains or biological materials</li>
                    <li>Items that violate local, national, or international laws</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Shipping and Delivery Terms</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Service Levels</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We offer various service levels with different delivery timeframes:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li><strong>Express:</strong> 1-2 business days</li>
                    <li><strong>Standard:</strong> 3-5 business days</li>
                    <li><strong>Economy:</strong> 5-7 business days</li>
                    <li><strong>Overnight:</strong> Next business day delivery</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Delivery Attempts</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We will make up to three delivery attempts at the specified address. If delivery is unsuccessful after three attempts, the package will be returned to our facility and held for 30 days. Additional fees may apply for redelivery or return to sender.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Delivery Confirmation</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Delivery confirmation may be obtained through signature, photo proof, or other verification methods as determined by the service level selected.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Payment Terms and Billing</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Payment Methods</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We accept various payment methods including credit cards, debit cards, bank transfers, and digital wallets. All payments must be made in advance or as agreed upon in your service contract.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Pricing and Fees</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Service prices are based on package weight, dimensions, destination, and service level selected. Additional fees may apply for:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Remote area delivery surcharges</li>
                    <li>Special handling requirements</li>
                    <li>Insurance coverage</li>
                    <li>Customs duties and taxes</li>
                    <li>Storage and handling fees</li>
                    <li>Redelivery charges</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 Billing and Invoicing</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Invoices will be generated upon service completion and are due within 30 days of the invoice date. Late payment fees of 1.5% per month may be applied to overdue accounts.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Liability and Insurance</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Limitation of Liability</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our liability for loss or damage to packages is limited to the lesser of: (a) the actual value of the package contents, (b) the declared value, or (c) $100 USD per package. We are not liable for indirect, incidental, special, or consequential damages.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Insurance Coverage</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Basic insurance coverage is included with all shipments. Additional insurance coverage may be purchased for packages with declared values exceeding the basic coverage limit.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">7.3 Exclusions</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We are not liable for loss or damage caused by: acts of God, war, terrorism, government actions, strikes, weather conditions, or other circumstances beyond our control.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Privacy and Data Protection</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Services. By using our Services, you agree to the collection and use of information in accordance with our Privacy Policy.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Intellectual Property Rights</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The Services and their original content, features, and functionality are and will remain the exclusive property of Nivamore Courier Services and its licensors. The Services are protected by copyright, trademark, and other laws.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Termination</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We may terminate or suspend your account and bar access to the Services immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    If you wish to terminate your account, you may simply discontinue using the Services or contact us to request account deletion.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Dispute Resolution</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">11.1 Governing Law</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    These Terms shall be interpreted and governed by the laws of the United Arab Emirates, without regard to its conflict of law provisions.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">11.2 Dispute Resolution Process</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Any disputes arising from these Terms or your use of our Services shall be resolved through the following process:
                  </p>
                  <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
                    <li>Direct negotiation between the parties</li>
                    <li>Mediation through a mutually agreed mediator</li>
                    <li>Binding arbitration under the rules of the Dubai International Arbitration Centre</li>
                  </ol>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Force Majeure</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We shall not be liable for any failure or delay in performance under these Terms which is due to fire, flood, earthquake, elements of nature or acts of God, acts of war, terrorism, labor strikes, or any other cause which is beyond our reasonable control.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">13. Severability</h2>
                  <p className="text-gray-700 leading-relaxed">
                    If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">14. Changes to Terms</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">15. Contact Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you have any questions about these Terms and Conditions, please contact us:
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Guangzhou Swift Logistics (GSL)</strong></p>
                    <p className="text-gray-700 mb-2">Email: guangzhouswiftlogistics@gmail.com</p>
                    <p className="text-gray-700 mb-2">Phone: +86 138 2408 8001</p>
                    <p className="text-gray-700">Address: 1000 Nanshan Road, Nanshan District, Guangzhou, China</p>
                  </div>
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
