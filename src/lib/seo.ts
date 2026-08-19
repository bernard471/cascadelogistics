import type { Metadata } from "next";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const siteConfig = {
  name: "Cascade Logistics",
  legalName: "Cascade Logistics Ltd",
  url: (configuredSiteUrl || "https://cascadelogistics.co").replace(/\/$/, ""),
  locale: "en_GH",
  description:
    "Reliable air and sea freight, customs clearance, warehousing, procurement and delivery services connecting China and Ghana.",
  email: "info@cascadelogistics.co",
  phone: "+233241893393",
  address: "No. 25 Sir Arku Korsah Road, Airport Residential Area, Accra, Ghana",
  socialImage: "/opengraph-image.png",
} as const;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

function absoluteUrl(path: string) {
  return new URL(path, `${siteConfig.url}/`).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = siteConfig.socialImage,
  type = "website",
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const brandedTitle = `${title} | ${siteConfig.name}`;

  return {
    title: { absolute: brandedTitle },
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: brandedTitle,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — globally connecting you`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: [image],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.legalName,
      alternateName: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo/casecade-logo.png"),
      },
      image: absoluteUrl(siteConfig.socialImage),
      description: siteConfig.description,
      email: siteConfig.email,
      telephone: siteConfig.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: "No. 25 Sir Arku Korsah Road, Airport Residential Area",
        addressLocality: "Accra",
        addressCountry: "GH",
      },
      areaServed: [
        { "@type": "Country", name: "Ghana" },
        { "@type": "Country", name: "China" },
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: siteConfig.phone,
        email: siteConfig.email,
        areaServed: "GH",
        availableLanguage: "English",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: { "@id": `${siteConfig.url}/#organization` },
      inLanguage: "en-GH",
    },
  ],
};
