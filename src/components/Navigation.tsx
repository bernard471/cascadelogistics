"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp, Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ContactModal from "./ContactModal";
import Link from "next/link";

export default function Navigation() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileActiveDropdown, setMobileActiveDropdown] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (dropdown: string) => {
    // Clear any existing timeout
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    // Add a delay before closing the dropdown
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 200); // 200ms delay
    setCloseTimeout(timeout);
  };

  // const handleGridClick = () => {
  //   setIsModalOpen(true);
  // };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setMobileActiveDropdown(null);
  };

  const handleMobileDropdownToggle = (dropdown: string) => {
    setMobileActiveDropdown(mobileActiveDropdown === dropdown ? null : dropdown);
  };

  const dropdownMenus = {
    about: [
      { label: "About Cascade", href: "/about-us-cascade" },
      { label: "FAQ's", href: "/faqs-cascade" },
      // { label: "Latest Blog Posts", href: "/modern-blogs" }
    ],
    security: [
      { label: "Airline / Aviation Security", href: "/security-services/airline-aviation-security" },
      { label: "Closed Circuit TV (CCTV)", href: "/security-services/closed-circuit-tv" },
      { label: "Consignments/Cargo Handling", href: "/security-services/consignments-cargo-handling" },
      { label: "Counter Surveillance", href: "/security-services/counter-surveillance" },
      { label: "Dispatch Arrangement", href: "/security-services/dispatch-arrangement" },
      { label: "General Services", href: "/security-services/general-services" },
      { label: "Safe Keeping", href: "/security-services/safe-keeping" }
    ],
    logistics: [
      { label: "Air Shipments", href: "/logistics-services/air-shipments" },
      { label: "Sea Cargo", href: "/logistics-services/sea-cargo" },
      { label: "Clearing & Customs", href: "/logistics-services/clearing-customs" },
      { label: "Haulage Services", href: "/logistics-services/haulage" }
      // { label: "Warehouse and Distribution", href: "/logistics-services/warehouse-and-distribution" }
    ],
    userAccount: [
      { label: "Sign In", href: "/member-login" },
      { label: "Register", href: "/member-register" },
      { label: "Forgot Your Password?", href: "/forgot-password" }
    ]
  };

  return (
    <nav className="bg-white py-4 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
        <div className="flex items-center gap-3">
        <Image
            src="/logo/casecade-logo.png"
            alt="Guangzhou Swift Logistics"
            width={180}
            height={60}
            className="h-12 lg:h-18 object-cover"
          />
        </div>
          {/* <span className="text-blue-800 text-lg font-medium">Guangzhou Swift Logistics</span> */}

        </Link>

        {/* Mobile Hamburger Menu */}
        <button
          onClick={handleMobileMenuToggle}
          className="lg:hidden flex items-center justify-center w-8 h-8"
        >
          <Menu className="w-6 h-6 text-gray-800" />
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-8">
          {/* <Link 
            href="/" 
            className="text-gray-800 hover:text-blue-800 transition-colors font-medium"
          >
            Home
          </Link> */}
          
          <div 
            className="relative group"
            onMouseEnter={() => handleMouseEnter('about')}
            onMouseLeave={handleMouseLeave}
          >
            <Link 
              href="/about-us-cascade" 
              className={`flex items-center gap-1 transition-colors font-medium ${
                activeDropdown === 'about' ? 'text-gray-800' : 'text-gray-800 hover:text-[#219ebc]'
              }`}
            >
              About
              <ChevronDown className="w-4 h-4" />
            </Link>
            {activeDropdown === 'about' && (
              <div 
                className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                onMouseEnter={() => handleMouseEnter('about')}
                onMouseLeave={handleMouseLeave}
              >
                {dropdownMenus.about.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 hover:text-[#219ebc] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* <div 
            className="relative group"
            onMouseEnter={() => handleMouseEnter('security')}
            onMouseLeave={handleMouseLeave}
          >
            <Link 
              href="/security-services" 
              className={`flex items-center gap-1 transition-colors font-medium ${
                activeDropdown === 'security' ? 'text-blue-800' : 'text-gray-800 hover:text-blue-600'
              }`}
            >
              Security Services
              <ChevronDown className="w-4 h-4" />
            </Link>
            {activeDropdown === 'security' && (
              <div 
                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                onMouseEnter={() => handleMouseEnter('security')}
                onMouseLeave={handleMouseLeave}
              >
                {dropdownMenus.security.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 hover:text-[#219ebc] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div> */}

          <div 
            className="relative group"
            onMouseEnter={() => handleMouseEnter('logistics')}
            onMouseLeave={handleMouseLeave}
          >
            <Link 
              href="/logistics-services" 
              className={`flex items-center gap-1 transition-colors font-medium ${
                activeDropdown === 'logistics' ? 'text-[#219ebc]' : 'text-gray-800 hover:text-[#219ebc]'
              }`}
            >
              Logistics Services
              <ChevronDown className="w-4 h-4" />
            </Link>
            {activeDropdown === 'logistics' && (
              <div 
                className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                onMouseEnter={() => handleMouseEnter('logistics')}
                onMouseLeave={handleMouseLeave}
              >
                {dropdownMenus.logistics.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 hover:text-[#219ebc] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* <Link 
            href="/logistics-services/money-transfer" 
            className="text-gray-800 hover:text-[#219ebc] transition-colors font-medium"
          >
            Money Transfer
          </Link> */}

          <Link 
            href="/get-quote" 
            className="text-gray-800 hover:text-[#219ebc] transition-colors font-medium"
          >
            Get Quote
          </Link>

          <Link 
            href="/contact-us" 
            className="text-gray-800 hover:text-[#219ebc] transition-colors font-medium"
          >
            Contact
          </Link>

          <div 
            className="relative group"
            onMouseEnter={() => handleMouseEnter('userAccount')}
            onMouseLeave={handleMouseLeave}
          >
            <Link 
              href="/member-login" 
              className={`flex items-center gap-1 transition-colors font-medium ${
                activeDropdown === 'userAccount' ? 'text-[#219ebc]' : 'text-gray-800 hover:text-[#219ebc]'
              }`}
            >
              User Account
              <ChevronDown className="w-4 h-4" />
            </Link>
            {activeDropdown === 'userAccount' && (
              <div 
                className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                onMouseEnter={() => handleMouseEnter('userAccount')}
                onMouseLeave={handleMouseLeave}
              >
                {dropdownMenus.userAccount.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/#public-tracking">
          <Button 
            className="bg-[#f7941d] hover:bg-white hover:text-[#315694] hover:border-[#315694] text-[#262262] px-6 py-2 border border-[#262262] font-medium shadow-lg shadow-[#219ebc]/20 transition-all duration-300"
            style={{
              borderRadius: '10px 0px 10px 0px',
              transition: 'all 0.6s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderRadius = '0px 10px 0px 10px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderRadius = '10px 0px 10px 0px';
            }}
          >
            Track Shipment
          </Button>
          </Link>
          {/* <div 
            onClick={handleGridClick}
            className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-800 border border-blue-800 transition-colors cursor-pointer"
          >
            <Grid2X2 className="w-5 h-5 text-white" />
          </div> */}
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <div className={`fixed inset-0 z-50 lg:hidden bg-white transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
          {/* Close Button */}
          <div className="flex justify-end p-4 border-b border-gray-200">
            <button
              onClick={handleMobileMenuToggle}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#219ebc] focus:border-transparent"
                />
              </div>
              <button className="px-4 py-3 bg-[#315694] text-white rounded-lg hover:bg-[#023e8a] transition-colors flex items-center justify-center">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6 space-y-0">
            <Link 
              href="/" 
              className="block text-[#315694] hover:text-[#219ebc] transition-colors font-medium py-4 border-b border-gray-200"
              onClick={handleMobileMenuToggle}
            >
              Home
            </Link>

            <div>
              <button
                onClick={() => handleMobileDropdownToggle('about')}
                className="flex items-center justify-between w-full text-[#315694] hover:text-[#219ebc] transition-colors font-medium py-4 border-b border-gray-200"
              >
                About
                <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">
                  {mobileActiveDropdown === 'about' ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </button>
              {mobileActiveDropdown === 'about' && (
                <div className="bg-gray-50">
                  {dropdownMenus.about.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block text-[#315694] hover:text-[#219ebc] transition-colors py-3 pl-6 border-b border-gray-200 last:border-b-0"
                      onClick={handleMobileMenuToggle}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* <div>
              <button
                onClick={() => handleMobileDropdownToggle('security')}
                className="flex items-center justify-between w-full text-[#219ebc] hover:text-[#219ebc] transition-colors font-medium py-4 border-b border-gray-200"
              >
                Security Services
                <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">
                  {mobileActiveDropdown === 'security' ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </button>
              {mobileActiveDropdown === 'security' && (
                <div className="bg-gray-50">
                  {dropdownMenus.security.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block text-[#219ebc] hover:text-[#219ebc] transition-colors py-3 pl-6 border-b border-gray-200 last:border-b-0"
                      onClick={handleMobileMenuToggle}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div> */}

            <div>
              <button
                onClick={() => handleMobileDropdownToggle('logistics')}
                className="flex items-center justify-between w-full text-[#315694] hover:text-[#219ebc] transition-colors font-medium py-4 border-b border-gray-200"
              >
                Logistics Services
                <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">
                  {mobileActiveDropdown === 'logistics' ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </button>
              {mobileActiveDropdown === 'logistics' && (
                <div className="bg-gray-50">
                  {dropdownMenus.logistics.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block text-[#315694] hover:text-[#219ebc] transition-colors py-3 pl-6 border-b border-gray-200 last:border-b-0"
                      onClick={handleMobileMenuToggle}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* <a 
              href="/logistics-services/money-transfer" 
              className="block text-[#315694] hover:text-[#219ebc] transition-colors font-medium py-4 border-b border-gray-200"
              onClick={handleMobileMenuToggle}
            >
              Money Transfer
            </a> */}

            <a 
              href="/get-quote" 
              className="block text-[#315694] hover:text-[#219ebc] transition-colors font-medium py-4 border-b border-gray-200"
              onClick={handleMobileMenuToggle}
            >
              Get Quote
            </a>

            <a 
              href="/contact-us" 
              className="block text-[#315694] hover:text-[#219ebc] transition-colors font-medium py-4 border-b border-gray-200"
              onClick={handleMobileMenuToggle}
            >
              Contact
            </a>

            <div>
              <button
                onClick={() => handleMobileDropdownToggle('userAccount')}
                className="flex items-center justify-between w-full text-[#219ebc] hover:text-[#219ebc] transition-colors font-medium py-4 border-b border-gray-200"
              >
                User Account
                <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center">
                  {mobileActiveDropdown === 'userAccount' ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </button>
              {mobileActiveDropdown === 'userAccount' && (
                <div className="bg-gray-50">
                  {dropdownMenus.userAccount.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block text-[#315694] hover:text-[#219ebc] transition-colors py-3 pl-6 border-b border-gray-200 last:border-b-0"
                      onClick={handleMobileMenuToggle}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Contact Modal */}
      {isModalOpen && <ContactModal isOpen={isModalOpen} onClose={handleCloseModal} />}
    </nav>
  );
}
