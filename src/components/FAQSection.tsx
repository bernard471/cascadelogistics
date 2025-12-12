"use client";

import Image from "next/image";
import { ChevronDown, HelpCircle, Plane, Package, Shield, Clock, Phone, Mail, MessageCircle, FileCheck, Truck, Globe } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function FAQSection() {
  const [openItem, setOpenItem] = useState<number | null>(0); // First item open by default
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const faqCategories = [
    {
      category: "Shipping Services",
      icon: Plane,
      color: "from-[#315694] to-[#262262]",
      faqs: [
        {
          id: 0,
          question: "What shipping routes do you offer?",
          answer: "We offer air cargo services from United Kingdom, China, United States, and Turkey to Ghana. Our USA service ships twice weekly (Thursday & Sunday shipments, Tuesday & Friday pickups) for faster delivery times."
        },
        {
          id: 1,
          question: "How long does air shipping take?",
          answer: "Air shipments typically take 7-10 days for delivery to Ghana. Our USA service offers guaranteed pickup in Ghana within 1 week of delivery to our warehouse. We provide transparent tracking with photos of items received, packed, and tracking sent before flight."
        },
        {
          id: 2,
          question: "Do you offer package consolidation?",
          answer: "Yes, we offer package consolidation services. You can combine multiple packages from different suppliers into one shipment, which helps reduce shipping costs and simplifies the shipping process."
        },
        {
          id: 3,
          question: "What is your proxy-buy service?",
          answer: "Our proxy-buy service allows you to purchase items from USA stores, and we ship them directly to you in Ghana. This service is perfect for items that don't ship internationally or when you need assistance with purchasing."
        }
      ]
    },
    {
      category: "Clearing & Customs",
      icon: FileCheck,
      color: "from-[#f7941d] to-[#e6851a]",
      faqs: [
        {
          id: 4,
          question: "Do you handle customs clearance?",
          answer: "Yes, we provide comprehensive clearing and customs processing services. All our packages include freight and custom clearance, ensuring a smooth process from origin to destination."
        },
        {
          id: 5,
          question: "What documents are required for customs clearance?",
          answer: "Required documents typically include commercial invoice, packing list, and any necessary permits or licenses depending on the goods. Our team will guide you through all documentation requirements specific to your shipment."
        },
        {
          id: 6,
          question: "How long does customs clearance take?",
          answer: "Customs clearance time varies depending on the type of goods and documentation completeness. Our experienced team works to expedite the process, typically completing clearance within 2-5 business days after arrival."
        },
        {
          id: 7,
          question: "Do you handle special goods like batteries or electronics?",
          answer: "Yes, we handle various types of goods including battery goods and electronics. We ensure all items are properly declared and meet customs requirements. Contact us for specific requirements for your shipment type."
        }
      ]
    },
    {
      category: "Haulage & Services",
      icon: Truck,
      color: "from-[#315694] to-[#262262]",
      faqs: [
        {
          id: 8,
          question: "Do you provide haulage services?",
          answer: "Yes, we offer comprehensive haulage services to transport your goods from our warehouse to your desired location in Ghana. We ensure safe and timely delivery of your shipments."
        },
        {
          id: 9,
          question: "What areas do you deliver to in Ghana?",
          answer: "We primarily operate in Accra and surrounding areas. Our main warehouse and office is located at No. 25 Sir Arku Korsah Road, Airport Residential Area Accra. Contact us to confirm delivery to your specific location."
        },
        {
          id: 10,
          question: "How do I track my shipment?",
          answer: "We provide transparent tracking throughout the shipping process. You'll receive photos of items received, packed, and tracking information sent before flight. You can also contact us directly for updates on your shipment status."
        },
        {
          id: 11,
          question: "What happens when my package arrives at your warehouse?",
          answer: "When your package arrives at our warehouse, we inspect it, take photos, and notify you. We then pack it securely and send you tracking information before it's shipped. For USA shipments, we guarantee pickup in Ghana within 1 week of delivery to our warehouse."
        }
      ]
    },
    {
      category: "Insurance & General",
      icon: Shield,
      color: "from-[#f7941d] to-[#e6851a]",
      faqs: [
        {
          id: 12,
          question: "Do you offer insurance for shipments?",
          answer: "Yes, we offer insurance coverage for your packages. The rate is $1.10 per $100 value with a minimum of $10. Insurance covers loss or damage, and we have an easy claims process. This is especially recommended for high-value items."
        },
        {
          id: 13,
          question: "What happens if my goods are damaged during shipping?",
          answer: "If you have insurance coverage, we work with you to file insurance claims and resolve the issue promptly. We take great care in packaging and handling your goods, but insurance provides peace of mind for valuable shipments."
        },
        {
          id: 14,
          question: "How do I get a quote for my shipment?",
          answer: "To get a quote, simply contact us via phone (+233 24 189 3393), email (info@cascadelogistics.co), or fill out our contact form. Provide details about what you intend to ship (e.g., phones, laptops, battery goods, or non-battery goods), and we'll respond with a customized quote."
        },
        {
          id: 15,
          question: "How do I get started with your services?",
          answer: "Getting started is easy! Contact us via phone (+233 24 189 3393), email (info@cascadelogistics.co), or visit our office at No. 25 Sir Arku Korsah Road, Airport Residential Area Accra. Our team will discuss your shipping needs and provide a customized quote."
        }
      ]
    }
  ];

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative py-16 lg:py-32 bg-gradient-to-br from-[#f8f9fa] via-white to-gray-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#315694]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#f7941d]/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#315694]"></div>
            <span className="px-6 py-2 bg-[#315694]/10 border border-[#315694]/20 text-[#315694] text-sm font-bold uppercase tracking-wider rounded-full">
              Frequently Asked Questions
            </span>
            <div className="h-px w-16 bg-[#315694]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Got <span className="text-[#315694]">Questions?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about our shipping, clearing, customs, and logistics services
          </p>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Side - FAQ List (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {faqCategories.map((category, categoryIndex) => {
              const CategoryIcon = category.icon;
              return (
                <div
                  key={category.category}
                  className={`bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${categoryIndex * 100}ms` }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center shadow-md`}>
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
                  </div>

                  {/* FAQs in this category */}
                  <div className="space-y-4">
                    {category.faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#315694] transition-all duration-300"
                      >
                        <button
                          onClick={() => toggleItem(faq.id)}
                          className="w-full flex items-center justify-between p-4 lg:p-5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-[#315694] flex-shrink-0 transition-transform duration-300 ${
                              openItem === faq.id ? 'rotate-180' : 'rotate-0'
                            }`}
                          />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          openItem === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="px-4 lg:px-5 pb-4 lg:pb-5">
                            <div className="pl-4 border-l-4 border-[#315694]">
                              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side - Image Gallery & Quick Help */}
          <div className={`space-y-6 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl group">
                <Image
                  src="/cascade/airshipping.jpg"
                  alt="Cascade Logistics operations"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h4 className="font-bold text-lg mb-1">Expert Logistics</h4>
                  <p className="text-sm opacity-90">Professional shipping solutions</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative h-32 rounded-xl overflow-hidden shadow-lg group">
                  <Image
                    src="/cascade/card_image_03.jpg"
                    alt="Shipping"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="relative h-32 rounded-xl overflow-hidden shadow-lg group">
                  <Image
                    src="/cascade/image_single_service_01.jpg"
                    alt="Logistics"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Quick Help Card */}
            <div className="bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="w-6 h-6" />
                <h4 className="text-xl font-bold">Still Need Help?</h4>
              </div>
              <p className="text-white/90 mb-6 text-sm leading-relaxed">
                Can&apos;t find the answer you&apos;re looking for? Our support team is here to help you.
              </p>
              <div className="space-y-3 flex flex-col gap-3">
                <Link href="tel:+233241893393">
                  <button className="w-full flex items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 transition-all duration-300">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm font-medium">+233 24 189 3393</span>
                  </button>
                </Link>
                <Link href="mailto:info@cascadelogistics.co">
                  <button className="w-full flex items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 transition-all duration-300">
                    <Mail className="w-5 h-5" />
                    <span className="text-sm font-medium">Send Email</span>
                  </button>
                </Link>
                <Link href="/contact-us">
                  <button className="w-full flex items-center gap-3 bg-white text-[#315694] hover:bg-gray-100 rounded-lg p-3 transition-all duration-300 font-semibold">
                    <MessageCircle className="w-5 h-5" />
                    <span>Contact Us</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center mb-4">
                <Clock className="w-8 h-8 text-[#315694] mx-auto mb-2" />
                <h4 className="font-bold text-gray-900 mb-1">Response Time</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Response</span>
                  <span className="text-[#315694] font-bold">2 hours</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#315694] h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>

            
            
            {/* Additional Image */}
            <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl group">
              <Image
                src="/cascade/image_01.jpg"
                alt="Cascade Logistics"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h4 className="font-bold text-lg mb-1">Global Network</h4>
                <p className="text-sm opacity-90">Connecting continents</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
