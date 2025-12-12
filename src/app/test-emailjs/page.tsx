"use client";

import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestEmailJSPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [testData, setTestData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "test@example.com",
    username: "johndoe"
  });

  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '');
  }, []);

  const handleTestEmail = async () => {
    setIsLoading(true);
    setResult("");

    try {
      const emailParams = {
        to_email: testData.email,
        first_name: testData.firstName,
        last_name: testData.lastName,
        username: testData.username,
        user_email: testData.email,
        login_url: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3001'}/member-login`
      };

      const response = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
        emailParams
      );

      setResult(`✅ Email sent successfully! Status: ${response.status}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      setResult(`❌ Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Test EmailJS Integration</h1>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <Input
                value={testData.firstName}
                onChange={(e) => setTestData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <Input
                value={testData.lastName}
                onChange={(e) => setTestData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <Input
                value={testData.username}
                onChange={(e) => setTestData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <Button
            onClick={handleTestEmail}
            disabled={isLoading}
            className="w-full bg-[#055b8e] hover:bg-[#044a73] text-white"
          >
            {isLoading ? "Sending Email..." : "Send Test Welcome Email"}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${
              result.includes("✅") 
                ? "bg-green-50 border border-green-200 text-green-700" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {result}
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">Environment Variables Check:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Service ID: {process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ? "✅ Set" : "❌ Missing"}</div>
              <div>Template ID: {process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ? "✅ Set" : "❌ Missing"}</div>
              <div>Public Key: {process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? "✅ Set" : "❌ Missing"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
