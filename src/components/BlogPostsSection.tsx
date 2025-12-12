"use client";

import Image from "next/image";
import { User, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { blogPosts } from "@/data/blogData";

export default function BlogPostsSection() {

  return (
    <section className="py-16 lg:py-24 bg-gray-200 shadow-lg shadow-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className=" mb-16">
        <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                <div className="w-8 h-0.5 bg-blue-800"></div>
                <div className="text-blue-800 text-lg font-bold uppercase tracking-wide">
                  GUANGZHOU SWIFT LOGISTICS
                </div>
              </div>
            </div>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-800">
            Latest Blog Posts
          </h2>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Image with Date Badge */}
              <div className="relative">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={400}
                  height={250}
                  className="w-full h-[250px] object-cover"
                />
                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-blue-800 text-white px-3 py-1 rounded text-sm font-medium">
                  {post.date}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Meta Information */}
                <div className="flex items-center gap-4 mb-4 text-sm border-b-1 border-b-blue-800/10 pb-6">
                  <div className="flex items-center gap-2 text-blue-800 border-r-1 border-r-blue-800/10 pr-2">
                    <User className="w-4 h-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold text-gray-800 mb-3 leading-tight">
                  {post.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-4 leading-relaxed border-b-1 border-b-blue-800/10 pb-6">
                  {post.description}
                </p>

                {/* Read More Link */}
                <Link 
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-blue-800 font-medium hover:text-blue-700 transition-colors"
                >
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
