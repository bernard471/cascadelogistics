import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BlogBreadcrumbHero from "@/components/BlogBreadcrumbHero";
import BlogDetailsSection from "@/components/BlogDetailsSection";
import Footer from "@/components/Footer";
import { getBlogPostBySlug, getRelatedPosts } from "@/data/blogData";
import { notFound } from "next/navigation";

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
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
