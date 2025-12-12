"use client";

import Image from "next/image";
import { ZoomIn, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function GallerySection() {
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const galleryImages = [
    {
      id: 1,
      src: "/logisticssection/consolidation.jpg",
      title: "Warehouse Operations",
      category: "Facilities"
    },
    {
      id: 2,
      src: "/logisticssection/Cargo-handling.png",
      title: "Cargo Handling",
      category: "Operations"
    },
    {
      id: 3,
      src: "/popup/popup4.jpg",
      title: "Shipping Process",
      category: "Logistics"
    },
    {
      id: 4,
      src: "/logisticssection/quality.avif",
      title: "Quality Inspection",
      category: "Services"
    },
    {
      id: 5,
      src: "/hero/hero3.jpg",
      title: "Team at Work",
      category: "Team"
    },
    {
      id: 6,
      src: "/logisticssection/shipping.jpeg",
      title: "Shipping Containers",
      category: "Facilities"
    },
    {
      id: 7,
      src: "/footer/footer3.jpg",
      title: "Cargo Management",
      category: "Operations"
    },
    {
      id: 8,
      src: "/hero/hero1.jpg",
      title: "Delivery Services",
      category: "Services"
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

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      if (e.key === 'Escape') {
        setIsModalOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePreviousImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentImageIndex, handleNextImage, handlePreviousImage]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #219ebc 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#219ebc]"></div>
            <span className="px-6 py-2 bg-[#219ebc]/20 border border-[#219ebc]/30 text-[#219ebc] text-sm font-bold uppercase tracking-wider rounded-full">
              Our Gallery
            </span>
            <div className="h-px w-16 bg-[#219ebc]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            See Our <span className="text-[#219ebc]">Operations</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Take a look at our facilities, operations, and team in action. We&apos;re proud of what we do.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`group relative aspect-square overflow-hidden rounded-xl shadow-xl cursor-pointer transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredImage(image.id)}
              onMouseLeave={() => setHoveredImage(null)}
              onClick={() => openModal(index)}
            >
              <Image
                src={image.src}
                alt={image.title}
                fill
                className={`object-cover transition-transform duration-700 ${
                  hoveredImage === image.id ? 'scale-110' : 'scale-100'
                }`}
              />
              
              {/* Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
                hoveredImage === image.id ? 'opacity-100' : 'opacity-80'
              }`}></div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <div className="mb-2">
                  <span className="text-xs font-semibold text-[#219ebc] uppercase tracking-wide">
                    {image.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{image.title}</h3>
                
                {/* Zoom Icon */}
                <div 
                  className={`absolute top-6 right-6 w-12 h-12 bg-[#219ebc] rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:bg-[#023e8a] ${
                    hoveredImage === image.id 
                      ? 'opacity-100 scale-100 rotate-0' 
                      : 'opacity-0 scale-75 rotate-45'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(index);
                  }}
                >
                  <ZoomIn className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <Link href="/contact-us">
            <Button 
              size="lg"
              className="bg-[#219ebc] hover:bg-[#023e8a] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
            >
              Schedule a Facility Tour
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Image Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeModal}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-60 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/20"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePreviousImage();
            }}
            className="absolute left-4 z-60 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextImage();
            }}
            className="absolute right-4 z-60 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/20"
            aria-label="Next image"
          >
            <ChevronRight className="w-7 h-7 text-white" />
          </button>

          {/* Image Container */}
          <div 
            className="relative w-full h-full max-w-7xl mx-auto px-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[60vh] max-h-[600px]">
              <Image
                src={galleryImages[currentImageIndex].src}
                alt={galleryImages[currentImageIndex].title}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8">
              <div className="max-w-4xl mx-auto text-center">
                <div className="mb-2">
                  <span className="text-sm font-semibold text-[#219ebc] uppercase tracking-wide">
                    {galleryImages[currentImageIndex].category}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {galleryImages[currentImageIndex].title}
                </h3>
                <div className="flex items-center justify-center gap-2 text-white/70">
                  <span>{currentImageIndex + 1}</span>
                  <span>/</span>
                  <span>{galleryImages.length}</span>
                </div>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 z-60">
              {galleryImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    index === currentImageIndex
                      ? 'border-[#219ebc] scale-110'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.title}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


