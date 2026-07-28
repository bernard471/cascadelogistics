"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Target, Eye, Heart, ArrowRight, Sparkles, Globe2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function AboutPageSectionThree() {
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

  const missionVision = [
    {
      type: "mission",
      icon: Target,
      title: "Our Mission",
      description: "To provide comprehensive logistics solutions that connect possibilities and deliver excellence. We strive to make international shipping globally to Ghana accessible, affordable, and reliable for everyone, while maintaining the highest standards of service quality, transparency, and customer care.",
      image: "/cascade/background_single_service_01.jpg",
      gradient: "from-[#315694] to-[#262262]"
    },
    {
      type: "vision",
      icon: Eye,
      title: "Our Vision",
      description: "To become the leading shipping and logistics company connecting multiple countries with Ghana, providing seamless, reliable, and cost-effective solutions that empower businesses and individuals to thrive in international trade. We envision a future where shipping is transparent, fast, and accessible to all.",
      image: "/cascade/cascade-hero.png",
      gradient: "from-[#262262] to-[#315694]"
    }
  ];

  const coreValues = [
    { name: "Reliability & Trust", icon: ShieldCheck },
    { name: "Customer Excellence", icon: Sparkles },
    { name: "Transparency & Integrity", icon: Heart },
    { name: "Global Connectivity", icon: Globe2 }
  ];

  const imageGrid = [
    "/footer/footer3.jpg",
    "/footer/footer4.jpg",
    "/hero/hero1.jpg",
    "/cascade/airshipping.jpg",
    "/cascade/card_image_03.jpg",
    "/cascade/image_single_service_01.jpg",
    "/cascade/image_single_service_03.jpg",
    // "/cascade/banner1.jpg",
    "/cascade/hero-services.jpg",
    "/cascade/image_01.jpg",
    "/cascade/background_single_service_01.jpg",
    // "/footer/footer1.jpg",
    // "/footer/footer2.jpg",

    "/hero/hero3.jpg",
    // "/popup/popup2.jpg",
    "/popup/popup3.jpg"
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-16 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #315694 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#f7941d]"></div>
            <span className="px-6 py-2 bg-[#315694]/20 border border-[#315694]/40 text-[#f7941d] text-sm font-bold uppercase tracking-wider rounded-full">
              Our Foundation
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Mission, Vision & <span className="text-[#f7941d]">Values</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Building trust through excellence in shipping and logistics services
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {missionVision.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                className={`group relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80"></div>
                </div>

                {/* Content */}
                <div className="relative p-8 lg:p-10 text-white">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{item.title}</h3>
                  <p className="text-lg text-gray-200 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Values Section */}
        <div className={`mb-16 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-[#f7941d]" />
                <h3 className="text-3xl lg:text-4xl font-bold text-white">Our Core Values</h3>
              </div>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                The principles that guide everything we do and shape our commitment to excellence
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {coreValues.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#f7941d] hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[#315694] to-[#262262] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-white font-semibold text-center">{value.name}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Image Gallery Grid */}
        <div className={`mb-16 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">Our Operations</h3>
            <p className="text-gray-300">See our logistics operations in action</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imageGrid.map((img, index) => (
              <div
                key={index}
                className="group relative h-48 md:h-64 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
              >
                <Image
                  src={img}
                  alt={`Operation ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="text-white text-sm font-semibold">Operation {index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className={`text-center transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Ship with Us?</h3>
              <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
                Experience the difference of working with a trusted logistics partner. Get started today and let us handle your shipping needs with excellence.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact-us">
                  <Button
                    size="lg"
                    className="bg-white text-[#315694] hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Contact Us Today
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/logistics-services">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300"
                  >
                    View Services
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
