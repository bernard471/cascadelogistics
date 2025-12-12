import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BlogBreadcrumbHero from "@/components/BlogBreadcrumbHero";
import BlogDetailsSection from "@/components/BlogDetailsSection";
import Footer from "@/components/Footer";

export default function BlogDetailPage() {
  // Sample blog post data
  const blogPost = {
    id: 1,
    image: "/logisticssection/logistics.jpg", // Using existing image
    date: "JULY 21, 2022",
    title: "How to Quickly Respond to Attacks",
    description: "With the average cost of a data breach reported to...",
    category: "UNCATEGORIZED",
    author: "admin",
    content: `With the average cost of a data breach reported to be around $3.6 million, cyber attacks can be enormously damaging, making cyber security something that businesses can no longer Ignore. The sophistication of hackers and cyber criminals is rising dally. At the same time, the attack surface—the number of possible entry points for criminals to breach organizations—is growing exponentially.

Ultimately, there is no silver bullet to prevent attacks, cyber security is an on-going and constantly evolving challenge. Statistics suggest that it takes businesses an average of 131 days to detect a breach—during which cybercriminals can inflict a significant amount of damage. This is why it is essential for businesses to identify and shut down attacks before they cause serious financial and reputational damage. This is known as threat detection and response.

Read on for a look at some of the best techniques for more effective detection and response to cyber-attacks.`
  };

  // Sample related posts
  const relatedPosts = [
    {
      id: 2,
      image: "/servicesection/service-img3.jpg",
      date: "JULY 21, 2022",
      title: "We are offering Training & Courses",
      description: "Ensuring the compliance and security of your organization, your supply...",
      category: "UNCATEGORIZED",
      slug: "we-are-offering-training-courses",
      comments: "0"
    },
    {
      id: 3,
      image: "/images/aboutpagesection1/image2.jpg",
      date: "JULY 21, 2022",
      title: "Top 4 tips to receive the best warehouse pricing",
      description: "Creating a product can be exciting, difficult, and expensive. There...",
      category: "UNCATEGORIZED",
      slug: "top-4-tips-to-receive-the-best-warehouse-pricing",
      comments: "0"
    }
  ];

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "UNCATEGORIZED", href: "/category/uncategorized" },
    { label: "HOW TO QUICKLY RESPOND TO ATTACKS" }
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
