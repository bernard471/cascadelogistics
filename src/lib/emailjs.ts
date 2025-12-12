// EmailJS configuration and functions
import { EmailJSParams } from '@/types';

declare global {
  interface Window {
    emailjs: {
      init: (publicKey: string) => void;
      send: (serviceId: string, templateId: string, templateParams: EmailJSParams) => Promise<{ text: string }>;
    };
  }
}

// EmailJS configuration
export const EMAILJS_CONFIG = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id',
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id',
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key'
};

// Initialize EmailJS
export const initializeEmailJS = () => {
  if (typeof window !== 'undefined' && window.emailjs) {
    window.emailjs.init(EMAILJS_CONFIG.publicKey);
  }
};

// Send welcome email using EmailJS
export const sendWelcomeEmail = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}) => {
  try {
    // Check if EmailJS is loaded
    if (typeof window === 'undefined' || !window.emailjs) {
      console.error('EmailJS not loaded');
      return { success: false, error: 'EmailJS not loaded' };
    }

    // Prepare email data
    const templateParams = {
      to_email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      username: userData.username,
      user_email: userData.email,
      login_url: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3001'}/member-login`
    };

    // Send email
    const result = await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('Welcome email sent successfully:', result);
    return { success: true, messageId: result.text };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test email configuration
export const testEmailConnection = async () => {
  try {
    if (typeof window === 'undefined' || !window.emailjs) {
      return { success: false, error: 'EmailJS not loaded' };
    }

    // Test with dummy data
    const templateParams = {
      to_email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      user_email: 'test@example.com',
      login_url: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3001'}/member-login`
    };

    const result = await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('EmailJS connection verified successfully:', result);
    return { success: true };
  } catch (error) {
    console.error('EmailJS connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
