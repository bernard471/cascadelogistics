"use client";

import React from "react";
import Image from "next/image";
import {
  Breadcrumb,
  // BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Crumb = {
  label: string;
  href?: string;
};

interface BreadcrumbHeroProps {
  title: string;
  crumbs: Crumb[];
}

export default function BreadcrumbHero({ title, crumbs }: BreadcrumbHeroProps) {
  return (
    <section className="relative min-h-[350px] overflow-hidden bg-[#315694] flex items-center">
      {/* Transparent banner image over the base color */}
      <Image
        src="/banner/banner.png"
        alt="Section background"
        fill
        className="object-cover pointer-events-none select-none"
        priority
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{title}</h1>

        <Breadcrumb className="text-white/90 flex justify-center">
          <BreadcrumbList className="text-white/80">
            {crumbs.map((c, idx) => (
              <React.Fragment key={`crumb-${idx}-${c.label}`}>
                <BreadcrumbItem>
                  {c.href ? (
                    <BreadcrumbLink href={c.href} className="text-white/80 hover:text-white font-medium">
                      {c.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-white font-medium">{c.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {idx !== crumbs.length - 1 && (
                  <BreadcrumbSeparator className="text-white/60 font-medium" />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </section>
  );
}
