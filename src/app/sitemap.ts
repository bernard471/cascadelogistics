import type { MetadataRoute } from "next";
import { blogPosts } from "@/data/blogData";
import { siteConfig } from "@/lib/seo";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about-us-cascade", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/contact-us", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/get-quote", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/faqs-cascade", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/logistics-services", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/logistics-services/air-freight", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/air-shipments", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/clearing-customs", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/consolidation", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/courier-services", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/customs-brokerage", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/export-services", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/express-air-freight", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/haulage", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/land-freight", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/money-transfer", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/ocean-freight", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/procurement", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/proxy-buy", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/quality-checks", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/sea-cargo", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/sea-shipping", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/warehouse-and-distribution", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/logistics-services/warehousing", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/security-services", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/security-services/airline-aviation-security", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/security-services/closed-circuit-tv", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/security-services/consignments-cargo-handling", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/security-services/counter-surveillance", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/security-services/dispatch-arrangement", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/security-services/general-services", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/security-services/safe-keeping", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/modern-blogs", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/developers", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/developers/quickstart", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/developers/api-reference", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/developers/changelog", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pages = staticRoutes.map(({ path, ...route }) => ({
    url: new URL(path, `${siteConfig.url}/`).toString(),
    lastModified,
    ...route,
  }));
  const posts = blogPosts.map((post) => ({
    url: new URL(`/blog/${post.slug}`, `${siteConfig.url}/`).toString(),
    lastModified: new Date(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...pages, ...posts];
}
