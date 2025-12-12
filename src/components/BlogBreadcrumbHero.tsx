"use client";

import Image from "next/image";
import { Folder, MessageCircle, User } from "lucide-react";
import Link from "next/link";

interface BlogBreadcrumbHeroProps {
  date: string;
  title: string;
  category: string;
  author: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

export default function BlogBreadcrumbHero({ 
  date, 
  title, 
  category, 
  author, 
  breadcrumbs 
}: BlogBreadcrumbHeroProps) {
  return (
    <section className="relative min-h-[500px] overflow-hidden bg-blue-800/90 flex items-center">
      {/* Background pattern overlay */}
      <Image
        src="/banner/banner.png"
        alt="Section background"
        fill
        className="object-cover pointer-events-none select-none"
        priority
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
        <div className="text-center text-white">
          {/* Date */}
          <div className="text-sm text-gray-300 uppercase tracking-wide mb-4">
            {date}
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {title}
          </h1>

          {/* Breadcrumb Navigation */}
          <div className="text-sm text-gray-300 mb-8">
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span className="mx-2">&gt;</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Meta Information */}
        <div className="absolute max-w-4xl mx-auto left-0 right-0 flex justify-between items-end">
          {/* Left - Category and Comments */}
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              <span className="uppercase">{category}</span>
            </div>
            <Link href="#comment-section">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-teal-500" />
                <span className="text-teal-500 hover:text-white transition-colors">POST COMMENT</span>
              </div>
            </Link>
          </div>

          {/* Right - Author Information */}
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <div className="text-right">
              <div className="text-xs uppercase">POSTED BY</div>
              <div className="font-medium">{author}</div>
            </div>
            {/* Avatar */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
