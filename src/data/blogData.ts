export interface BlogPost {
  id: number;
  image: string;
  date: string;
  title: string;
  description: string;
  category: string;
  author: string;
  content: string;
  slug: string;
  comments: string;
}

export interface RelatedPost {
  id: number;
  image: string;
  date: string;
  title: string;
  description: string;
  category: string;
  slug: string;
  comments: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    image: "/logisticssection/logistics.jpg",
    date: "JULY 21, 2022",
    title: "How to Quickly Respond to Attacks",
    description: "With the average cost of a data breach reported to...",
    category: "UNCATEGORIZED",
    author: "admin",
    slug: "how-to-quickly-respond-to-attacks",
    comments: "Post Comment",
    content: `With the average cost of a data breach reported to be around $3.6 million, cyber attacks can be enormously damaging, making cyber security something that businesses can no longer Ignore. The sophistication of hackers and cyber criminals is rising dally. At the same time, the attack surface—the number of possible entry points for criminals to breach organizations—is growing exponentially.

Ultimately, there is no silver bullet to prevent attacks, cyber security is an on-going and constantly evolving challenge. Statistics suggest that it takes businesses an average of 131 days to detect a breach—during which cybercriminals can inflict a significant amount of damage. This is why it is essential for businesses to identify and shut down attacks before they cause serious financial and reputational damage. This is known as threat detection and response.

Read on for a look at some of the best techniques for more effective detection and response to cyber-attacks.`
  },
  {
    id: 2,
    image: "/servicesection/service-img3.jpg",
    date: "JULY 21, 2022",
    title: "We are offering Training & Courses",
    description: "Ensuring the compliance and security of your organization, your supply...",
    category: "UNCATEGORIZED",
    author: "admin",
    slug: "we-are-offering-training-courses",
    comments: "Post Comment",
    content: `Ensuring the compliance and security of your organization, your supply chain, and your customers is paramount in today's digital landscape. At Nivamore Courier Services, we understand that knowledge is power, and that's why we're proud to offer comprehensive training and courses designed to equip your team with the essential skills needed to navigate the complex world of security and logistics.

Our training programs cover a wide range of topics including cybersecurity awareness, physical security protocols, emergency response procedures, and logistics best practices. Each course is carefully crafted by industry experts and updated regularly to reflect the latest threats and solutions.

Whether you're looking to enhance your team's security awareness, improve your logistics operations, or ensure compliance with industry standards, our training programs provide practical, hands-on learning experiences that translate directly to improved performance in the workplace.`
  },
  {
    id: 3,
    image: "/images/aboutpagesection1/image2.jpg",
    date: "JULY 21, 2022",
    title: "Top 4 tips to receive the best warehouse pricing",
    description: "Creating a product can be exciting, difficult, and expensive. There...",
    category: "UNCATEGORIZED",
    author: "admin",
    slug: "top-4-tips-to-receive-the-best-warehouse-pricing",
    comments: "Post Comment",
    content: `Creating a product can be exciting, difficult, and expensive. There are many factors that go into the cost of manufacturing and distributing your product, and warehouse pricing is one of the most significant expenses you'll face. Understanding how to negotiate and optimize your warehouse costs can make a substantial difference to your bottom line.

Here are our top 4 tips to help you secure the best warehouse pricing:

1. **Volume Commitments**: The more space you commit to using, the better rates you'll receive. Consider your projected growth and negotiate long-term contracts that offer volume discounts.

2. **Location Optimization**: Choose warehouse locations that minimize transportation costs to your key markets. Sometimes paying slightly more for a strategically located facility saves money overall.

3. **Technology Integration**: Warehouses with advanced inventory management systems and automation often offer better pricing because they can operate more efficiently.

4. **Flexible Terms**: Negotiate terms that allow for seasonal fluctuations in your business. This flexibility can prevent costly penalties during slower periods.`
  },
  {
    id: 4,
    image: "/servicesection/service-img2.jpg",
    date: "JULY 21, 2022",
    title: "Interested in bulk storage with Nivamore Services?",
    description: "What is bulk storage? Bulkstorage is product stored in....",
    category: "UNCATEGORIZED",
    author: "admin",
    slug: "interested-in-bulk-storage-with-nivamore-services",
    comments: "Post Comment",
    content: `What is bulk storage? Bulk storage is product stored in large quantities, typically in specialized facilities designed to handle significant volumes efficiently. At Nivamore Courier Services, we understand that businesses with large-scale storage needs require solutions that are both cost-effective and reliable.

Our bulk storage facilities are equipped with state-of-the-art security systems, climate control, and inventory management technology to ensure your products are stored safely and can be accessed quickly when needed. Whether you're dealing with raw materials, finished goods, or seasonal inventory, our bulk storage solutions are designed to scale with your business.

We offer flexible storage options including dedicated storage areas, shared warehouse space, and specialized storage for sensitive or regulated products. Our team of logistics experts works closely with you to develop a storage strategy that optimizes space utilization while maintaining the highest standards of security and accessibility.

With our comprehensive tracking systems and 24/7 monitoring, you can rest assured that your bulk storage needs are in capable hands.`
  }
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find(post => post.slug === slug);
};

export const getRelatedPosts = (currentPostId: number, limit: number = 2): RelatedPost[] => {
  return blogPosts
    .filter(post => post.id !== currentPostId)
    .slice(0, limit)
    .map(post => ({
      id: post.id,
      image: post.image,
      date: post.date,
      title: post.title,
      description: post.description,
      category: post.category,
      slug: post.slug,
      comments: post.comments
    }));
};
