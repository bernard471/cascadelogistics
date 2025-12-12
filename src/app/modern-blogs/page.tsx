import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import BlogPostsSection from "@/components/BlogPostsSection";
import Footer from "@/components/Footer";

export default function ModernBlogs() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero 
            title="Latest Blog Posts" 
            crumbs={[{ label: "Home", href: "/" }, 
            { label: "Modern Blogs", href: "/modern-blogs" }]} />
            <BlogPostsSection />
            <Footer />
        </div>
    );
}
