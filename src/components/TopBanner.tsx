// import Image from "next/image";
import { PhoneCall, Mail, MapPin } from "lucide-react";

export default function TopBanner() {
  return (
    <div className="w-full">
      {/* Top Contact Strip */}
      <div 
        className="py-4 px-4"
        style={{
          backgroundImage: "url('/banner/banner.png')",
          backgroundColor: "#315694",
          backgroundSize: "cover",
          backgroundPosition: "left bottom",
          backgroundBlendMode: "overlay"
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center text-white text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Get in Touch: 24/7 Mon - Sat</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Email: info@cascadelogistics.co</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4" />
                <span>Phone: +233 24 189 3393</span>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col items-center gap-3 text-white text-sm">
            <div className="flex items-center gap-2 underline">
              <Mail className="w-4 h-4" />
              <span>info@cascadelogistics.co</span>
            </div>
            <div className="flex items-center gap-2 underline">
              <PhoneCall className="w-4 h-4" />
              <span>+233 24 189 3393</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
