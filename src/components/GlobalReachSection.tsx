"use client";

import Image from "next/image";
import { MapPin, Plane, Ship, Globe, 
  // ArrowRight 
  } from "lucide-react";
import { useState, useEffect, useRef } from "react";
// import Link from "next/link";

export default function GlobalReachSection() {
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

  // const shippingRoutes = [
  //   {
  //     id: 1,
  //     origin: "United Kingdom",
  //     destination: "Ghana",
  //     icon: Plane,
  //     color: "from-[#315694] to-[#262262]",
  //     deliveryTime: "7-10 Days"
  //   },
  //   {
  //     id: 2,
  //     origin: "China",
  //     destination: "Ghana",
  //     icon: Plane,
  //     color: "from-[#f7941d] to-[#e6851a]",
  //     deliveryTime: "7-10 Days"
  //   },
  //   {
  //     id: 3,
  //     origin: "United States",
  //     destination: "Ghana",
  //     icon: Plane,
  //     color: "from-[#315694] to-[#262262]",
  //     deliveryTime: "7-10 Days",
  //     special: true
  //   },
  //   {
  //     id: 4,
  //     origin: "Turkey",
  //     destination: "Ghana",
  //     icon: Plane,
  //     color: "from-[#f7941d] to-[#e6851a]",
  //     deliveryTime: "7-10 Days"
  //   }
  // ];

  const services = [
    {
      icon: Plane,
      title: "Air Shipments",
      description: "Fast and reliable air cargo services"
    },
    {
      icon: Ship,
      title: "Sea Cargo",
      description: "Cost-effective shipping solutions"
    },
    {
      icon: Globe,
      title: "Global Network",
      description: "Connecting continents seamlessly"
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="relative py-16 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #315694 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#f7941d]"></div>
            <span className="px-6 py-2 bg-[#f7941d]/20 border border-[#f7941d]/40 text-[#f7941d] text-sm font-bold uppercase tracking-wider rounded-full">
              Global Reach
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Connecting the <span className="text-[#f7941d]">World</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Shipping from multiple countries to Ghana with reliable, transparent, and on-time delivery
          </p>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">
          {/* Left Side - Map */}
          <div className={`relative transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-800/50 backdrop-blur-sm border border-white/10">
              {/* Map Image */}
              <div className="relative w-full aspect-square lg:aspect-[4/3]">
                <Image
                  src="/cascade/mape.png"
                  alt="Cascade Logistics Global Shipping Routes"
                  fill
                  className="object-contain object-center p-8"
                  priority
                />
                {/* Gradient Overlay for better visibility */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#262262]/20 via-transparent to-[#315694]/20"></div>
              </div>

              {/* Map Legend/Info Overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-[#f7941d]" />
                  <span className="text-white font-semibold text-sm">Key Locations</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                  <div>🇬🇧 United Kingdom</div>
                  <div>🇨🇳 China</div>
                  <div>🇺🇸 United States</div>
                  <div>🇹🇷 Turkey</div>
                  <div className="col-span-2 text-center pt-2 border-t border-white/10">
                    <span className="text-[#f7941d] font-semibold">→</span> 🇬🇭 Ghana
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Routes & Info */}
          <div className={`space-y-8 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            {/* Main Description */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#315694]/20 rounded-full border border-[#315694]/40">
                <Globe className="w-5 h-5 text-[#f7941d]" />
                <span className="text-sm font-semibold text-[#f7941d]">Global Shipping Network</span>
              </div>
              
              <h3 className="text-3xl lg:text-4xl font-bold text-white">
                Worldwide Shipping Solutions
              </h3>
              
              <p className="text-lg text-gray-300 leading-relaxed">
                Cascade Logistics Limited connects you to Ghana from key global locations. Our extensive 
                network spans across UK, China, USA, and Turkey, ensuring your shipments reach their 
                destination safely and on time.
              </p>

              <p className="text-lg text-gray-300 leading-relaxed">
                With our USA service shipping twice weekly (Thursday & Sunday shipments, Tuesday & Friday pickups), 
                we offer faster delivery times and greater flexibility for your shipping needs.
              </p>
            </div>

           

            {/* Services Quick View */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-center hover:border-[#f7941d]/50 transition-all duration-300"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#315694] to-[#262262] rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-white text-xs font-semibold mb-1">{service.title}</div>
                    <div className="text-gray-400 text-[10px]">{service.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contact CTA Section */}
        {/* <div className={`text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-gradient-to-r from-[#315694] to-[#262262] rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-[#f7941d]/20">
           
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '30px 30px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Ship Globally?</h3>
              <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
                Experience seamless shipping from anywhere in the world to Ghana. Get a quote today and let us handle your logistics needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact-us">
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-[#f7941d] text-white font-semibold rounded-lg shadow-xl hover:bg-[#e6851a] transition-all duration-300 hover:scale-105">
                    Get a Quote
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/logistics-services">
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300">
                    View Services
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}

