"use client";

import Image from "next/image";
import { Facebook, Twitter, Linkedin, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import Link from "next/link";

interface BlogPost {
  id: number;
  image: string;
  date: string;
  title: string;
  description: string;
  category: string;
  author: string;
  content: string;
}

interface RelatedPost {
  id: number;
  image: string;
  date: string;
  title: string;
  description: string;
  category: string;
  slug: string;
  comments: string;
}

interface BlogDetailsSectionProps {
  blogPost: BlogPost;
  relatedPosts: RelatedPost[];
}

export default function BlogDetailsSection({ blogPost, relatedPosts }: BlogDetailsSectionProps) {
  const [commentForm, setCommentForm] = useState({
    name: "",
    email: "",
    website: "",
    comment: ""
  });
  const [saveInfo, setSaveInfo] = useState(false);
  const [currentRelatedPostIndex, setCurrentRelatedPostIndex] = useState(0);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Comment submitted:", commentForm);
    setCommentForm({ name: "", email: "", website: "", comment: "" });
  };

  const handlePreviousRelatedPost = () => {
    setCurrentRelatedPostIndex((prev) => 
      prev === 0 ? relatedPosts.length - 1 : prev - 1
    );
  };

  const handleNextRelatedPost = () => {
    setCurrentRelatedPostIndex((prev) => 
      prev === relatedPosts.length - 1 ? 0 : prev + 1
    );
  };

  const socialIcons = [
    { icon: Facebook, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Linkedin, href: "#" },
    { icon: MessageCircle, href: "#" }
  ];

  return (
    <section className="py-16 bg-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2">
            {/* Main Blog Image */}
            <div className="mb-8">
              <Image
                src={blogPost.image}
                alt={blogPost.title}
                width={800}
                height={400}
                className="w-full h-[400px] object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <div className="text-gray-700 leading-relaxed space-y-4">
                {blogPost.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-base leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Share Section */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-gray-800 mb-4">SHARE</h3>
              <div className="flex gap-3">
                {socialIcons.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
                  >
                    <social.icon className="w-5 h-5 text-white" />
                  </a>
                ))}
              </div>
            </div>

            {/* Comment Section */}
            <div id="comment-section" className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Post a comment</h3>
              <p className="text-gray-600 mb-6">Your email address will not be published. Leave a Reply</p>

              <form onSubmit={handleCommentSubmit} className="space-y-6">
                {/* Comment Textarea */}
                <Textarea
                  placeholder="Write Your Comment Here....."
                  value={commentForm.comment}
                  onChange={(e) => setCommentForm({...commentForm, comment: e.target.value})}
                  className="min-h-[120px] bg-gray-50 border-gray-300 focus:border-blue-800 focus:ring-blue-800"
                  required
                />

                {/* Name and Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Ex. John Doe"
                      value={commentForm.name}
                      onChange={(e) => setCommentForm({...commentForm, name: e.target.value})}
                      className="bg-gray-50 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                      required
                    />
                    <label className="block text-sm font-medium text-gray-700 mt-1">Full Name</label>
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Ex. John@Mail.Com"
                      value={commentForm.email}
                      onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                      className="bg-gray-50 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                      required
                    />
                    <label className="block text-sm font-medium text-gray-700 mt-1">Email address</label>
                  </div>
                </div>

                {/* Website URL */}
                <div>
                  <Input
                    type="url"
                    placeholder="Ex. Www.Example.Com"
                    value={commentForm.website}
                    onChange={(e) => setCommentForm({...commentForm, website: e.target.value})}
                    className="bg-gray-50 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                  />
                  <label className="block text-sm font-medium text-gray-700 mt-1">Website Url</label>
                </div>

                {/* Save Info Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="saveInfo"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="w-4 h-4 text-[#055b8e] border-gray-300 rounded focus:ring-[#055b8e]"
                  />
                  <label htmlFor="saveInfo" className="ml-2 text-sm text-gray-700">
                    Save my name, and email in this browser for the next time I comment.
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="bg-blue-800 hover:bg-blue-700 text-white px-8 py-3 font-medium"
                  style={{ borderRadius: '10px 0px 10px 0px' }}
                >
                  POST COMMENT
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-1">
            {/* Related Posts */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-blue-800">Related Posts</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePreviousRelatedPost}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-blue-800 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextRelatedPost}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-blue-800 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {relatedPosts.length > 0 && (
                  <div className="border-b border-gray-200 pb-6">
                    {/* Post Image */}
                    <div className="relative mb-4">
                      <Link href={`/blog/${relatedPosts[currentRelatedPostIndex].slug}`}> 
                        <Image
                          src={relatedPosts[currentRelatedPostIndex].image}
                          alt={relatedPosts[currentRelatedPostIndex].title}
                          width={300}
                          height={200}
                          className="w-full h-[200px] object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                        />
                      </Link>
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 bg-blue-800 text-white text-xs font-semibold px-2 py-1 rounded">
                        {relatedPosts[currentRelatedPostIndex].category}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">{relatedPosts[currentRelatedPostIndex].date}</div>
                      <Link href={`/blog/${relatedPosts[currentRelatedPostIndex].slug}`}>
                        <h4 className="text-lg font-bold text-gray-800 leading-tight hover:text-[#055b8e] transition-colors cursor-pointer">
                          {relatedPosts[currentRelatedPostIndex].title}
                        </h4>
                      </Link>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {relatedPosts[currentRelatedPostIndex].description}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Show second related post if available */}
                {relatedPosts.length > 1 && (
                  <div className="border-b border-gray-200 pb-6 last:border-b-0">
                    {/* Post Image */}
                    <div className="relative mb-4">
                      <Link href={`/blog/${relatedPosts[1].slug}`}>
                        <Image
                          src={relatedPosts[1].image}
                          alt={relatedPosts[1].title}
                          width={300}
                          height={200}
                          className="w-full h-[200px] object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                        />
                      </Link>
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 bg-blue-800 text-white text-xs font-semibold px-2 py-1 rounded">
                        {relatedPosts[1].category}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">{relatedPosts[1].date}</div>
                      <Link href={`/blog/${relatedPosts[1].slug}`}>
                        <h4 className="text-lg font-bold text-gray-800 leading-tight hover:text-[#055b8e] transition-colors cursor-pointer">
                          {relatedPosts[1].title}
                        </h4>
                      </Link>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {relatedPosts[1].description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
