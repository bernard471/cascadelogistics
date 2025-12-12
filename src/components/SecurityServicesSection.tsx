"use client";

import Image from "next/image";
import { Shield, ShieldCheck, Video, ArrowRight, Plane, Lightbulb, Ship, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SecurityServicesSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  const securityServices = [
    {
      id: 1,
      image: "/servicesection/service-img1.jpg",
      icon: Shield,
      title: "Safe Keeping",
      description: "We protect valuable assets such as Money, Gold, Diamond, and valuable documents....",
      link: "/security-services/safe-keeping"
    },
    {
      id: 2,
      image: "/servicesection/service-img2.jpg",
      icon: ShieldCheck,
      title: "General Services",
      description: "Nivamore Courier Services Civil Investigations and Bureau of intelligence provides the finest...",
      link: "/security-services/general-services"
    },
    {
      id: 3,
      image: "/servicesection/service-img3.jpg",
      icon: Video,
      title: "Counter Surveillance",
      description: "We also undertake Counter Surveillance and Close Circuit TV Surveillance. At Nivamore Courier Services...",
      link: "/security-services/counter-surveillance"
    },
    {
        id: 4,
        image: "/servicesection/service-img4.jpg",
        icon: Lightbulb,
        title: "Dispatch Arrangement",
        description: "You want immediate and accurate dispatching services and that is what we....",
        link: "/security-services/dispatch-arrangement"
    },
    {
        id: 5,
        image: "/servicesection/service-img5.jpg",
        icon: Ship,
        title: "Consignments/Cargo Handling",
        description: "The carriage of cargo is getting progressively significant in the general airline...",
        link: "/security-services/consignments-cargo-handling"
    },
    {
        id: 6,
        image: "/servicesection/service-img6.jpg",
        icon: Plane,
        title: "Airline / Aviation Security",
        description: "The recent upsurge of global terrorism especially on airlines and their operations...",
        link: "/security-services/airline-aviation-security"
    },
    {
        id: 7,
        image: "/servicesection/service-img7.jpg",
        icon: Video,
        title: "Closed Circuit TV",
        description: "Distant observing is a compelling affordable security arrangement that gives significant serenity...",
        link: "/security-services/closed-circuit-tv"
    }
  ];

  // Pagination logic
  const totalPages = Math.ceil(securityServices.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentServices = securityServices.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Subtitle */}
          <div className="mb-4">
            <h2 className="text-blue-800 text-lg font-bold uppercase tracking-wide relative inline-block">
              What we offer tailored
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-800"></div>
            </h2>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-800 mb-6">
            Security Services
          </h1>

          {/* Description */}
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600 text-base lg:text-lg leading-relaxed">
              As today&apos;s security require qualified professionals who will help them monitor a successful course to increase their wealth and protect their assets, our professionals provide a broad and diversified range of security services. Our professionals will help you assess your valuables and risk-tolerance, and work with you to develop a plan to meet your safekeeping for retirement objectives. With your Afamase Security professional, you have a meaningful and goal-oriented partnership to keep your valuables secure and safe.
            </p>
          </div>
        </div>

        {/* Services Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentServices.map((service) => (
            <div 
              key={service.id} 
              className="bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 rounded-lg"
             
            >
              {/* Service Image */}
              <div className="relative h-64 overflow-hidden">
                
                
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                  style={{ borderRadius: '15px 0px 0px 0px' }}
                />
              </div>

              {/* Service Content */}
              <div className="p-6 relative">
                {/* Icon - Positioned to overlap image */}
                <div className="absolute -top-6 left-6">
                  <div 
                    className="w-12 h-12 bg-blue-800 border-2 border-white flex items-center justify-center shadow-lg"
                    style={{ borderRadius: '10px 0px 10px 0px' }}
                  >
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-blue-800 mb-4 mt-2">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Read More Link */}
                <Link 
                  href={service.link}
                  className="inline-flex items-center gap-2 text-blue-800 font-semibold hover:text-blue-700 transition-colors"
                >
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            {/* Previous Button */}
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-800 text-white hover:bg-blue-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-800 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-800 text-white hover:bg-blue-700'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg z-50"
      >
        <ArrowRight className="w-6 h-6 text-white rotate-[-90deg]" />
      </button>
    </section>
  );
}
