"use client";

import Image from "next/image";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const testimonials = [
    {
      id: 1,
      name: "Kwame Mensah",
      role: "Business Owner",
      company: "Accra Trading Co.",
      image: "/hero/hero1.jpg",
      rating: 5,
      text: "Cascade Logistics has been excellent for shipping from Turkey to Ghana. Their air cargo service is fast - I received my packages in just 7-10 days. The best part is that freight and custom clearance are all included, making the process seamless.",
      location: "Accra, Ghana"
    },
    {
      id: 2,
      name: "Sarah Adjei",
      role: "Import Manager",
      company: "Ghana Electronics Ltd.",
      image: "/hero/hero2.jpg",
      rating: 5,
      text: "The USA shipping service is a game-changer! Shipments twice a week means I get my packages faster than ever. The transparent process with photos and tracking gives me complete peace of mind. Highly recommended!",
      location: "Kumasi, Ghana"
    },
    {
      id: 3,
      name: "Michael Osei",
      role: "Procurement Director",
      company: "West Africa Imports",
      image: "/hero/hero3.jpg",
      rating: 5,
      text: "Their clearing and customs processing is top-notch. They handle all the documentation and ensure smooth clearance. The haulage service is also very reliable - my goods always arrive on time and in perfect condition.",
      location: "Accra, Ghana"
    },
    {
      id: 4,
      name: "Ama Asante",
      role: "Retail Business Owner",
      company: "Fashion Forward",
      image: "/popup/popup1.jpg",
      rating: 5,
      text: "I love their Cargo Consolidation service! It saves me so much money by combining multiple orders. The Door to Door service is also fantastic - I can shop from USA stores and they ship directly to me in Ghana.",
      location: "Kumasi, Ghana"
    },
    {
      id: 5,
      name: "David Kofi",
      role: "Operations Manager",
      company: "Tech Solutions Ghana",
      image: "/popup/popup2.jpg",
      rating: 5,
      text: "Shipping from China to Ghana has never been easier. Cascade handles everything from air cargo to customs clearance. The guaranteed 1-week pickup for USA shipments is incredible - I always know when to expect my packages.",
      location: "Accra, Ghana"
    },
    {
      id: 6,
      name: "Grace Adjei",
      role: "Entrepreneur",
      company: "Home Essentials",
      image: "/popup/popup3.jpg",
      rating: 5,
      text: "The insurance option gives me peace of mind when shipping valuable items. The rates are affordable and the claims process is straightforward. Cascade Logistics truly cares about protecting my shipments.",
      location: "Tema, Ghana"
    }
  ];

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

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentTestimonial(index);
  };

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#315694]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f7941d]/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#f7941d]"></div>
            <span className="px-6 py-2 bg-[#315694]/10 border border-[#315694]/20 text-[#315694] text-sm font-bold uppercase tracking-wider rounded-full">
              Testimonials
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            What Our <span className="text-[#315694]">Clients Say</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don&apos;t just take our word for it. Here&apos;s what our satisfied clients have to say about their experience with us.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className={`relative transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-5xl mx-auto">
            {/* Quote Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#315694]/10 rounded-full flex items-center justify-center">
                <Quote className="w-8 h-8 text-[#315694]" />
              </div>
            </div>

            {/* Testimonial Content */}
            <div className="text-center mb-8">
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-[#f7941d] text-[#f7941d]" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed italic mb-8">
                &quot;{testimonials[currentTestimonial].text}&quot;
              </p>

              {/* Author Info */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-[#315694]/20">
                  <Image
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">
                    {testimonials[currentTestimonial].name}
                  </h4>
                  <p className="text-[#315694] font-semibold mb-1">
                    {testimonials[currentTestimonial].role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {testimonials[currentTestimonial].company} • {testimonials[currentTestimonial].location}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                    ? 'w-8 bg-[#315694]'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#315694] hover:text-white transition-all duration-300 hover:scale-110 border border-gray-200"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 lg:translate-x-12 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#315694] hover:text-white transition-all duration-300 hover:scale-110 border border-gray-200"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#315694] mb-2">Reliable</div>
            <div className="text-gray-600">Service</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#f7941d] mb-2">4+</div>
            <div className="text-gray-600">Shipping Routes</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#315694] mb-2">100%</div>
            <div className="text-gray-600">Full Service</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#f7941d] mb-2">24/7</div>
            <div className="text-gray-600">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}

