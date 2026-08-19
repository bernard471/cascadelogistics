import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BlogBreadcrumbHero from "@/components/BlogBreadcrumbHero";
import BlogDetailsSection from "@/components/BlogDetailsSection";
import Footer from "@/components/Footer";
import { blogPosts, getBlogPostBySlug, getRelatedPosts } from "@/data/blogData";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function postDescription(content: string) {
  const text = content.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return text.length > 157 ? `${text.slice(0, 156).trimEnd()}…` : text;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return createPageMetadata({
      title: "Article Not Found",
      description: "The requested Cascade Logistics article could not be found.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: post.title,
    description: postDescription(post.content),
    path: `/blog/${post.slug}`,
    type: "article",
    keywords: [post.category, "Cascade Logistics", "logistics insights"],
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const blogPost = getBlogPostBySlug(slug);

  if (!blogPost) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(blogPost.id);

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "UNCATEGORIZED", href: "/category/uncategorized" },
    { label: blogPost.title.toUpperCase() }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BlogBreadcrumbHero
        date={blogPost.date}
        title={blogPost.title}
        category={blogPost.category}
        author={blogPost.author}
        breadcrumbs={breadcrumbs}
      />
      <BlogDetailsSection
        blogPost={blogPost}
        relatedPosts={relatedPosts}
      />
      <Footer />
    </div>
  );
}
