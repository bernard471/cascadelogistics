"use client";

import Image from "next/image";
import { Linkedin, Mail, Phone } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function TeamSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  const teamMembers = [
    {
      id: 1,
      name: "Asoma Amankonah-Hinneh",
      position: "Chief Executive Officer",
      image: "/cascade/team-01-1.png",
      linkedin: "https://www.linkedin.com/in/kwaku-asoma-amankonah-hinneh-b727aa82/"
    },
    {
      id: 2,
      name: "Kwaku Amankonah-Hinneh",
      position: "Managing Director",
      image: "/cascade/team-02.png",
      linkedin: "vhttps://www.linkedin.com/in/kwaku-amankonah-hinneh-a5b35986/"
    },
    {
      id: 3,
      name: "Collins Adusei Brempong",
      position: "Chief Finance Officer",
      image: "/cascade/team-03.png",
      linkedin: "https://www.linkedin.com/in/collins-adusei-brempong-329723368/"
    },
    {
      id: 4,
      name: "Ewurama Amankonah-Hinneh",
      position: "Business Development Manager",
      image: "/cascade/team-04-640x893.png",
      linkedin: "https://cascadelogistics.co/about/about-me/#"
    },
    {
      id: 5,
      name: "David Brown",
      position: "Customs & Clearing Specialist",
      image: "/cascade/team-05-640x893.png",
      linkedin: "https://www.linkedin.com/in/davidbrown"
    },
    {
      id: 6,
      name: "Emily Davis",
      position: "Shipping Coordinator",
      image: "/cascade/team-06-640x893.png",
      linkedin: "https://www.linkedin.com/in/emilydavis"
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="relative py-16 lg:py-20 bg-gradient-to-br from-white via-gray-50 to-white overflow-hidden"
    >
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
              Our Team
            </span>
            <div className="h-px w-16 bg-[#315694]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Meet Our <span className="text-[#315694]">Expert Team</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Dedicated professionals committed to delivering excellence in every shipment
          </p>
        </div>

        {/* Team Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-4 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Decorative Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#315694] via-[#f7941d] to-[#262262] z-10"></div>

              {/* Image Container - Full Image Display */}
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#315694]/5 to-[#262262]/5">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-contain object-center group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* LinkedIn Button - Appears on Hover */}
                <div className="absolute bottom-6 right-6 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-[#315694] rounded-full flex items-center justify-center shadow-2xl hover:bg-[#262262] transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                    aria-label={`${member.name}'s LinkedIn profile`}
                  >
                    <Linkedin className="w-7 h-7 text-white" />
                  </a>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 lg:p-8 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-[#315694] font-semibold text-lg mb-6">{member.position}</p>
                </div>
                
                {/* Contact Info */}
                <div className="pt-4 border-t border-gray-100">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#315694] transition-colors duration-300 font-medium group/link"
                  >
                    <Linkedin className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                    <span>Connect on LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA Section */}
        <div className={`mt-20 text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-gradient-to-r from-[#315694] to-[#262262] rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '30px 30px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Get in Touch with Our Team</h3>
              <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
                Have questions? Our expert team is here to help you with all your shipping and logistics needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="tel:+233241893393"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#315694] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                >
                  <Phone className="w-5 h-5" />
                  Call Us
                </a>
                <a
                  href="mailto:info@cascadelogistics.co"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
                >
                  <Mail className="w-5 h-5" />
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
